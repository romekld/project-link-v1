from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, Field, computed_field


class ConsultationCreate(BaseModel):
    chief_complaint: str = Field(..., min_length=1, max_length=2000)
    bp_systolic: int | None = Field(None, ge=40, le=300)
    bp_diastolic: int | None = Field(None, ge=20, le=200)
    heart_rate: int | None = Field(None, ge=20, le=300)
    respiratory_rate: int | None = Field(None, ge=4, le=80)
    temperature: Decimal | None = Field(None, ge=Decimal("30.0"), le=Decimal("45.0"))
    weight: Decimal | None = Field(None, ge=Decimal("0.5"), le=Decimal("500.00"))
    height: Decimal | None = Field(None, ge=Decimal("20.00"), le=Decimal("300.00"))
    vitals_extra: dict[str, Any] | None = None
    diagnosis: str | None = Field(None, max_length=2000)
    referring_to: str | None = Field(None, max_length=500)


class ConsultationResponse(BaseModel):
    id: int
    patient_id: int
    recorded_by: int
    recorded_by_name: str  # joined from user.full_name
    chief_complaint: str
    bp_systolic: int | None
    bp_diastolic: int | None
    heart_rate: int | None
    respiratory_rate: int | None
    temperature: Decimal | None
    weight: Decimal | None
    height: Decimal | None
    vitals_extra: dict[str, Any] | None
    diagnosis: str | None
    referring_to: str | None
    created_at: datetime

    @computed_field
    @property
    def bmi(self) -> float | None:
        """BMI computed on read — never stored (RA 10173 compliance: no derived data)."""
        if self.weight and self.height and self.height > 0:
            h_meters = float(self.height) / 100
            return round(float(self.weight) / (h_meters ** 2), 1)
        return None

    model_config = {"from_attributes": True}
