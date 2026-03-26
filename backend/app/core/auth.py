from __future__ import annotations

from typing import NamedTuple

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings

_security = HTTPBearer()


class CurrentUser(NamedTuple):
    user_id: str
    role: str
    health_station_id: str | None


def verify_jwt(token: str) -> CurrentUser:
    """Decode and validate a Supabase-issued JWT. Raises HTTP 401 on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return CurrentUser(
        user_id=payload.get("sub", ""),
        role=payload.get("role", ""),
        health_station_id=payload.get("health_station_id"),
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> CurrentUser:
    return verify_jwt(credentials.credentials)
