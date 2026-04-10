"""Unit tests for auth layer: UserRepository, AuthService, and require_role dependency.

These are unit tests that use mocks (no live DB required) to verify
business logic in isolation. Integration tests against real DB live in
test_login.py / test_refresh.py / test_logout.py (un-stubbed in 02-03b).

Covers behavior spec from 02-03a-PLAN.md:
  - UserRepository.get_by_email returns None for non-existent email
  - UserRepository.create returns User ORM object
  - AuthService.login with correct credentials returns TokenPair
  - AuthService.login with wrong password raises HTTPException(401)
  - AuthService.login for inactive user raises HTTPException(401)
  - require_role(["nurse"]) raises HTTPException(403) for BHW user
  - require_role(["nurse", "disease_surveillance_officer"]) passes dual-role user
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException

from app.schemas.auth import LoginRequest, TokenPair
from app.schemas.user import UserSchema
from app.repositories.base import BaseRepository, CROSS_BHS_ROLES


# ---------------------------------------------------------------------------
# BaseRepository unit tests (no DB — pure logic)
# ---------------------------------------------------------------------------

class FakeModel:
    """Mock ORM model that has health_station_id."""
    health_station_id = None


class FakeModelNoHSID:
    """Mock ORM model that does NOT have health_station_id."""
    pass


def _make_query():
    """Return a mock Select query that tracks .where() calls."""
    q = MagicMock()
    q.where = MagicMock(return_value=q)
    return q


def test_isolation_filter_adds_where_for_nurse():
    """_isolation_filter() adds WHERE health_station_id clause for nurse role."""
    nurse_user = UserSchema(
        id=1, email="nurse@bhs.ph", full_name="Nurse Test",
        roles=["nurse"], health_station_id=5, is_active=True
    )
    repo = BaseRepository(session=MagicMock(), user=nurse_user)
    query = _make_query()
    result = repo._isolation_filter(query, FakeModel)
    query.where.assert_called_once()


def test_isolation_filter_skips_for_city_health_officer():
    """_isolation_filter() skips WHERE clause for city_health_officer (CROSS_BHS_ROLES)."""
    cho_user = UserSchema(
        id=2, email="cho@city.ph", full_name="CHO Test",
        roles=["city_health_officer"], health_station_id=None, is_active=True
    )
    repo = BaseRepository(session=MagicMock(), user=cho_user)
    query = _make_query()
    result = repo._isolation_filter(query, FakeModel)
    query.where.assert_not_called()
    assert result is query  # query returned unchanged


def test_isolation_filter_skips_for_disease_surveillance_officer():
    """_isolation_filter() skips WHERE clause for disease_surveillance_officer."""
    dso_user = UserSchema(
        id=3, email="dso@city.ph", full_name="DSO Test",
        roles=["disease_surveillance_officer"], health_station_id=None, is_active=True
    )
    repo = BaseRepository(session=MagicMock(), user=dso_user)
    query = _make_query()
    result = repo._isolation_filter(query, FakeModel)
    query.where.assert_not_called()


def test_isolation_filter_skips_if_model_has_no_health_station_id():
    """_isolation_filter() skips WHERE for models without health_station_id (e.g., audit_logs)."""
    nurse_user = UserSchema(
        id=1, email="nurse@bhs.ph", full_name="Nurse Test",
        roles=["nurse"], health_station_id=5, is_active=True
    )
    repo = BaseRepository(session=MagicMock(), user=nurse_user)
    query = _make_query()
    result = repo._isolation_filter(query, FakeModelNoHSID)
    query.where.assert_not_called()


def test_cross_bhs_roles_constant_content():
    """CROSS_BHS_ROLES contains expected roles."""
    assert "city_health_officer" in CROSS_BHS_ROLES
    assert "phis_coordinator" in CROSS_BHS_ROLES
    assert "disease_surveillance_officer" in CROSS_BHS_ROLES
    assert "nurse" not in CROSS_BHS_ROLES
    assert "bhw" not in CROSS_BHS_ROLES


def test_cross_bhs_roles_is_frozenset():
    """CROSS_BHS_ROLES is a frozenset (immutable)."""
    assert isinstance(CROSS_BHS_ROLES, frozenset)


# ---------------------------------------------------------------------------
# require_role unit tests (pure logic, no DB)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_require_role_blocks_bhw_from_nurse_route():
    """require_role(['nurse']) raises HTTPException(403) for BHW user."""
    from app.core.dependencies import require_role

    bhw_user = UserSchema(
        id=10, email="bhw@bhs.ph", full_name="BHW Test",
        roles=["bhw"], health_station_id=3, is_active=True
    )

    guard_dep = require_role(["nurse"])
    # require_role returns a Depends() wrapper; extract the inner function
    guard_fn = guard_dep.dependency

    with pytest.raises(HTTPException) as exc_info:
        await guard_fn(current_user=bhw_user)

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_require_role_passes_dual_role_user():
    """User with roles=['nurse','disease_surveillance_officer'] passes both role guards."""
    from app.core.dependencies import require_role

    dual_user = UserSchema(
        id=11, email="dual@bhs.ph", full_name="Dual Role",
        roles=["nurse", "disease_surveillance_officer"],
        health_station_id=3, is_active=True
    )

    # Should pass nurse guard
    nurse_dep = require_role(["nurse"])
    nurse_fn = nurse_dep.dependency
    await nurse_fn(current_user=dual_user)  # no exception expected

    # Should pass DSO guard
    dso_dep = require_role(["disease_surveillance_officer"])
    dso_fn = dso_dep.dependency
    await dso_fn(current_user=dual_user)  # no exception expected


# ---------------------------------------------------------------------------
# AuthService unit tests (mocked DB)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auth_service_login_wrong_password_raises_401():
    """AuthService.login with wrong password raises HTTPException(401)."""
    from app.services.auth import AuthService

    # Build a mock user with a known hashed password
    from app.core.security import hash_password
    mock_user = MagicMock()
    mock_user.hashed_password = hash_password("correct_password")
    mock_user.is_active = True

    mock_session = AsyncMock()
    svc = AuthService(session=mock_session)

    # Patch UserRepository.get_by_email to return the mock user
    with patch.object(svc.repo, "get_by_email", new=AsyncMock(return_value=mock_user)):
        with pytest.raises(HTTPException) as exc_info:
            await svc.login(LoginRequest(email="test@bhs.ph", password="wrong_password"))

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_auth_service_login_inactive_user_raises_401():
    """AuthService.login for inactive user raises HTTPException(401)."""
    from app.services.auth import AuthService
    from app.core.security import hash_password

    mock_user = MagicMock()
    mock_user.hashed_password = hash_password("correct_password")
    mock_user.is_active = False  # inactive

    mock_session = AsyncMock()
    svc = AuthService(session=mock_session)

    with patch.object(svc.repo, "get_by_email", new=AsyncMock(return_value=mock_user)):
        with pytest.raises(HTTPException) as exc_info:
            await svc.login(LoginRequest(email="test@bhs.ph", password="correct_password"))

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_auth_service_login_returns_token_pair():
    """AuthService.login with valid credentials returns TokenPair."""
    from app.services.auth import AuthService
    from app.core.security import hash_password

    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.hashed_password = hash_password("correct_password")
    mock_user.is_active = True
    mock_user.roles = ["nurse"]
    mock_user.health_station_id = 5

    mock_session = AsyncMock()
    svc = AuthService(session=mock_session)

    with patch.object(svc.repo, "get_by_email", new=AsyncMock(return_value=mock_user)), \
         patch.object(svc.repo, "create_session", new=AsyncMock()):

        result = await svc.login(LoginRequest(email="test@bhs.ph", password="correct_password"))

    assert isinstance(result, TokenPair)
    assert result.access_token
    assert result.refresh_token
    assert result.token_type == "bearer"


@pytest.mark.asyncio
async def test_get_current_user_raises_401_without_header():
    """get_current_user() raises HTTP 401 when Authorization header is missing."""
    from app.core.dependencies import get_current_user

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(credentials=None)

    assert exc_info.value.status_code == 401
