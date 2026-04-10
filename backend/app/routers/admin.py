"""Admin router — user management and audit-logs (system_admin only).

All routes are gated to system_admin via router-level dependency.
Individual routes do not need _=Depends(require_role(...)).
"""
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.core.dependencies import AsyncDB, CurrentUser, require_role
from app.schemas.user import UserCreateRequest, UserListItem, UserUpdateRequest
from app.services.admin import AdminService

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[require_role(["system_admin"])],
)
# Note: require_role() already returns Depends(_guard), so it is passed directly
# to router-level dependencies. This gates ALL routes in this router to system_admin only.


@router.get("/users", response_model=list[UserListItem])
async def list_users(db: AsyncDB, current_user: CurrentUser):
    svc = AdminService(db, current_user)
    return await svc.list_users()


@router.get("/users/{user_id}", response_model=UserListItem)
async def get_user(user_id: int, db: AsyncDB, current_user: CurrentUser):
    svc = AdminService(db, current_user)
    return await svc.get_user(user_id)


@router.post("/users", response_model=UserListItem, status_code=201)
async def create_user(body: UserCreateRequest, db: AsyncDB, current_user: CurrentUser):
    svc = AdminService(db, current_user)
    return await svc.create_user(body)


@router.put("/users/{user_id}", response_model=UserListItem)
async def update_user(user_id: int, body: UserUpdateRequest, db: AsyncDB, current_user: CurrentUser):
    svc = AdminService(db, current_user)
    return await svc.update_user(user_id, body)


@router.patch("/users/{user_id}/deactivate", status_code=204)
async def deactivate_user(user_id: int, db: AsyncDB, current_user: CurrentUser):
    svc = AdminService(db, current_user)
    await svc.deactivate_user(user_id)


@router.patch("/users/{user_id}/reactivate", status_code=204)
async def reactivate_user(user_id: int, db: AsyncDB, current_user: CurrentUser):
    svc = AdminService(db, current_user)
    await svc.reactivate_user(user_id)


@router.get("/audit-logs", response_model=list[dict[str, Any]])
async def list_audit_logs(db: AsyncDB):
    """Returns last 100 audit_logs rows where table_name='users', newest first.
    Used by the Activity Log tab in the admin UI (Plan 02-07 frontend/src/features/admin/api.ts).
    AUTH-06: admin operations must be visible in the activity log.

    audit_logs timestamp column is 'performed_at' (verified in 0001_initial_schema.py).
    """
    result = await db.execute(
        text(
            "SELECT id, table_name, operation, performed_at, new_values "
            "FROM audit_logs "
            "WHERE table_name = 'users' "
            "ORDER BY performed_at DESC "
            "LIMIT 100"
        )
    )
    rows = result.mappings().all()
    return [
        {
            "id": row["id"],
            "table_name": row["table_name"],
            "operation": row["operation"],
            "performed_at": row["performed_at"].isoformat() if row["performed_at"] else None,
            "new_values": row["new_values"],
        }
        for row in rows
    ]
