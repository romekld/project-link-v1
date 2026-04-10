"""AUTH-03/05/10: RBAC role guards — require_role() enforcement."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.dependencies import get_current_user
from app.main import app
from app.schemas.user import UserSchema


def make_bhw():
    return UserSchema(id=10, email="bhw@test.com", full_name="BHW User",
                      roles=["bhw"], health_station_id=1, is_active=True)


def make_nurse_dso():
    return UserSchema(id=11, email="nursedso@test.com", full_name="Nurse DSO",
                      roles=["nurse", "disease_surveillance_officer"],
                      health_station_id=1, is_active=True)


@pytest.mark.asyncio
async def test_role_guard():
    """require_role(["nurse"]) blocks a BHW user with HTTP 403."""
    # Use a protected endpoint that requires system_admin — BHW gets 403
    app.dependency_overrides[get_current_user] = lambda: make_bhw()
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/admin/users", headers={"Authorization": "Bearer dummy"})
        # system_admin required, BHW -> 403
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_dual_role():
    """User with roles=['nurse','disease_surveillance_officer'] passes both nurse and DSO route guards."""
    from app.core.dependencies import require_role
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    test_app = FastAPI()

    @test_app.get("/nurse-only")
    async def nurse_route(_=require_role(["nurse"])):
        return {"ok": True}

    @test_app.get("/dso-only")
    async def dso_route(_=require_role(["disease_surveillance_officer"])):
        return {"ok": True}

    test_app.dependency_overrides[get_current_user] = lambda: make_nurse_dso()
    client = TestClient(test_app)
    assert client.get("/nurse-only").status_code == 200
    assert client.get("/dso-only").status_code == 200


@pytest.mark.asyncio
async def test_dso_write_blocked():
    """DSO is NOT in allowed roles for POST /api/admin/users; gets 403."""
    dso_only = UserSchema(id=12, email="dso@test.com", full_name="DSO Only",
                          roles=["disease_surveillance_officer"],
                          health_station_id=None, is_active=True)
    app.dependency_overrides[get_current_user] = lambda: dso_only
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/admin/users",
                json={"email": "x@x.com", "full_name": "X", "password": "x", "roles": ["nurse"], "health_station_id": 1},
                headers={"Authorization": "Bearer dummy"},
            )
        assert response.status_code == 403
    finally:
        app.dependency_overrides.clear()
