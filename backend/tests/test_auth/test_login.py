"""AUTH-01: Login flow — email/password -> access+refresh token pair."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import hash_password
from app.main import app
from app.models.user import User


@pytest.mark.asyncio
async def test_login_success(async_session):
    """POST /auth/login with valid credentials returns 200 + token pair."""
    user = User(
        email="nurse@test.com",
        full_name="Test Nurse",
        hashed_password=hash_password("password123"),
        roles=["nurse"],
        health_station_id=None,  # null avoids FK constraint in test DB (no health_stations fixture)
        is_active=True,
    )
    async_session.add(user)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={"email": "nurse@test.com", "password": "password123"})

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_wrong_password(async_session):
    """POST /auth/login with wrong password returns 401."""
    user = User(
        email="wrongpw@test.com",
        full_name="Test User",
        hashed_password=hash_password("correctpassword"),
        roles=["nurse"],
        health_station_id=None,
        is_active=True,
    )
    async_session.add(user)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={"email": "wrongpw@test.com", "password": "wrongpassword"})

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_inactive_user(async_session):
    """POST /auth/login with inactive user (is_active=False) returns 401."""
    user = User(
        email="inactive@test.com",
        full_name="Inactive User",
        hashed_password=hash_password("password123"),
        roles=["nurse"],
        health_station_id=None,
        is_active=False,
    )
    async_session.add(user)
    await async_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/auth/login", json={"email": "inactive@test.com", "password": "password123"})

    assert response.status_code == 401
