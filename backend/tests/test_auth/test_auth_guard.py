"""AUTH-07: Unauthenticated requests to protected endpoints return 401."""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_unauthenticated_returns_401():
    """GET /api/admin/users without Authorization header returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/admin/users")
    assert response.status_code == 401
