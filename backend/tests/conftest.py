import pytest
import pytest_asyncio

try:
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    from sqlalchemy.pool import NullPool
    from app.core.base import Base
    from app.core.config import settings
    from app.core.database import get_async_session
    from app.main import app
    HAS_BASE = True
except ImportError:
    HAS_BASE = False

_AUDIT_LOGS_DDL = """
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'SOFT_DELETE')),
    performed_by UUID,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB
)
"""

_AUDIT_LOGS_RULE_UPDATE = (
    "CREATE OR REPLACE RULE no_update_audit_logs "
    "AS ON UPDATE TO audit_logs DO INSTEAD NOTHING"
)

_AUDIT_LOGS_RULE_DELETE = (
    "CREATE OR REPLACE RULE no_delete_audit_logs "
    "AS ON DELETE TO audit_logs DO INSTEAD NOTHING"
)


@pytest_asyncio.fixture(scope="session")
async def async_engine():
    if not HAS_BASE:
        pytest.skip("app.core.base not yet implemented (Plan 02)")
    engine = create_async_engine(settings.TEST_DATABASE_URL, poolclass=NullPool)
    async with engine.begin() as conn:
        # Create ORM-managed tables (users, user_sessions, barangays, etc.)
        await conn.run_sync(Base.metadata.create_all)
        # Create audit_logs (raw SQL, not in ORM Base — mirrors 0001_initial_schema.py)
        await conn.execute(text(_AUDIT_LOGS_DDL))
        # Add append-only RULE enforcement (mirrors 0001_initial_schema.py)
        await conn.execute(text(_AUDIT_LOGS_RULE_UPDATE))
        await conn.execute(text(_AUDIT_LOGS_RULE_DELETE))
    yield engine
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS audit_logs CASCADE"))
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def async_session(async_engine) -> AsyncSession:
    """Provide a test DB session AND override FastAPI's get_async_session
    so that ASGITransport requests use the same test database."""
    async with async_sessionmaker(async_engine, expire_on_commit=False)() as session:

        async def _override_session():
            yield session

        # Override the FastAPI dependency so endpoints use the test DB session
        app.dependency_overrides[get_async_session] = _override_session
        yield session
        # Restore after test
        app.dependency_overrides.pop(get_async_session, None)
