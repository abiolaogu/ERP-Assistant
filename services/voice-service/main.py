from fastapi import FastAPI, Header, HTTPException

app = FastAPI(title="ERP-Assistant voice-service")

@app.get('/healthz')
def healthz():
    return {"status": "healthy", "module": "ERP-Assistant", "service": "voice-service"}

@app.get('/v1/voice')
def list_items(x_tenant_id: str | None = Header(default=None)):
    if not x_tenant_id:
        raise HTTPException(status_code=400, detail='missing X-Tenant-ID')
    return {"items": [], "event_topic": "erp.assistant.voice.listed"}
