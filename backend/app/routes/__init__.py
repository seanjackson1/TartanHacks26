from app.routes.auth import router as auth_router
from app.routes.discord import router as discord_router
from app.routes.ingest import router as ingest_router
from app.routes.messaging import router as messaging_router
from app.routes.profile import router as profile_router
from app.routes.search import router as search_router
from app.routes.youtube import router as youtube_router

__all__ = [
    "auth_router",
    "discord_router",
    "ingest_router",
    "messaging_router",
    "profile_router",
    "search_router",
    "youtube_router",
]
