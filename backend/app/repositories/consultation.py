"""ConsultationRepository — paginated list and create for consultations.

Key design decisions:
- list_for_patient loads recorded_by_user via selectinload — avoids N+1 for recorded_by_name
- No BHS isolation on consultations — access is controlled at patient level in service layer
"""
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.models.consultation import Consultation
from app.repositories.base import BaseRepository


class ConsultationRepository(BaseRepository):

    async def list_for_patient(
        self, patient_id: int, page: int, page_size: int
    ) -> tuple[list[Consultation], int]:
        """Return paginated consultations for a patient, newest first.

        Eagerly loads recorded_by_user to populate recorded_by_name in response
        without a secondary query per row.
        """
        base_stmt = select(Consultation).where(Consultation.patient_id == patient_id)

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = (await self.session.execute(count_stmt)).scalar_one()

        data_stmt = (
            base_stmt
            .options(selectinload(Consultation.recorded_by_user))
            .order_by(Consultation.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.execute(data_stmt)
        return list(result.scalars().all()), total

    async def get_by_id(self, consultation_id: int, patient_id: int) -> Consultation | None:
        """Get a single consultation by ID, scoped to the given patient_id.

        Eagerly loads recorded_by_user for recorded_by_name in response.
        """
        stmt = (
            select(Consultation)
            .options(selectinload(Consultation.recorded_by_user))
            .where(
                Consultation.id == consultation_id,
                Consultation.patient_id == patient_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Consultation:
        """Insert a new Consultation row. Flush (not commit) — caller commits."""
        consultation = Consultation(**kwargs)
        self.session.add(consultation)
        await self.session.flush()
        return consultation
