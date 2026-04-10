"""AuthService — login, refresh token rotation, logout.

Implements server-side token revocation via user_sessions table.
Refresh token rotation: every /auth/refresh issues new pair, revokes old session row.
"""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_password,
    verify_token,
)
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, TokenPair


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.repo = UserRepository(session)

    async def login(self, body: LoginRequest) -> TokenPair:
        user = await self.repo.get_by_email(body.email)
        if not user or not verify_password(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect email or password.")
        if not user.is_active:
            raise HTTPException(status_code=401, detail="Account is inactive.")

        access_token = create_access_token(user.id, user.roles, user.health_station_id)
        refresh_token = create_refresh_token(user.id, user.roles, user.health_station_id)

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.repo.create_session(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=expires_at,
        )
        await self.session.commit()

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh(self, refresh_token_raw: str) -> TokenPair:
        """Rotate refresh token: validate, revoke old session, issue new pair."""
        payload = verify_token(refresh_token_raw)  # raises 401 on expiry/invalid
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type.")

        token_hash = hash_token(refresh_token_raw)
        session = await self.repo.get_session_by_token_hash(token_hash)
        if not session:
            raise HTTPException(status_code=401, detail="Token has been revoked.")

        user_id = int(payload["sub"])
        roles: list[str] = payload["roles"]
        health_station_id: int | None = payload.get("health_station_id")

        # Revoke the old session before issuing new tokens (rotation)
        await self.repo.revoke_session(session)

        access_token = create_access_token(user_id, roles, health_station_id)
        new_refresh_token = create_refresh_token(user_id, roles, health_station_id)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.repo.create_session(
            user_id=user_id,
            token_hash=hash_token(new_refresh_token),
            expires_at=expires_at,
        )
        await self.session.commit()

        return TokenPair(access_token=access_token, refresh_token=new_refresh_token)

    async def logout(self, refresh_token_raw: str) -> None:
        """Revoke the user_sessions row for this refresh token. No-op if already revoked."""
        try:
            verify_token(refresh_token_raw)
        except HTTPException:
            return  # already expired — nothing to revoke
        token_hash = hash_token(refresh_token_raw)
        session = await self.repo.get_session_by_token_hash(token_hash)
        if session:
            await self.repo.revoke_session(session)
            await self.session.commit()
