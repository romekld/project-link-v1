import pytest
import httpx


@pytest.mark.asyncio
async def test_health_endpoint():
    """INFRA-01: FastAPI /health returns 200."""
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
