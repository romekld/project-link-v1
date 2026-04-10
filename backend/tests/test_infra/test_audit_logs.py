import pytest


@pytest.mark.asyncio
async def test_update_denied(async_session):
    """INFRA-03: UPDATE on audit_logs is rejected by PostgreSQL RULE or trigger."""
    import sqlalchemy as sa
    # Insert a test row first
    try:
        await async_session.execute(
            sa.text(
                "INSERT INTO audit_logs (table_name, record_id, operation, performed_at) "
                "VALUES ('test', gen_random_uuid(), 'CREATE', NOW())"
            )
        )
        await async_session.commit()
    except Exception:
        pytest.skip("audit_logs table not yet created — run alembic upgrade head (Plan 02)")

    # Attempt UPDATE — should silently do nothing (RULE) or raise (trigger)
    result = await async_session.execute(
        sa.text("UPDATE audit_logs SET table_name = 'mutated' WHERE table_name = 'test'")
    )
    await async_session.commit()
    # Verify mutation did NOT occur
    check = await async_session.execute(
        sa.text("SELECT count(*) FROM audit_logs WHERE table_name = 'mutated'")
    )
    count = check.scalar()
    assert count == 0, "audit_logs UPDATE should be denied — append-only violation"
