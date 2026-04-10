"""AUTH-08/09: BaseRepository barangay isolation filter."""
import pytest
from sqlalchemy import Column, Integer, select
from sqlalchemy.orm import DeclarativeBase

from app.repositories.base import CROSS_BHS_ROLES, BaseRepository
from app.schemas.user import UserSchema


class _FakeBase(DeclarativeBase):
    pass


class _FakeModel(_FakeBase):
    __tablename__ = "fake_model"
    __table_args__ = {"extend_existing": True}
    id = Column(Integer, primary_key=True)
    health_station_id = Column(Integer)


def make_nurse():
    return UserSchema(id=1, email="n@t.com", full_name="Nurse",
                      roles=["nurse"], health_station_id=5, is_active=True)


def make_cho():
    return UserSchema(id=2, email="cho@t.com", full_name="CHO",
                      roles=["city_health_officer"], health_station_id=None, is_active=True)


def test_isolation_filter():
    """_isolation_filter() adds WHERE health_station_id = 5 for nurse."""
    repo = BaseRepository(session=None, user=make_nurse())  # type: ignore[arg-type]
    query = select(_FakeModel)
    filtered = repo._isolation_filter(query, _FakeModel)
    compiled = str(filtered.compile())
    assert "health_station_id" in compiled


def test_cross_bhs_bypass():
    """_isolation_filter() skips WHERE clause for city_health_officer."""
    repo = BaseRepository(session=None, user=make_cho())  # type: ignore[arg-type]
    query = select(_FakeModel)
    filtered = repo._isolation_filter(query, _FakeModel)
    # CHO should get the same query back — no WHERE added
    assert filtered is query


def test_cho_cross_bhs():
    """CHO role is in CROSS_BHS_ROLES — isolation is skipped."""
    assert "city_health_officer" in CROSS_BHS_ROLES
    assert "phis_coordinator" in CROSS_BHS_ROLES
    assert "disease_surveillance_officer" in CROSS_BHS_ROLES
    assert "nurse" not in CROSS_BHS_ROLES
    assert "bhw" not in CROSS_BHS_ROLES
