"""Auth router — POST /auth/login, /auth/refresh, /auth/logout.

No authentication required on these three routes.
All other routes that need auth use require_role() or CurrentUser dependency.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.dependencies import AsyncDB
from app.schemas.auth import LoginRequest, TokenPair
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


class _RefreshBody(BaseModel):
    refresh_token: str


class _LogoutBody(BaseModel):
    refresh_token: str


@router.post("/login", response_model=TokenPair)
async def login(body: LoginRequest, db: AsyncDB):
    svc = AuthService(db)
    return await svc.login(body)


@router.post("/refresh", response_model=TokenPair)
async def refresh(body: _RefreshBody, db: AsyncDB):
    svc = AuthService(db)
    return await svc.refresh(body.refresh_token)


@router.post("/logout", status_code=204)
async def logout(body: _LogoutBody, db: AsyncDB):
    svc = AuthService(db)
    await svc.logout(body.refresh_token)
