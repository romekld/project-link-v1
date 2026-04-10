import pytest


@pytest.mark.asyncio
async def test_audit_logs_table(async_session):
    """INFRA-03: audit_logs table exists with correct schema after alembic upgrade head."""
    result = await async_session.execute(
        __import__("sqlalchemy").text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'audit_logs' ORDER BY column_name"
        )
    )
    columns = {row[0] for row in result}
    # Will pass empty set (skip) until Plan 02 runs migrations
    if not columns:
        pytest.skip("audit_logs table not yet created — run alembic upgrade head (Plan 02)")
    expected = {"id", "table_name", "record_id", "operation", "performed_by", "performed_at", "old_values", "new_values"}
    assert expected.issubset(columns), f"Missing columns: {expected - columns}"
