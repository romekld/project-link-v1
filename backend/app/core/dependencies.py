from typing import Annotated

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.security import verify_token
from app.schemas.user import UserSchema

# Existing from Phase 1:
AsyncDB = Annotated[AsyncSession, Depends(get_async_session)]
# Usage in routers: async def endpoint(db: AsyncDB): ...

# Auth bearer scheme — auto_error=False so we can return 401 (not 403) for missing header
_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> UserSchema:
    """Extract and validate the JWT from the Authorization: Bearer header.
    Raises HTTP 401 if header is missing or token is invalid/expired."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = verify_token(credentials.credentials)
    return UserSchema(
        id=int(payload["sub"]),
        email="",  # not in JWT — fetched from DB only when needed (admin operations)
        full_name="",
        roles=payload["roles"],
        health_station_id=payload.get("health_station_id"),
        is_active=True,
    )


CurrentUser = Annotated[UserSchema, Depends(get_current_user)]


def require_role(allowed_roles: list[str]):
    """FastAPI dependency factory. Returns a dependency that raises 403 if
    the current user's roles do not intersect with allowed_roles.

    Usage:
        async def endpoint(db: AsyncDB, current_user: CurrentUser, _=Depends(require_role(["nurse"]))):
    """
    async def _guard(current_user: CurrentUser) -> None:
        if not any(r in allowed_roles for r in current_user.roles):
            raise HTTPException(
                status_code=403,
                detail=f"Access requires one of: {allowed_roles}",
            )
    return Depends(_guard)
