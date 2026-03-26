from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["health"])


class HealthData(BaseModel):
    status: str
    version: str


class HealthResponse(BaseModel):
    data: HealthData
    meta: dict
    error: None = None


@router.get("/health", response_model=HealthResponse, status_code=200)
async def health_check() -> HealthResponse:
    """Liveness probe — no auth required."""
    return HealthResponse(
        data=HealthData(status="ok", version="1.0.0"),
        meta={},
        error=None,
    )
