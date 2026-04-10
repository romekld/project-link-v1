"""Patient router — registration, search, and consultation endpoints.

RBAC summary:
- GET /patients, GET /patients/:id, GET /patients/:id/consultations
    → nurse, midwife, physician, city_health_officer, phis_coordinator, disease_surveillance_officer
- GET /patients/check-duplicate, POST /patients
    → nurse, midwife only
- POST /patients/:id/consultations
    → nurse, midwife, physician

Route ordering:
  /check-duplicate MUST appear before /{patient_id} — FastAPI matches first.
  A GET /patients/check-duplicate would otherwise be matched as /{patient_id} with patient_id="check-duplicate".
"""
from datetime import date

from fastapi import APIRouter, Query

from app.core.dependencies import AsyncDB, CurrentUser, require_role
from app.schemas.consultation import ConsultationCreate, ConsultationResponse
from app.schemas.patient import (
    DuplicateCheckResult,
    PaginatedResponse,
    PatientCreate,
    PatientResponse,
    PatientSearchResponse,
)
from app.services.patient import (
    CONSULTATION_WRITE_ROLES,
    PATIENT_READ_ROLES,
    PATIENT_WRITE_ROLES,
    PatientService,
)

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=PatientSearchResponse)
async def search_patients(
    q: str = "",
    city_wide: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(PATIENT_READ_ROLES),
):
    """Search patients by name. BHS-scoped by default; city_wide=True for city-wide read."""
    svc = PatientService(db, current_user)
    return await svc.search_patients(q, city_wide, page, page_size)


@router.get("/check-duplicate", response_model=DuplicateCheckResult)
async def check_duplicate(
    last_name: str = Query(..., min_length=1),
    first_name: str = Query(..., min_length=1),
    birthdate: date = Query(...),
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(PATIENT_WRITE_ROLES),
):
    """Check if a patient with this name + birthdate already exists city-wide.
    Must be called before POST /patients to surface the 409 conflict UI to the nurse.
    Route placed BEFORE /{patient_id} to avoid path collision.
    """
    svc = PatientService(db, current_user)
    return await svc.check_duplicate(last_name, first_name, birthdate)


@router.post("/", response_model=PatientResponse, status_code=201)
async def register_patient(
    body: PatientCreate,
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(PATIENT_WRITE_ROLES),
):
    """Register a new patient. health_station_id is auto-set from current user's assignment.
    Returns 409 if duplicate found and force_duplicate=False.
    """
    svc = PatientService(db, current_user)
    return await svc.register_patient(body)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(PATIENT_READ_ROLES),
):
    """Return full patient record with health station and barangay names."""
    svc = PatientService(db, current_user)
    return await svc.get_patient(patient_id)


@router.post("/{patient_id}/consultations", response_model=ConsultationResponse, status_code=201)
async def create_consultation(
    patient_id: int,
    body: ConsultationCreate,
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(CONSULTATION_WRITE_ROLES),
):
    """Create a consultation for a patient.
    BHS-scoped roles (nurse, midwife, physician) are blocked if patient belongs to another BHS.
    """
    svc = PatientService(db, current_user)
    return await svc.create_consultation(patient_id, body)


@router.get("/{patient_id}/consultations/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation(
    patient_id: int,
    consultation_id: int,
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(PATIENT_READ_ROLES),
):
    """Return a single consultation by ID, scoped to the patient."""
    svc = PatientService(db, current_user)
    return await svc.get_consultation(patient_id, consultation_id)


@router.get("/{patient_id}/consultations", response_model=PaginatedResponse[ConsultationResponse])
async def list_consultations(
    patient_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncDB = None,
    current_user: CurrentUser = None,
    _=require_role(PATIENT_READ_ROLES),
):
    """Return paginated consultations for a patient with recorded_by_name populated."""
    svc = PatientService(db, current_user)
    return await svc.list_consultations(patient_id, page, page_size)
