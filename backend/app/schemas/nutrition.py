from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class NutritionEnrollmentCreate(BaseModel):
    enrollment_date: date


class NutritionEnrollmentResponse(BaseModel):
    id: int
    patient_id: int
    health_station_id: int
    recorded_by: int
    enrollment_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class NutritionVisitCreate(BaseModel):
    visit_date: date
    weight: Decimal = Field(..., ge=Decimal("0.5"), le=Decimal("200.00"))
    height: Decimal = Field(..., ge=Decimal("20.00"), le=Decimal("250.00"))
    muac: Decimal | None = Field(None, ge=Decimal("5.0"), le=Decimal("50.0"))


class NutritionVisitResponse(BaseModel):
    id: int
    nutrition_enrollment_id: int
    recorded_by: int
    visit_date: date
    weight: Decimal
    height: Decimal
    muac: Decimal | None
    waz: Decimal | None
    haz: Decimal | None
    whz: Decimal | None
    nutrition_status: str | None
    severe_wasting: bool
    created_at: datetime

    model_config = {"from_attributes": True}
