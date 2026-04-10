"""BaseRepository — base class for all Phase 2+ repositories.

Provides barangay data isolation via _isolation_filter().
All clinical repositories in Phases 3–9 must inherit from this class.

CROSS_BHS_ROLES is a named module-level constant so downstream phases can
import and reuse it without duplicating the set.
"""
from typing import Any

from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.user import UserSchema

# Roles that can read/write across ALL barangay health stations.
# Nurses, physicians, BHWs, and midwives are scoped to their own BHS only.
CROSS_BHS_ROLES: frozenset[str] = frozenset({
    "city_health_officer",
    "phis_coordinator",
    "disease_surveillance_officer",
})


class BaseRepository:
    """Base class for all domain repositories.

    Instantiate per-request with both the DB session and the current user
    so that _isolation_filter() has access to health_station_id without
    a separate DB query.

    Usage (in router):
        repo = PatientRepository(session=db, user=current_user)
    """

    def __init__(self, session: AsyncSession, user: UserSchema) -> None:
        self.session = session
        self.user = user

    def _isolation_filter(self, query: Select, model: Any) -> Select:
        """Apply WHERE health_station_id = user.health_station_id for BHS-scoped roles.

        Skipped for CROSS_BHS_ROLES (CHO, PHIS, DSO) — those roles see all BHS data.
        Also skipped if the model has no health_station_id column (e.g., audit_logs).
        """
        if any(r in CROSS_BHS_ROLES for r in self.user.roles):
            return query
        if not hasattr(model, "health_station_id"):
            return query
        return query.where(model.health_station_id == self.user.health_station_id)
