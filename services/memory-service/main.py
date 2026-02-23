from fastapi import FastAPI

app = FastAPI(title="OpenClaw Memory Service")

@app.get("/healthz")
def healthz():
    return {"status": "healthy", "service": "memory-service"}
