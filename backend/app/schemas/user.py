from pydantic import BaseModel


class UserSchema(BaseModel):
    id: int
    email: str
    full_name: str
    roles: list[str]
    health_station_id: int | None
    is_active: bool

    model_config = {"from_attributes": True}


class UserListItem(BaseModel):
    id: int
    email: str
    full_name: str
    roles: list[str]
    health_station_id: int | None
    is_active: bool
    created_at: str  # ISO 8601 — serialized from datetime in service layer

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    email: str
    full_name: str
    password: str
    roles: list[str]
    health_station_id: int | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    password: str | None = None  # optional on edit; None means "no change"
    roles: list[str] | None = None
    health_station_id: int | None = None
    is_active: bool | None = None
