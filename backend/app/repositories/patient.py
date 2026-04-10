"""PatientRepository — BHS-isolated patient search, duplicate check, CRUD.

Key design decisions:
- search() applies _isolation_filter unless city_wide=True (city-wide read is safe; write protection is in service)
- check_duplicate() is always city-wide — no isolation filter (must detect duplicates across all BHS)
- tsvector query uses 'simple' config with :* prefix match — matches Filipino partial name entry
- sanitize strips punctuation; split into tokens joined with & (AND) for multi-term search
"""
import re
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import contains_eager, selectinload

from app.models.patient import Patient
from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository):

    def _sanitize_search_input(self, raw: str) -> str:
        """Strip non-alphanumeric (except spaces), split to tokens, append :* for prefix match, join with &."""
        cleaned = re.sub(r"[^\w\s]", "", raw, flags=re.UNICODE)
        tokens = cleaned.split()
        if not tokens:
            return ""
        return " & ".join(f"{token}:*" for token in tokens)

    async def search(
        self, query_text: str, city_wide: bool, page: int, page_size: int
    ) -> tuple[list[Patient], int]:
        """Search patients by name using tsvector GIN index.

        Returns (patients, total_count).
        BHS-scoped by default; city_wide=True skips isolation for read-only results.
        """
        base_stmt = select(Patient).join(Patient.health_station).options(contains_eager(Patient.health_station))

        if query_text.strip():
            sanitized = self._sanitize_search_input(query_text)
            if sanitized:
                tsquery = func.to_tsquery("simple", sanitized)
                base_stmt = base_stmt.where(Patient.search_vector.op("@@")(tsquery))

        if not city_wide:
            base_stmt = self._isolation_filter(base_stmt, Patient)

        # Count total before pagination
        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        # Paginate
        data_stmt = (
            base_stmt
            .order_by(Patient.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(data_stmt)
        patients = list(result.scalars().all())

        return patients, total

    async def check_duplicate(
        self, last_name: str, first_name: str, birthdate: date
    ) -> Patient | None:
        """City-wide exact case-insensitive match on (last_name, first_name, birthdate).

        Always checks ALL BHS — no isolation filter applied.
        Used before patient registration and for GET /check-duplicate.
        """
        stmt = (
            select(Patient)
            .join(Patient.health_station)
            .options(contains_eager(Patient.health_station))
            .where(
                func.lower(Patient.last_name) == last_name.strip().lower(),
                func.lower(Patient.first_name) == first_name.strip().lower(),
                Patient.birthdate == birthdate,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, patient_id: int) -> Patient | None:
        """Get patient by ID without eager-loading relations.

        No isolation filter — patient profiles are viewable city-wide.
        Use when you only need the Patient row (e.g., existence check).
        """
        stmt = select(Patient).where(Patient.id == patient_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_relations(self, patient_id: int) -> Patient | None:
        """Get patient with health_station and barangay eagerly loaded.

        Use when building PatientResponse (needs health_station_name, barangay_name).
        """
        stmt = (
            select(Patient)
            .options(
                selectinload(Patient.health_station),
                selectinload(Patient.barangay),
            )
            .where(Patient.id == patient_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Patient:
        """Insert a new Patient row. Flush (not commit) — caller commits after audit log."""
        patient = Patient(**kwargs)
        self.session.add(patient)
        await self.session.flush()
        return patient
