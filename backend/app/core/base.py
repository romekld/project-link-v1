from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, event, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session, with_loader_criteria
from sqlalchemy.ext.asyncio import AsyncAttrs


class Base(AsyncAttrs, DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SoftDeleteMixin:
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )


@event.listens_for(Session, "do_orm_execute")
def _filter_soft_deleted(orm_execute_state):
    if (
        orm_execute_state.is_select
        and not orm_execute_state.is_column_load
        and not orm_execute_state.is_relationship_load
    ):
        orm_execute_state.statement = orm_execute_state.statement.options(
            with_loader_criteria(
                SoftDeleteMixin,
                lambda cls: cls.deleted_at.is_(None),
                include_aliases=True,
            )
        )
