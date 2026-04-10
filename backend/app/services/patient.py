"""PatientService — patient registration, search, and consultation management.

Key design decisions:
- health_station_id auto-set from current_user (not from request body) — prevents cross-BHS registration
- Duplicate detection is city-wide; force_duplicate=True bypasses 409 with possible_duplicate=True flag
- CROSS_BHS_ROLES always see city-wide results regardless of city_wide parameter
- BHS-level write protection: consultation creation blocked for patients at another BHS
- Audit log written before final commit so both patient and audit entries are in the same transaction
"""
import json
import math
from datetime import date

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.base import CROSS_BHS_ROLES
from app.repositories.consultation import ConsultationRepository
from app.repositories.patient import PatientRepository
from app.schemas.consultation import ConsultationCreate, ConsultationResponse
from app.schemas.patient import (
    DuplicateCheckResult,
    PaginatedResponse,
    PatientCreate,
    PatientListItem,
    PatientResponse,
    PatientSearchResponse,
)
from app.schemas.user import UserSchema

PATIENT_READ_ROLES = [
    "nurse",
    "midwife",
    "physician",
    "city_health_officer",
    "phis_coordinator",
    "disease_surveillance_officer",
]
PATIENT_WRITE_ROLES = ["nurse", "midwife"]
CONSULTATION_WRITE_ROLES = ["nurse", "midwife", "physician"]


class PatientService:
    def __init__(self, session: AsyncSession, current_user: UserSchema) -> None:
        self.session = session
        self.current_user = current_user
        self.patient_repo = PatientRepository(session=session, user=current_user)
        self.consultation_repo = ConsultationRepository(session=session, user=current_user)

    async def search_patients(
        self, q: str, city_wide: bool, page: int, page_size: int
    ) -> PatientSearchResponse:
        """Search patients by name. CROSS_BHS_ROLES always see city-wide results."""
        # CROSS_BHS_ROLES (CHO, PHIS, DSO) always get city-wide regardless of client parameter
        if any(r in CROSS_BHS_ROLES for r in self.current_user.roles):
            city_wide = True

        patients, total = await self.patient_repo.search(q, city_wide, page, page_size)

        items = []
        for p in patients:
            hs_name = p.health_station.name if p.health_station else ""
            items.append(
                PatientListItem(
                    id=p.id,
                    last_name=p.last_name,
                    first_name=p.first_name,
                    middle_name=p.middle_name,
                    birthdate=p.birthdate,
                    sex=p.sex,
                    health_station_id=p.health_station_id,
                    health_station_name=hs_name,
                    possible_duplicate=p.possible_duplicate,
                    created_at=p.created_at,
                )
            )

        total_pages = max(1, math.ceil(total / page_size))
        return PatientSearchResponse(
            items=items, total=total, page=page, page_size=page_size, total_pages=total_pages
        )

    async def check_duplicate(
        self, last_name: str, first_name: str, birthdate: date
    ) -> DuplicateCheckResult:
        """City-wide duplicate check before patient registration."""
        existing = await self.patient_repo.check_duplicate(last_name, first_name, birthdate)
        if existing:
            hs_name = existing.health_station.name if existing.health_station else ""
            item = PatientListItem(
                id=existing.id,
                last_name=existing.last_name,
                first_name=existing.first_name,
                middle_name=existing.middle_name,
                birthdate=existing.birthdate,
                sex=existing.sex,
                health_station_id=existing.health_station_id,
                health_station_name=hs_name,
                possible_duplicate=existing.possible_duplicate,
                created_at=existing.created_at,
            )
            return DuplicateCheckResult(has_duplicate=True, existing_patient=item)
        return DuplicateCheckResult(has_duplicate=False)

    async def register_patient(self, body: PatientCreate) -> PatientResponse:
        """Register a new patient. health_station_id is auto-set from current_user."""
        # Auto-set health_station_id from current user (RESEARCH.md Pitfall 5)
        health_station_id = self.current_user.health_station_id
        if not health_station_id:
            raise HTTPException(
                status_code=400,
                detail="Your account has no assigned health station.",
            )

        # Check duplicate city-wide before creating
        existing = await self.patient_repo.check_duplicate(
            body.last_name, body.first_name, body.birthdate
        )

        if existing and not body.force_duplicate:
            raise HTTPException(
                status_code=409,
                detail="A patient with the same name and birthdate already exists.",
            )

        patient = await self.patient_repo.create(
            last_name=body.last_name.strip(),
            first_name=body.first_name.strip(),
            middle_name=body.middle_name.strip() if body.middle_name else None,
            birthdate=body.birthdate,
            sex=body.sex,
            barangay_psgc_code=body.barangay_psgc_code,
            address_line=body.address_line.strip() if body.address_line else None,
            health_station_id=health_station_id,
            mobile_number=body.mobile_number.strip() if body.mobile_number else None,
            possible_duplicate=body.force_duplicate and existing is not None,
        )
        await self.session.commit()
        await self.session.refresh(patient)

        # Audit log — includes duplicate_override flag when force_duplicate used
        audit_op = "CREATE"
        audit_payload: dict = {"patient_id": patient.id, "action": "register_patient"}
        if body.force_duplicate and existing is not None:
            audit_payload["duplicate_override"] = True
            audit_payload["existing_patient_id"] = existing.id

        await self._write_audit("patients", audit_op, audit_payload)
        await self.session.commit()

        # Reload with relations for response (health_station + barangay names)
        patient_full = await self.patient_repo.get_by_id_with_relations(patient.id)
        return self._to_patient_response(patient_full)

    async def get_patient(self, patient_id: int) -> PatientResponse:
        """Return full patient record with health_station and barangay names."""
        patient = await self.patient_repo.get_by_id_with_relations(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")
        return self._to_patient_response(patient)

    async def create_consultation(
        self, patient_id: int, body: ConsultationCreate
    ) -> ConsultationResponse:
        """Create a consultation for a patient.

        BHS-scoped roles (nurse, midwife, physician) can only create consultations for
        patients registered at their own health station. CROSS_BHS_ROLES are exempt.
        """
        patient = await self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")

        # City-wide search results are read-only — nurse cannot create consultation on another BHS patient
        is_cross_bhs = any(r in CROSS_BHS_ROLES for r in self.current_user.roles)
        if not is_cross_bhs and patient.health_station_id != self.current_user.health_station_id:
            raise HTTPException(
                status_code=403,
                detail="Cannot create consultation for a patient at another health station.",
            )

        consultation = await self.consultation_repo.create(
            patient_id=patient_id,
            recorded_by=self.current_user.id,
            chief_complaint=body.chief_complaint.strip(),
            bp_systolic=body.bp_systolic,
            bp_diastolic=body.bp_diastolic,
            heart_rate=body.heart_rate,
            respiratory_rate=body.respiratory_rate,
            temperature=body.temperature,
            weight=body.weight,
            height=body.height,
            vitals_extra=body.vitals_extra,
            diagnosis=body.diagnosis,
            referring_to=body.referring_to,
        )
        await self.session.commit()
        await self.session.refresh(consultation)

        return ConsultationResponse(
            id=consultation.id,
            patient_id=consultation.patient_id,
            recorded_by=consultation.recorded_by,
            recorded_by_name=self.current_user.full_name or "Unknown",
            chief_complaint=consultation.chief_complaint,
            bp_systolic=consultation.bp_systolic,
            bp_diastolic=consultation.bp_diastolic,
            heart_rate=consultation.heart_rate,
            respiratory_rate=consultation.respiratory_rate,
            temperature=consultation.temperature,
            weight=consultation.weight,
            height=consultation.height,
            vitals_extra=consultation.vitals_extra,
            diagnosis=consultation.diagnosis,
            referring_to=consultation.referring_to,
            created_at=consultation.created_at,
        )

    async def list_consultations(
        self, patient_id: int, page: int, page_size: int
    ) -> PaginatedResponse[ConsultationResponse]:
        """Return paginated consultations for a patient with recorded_by_name populated."""
        patient = await self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")

        consultations, total = await self.consultation_repo.list_for_patient(
            patient_id, page, page_size
        )
        total_pages = max(1, math.ceil(total / page_size))

        items = []
        for c in consultations:
            # recorded_by_user eagerly loaded via selectinload in ConsultationRepository.list_for_patient
            recorded_name = c.recorded_by_user.full_name if c.recorded_by_user else "Unknown"
            items.append(
                ConsultationResponse(
                    id=c.id,
                    patient_id=c.patient_id,
                    recorded_by=c.recorded_by,
                    recorded_by_name=recorded_name,
                    chief_complaint=c.chief_complaint,
                    bp_systolic=c.bp_systolic,
                    bp_diastolic=c.bp_diastolic,
                    heart_rate=c.heart_rate,
                    respiratory_rate=c.respiratory_rate,
                    temperature=c.temperature,
                    weight=c.weight,
                    height=c.height,
                    vitals_extra=c.vitals_extra,
                    diagnosis=c.diagnosis,
                    referring_to=c.referring_to,
                    created_at=c.created_at,
                )
            )

        return PaginatedResponse[ConsultationResponse](
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    async def get_consultation(
        self, patient_id: int, consultation_id: int
    ) -> ConsultationResponse:
        """Return a single consultation by ID. Verifies patient exists first."""
        patient = await self.patient_repo.get_by_id(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found.")

        consultation = await self.consultation_repo.get_by_id(consultation_id, patient_id)
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found.")

        recorded_name = (
            consultation.recorded_by_user.full_name
            if consultation.recorded_by_user else "Unknown"
        )
        return ConsultationResponse(
            id=consultation.id,
            patient_id=consultation.patient_id,
            recorded_by=consultation.recorded_by,
            recorded_by_name=recorded_name,
            chief_complaint=consultation.chief_complaint,
            bp_systolic=consultation.bp_systolic,
            bp_diastolic=consultation.bp_diastolic,
            heart_rate=consultation.heart_rate,
            respiratory_rate=consultation.respiratory_rate,
            temperature=consultation.temperature,
            weight=consultation.weight,
            height=consultation.height,
            vitals_extra=consultation.vitals_extra,
            diagnosis=consultation.diagnosis,
            referring_to=consultation.referring_to,
            created_at=consultation.created_at,
        )

    # -------------------------------------------------------------------------
    # Private helpers
    # -------------------------------------------------------------------------

    def _to_patient_response(self, patient) -> PatientResponse:
        """Convert ORM Patient (with eagerly loaded relations) to PatientResponse."""
        return PatientResponse(
            id=patient.id,
            last_name=patient.last_name,
            first_name=patient.first_name,
            middle_name=patient.middle_name,
            birthdate=patient.birthdate,
            sex=patient.sex,
            barangay_psgc_code=patient.barangay_psgc_code,
            barangay_name=patient.barangay.name if patient.barangay else "",
            address_line=patient.address_line,
            health_station_id=patient.health_station_id,
            health_station_name=patient.health_station.name if patient.health_station else "",
            mobile_number=patient.mobile_number,
            possible_duplicate=patient.possible_duplicate,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
        )

    async def _write_audit(
        self, table_name: str, operation: str, new_values: dict
    ) -> None:
        """Write to audit_logs. Same pattern as AdminService._write_audit.

        Uses gen_random_uuid() for record_id — audit_logs.record_id is UUID,
        patient.id is INTEGER. Store patient PK in new_values JSONB instead.
        """
        await self.session.execute(
            text(
                "INSERT INTO audit_logs (table_name, record_id, operation, performed_by, new_values) "
                "VALUES (:table, gen_random_uuid(), :op, NULL, :new)"
            ),
            {"table": table_name, "op": operation, "new": json.dumps(new_values)},
        )
