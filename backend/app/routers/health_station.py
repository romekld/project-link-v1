"""Health stations router — read-only reference data endpoint.

No service or repository layer: health_stations is immutable reference data
seeded once in Phase 1 with zero business logic. This is a deliberate
deviation from the Router → Service → Repository pattern (documented in spec).

Route: GET /api/health-stations (no trailing slash — avoids 307 redirect auth bug)
RBAC: Any authenticated user (all 7 roles need BHS names for display).
"""
from sqlalchemy import select
from fastapi import APIRouter

from app.core.dependencies import AsyncDB, CurrentUser
from app.models.health_station import HealthStation
from app.schemas.health_station import HealthStationListItem

router = APIRouter(prefix="/health-stations", tags=["health-stations"])


@router.get("", response_model=list[HealthStationListItem])
async def list_health_stations(db: AsyncDB, _: CurrentUser):
    result = await db.execute(select(HealthStation).order_by(HealthStation.id))
    return result.scalars().all()
