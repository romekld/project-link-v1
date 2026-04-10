"""AUTH-04/06: Admin user management tests."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.dependencies import get_current_user
from app.core.security import hash_password
from app.main import app
from app.schemas.user import UserSchema


def make_admin():
    return UserSchema(id=99, email="admin@test.com", full_name="Admin",
                      roles=["system_admin"], health_station_id=None, is_active=True)


def make_nurse():
    return UserSchema(id=98, email="nurse@test.com", full_name="Nurse",
                      roles=["nurse"], health_station_id=1, is_active=True)


@pytest.mark.asyncio
async def test_create_user_success(async_session):
    """POST /api/admin/users by system_admin creates a user and returns 201."""
    app.dependency_overrides[get_current_user] = lambda: make_admin()
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/admin/users",
                json={
                    "email": "newuser@test.com",
                    "full_name": "New Nurse",
                    "password": "password123",
                    "roles": ["nurse"],
                    "health_station_id": None,  # null avoids FK constraint in test DB
                },
                headers={"Authorization": "Bearer dummy"},
            )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["roles"] == ["nurse"]
        assert data["is_active"] is True
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_admin_exclusive(async_session):
    """POST /api/admin/users with roles=['system_admin','nurse'] returns 422."""
    app.dependency_overrides[get_current_user] = lambda: make_admin()
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/admin/users",
                json={
                    "email": "conflict@test.com",
                    "full_name": "Conflict User",
                    "password": "password123",
                    "roles": ["system_admin", "nurse"],
                    "health_station_id": None,
                },
                headers={"Authorization": "Bearer dummy"},
            )
        assert response.status_code == 422
        assert "system_admin cannot be combined with other roles" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_non_admin_blocked(async_session):
    """POST /api/admin/users by a nurse returns 403."""
    app.dependency_overrides[get_current_user] = lambda: make_nurse()
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/admin/users",
                json={
                    "email": "shouldfail@test.com",
                    "full_name": "Should Fail",
                    "password": "password123",
                    "roles": ["nurse"],
                    "health_station_id": 1,
                },
                headers={"Authorization": "Bearer dummy"},
            )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()
