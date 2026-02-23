from fastapi import FastAPI

app = FastAPI(title="ERP-Assistant Memory Service")

@app.get("/healthz")
def healthz():
    return {"status": "healthy", "service": "memory-service"}
