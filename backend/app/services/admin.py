"""AdminService — user lifecycle management (system_admin only).
Validates system_admin role exclusivity at service layer.
All mutations write to audit_logs (no PII in payloads).
"""
import json

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.repositories.user import UserRepository
from app.schemas.user import UserCreateRequest, UserListItem, UserSchema, UserUpdateRequest


_VALID_ROLES = frozenset({
    "system_admin",
    "city_health_officer",
    "physician",
    "phis_coordinator",
    "disease_surveillance_officer",
    "nurse",
    "midwife",
    "bhw",
})


def _validate_roles(roles: list[str]) -> None:
    """Enforce system_admin exclusivity and valid role names."""
    unknown = set(roles) - _VALID_ROLES
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown roles: {sorted(unknown)}")
    if "system_admin" in roles and len(roles) > 1:
        raise HTTPException(
            status_code=422,
            detail="system_admin cannot be combined with other roles.",
        )


class AdminService:
    def __init__(self, session: AsyncSession, current_user: UserSchema) -> None:
        self.session = session
        self.current_user = current_user
        self.repo = UserRepository(session)

    async def get_user(self, user_id: int) -> UserListItem:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return UserListItem(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            roles=user.roles,
            health_station_id=user.health_station_id,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )

    async def list_users(self) -> list[UserListItem]:
        users = await self.repo.list_all()
        return [
            UserListItem(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                roles=u.roles,
                health_station_id=u.health_station_id,
                is_active=u.is_active,
                created_at=u.created_at.isoformat(),
            )
            for u in users
        ]

    async def create_user(self, body: UserCreateRequest) -> UserListItem:
        _validate_roles(body.roles)

        # Check email uniqueness
        existing = await self.repo.get_by_email(body.email)
        if existing:
            raise HTTPException(status_code=409, detail="This email is already in use.")

        user = await self.repo.create(
            email=body.email,
            full_name=body.full_name,
            hashed_password=hash_password(body.password),
            roles=body.roles,
            health_station_id=body.health_station_id,
        )
        await self.session.commit()
        await self.session.refresh(user)

        await self._write_audit(
            operation="CREATE",
            target_user_id=user.id,
            new_values={"full_name": user.full_name, "roles": user.roles, "is_active": True},
        )
        await self.session.commit()

        return UserListItem(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            roles=user.roles,
            health_station_id=user.health_station_id,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )

    async def update_user(self, user_id: int, body: UserUpdateRequest) -> UserListItem:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        fields = {}
        if body.full_name is not None:
            fields["full_name"] = body.full_name
        if body.roles is not None:
            _validate_roles(body.roles)
            fields["roles"] = body.roles
        if body.health_station_id is not None:
            fields["health_station_id"] = body.health_station_id
        if body.password is not None:
            fields["hashed_password"] = hash_password(body.password)

        if fields:
            await self.repo.update(user, **fields)
            await self.session.commit()
            await self.session.refresh(user)

        changed_fields = {k: v for k, v in fields.items() if k != "hashed_password"}
        if changed_fields:
            await self._write_audit(
                operation="UPDATE",
                target_user_id=user.id,
                new_values={"changed_fields": list(changed_fields.keys())},
            )
            await self.session.commit()

        return UserListItem(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            roles=user.roles,
            health_station_id=user.health_station_id,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
        )

    async def deactivate_user(self, user_id: int) -> None:
        """Sets is_active=False AND revokes ALL active sessions for the user.
        Cascade is critical — per RESEARCH.md Pitfall 4: deactivated user must not retain
        valid refresh tokens (which would allow up to 7 more days of access)."""
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await self.repo.update(user, is_active=False)
        await self.repo.revoke_all_sessions(user_id)  # cascade — RESEARCH.md Pitfall 4
        await self.session.commit()
        await self._write_audit(
            operation="UPDATE",
            target_user_id=user_id,
            new_values={"is_active": False, "action": "deactivate"},
        )
        await self.session.commit()

    async def reactivate_user(self, user_id: int) -> None:
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        await self.repo.update(user, is_active=True)
        await self.session.commit()
        await self._write_audit(
            operation="UPDATE",
            target_user_id=user_id,
            new_values={"is_active": True, "action": "reactivate"},
        )
        await self.session.commit()

    async def _write_audit(
        self,
        operation: str,
        target_user_id: int,
        new_values: dict,
    ) -> None:
        """Audit log write. Uses gen_random_uuid() for record_id (audit_logs.record_id is UUID;
        users.id is INTEGER — per RESEARCH.md Pitfall 8, store user PK in new_values JSONB)."""
        payload = {"target_user_id": target_user_id, **new_values}
        await self.session.execute(
            text(
                "INSERT INTO audit_logs (table_name, record_id, operation, performed_by, new_values) "
                "VALUES (:table, gen_random_uuid(), :op, NULL, :new)"
            ),
            {
                "table": "users",
                "op": operation,
                "new": json.dumps(payload),
            },
        )
