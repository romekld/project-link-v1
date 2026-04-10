from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class PrenatalEnrollmentCreate(BaseModel):
    gravida: int = Field(..., ge=1)
    para: int = Field(..., ge=0)
    lmp: date
    edc: date
    risk_factors: str | None = Field(None, max_length=2000)


class PrenatalEnrollmentResponse(BaseModel):
    id: int
    patient_id: int
    health_station_id: int
    recorded_by: int
    gravida: int
    para: int
    lmp: date
    edc: date
    risk_factors: str | None
    is_high_risk: bool
    next_visit_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PrenatalVisitCreate(BaseModel):
    visit_date: date
    aog_weeks: int | None = Field(None, ge=1, le=45)
    weight: Decimal | None = Field(None, ge=Decimal("20.00"), le=Decimal("300.00"))
    bp_systolic: int | None = Field(None, ge=40, le=300)
    bp_diastolic: int | None = Field(None, ge=20, le=200)
    fundic_height: Decimal | None = Field(None, ge=Decimal("5.0"), le=Decimal("50.0"))
    fetal_heart_tone: int | None = Field(None, ge=60, le=220)
    presentation: str | None = Field(None, max_length=100)
    edema: str | None = Field(None, max_length=100)
    hgb: Decimal | None = Field(None, ge=Decimal("3.0"), le=Decimal("20.0"))
    gdm_positive: bool | None = None
    tt_dose: int | None = Field(None, ge=1, le=5)
    iron_supplementation: bool | None = None
    counseling_notes: str | None = Field(None, max_length=2000)


class PrenatalVisitResponse(BaseModel):
    id: int
    prenatal_enrollment_id: int
    recorded_by: int
    visit_date: date
    aog_weeks: int | None
    weight: Decimal | None
    bp_systolic: int | None
    bp_diastolic: int | None
    fundic_height: Decimal | None
    fetal_heart_tone: int | None
    presentation: str | None
    edema: str | None
    hgb: Decimal | None
    gdm_positive: bool | None
    tt_dose: int | None
    iron_supplementation: bool | None
    counseling_notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
