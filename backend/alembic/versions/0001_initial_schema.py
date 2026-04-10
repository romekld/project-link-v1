"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-15 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Enable PostGIS extension — MUST run before any geometry column is created
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    # Step 2: Create barangays table (reference data, no soft delete)
    op.create_table(
        "barangays",
        sa.Column("psgc_code", sa.Text, primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("city_name", sa.Text, nullable=False),
        sa.Column(
            "boundary",
            Geometry(geometry_type="MULTIPOLYGON", srid=4326),
            nullable=False,
        ),
        sa.Column("area_sqkm", sa.Float, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )

    # Step 3: Create health_stations table (reference data, no soft delete)
    op.create_table(
        "health_stations",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column(
            "psgc_code",
            sa.Text,
            sa.ForeignKey("barangays.psgc_code"),
            nullable=False,
        ),
        sa.Column(
            "location",
            Geometry(geometry_type="POINT", srid=4326),
            nullable=False,
        ),
        sa.Column("contact_number", sa.Text, nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )

    # Step 4: Create audit_logs table with append-only enforcement
    # Using raw SQL for BIGSERIAL, JSONB, and PostgreSQL-specific DDL (RULE + TRIGGER)
    op.execute(
        """
        CREATE TABLE audit_logs (
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
    )

    # Append-only enforcement: RULE (silent no-op) + TRIGGER (visible error)
    # Per RESEARCH.md Pattern 7 — belt-and-suspenders approach for RA 10173 compliance
    op.execute(
        "CREATE RULE no_update_audit_logs AS ON UPDATE TO audit_logs DO INSTEAD NOTHING"
    )
    op.execute(
        "CREATE RULE no_delete_audit_logs AS ON DELETE TO audit_logs DO INSTEAD NOTHING"
    )
    op.execute(
        """
        CREATE OR REPLACE FUNCTION deny_audit_log_mutation()
        RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'audit_logs is append-only; modifications are not permitted';
        END;
        $$ LANGUAGE plpgsql
        """
    )
    op.execute(
        """
        CREATE TRIGGER audit_logs_immutable
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION deny_audit_log_mutation()
        """
    )


def downgrade() -> None:
    # Drop in reverse dependency order
    op.execute("DROP TABLE IF EXISTS audit_logs CASCADE")
    op.execute("DROP FUNCTION IF EXISTS deny_audit_log_mutation() CASCADE")
    op.drop_table("health_stations")
    op.drop_table("barangays")
    # Note: do NOT drop postgis extension — other spatial tables may exist
    # op.execute("DROP EXTENSION IF EXISTS postgis")
