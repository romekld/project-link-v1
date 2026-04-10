from datetime import date, datetime
from typing import Generic, TypeVar
from pydantic import BaseModel, Field, computed_field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class PatientCreate(BaseModel):
    last_name: str = Field(..., min_length=1, max_length=200)
    first_name: str = Field(..., min_length=1, max_length=200)
    middle_name: str | None = Field(None, max_length=200)
    birthdate: date
    sex: str = Field(..., pattern=r"^(male|female)$")
    barangay_psgc_code: str = Field(..., min_length=1)
    address_line: str | None = Field(None, max_length=500)
    mobile_number: str | None = Field(None, max_length=20)
    # health_station_id is auto-set from current_user in service layer — not in request body
    # force_duplicate: if True, save with possible_duplicate=True despite match
    force_duplicate: bool = False


class PatientResponse(BaseModel):
    id: int
    last_name: str
    first_name: str
    middle_name: str | None
    birthdate: date
    sex: str
    barangay_psgc_code: str
    barangay_name: str  # joined from barangay.name
    address_line: str | None
    health_station_id: int
    health_station_name: str  # joined from health_station.name
    mobile_number: str | None
    possible_duplicate: bool
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def age(self) -> int:
        today = date.today()
        return today.year - self.birthdate.year - (
            (today.month, today.day) < (self.birthdate.month, self.birthdate.day)
        )

    model_config = {"from_attributes": True}


class PatientListItem(BaseModel):
    id: int
    last_name: str
    first_name: str
    middle_name: str | None
    birthdate: date
    sex: str
    health_station_id: int
    health_station_name: str
    possible_duplicate: bool
    created_at: datetime

    @computed_field
    @property
    def full_name(self) -> str:
        # Format: "LAST_NAME, First Middle" — standard Philippine patient record format
        given = " ".join(filter(None, [self.first_name, self.middle_name]))
        return f"{self.last_name}, {given}"

    model_config = {"from_attributes": True}


class DuplicateCheckResult(BaseModel):
    has_duplicate: bool
    existing_patient: PatientListItem | None = None


class PatientSearchResponse(PaginatedResponse[PatientListItem]):
    pass
