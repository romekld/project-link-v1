"""AUTH-02: Refresh token rotation — old token invalidated, new pair issued."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import hash_password
from app.main import app
from app.models.user import User


@pytest.mark.asyncio
async def test_refresh_rotates_token(async_session):
    """POST /auth/refresh issues new token pair and revokes the old refresh token."""
    user = User(
        email="refresh@test.com",
        full_name="Refresh Test",
        hashed_password=hash_password("password123"),
        roles=["nurse"],
        health_station_id=None,
        is_active=True,
    )
    async_session.add(user)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_resp = await client.post("/api/auth/login", json={"email": "refresh@test.com", "password": "password123"})
        original_refresh = login_resp.json()["refresh_token"]

        refresh_resp = await client.post("/api/auth/refresh", json={"refresh_token": original_refresh})
        assert refresh_resp.status_code == 200
        data = refresh_resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["refresh_token"] != original_refresh  # rotation: new token issued

        # Old token is revoked — using it again must fail
        retry = await client.post("/api/auth/refresh", json={"refresh_token": original_refresh})
        assert retry.status_code == 401


@pytest.mark.asyncio
async def test_revoked_token(async_session):
    """POST /auth/refresh with an already-revoked token returns 401."""
    user = User(
        email="revoked@test.com",
        full_name="Revoked Test",
        hashed_password=hash_password("password123"),
        roles=["nurse"],
        health_station_id=None,
        is_active=True,
    )
    async_session.add(user)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_resp = await client.post("/api/auth/login", json={"email": "revoked@test.com", "password": "password123"})
        refresh_token = login_resp.json()["refresh_token"]

        # Logout revokes the token
        await client.post("/api/auth/logout", json={"refresh_token": refresh_token})

        # Now try to refresh with the revoked token
        response = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert response.status_code == 401
