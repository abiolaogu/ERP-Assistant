"""
ERP-Assistant voice-service
Manages voice interactions and commands within the ERP Assistant module.
Entity: voiceCommand  |  Table: assistant_voice_commands
Event topic: erp.assistant.voice-command
"""

import os
import json
import time
import secrets
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator
import asyncpg

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("voice-service")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
ID_PREFIX = "vcmd_"
EVENT_TOPIC = "erp.assistant.voice-command"
TABLE = "assistant_voice_commands"
CACHE_TTL_SECONDS = 45

VALID_STATUSES = {"received", "processing", "completed", "failed", "cancelled"}
VALID_INTENTS = {"navigation", "query", "action", "dictation", "system"}

# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def generate_id() -> str:
    return f"{ID_PREFIX}{secrets.token_hex(6)}"

# ---------------------------------------------------------------------------
# In-memory store (used when DATABASE_URL is not set)
# ---------------------------------------------------------------------------
_memory_store: Dict[str, Dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# TTL cache for list queries
# ---------------------------------------------------------------------------
_list_cache: Dict[str, Any] = {}
_list_cache_ts: Dict[str, float] = {}


def _cache_get(key: str) -> Optional[Any]:
    ts = _list_cache_ts.get(key)
    if ts is not None and (time.time() - ts) < CACHE_TTL_SECONDS:
        return _list_cache.get(key)
    return None


def _cache_set(key: str, value: Any) -> None:
    _list_cache[key] = value
    _list_cache_ts[key] = time.time()


def _cache_invalidate() -> None:
    _list_cache.clear()
    _list_cache_ts.clear()

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class VoiceCommandCreate(BaseModel):
    user_id: str = Field(..., min_length=1)
    command_text: str = Field(..., min_length=1)
    intent: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    language: str = Field(default="en")
    entities_json: str = Field(default="{}")
    response_text: str = Field(default="")
    response_audio_url: Optional[str] = Field(default=None)
    action_taken: str = Field(default="")
    module: str = Field(default="")
    duration_ms: int = Field(default=0, ge=0)
    status: str = Field(default="received")

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, v: str) -> str:
        if v not in VALID_INTENTS:
            raise ValueError(f"intent must be one of {sorted(VALID_INTENTS)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {sorted(VALID_STATUSES)}")
        return v


class VoiceCommandUpdate(BaseModel):
    command_text: Optional[str] = None
    intent: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    language: Optional[str] = None
    entities_json: Optional[str] = None
    response_text: Optional[str] = None
    response_audio_url: Optional[str] = None
    action_taken: Optional[str] = None
    module: Optional[str] = None
    duration_ms: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = None

    @field_validator("intent")
    @classmethod
    def validate_intent(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_INTENTS:
            raise ValueError(f"intent must be one of {sorted(VALID_INTENTS)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_STATUSES:
            raise ValueError(f"status must be one of {sorted(VALID_STATUSES)}")
        return v


class VoiceCommandResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    command_text: str
    intent: str
    confidence: float
    language: str
    entities_json: str
    response_text: str
    response_audio_url: Optional[str]
    action_taken: str
    module: str
    duration_ms: int
    status: str
    created_at: str
    updated_at: str

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
_pool: Optional[asyncpg.Pool] = None

CREATE_TABLE_SQL = f"""
CREATE TABLE IF NOT EXISTS {TABLE} (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    command_text    TEXT NOT NULL,
    intent          TEXT NOT NULL,
    confidence      DOUBLE PRECISION NOT NULL,
    language        TEXT NOT NULL DEFAULT 'en',
    entities_json   TEXT NOT NULL DEFAULT '{{}}',
    response_text   TEXT NOT NULL DEFAULT '',
    response_audio_url TEXT,
    action_taken    TEXT NOT NULL DEFAULT '',
    module          TEXT NOT NULL DEFAULT '',
    duration_ms     INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'received',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


async def _init_pool() -> Optional[asyncpg.Pool]:
    if not DATABASE_URL:
        logger.info("DATABASE_URL not set -- using in-memory store")
        return None
    pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLE_SQL)
    logger.info("Connected to PostgreSQL and ensured table exists")
    return pool

# ---------------------------------------------------------------------------
# Row serialization
# ---------------------------------------------------------------------------

def _row_to_dict(row) -> dict:
    """Convert an asyncpg Record or plain dict to a response dict."""
    if isinstance(row, dict):
        d = dict(row)
    else:
        d = dict(row)
    for key in ("created_at", "updated_at"):
        val = d.get(key)
        if isinstance(val, datetime):
            d[key] = val.isoformat()
    return d

# ---------------------------------------------------------------------------
# CRUD -- in-memory implementation
# ---------------------------------------------------------------------------

def _mem_insert(record: dict) -> dict:
    _memory_store[record["id"]] = record
    return record


def _mem_get(record_id: str, tenant_id: str) -> Optional[dict]:
    rec = _memory_store.get(record_id)
    if rec and rec["tenant_id"] == tenant_id:
        return rec
    return None


def _mem_list(tenant_id: str, cursor: Optional[str], limit: int) -> List[dict]:
    items = [r for r in _memory_store.values() if r["tenant_id"] == tenant_id]
    items.sort(key=lambda r: r["created_at"], reverse=True)
    if cursor:
        idx = next((i for i, r in enumerate(items) if r["id"] == cursor), None)
        if idx is not None:
            items = items[idx + 1:]
    return items[:limit]


def _mem_update(record_id: str, tenant_id: str, updates: dict) -> Optional[dict]:
    rec = _memory_store.get(record_id)
    if not rec or rec["tenant_id"] != tenant_id:
        return None
    rec.update(updates)
    rec["updated_at"] = datetime.now(timezone.utc).isoformat()
    return rec


def _mem_delete(record_id: str, tenant_id: str) -> bool:
    rec = _memory_store.get(record_id)
    if not rec or rec["tenant_id"] != tenant_id:
        return False
    del _memory_store[record_id]
    return True

# ---------------------------------------------------------------------------
# CRUD -- PostgreSQL implementation
# ---------------------------------------------------------------------------

async def _pg_insert(pool: asyncpg.Pool, record: dict) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
            INSERT INTO {TABLE}
                (id, tenant_id, user_id, command_text, intent, confidence,
                 language, entities_json, response_text, response_audio_url,
                 action_taken, module, duration_ms, status, created_at, updated_at)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *
            """,
            record["id"], record["tenant_id"], record["user_id"],
            record["command_text"], record["intent"], record["confidence"],
            record["language"], record["entities_json"], record["response_text"],
            record.get("response_audio_url"), record["action_taken"],
            record["module"], record["duration_ms"], record["status"],
            record["created_at"], record["updated_at"],
        )
    return _row_to_dict(row)


async def _pg_get(pool: asyncpg.Pool, record_id: str, tenant_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT * FROM {TABLE} WHERE id=$1 AND tenant_id=$2",
            record_id, tenant_id,
        )
    return _row_to_dict(row) if row else None


async def _pg_list(pool: asyncpg.Pool, tenant_id: str, cursor: Optional[str], limit: int) -> List[dict]:
    async with pool.acquire() as conn:
        if cursor:
            ref = await conn.fetchrow(
                f"SELECT created_at FROM {TABLE} WHERE id=$1 AND tenant_id=$2",
                cursor, tenant_id,
            )
            if ref:
                rows = await conn.fetch(
                    f"""SELECT * FROM {TABLE}
                        WHERE tenant_id=$1 AND created_at < $2
                        ORDER BY created_at DESC LIMIT $3""",
                    tenant_id, ref["created_at"], limit,
                )
            else:
                rows = await conn.fetch(
                    f"""SELECT * FROM {TABLE}
                        WHERE tenant_id=$1
                        ORDER BY created_at DESC LIMIT $2""",
                    tenant_id, limit,
                )
        else:
            rows = await conn.fetch(
                f"""SELECT * FROM {TABLE}
                    WHERE tenant_id=$1
                    ORDER BY created_at DESC LIMIT $2""",
                tenant_id, limit,
            )
    return [_row_to_dict(r) for r in rows]


async def _pg_update(pool: asyncpg.Pool, record_id: str, tenant_id: str, updates: dict) -> Optional[dict]:
    sets = []
    vals: list = []
    idx = 1
    for col, val in updates.items():
        sets.append(f"{col}=${idx}")
        vals.append(val)
        idx += 1
    vals.append(record_id)
    vals.append(tenant_id)
    sql = (
        f"UPDATE {TABLE} SET {', '.join(sets)} "
        f"WHERE id=${idx} AND tenant_id=${idx+1} RETURNING *"
    )
    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *vals)
    return _row_to_dict(row) if row else None


async def _pg_delete(pool: asyncpg.Pool, record_id: str, tenant_id: str) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            f"DELETE FROM {TABLE} WHERE id=$1 AND tenant_id=$2",
            record_id, tenant_id,
        )
    return result == "DELETE 1"

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pool
    _pool = await _init_pool()
    logger.info("voice-service started")
    yield
    if _pool:
        await _pool.close()
        logger.info("PostgreSQL pool closed")
    logger.info("voice-service stopped")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="ERP-Assistant voice-service",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware -- structured request logging
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed_ms = round((time.time() - start) * 1000, 2)
    logger.info(
        "method=%s path=%s status=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response

# ---------------------------------------------------------------------------
# Tenant helper
# ---------------------------------------------------------------------------

def _require_tenant(tenant_id: Optional[str]) -> str:
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing X-Tenant-ID header")
    return tenant_id

# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

@app.get("/healthz")
async def healthz():
    return {
        "status": "healthy",
        "module": "ERP-Assistant",
        "service": "voice-service",
        "mode": "postgres" if _pool else "in-memory",
    }

# ---------------------------------------------------------------------------
# POST /v1/voice-commands
# ---------------------------------------------------------------------------

@app.post("/v1/voice-commands", status_code=201)
async def create_voice_command(
    body: VoiceCommandCreate,
    x_tenant_id: Optional[str] = Header(default=None),
):
    tenant_id = _require_tenant(x_tenant_id)
    now = datetime.now(timezone.utc)

    record: Dict[str, Any] = {
        "id": generate_id(),
        "tenant_id": tenant_id,
        "user_id": body.user_id,
        "command_text": body.command_text,
        "intent": body.intent,
        "confidence": body.confidence,
        "language": body.language,
        "entities_json": body.entities_json,
        "response_text": body.response_text,
        "response_audio_url": body.response_audio_url,
        "action_taken": body.action_taken,
        "module": body.module,
        "duration_ms": body.duration_ms,
        "status": body.status,
        "created_at": now,
        "updated_at": now,
    }

    if _pool:
        result = await _pg_insert(_pool, record)
    else:
        record["created_at"] = now.isoformat()
        record["updated_at"] = now.isoformat()
        result = _mem_insert(record)

    _cache_invalidate()
    logger.info("created voice_command id=%s tenant=%s", result["id"], tenant_id)
    return {"item": result, "event_topic": f"{EVENT_TOPIC}.created"}

# ---------------------------------------------------------------------------
# GET /v1/voice-commands
# ---------------------------------------------------------------------------

@app.get("/v1/voice-commands")
async def list_voice_commands(
    x_tenant_id: Optional[str] = Header(default=None),
    cursor: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
):
    tenant_id = _require_tenant(x_tenant_id)
    cache_key = f"{tenant_id}:{cursor}:{limit}"
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.info("cache hit for list tenant=%s", tenant_id)
        return cached

    if _pool:
        items = await _pg_list(_pool, tenant_id, cursor, limit)
    else:
        items = _mem_list(tenant_id, cursor, limit)

    next_cursor = items[-1]["id"] if items else None
    response = {
        "items": items,
        "next_cursor": next_cursor,
        "limit": limit,
        "event_topic": f"{EVENT_TOPIC}.listed",
    }
    _cache_set(cache_key, response)
    return response

# ---------------------------------------------------------------------------
# GET /v1/voice-commands/{command_id}
# ---------------------------------------------------------------------------

@app.get("/v1/voice-commands/{command_id}")
async def get_voice_command(
    command_id: str,
    x_tenant_id: Optional[str] = Header(default=None),
):
    tenant_id = _require_tenant(x_tenant_id)

    if _pool:
        record = await _pg_get(_pool, command_id, tenant_id)
    else:
        record = _mem_get(command_id, tenant_id)

    if not record:
        raise HTTPException(status_code=404, detail="Voice command not found")
    return {"item": record, "event_topic": f"{EVENT_TOPIC}.fetched"}

# ---------------------------------------------------------------------------
# PUT /v1/voice-commands/{command_id}
# ---------------------------------------------------------------------------

@app.put("/v1/voice-commands/{command_id}")
async def update_voice_command(
    command_id: str,
    body: VoiceCommandUpdate,
    x_tenant_id: Optional[str] = Header(default=None),
):
    tenant_id = _require_tenant(x_tenant_id)
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.now(timezone.utc)

    if _pool:
        record = await _pg_update(_pool, command_id, tenant_id, updates)
    else:
        mem_updates = {
            k: (v.isoformat() if isinstance(v, datetime) else v)
            for k, v in updates.items()
        }
        record = _mem_update(command_id, tenant_id, mem_updates)

    if not record:
        raise HTTPException(status_code=404, detail="Voice command not found")

    _cache_invalidate()
    logger.info("updated voice_command id=%s tenant=%s", command_id, tenant_id)
    return {"item": record, "event_topic": f"{EVENT_TOPIC}.updated"}

# ---------------------------------------------------------------------------
# DELETE /v1/voice-commands/{command_id}
# ---------------------------------------------------------------------------

@app.delete("/v1/voice-commands/{command_id}", status_code=200)
async def delete_voice_command(
    command_id: str,
    x_tenant_id: Optional[str] = Header(default=None),
):
    tenant_id = _require_tenant(x_tenant_id)

    if _pool:
        deleted = await _pg_delete(_pool, command_id, tenant_id)
    else:
        deleted = _mem_delete(command_id, tenant_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Voice command not found")

    _cache_invalidate()
    logger.info("deleted voice_command id=%s tenant=%s", command_id, tenant_id)
    return {"deleted": True, "id": command_id, "event_topic": f"{EVENT_TOPIC}.deleted"}
