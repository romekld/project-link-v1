"""AUTH-02: Logout — revokes user_sessions row server-side."""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.security import hash_password, hash_token
from app.main import app
from app.models.user import User
from app.models.user_session import UserSession


@pytest.mark.asyncio
async def test_logout_revokes_session(async_session):
    """POST /auth/logout sets revoked_at on the user_sessions row; subsequent refresh fails."""
    user = User(
        email="logout@test.com",
        full_name="Logout Test",
        hashed_password=hash_password("password123"),
        roles=["nurse"],
        health_station_id=None,
        is_active=True,
    )
    async_session.add(user)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login_resp = await client.post("/api/auth/login", json={"email": "logout@test.com", "password": "password123"})
        assert login_resp.status_code == 200
        refresh_token = login_resp.json()["refresh_token"]

        logout_resp = await client.post("/api/auth/logout", json={"refresh_token": refresh_token})
        assert logout_resp.status_code == 204

        # Subsequent refresh with the revoked token must fail
        refresh_resp = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert refresh_resp.status_code == 401

    # Verify revoked_at is set in DB
    result = await async_session.execute(
        select(UserSession).where(UserSession.token_hash == hash_token(refresh_token))
    )
    session_row = result.scalar_one_or_none()
    assert session_row is not None
    assert session_row.revoked_at is not None
