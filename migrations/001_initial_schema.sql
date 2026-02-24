-- ERP-Assistant Initial Schema
-- Generated: 2026-02-24

-- Assistant Core: Sessions
CREATE TABLE IF NOT EXISTS assistant_sessions (
	id TEXT PRIMARY KEY,
	tenant_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	context_module TEXT,
	conversation_json TEXT,
	intent TEXT,
	entities_json TEXT,
	actions_taken_json TEXT,
	model_used TEXT,
	total_tokens INT DEFAULT 0,
	satisfaction_score INT,
	status TEXT CHECK (status IN ('active','completed','failed','timeout')) DEFAULT 'active',
	started_at TIMESTAMPTZ,
	ended_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_sessions_tenant ON assistant_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_user ON assistant_sessions (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_status ON assistant_sessions (tenant_id, status);

-- Memory Service
CREATE TABLE IF NOT EXISTS assistant_memories (
	id TEXT PRIMARY KEY,
	tenant_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	memory_type TEXT CHECK (memory_type IN ('preference','context','fact','instruction','conversation','entity','relationship')) NOT NULL,
	key TEXT NOT NULL,
	value TEXT NOT NULL,
	source TEXT,
	confidence NUMERIC(3,2) DEFAULT 1.0,
	access_count INT DEFAULT 0,
	last_accessed_at TIMESTAMPTZ,
	expires_at TIMESTAMPTZ,
	status TEXT CHECK (status IN ('active','archived','expired','superseded')) DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_memories_tenant ON assistant_memories (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_memories_user ON assistant_memories (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_memories_type ON assistant_memories (tenant_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_assistant_memories_key ON assistant_memories (tenant_id, key);

-- Briefing Service
CREATE TABLE IF NOT EXISTS assistant_briefings (
	id TEXT PRIMARY KEY,
	tenant_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	title TEXT NOT NULL,
	summary TEXT NOT NULL,
	sections_json TEXT,
	data_sources TEXT,
	priority TEXT CHECK (priority IN ('low','normal','high','urgent')) DEFAULT 'normal',
	delivery_time TIMESTAMPTZ,
	schedule TEXT,
	channel TEXT CHECK (channel IN ('email','push','in_app','slack','teams')) DEFAULT 'in_app',
	status TEXT CHECK (status IN ('draft','scheduled','sent','read','archived')) DEFAULT 'draft',
	read_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_briefings_tenant ON assistant_briefings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_briefings_user ON assistant_briefings (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_briefings_status ON assistant_briefings (tenant_id, status);

-- Connector Hub
CREATE TABLE IF NOT EXISTS assistant_connectors (
	id TEXT PRIMARY KEY,
	tenant_id TEXT NOT NULL,
	name TEXT NOT NULL,
	service_name TEXT NOT NULL,
	connector_type TEXT CHECK (connector_type IN ('erp_module','external_api','database','file_system','messaging','calendar','custom')) NOT NULL,
	endpoint_url TEXT,
	auth_config_ref TEXT,
	capabilities_json TEXT,
	schema_json TEXT,
	health_status TEXT CHECK (health_status IN ('healthy','degraded','down','unknown')) DEFAULT 'unknown',
	last_health_check TIMESTAMPTZ,
	request_count INT DEFAULT 0,
	status TEXT CHECK (status IN ('active','inactive','configuring','error')) DEFAULT 'configuring',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_connectors_tenant ON assistant_connectors (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_connectors_type ON assistant_connectors (tenant_id, connector_type);
CREATE INDEX IF NOT EXISTS idx_assistant_connectors_status ON assistant_connectors (tenant_id, status);

-- Action Engine
CREATE TABLE IF NOT EXISTS assistant_actions (
	id TEXT PRIMARY KEY,
	tenant_id TEXT NOT NULL,
	name TEXT NOT NULL,
	description TEXT,
	action_type TEXT CHECK (action_type IN ('api_call','database_query','workflow','notification','file_operation','approval','custom')) NOT NULL,
	target_service TEXT,
	parameters_json TEXT,
	preconditions_json TEXT,
	postconditions_json TEXT,
	requires_approval BOOLEAN DEFAULT false,
	execution_count INT DEFAULT 0,
	avg_duration_ms INT DEFAULT 0,
	status TEXT CHECK (status IN ('active','draft','disabled','deprecated')) DEFAULT 'draft',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_actions_tenant ON assistant_actions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_actions_type ON assistant_actions (tenant_id, action_type);
CREATE INDEX IF NOT EXISTS idx_assistant_actions_status ON assistant_actions (tenant_id, status);

-- Voice Service
CREATE TABLE IF NOT EXISTS assistant_voice_commands (
    id              TEXT PRIMARY KEY,
    tenant_id       TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    command_text    TEXT NOT NULL,
    intent          TEXT NOT NULL,
    confidence      DOUBLE PRECISION NOT NULL,
    language        TEXT NOT NULL DEFAULT 'en',
    entities_json   TEXT NOT NULL DEFAULT '{}',
    response_text   TEXT NOT NULL DEFAULT '',
    response_audio_url TEXT,
    action_taken    TEXT NOT NULL DEFAULT '',
    module          TEXT NOT NULL DEFAULT '',
    duration_ms     INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'received',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistant_voice_commands_tenant ON assistant_voice_commands (tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistant_voice_commands_user ON assistant_voice_commands (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_voice_commands_intent ON assistant_voice_commands (tenant_id, intent);
CREATE INDEX IF NOT EXISTS idx_assistant_voice_commands_status ON assistant_voice_commands (tenant_id, status);
