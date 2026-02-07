"""Automatic OAuth token refresh utilities."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from authlib.integrations.requests_client import OAuth2Session

from app.core.oauth_providers import get_provider_config
from app.db.supabase_client import get_oauth_account, upsert_oauth_account

logger = logging.getLogger(__name__)


def refresh_google_token(user_id: str) -> str | None:
    """
    Refresh the Google/YouTube OAuth token for a user.
    
    Returns the new access_token on success, or None if refresh fails.
    The refreshed token is also saved to the database.
    """
    # Google and YouTube use the same OAuth config
    cfg = get_provider_config("google")
    if not cfg:
        logger.error("Google provider config not found")
        return None
    
    # Try google first, then youtube (they may be stored under either name)
    account = get_oauth_account(user_id, "google")
    provider_name = "google"
    if not account:
        account = get_oauth_account(user_id, "youtube")
        provider_name = "youtube"
    
    if not account:
        logger.warning("No Google/YouTube account found for user %s", user_id)
        return None
    
    refresh_token = account.get("refresh_token")
    if not refresh_token:
        logger.warning("No refresh token stored for user %s", user_id)
        return None
    
    try:
        session = OAuth2Session(
            client_id=cfg.client_id,
            client_secret=cfg.client_secret,
            scope=cfg.scopes,
        )
        token = session.refresh_token(
            cfg.token_url,
            refresh_token=refresh_token,
        )
        
        access_token = token.get("access_token")
        # Google may return a new refresh token, or we keep the old one
        new_refresh_token = token.get("refresh_token", refresh_token)
        expires_in = token.get("expires_in")
        expires_at = None
        if expires_in:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        
        # Save the refreshed token to DB
        upsert_oauth_account(
            user_id=user_id,
            provider=provider_name,
            provider_user_id=account.get("provider_user_id", ""),
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_at=expires_at,
            raw_token=token,
        )
        
        logger.info("Refreshed Google token for user %s", user_id)
        return access_token
        
    except Exception as exc:
        logger.warning("Failed to refresh Google token for user %s: %s", user_id, exc)
        return None
