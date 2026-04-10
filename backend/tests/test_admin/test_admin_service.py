"""AUTH-04: AdminService unit tests — TDD RED phase.
Tests AdminService behaviors before service implementation ships.
Uses mock repositories to keep tests fast (no DB connection needed).
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException


@pytest.mark.asyncio
async def test_create_user_system_admin_exclusive_raises_422():
    """AdminService.create_user() with roles=['system_admin','nurse'] raises HTTP 422."""
    from app.services.admin import AdminService
    from app.schemas.user import UserCreateRequest, UserSchema

    session = AsyncMock()
    current_user = UserSchema(id=1, email="admin@test.com", full_name="Admin",
                               roles=["system_admin"], health_station_id=None, is_active=True)
    svc = AdminService(session=session, current_user=current_user)

    body = UserCreateRequest(
        email="conflict@test.com",
        full_name="Conflict",
        password="pass",
        roles=["system_admin", "nurse"],
        health_station_id=None,
    )

    with pytest.raises(HTTPException) as exc_info:
        await svc.create_user(body)

    assert exc_info.value.status_code == 422
    assert "system_admin cannot be combined with other roles" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_user_system_admin_alone_succeeds():
    """AdminService.create_user() with roles=['system_admin'] alone succeeds."""
    from app.services.admin import AdminService
    from app.schemas.user import UserCreateRequest, UserSchema

    session = AsyncMock()
    current_user = UserSchema(id=1, email="admin@test.com", full_name="Admin",
                               roles=["system_admin"], health_station_id=None, is_active=True)

    with patch("app.services.admin.UserRepository") as MockRepo:
        mock_repo = MockRepo.return_value
        mock_repo.get_by_email = AsyncMock(return_value=None)  # no duplicate
        mock_user = MagicMock()
        mock_user.id = 10
        mock_user.email = "newadmin@test.com"
        mock_user.full_name = "New Admin"
        mock_user.roles = ["system_admin"]
        mock_user.health_station_id = None
        mock_user.is_active = True
        from datetime import datetime, timezone
        mock_user.created_at = datetime.now(timezone.utc)
        mock_repo.create = AsyncMock(return_value=mock_user)
        session.execute = AsyncMock()

        svc = AdminService(session=session, current_user=current_user)

        body = UserCreateRequest(
            email="newadmin@test.com",
            full_name="New Admin",
            password="pass",
            roles=["system_admin"],
            health_station_id=None,
        )

        result = await svc.create_user(body)

    assert result.email == "newadmin@test.com"
    assert result.roles == ["system_admin"]


@pytest.mark.asyncio
async def test_deactivate_user_revokes_sessions():
    """AdminService.deactivate_user() sets is_active=False AND calls revoke_all_sessions."""
    from app.services.admin import AdminService
    from app.schemas.user import UserSchema

    session = AsyncMock()
    current_user = UserSchema(id=1, email="admin@test.com", full_name="Admin",
                               roles=["system_admin"], health_station_id=None, is_active=True)

    with patch("app.services.admin.UserRepository") as MockRepo:
        mock_repo = MockRepo.return_value
        mock_user = MagicMock()
        mock_user.id = 5
        mock_user.is_active = True
        mock_repo.get_by_id = AsyncMock(return_value=mock_user)
        mock_repo.update = AsyncMock(return_value=mock_user)
        mock_repo.revoke_all_sessions = AsyncMock()
        session.execute = AsyncMock()

        svc = AdminService(session=session, current_user=current_user)
        await svc.deactivate_user(user_id=5)

        # Verify cascade — revoke_all_sessions MUST be called
        mock_repo.revoke_all_sessions.assert_called_once_with(5)
        # Verify is_active set to False
        mock_repo.update.assert_called_once_with(mock_user, is_active=False)


@pytest.mark.asyncio
async def test_reactivate_user_sets_active_true():
    """AdminService.reactivate_user() sets is_active=True."""
    from app.services.admin import AdminService
    from app.schemas.user import UserSchema

    session = AsyncMock()
    current_user = UserSchema(id=1, email="admin@test.com", full_name="Admin",
                               roles=["system_admin"], health_station_id=None, is_active=True)

    with patch("app.services.admin.UserRepository") as MockRepo:
        mock_repo = MockRepo.return_value
        mock_user = MagicMock()
        mock_user.id = 5
        mock_user.is_active = False
        mock_repo.get_by_id = AsyncMock(return_value=mock_user)
        mock_repo.update = AsyncMock(return_value=mock_user)
        session.execute = AsyncMock()

        svc = AdminService(session=session, current_user=current_user)
        await svc.reactivate_user(user_id=5)

        mock_repo.update.assert_called_once_with(mock_user, is_active=True)
