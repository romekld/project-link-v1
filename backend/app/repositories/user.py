"""UserRepository — CRUD for users and user_sessions.

Does NOT inherit BaseRepository — User management is not BHS-scoped.
The admin can manage all users regardless of BHS assignment.
"""
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_session import UserSession


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[User]:
        result = await self.session.execute(select(User).order_by(User.created_at.desc()))
        return list(result.scalars().all())

    async def create(
        self,
        email: str,
        full_name: str,
        hashed_password: str,
        roles: list[str],
        health_station_id: int | None,
    ) -> User:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            roles=roles,
            health_station_id=health_station_id,
            is_active=True,
        )
        self.session.add(user)
        await self.session.flush()  # get auto-generated id before commit
        return user

    async def update(self, user: User, **fields) -> User:
        for k, v in fields.items():
            setattr(user, k, v)
        self.session.add(user)
        return user

    async def get_session_by_token_hash(self, token_hash: str) -> UserSession | None:
        result = await self.session.execute(
            select(UserSession).where(
                UserSession.token_hash == token_hash,
                UserSession.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create_session(
        self,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> UserSession:
        session = UserSession(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.session.add(session)
        await self.session.flush()
        return session

    async def revoke_session(self, session: UserSession) -> None:
        session.revoked_at = datetime.now(timezone.utc)
        self.session.add(session)

    async def revoke_all_sessions(self, user_id: int) -> None:
        """Revoke all active sessions for a user. Called on deactivation — RESEARCH.md Pitfall 4."""
        await self.session.execute(
            update(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
