from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, Field


class PostpartumEnrollmentCreate(BaseModel):
    prenatal_enrollment_id: int | None = None
    delivery_date: date
    delivery_type: str | None = Field(None, max_length=100)
    birth_outcome: str | None = Field(None, max_length=100)


class PostpartumEnrollmentResponse(BaseModel):
    id: int
    patient_id: int
    health_station_id: int
    recorded_by: int
    prenatal_enrollment_id: int | None
    delivery_date: date
    delivery_type: str | None
    birth_outcome: str | None
    day1_date: date | None
    week1_date: date | None
    week6_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PostpartumVisitCreate(BaseModel):
    visit_date: date
    visit_type: Literal["day1", "week1", "week6"]
    bp_systolic: int | None = Field(None, ge=40, le=300)
    bp_diastolic: int | None = Field(None, ge=20, le=200)
    wound_status: str | None = Field(None, max_length=500)
    breastfeeding: bool | None = None
    family_planning_counseling: bool | None = None
    newborn_status: str | None = Field(None, max_length=500)
    notes: str | None = Field(None, max_length=2000)


class PostpartumVisitResponse(BaseModel):
    id: int
    postpartum_enrollment_id: int
    recorded_by: int
    visit_date: date
    visit_type: str
    bp_systolic: int | None
    bp_diastolic: int | None
    wound_status: str | None
    breastfeeding: bool | None
    family_planning_counseling: bool | None
    newborn_status: str | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
