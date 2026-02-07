from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from urllib.parse import urlencode

import requests
from authlib.integrations.requests_client import OAuth2Session
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.config import settings
from app.core.oauth_providers import get_provider_config
from app.db.supabase_client import get_oauth_account, upsert_oauth_account

router = APIRouter(prefix="/auth", tags=["auth"])

STATE_TTL_SECONDS = 10 * 60


def _sign_state(payload: dict[str, Any]) -> str:
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    sig = hmac.new(
        settings.oauth_state_secret.encode(), body, hashlib.sha256
    ).digest()
    return base64.urlsafe_b64encode(body + sig).decode()


def _verify_state(state: str) -> dict[str, Any]:
    try:
        raw = base64.urlsafe_b64decode(state.encode())
        body, sig = raw[:-32], raw[-32:]
        expected = hmac.new(
            settings.oauth_state_secret.encode(), body, hashlib.sha256
        ).digest()
        if not hmac.compare_digest(sig, expected):
            raise ValueError("invalid signature")
        payload = json.loads(body.decode())
        if time.time() - payload.get("ts", 0) > STATE_TTL_SECONDS:
            raise ValueError("state expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from exc


def _redirect_uri(provider: str) -> str:
    return f"{settings.oauth_redirect_base_url}/auth/{provider}/callback"


def _exchange_token(
    provider: str, request: Request, code: str
) -> dict[str, Any]:
    cfg = get_provider_config(provider)
    if not cfg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    session = OAuth2Session(
        client_id=cfg.client_id,
        client_secret=cfg.client_secret,
        redirect_uri=_redirect_uri(provider),
        scope=cfg.scopes,
    )
    token = session.fetch_token(
        cfg.token_url,
        code=code,
        authorization_response=str(request.url),
        include_client_id=True,
    )
    return token


def _fetch_userinfo(provider: str, access_token: str) -> str:
    cfg = get_provider_config(provider)
    if not cfg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(cfg.userinfo_url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    if provider == "spotify":
        return str(data.get("id"))
    if provider == "github":
        return str(data.get("id"))
    if provider in {"google", "youtube"}:
        return str(data.get("sub"))
    return "unknown"


@router.get("/{provider}/start")
def oauth_start(provider: str, user_id: str):
    cfg = get_provider_config(provider)
    if not cfg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    if not cfg.client_id or not cfg.client_secret:
        raise HTTPException(status_code=400, detail="Provider not configured")
    state = _sign_state({"user_id": user_id, "provider": provider, "ts": time.time()})
    session = OAuth2Session(
        client_id=cfg.client_id,
        client_secret=cfg.client_secret,
        redirect_uri=_redirect_uri(provider),
        scope=cfg.scopes,
    )
    auth_url, _ = session.create_authorization_url(
        cfg.auth_url,
        state=state,
        access_type="offline" if provider in {"google", "youtube"} else None,
        prompt="consent" if provider in {"google", "youtube"} else None,
    )
    return RedirectResponse(auth_url)


@router.get("/{provider}/callback")
def oauth_callback(provider: str, request: Request, code: str, state: str):
    payload = _verify_state(state)
    if payload.get("provider") != provider:
        raise HTTPException(status_code=400, detail="Provider mismatch")
    user_id = payload.get("user_id")
    token = _exchange_token(provider, request, code)
    access_token = token.get("access_token")
    refresh_token = token.get("refresh_token")
    expires_in = token.get("expires_in")
    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
    provider_user_id = _fetch_userinfo(provider, access_token)
    upsert_oauth_account(
        user_id=user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at,
        raw_token=token,
    )
    return {"connected": True, "provider": provider, "provider_user_id": provider_user_id}


@router.post("/{provider}/refresh")
def oauth_refresh(provider: str, user_id: str):
    cfg = get_provider_config(provider)
    if not cfg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    if not cfg.supports_refresh:
        raise HTTPException(status_code=400, detail="Provider does not refresh")
    account = get_oauth_account(user_id, provider)
    if not account or not account.get("refresh_token"):
        raise HTTPException(status_code=404, detail="No refresh token stored")
    session = OAuth2Session(
        client_id=cfg.client_id,
        client_secret=cfg.client_secret,
        scope=cfg.scopes,
    )
    token = session.refresh_token(
        cfg.token_url,
        refresh_token=account["refresh_token"],
    )
    access_token = token.get("access_token")
    refresh_token = token.get("refresh_token", account["refresh_token"])
    expires_in = token.get("expires_in")
    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
    provider_user_id = account.get("provider_user_id", "")
    upsert_oauth_account(
        user_id=user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at,
        raw_token=token,
    )
    return {"refreshed": True, "provider": provider}


# ---- Steam (OpenID 2.0) ----


@router.get("/steam/start")
def steam_start(user_id: str):
    state = _sign_state({"user_id": user_id, "provider": "steam", "ts": time.time()})
    params = {
        "openid.ns": "http://specs.openid.net/auth/2.0",
        "openid.mode": "checkid_setup",
        "openid.return_to": f"{settings.oauth_redirect_base_url}/auth/steam/callback",
        "openid.realm": settings.oauth_redirect_base_url,
        "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
        "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        "state": state,
    }
    url = "https://steamcommunity.com/openid/login?" + urlencode(params)
    return RedirectResponse(url)


@router.get("/steam/callback")
def steam_callback(request: Request, state: str):
    payload = _verify_state(state)
    if payload.get("provider") != "steam":
        raise HTTPException(status_code=400, detail="Provider mismatch")
    user_id = payload.get("user_id")
    params = dict(request.query_params)
    params["openid.mode"] = "check_authentication"
    resp = requests.post(
        "https://steamcommunity.com/openid/login", data=params, timeout=10
    )
    if "is_valid:true" not in resp.text:
        raise HTTPException(status_code=400, detail="Steam OpenID validation failed")
    claimed_id = params.get("openid.claimed_id", "")
    steam_id = claimed_id.rsplit("/", 1)[-1]
    upsert_oauth_account(
        user_id=user_id,
        provider="steam",
        provider_user_id=steam_id,
        access_token="",
        refresh_token=None,
        expires_at=None,
        raw_token={"steam_id": steam_id},
    )
    return {"connected": True, "provider": "steam", "provider_user_id": steam_id}
