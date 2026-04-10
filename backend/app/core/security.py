import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import settings

_pwd = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def hash_token(raw_token: str) -> str:
    """SHA-256 hash of refresh token for DB storage — DB breach doesn't expose valid tokens."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


def create_access_token(
    user_id: int,
    roles: list[str],
    health_station_id: int | None,
) -> str:
    payload = {
        "sub": str(user_id),
        "roles": roles,
        "health_station_id": health_station_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    user_id: int,
    roles: list[str],
    health_station_id: int | None,
) -> str:
    payload = {
        "sub": str(user_id),
        "roles": roles,
        "health_station_id": health_station_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
        "jti": secrets.token_urlsafe(32),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
