from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, Field


EPI_VACCINES = Literal[
    "BCG",
    "HepB_BD", "HepB_1", "HepB_2", "HepB_3",
    "DPT_1", "DPT_2", "DPT_3",
    "OPV_1", "OPV_2", "OPV_3",
    "IPV_1", "IPV_2",
    "PCV_1", "PCV_2", "PCV_3",
    "MMR_1", "MMR_2",
    "MCV_1", "MCV_2",
]


class EpiEnrollmentCreate(BaseModel):
    enrollment_date: date


class EpiEnrollmentResponse(BaseModel):
    id: int
    patient_id: int
    health_station_id: int
    recorded_by: int
    enrollment_date: date
    fic_status: bool
    next_visit_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class EpiVaccinationCreate(BaseModel):
    vaccine: EPI_VACCINES
    dose_number: int = Field(..., ge=1, le=5)
    date_given: date
    lot_number: str | None = Field(None, max_length=100)
    site: str | None = Field(None, max_length=100)
    administered_by: str | None = Field(None, max_length=200)


class EpiVaccinationResponse(BaseModel):
    id: int
    epi_enrollment_id: int
    recorded_by: int
    vaccine: str
    dose_number: int
    date_given: date
    lot_number: str | None
    site: str | None
    administered_by: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
