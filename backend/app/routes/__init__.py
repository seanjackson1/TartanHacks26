from app.routes.auth import router as auth_router
from app.routes.ingest import router as ingest_router
from app.routes.search import router as search_router

__all__ = ["auth_router", "ingest_router", "search_router"]
