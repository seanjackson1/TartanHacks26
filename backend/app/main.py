from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import ingest_router, search_router

app = FastAPI(title="Global Mosaic API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest_router)
app.include_router(search_router)


@app.get("/health")
def health():
    return {"status": "ok"}
