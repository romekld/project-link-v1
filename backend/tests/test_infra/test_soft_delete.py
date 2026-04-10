import pytest
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class _TestRecord(SoftDeleteMixin, TimestampMixin, Base):
    __tablename__ = "_test_soft_delete_records"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    value: Mapped[str] = mapped_column(sa.Text)


@pytest.mark.asyncio
async def test_soft_delete_filter(async_engine, async_session):
    # Create the test table
    async with async_engine.begin() as conn:
        await conn.run_sync(_TestRecord.__table__.create, checkfirst=True)

    # Insert active + deleted rows
    async_session.add(_TestRecord(value="active"))
    async_session.add(_TestRecord(value="deleted"))
    await async_session.commit()

    # Soft-delete the second one
    result = await async_session.execute(
        sa.select(_TestRecord).where(_TestRecord.value == "deleted")
    )
    rec = result.scalar_one()
    from datetime import datetime, UTC
    rec.deleted_at = datetime.now(UTC)
    await async_session.commit()

    # Verify do_orm_execute filters it out
    result = await async_session.execute(sa.select(_TestRecord))
    visible = result.scalars().all()
    assert len(visible) == 1
    assert visible[0].value == "active"
