"""patients and consultations tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # Step 1: Create patients table
    # Note: search_vector tsvector generated column is added via raw SQL (Step 2)
    # because Alembic op.add_column cannot handle GENERATED ALWAYS AS expressions
    # -------------------------------------------------------------------------
    op.create_table(
        "patients",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("last_name", sa.Text, nullable=False),
        sa.Column("first_name", sa.Text, nullable=False),
        sa.Column("middle_name", sa.Text, nullable=True),
        sa.Column("birthdate", sa.Date, nullable=False),
        sa.Column("sex", sa.Text, nullable=False),
        sa.Column(
            "barangay_psgc_code",
            sa.Text,
            sa.ForeignKey("barangays.psgc_code"),
            nullable=False,
        ),
        sa.Column("address_line", sa.Text, nullable=True),
        sa.Column(
            "health_station_id",
            sa.Integer,
            sa.ForeignKey("health_stations.id"),
            nullable=False,
        ),
        sa.Column("mobile_number", sa.Text, nullable=True),
        sa.Column(
            "possible_duplicate",
            sa.Boolean,
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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

    # -------------------------------------------------------------------------
    # Step 2: Add CHECK constraint on sex column
    # TEXT + CHECK is preferred over PostgreSQL ENUM — immutable ENUMs require
    # ALTER TYPE to add values; TEXT + CHECK is flexible (RESEARCH.md Open Question 2)
    # -------------------------------------------------------------------------
    op.execute(
        "ALTER TABLE patients ADD CONSTRAINT ck_patients_sex "
        "CHECK (sex IN ('male', 'female'))"
    )

    # -------------------------------------------------------------------------
    # Step 3: Add tsvector STORED generated column via raw SQL
    # Alembic op.add_column cannot generate GENERATED ALWAYS AS expressions.
    # 'simple' config (not 'english') — Filipino names must not be stemmed.
    # persisted=True required — GIN index cannot be created on a virtual column.
    # -------------------------------------------------------------------------
    op.execute(
        """
        ALTER TABLE patients ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            to_tsvector('simple', coalesce(last_name, '') || ' ' || coalesce(first_name, ''))
        ) STORED
        """
    )

    # -------------------------------------------------------------------------
    # Step 4: Create GIN index on search_vector via raw SQL
    # Raw SQL avoids Alembic autogenerate re-detecting this as a change every run
    # (Alembic cannot reflect expression-based indexes — GitHub issue #1390)
    # -------------------------------------------------------------------------
    op.execute(
        "CREATE INDEX ix_patients_search_vector ON patients USING GIN (search_vector)"
    )

    # -------------------------------------------------------------------------
    # Step 5: Supporting indexes for query patterns
    # -------------------------------------------------------------------------
    op.create_index("ix_patients_health_station_id", "patients", ["health_station_id"])
    op.create_index("ix_patients_barangay_psgc_code", "patients", ["barangay_psgc_code"])

    # -------------------------------------------------------------------------
    # Step 6: Create consultations table
    # Hybrid vitals: discrete typed columns (queryable for analytics) +
    # vitals_extra JSONB (extensible for future vital signs)
    # BMI is NOT stored — computed on read in ConsultationResponse.bmi
    # -------------------------------------------------------------------------
    op.create_table(
        "consultations",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id",
            sa.Integer,
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("chief_complaint", sa.Text, nullable=False),
        # Discrete vitals — all optional
        sa.Column("bp_systolic", sa.Integer, nullable=True),
        sa.Column("bp_diastolic", sa.Integer, nullable=True),
        sa.Column("heart_rate", sa.Integer, nullable=True),
        sa.Column("respiratory_rate", sa.Integer, nullable=True),
        sa.Column("temperature", sa.Numeric(4, 1), nullable=True),
        sa.Column("weight", sa.Numeric(5, 2), nullable=True),
        sa.Column("height", sa.Numeric(5, 2), nullable=True),
        sa.Column("vitals_extra", postgresql.JSONB, nullable=True),
        sa.Column("diagnosis", sa.Text, nullable=True),
        sa.Column("referring_to", sa.Text, nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
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

    op.create_index("ix_consultations_patient_id", "consultations", ["patient_id"])


def downgrade() -> None:
    # Drop in FK dependency order: consultations first, then patients
    op.drop_table("consultations")
    op.execute("DROP INDEX IF EXISTS ix_patients_search_vector")
    op.drop_table("patients")
    # Note: CHECK constraint and search_vector column are dropped with the table
