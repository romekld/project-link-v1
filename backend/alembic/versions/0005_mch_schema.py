"""MCH schema — prenatal, postpartum, EPI, nutrition tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # Step 1: Create shared record_status PostgreSQL ENUM
    # Used by all 8 MCH tables for offline sync status tracking (Phase 9 PWA/BHW)
    # Values: PENDING (local only), SYNCED (confirmed), CONFLICT (requires review)
    # create_type=True + checkfirst=True — safe to re-run upgrade without error
    # -------------------------------------------------------------------------
    # create_type=False on the variable used in create_table calls — prevents
    # SQLAlchemy from firing CREATE TYPE again when each table is created.
    # We call .create() explicitly with checkfirst=True first.
    record_status_create = postgresql.ENUM(
        "PENDING", "SYNCED", "CONFLICT",
        name="record_status",
        create_type=True,
    )
    record_status_create.create(op.get_bind(), checkfirst=True)

    # This variable is passed to op.create_table; create_type=False means
    # SQLAlchemy will NOT attempt to CREATE TYPE for it again (already created above)
    record_status = postgresql.ENUM(
        "PENDING", "SYNCED", "CONFLICT",
        name="record_status",
        create_type=False,
    )

    # -------------------------------------------------------------------------
    # Step 2: prenatal_enrollments
    # Enrollment-level table; carries health_station_id for BHS isolation queries
    # is_high_risk — ML Phase 8 at-risk classifier flag
    # next_visit_date — updated by service layer after each prenatal visit save
    # -------------------------------------------------------------------------
    op.create_table(
        "prenatal_enrollments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id",
            sa.Integer,
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column(
            "health_station_id",
            sa.Integer,
            sa.ForeignKey("health_stations.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("gravida", sa.Integer, nullable=False),
        sa.Column("para", sa.Integer, nullable=False),
        sa.Column("lmp", sa.Date, nullable=False),
        sa.Column("edc", sa.Date, nullable=False),
        sa.Column("risk_factors", sa.Text, nullable=True),
        sa.Column(
            "is_high_risk",
            sa.Boolean,
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("next_visit_date", sa.Date, nullable=True),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_prenatal_enrollments_patient_id", "prenatal_enrollments", ["patient_id"]
    )
    op.create_index(
        "ix_prenatal_enrollments_health_station_id",
        "prenatal_enrollments",
        ["health_station_id"],
    )

    # -------------------------------------------------------------------------
    # Step 3: prenatal_visits
    # Visit-level table; NO health_station_id — BHS isolation via JOIN through enrollment
    # -------------------------------------------------------------------------
    op.create_table(
        "prenatal_visits",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "prenatal_enrollment_id",
            sa.Integer,
            sa.ForeignKey("prenatal_enrollments.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("visit_date", sa.Date, nullable=False),
        sa.Column("aog_weeks", sa.Integer, nullable=True),
        sa.Column("weight", sa.Numeric(5, 2), nullable=True),
        sa.Column("bp_systolic", sa.Integer, nullable=True),
        sa.Column("bp_diastolic", sa.Integer, nullable=True),
        sa.Column("fundic_height", sa.Numeric(4, 1), nullable=True),
        sa.Column("fetal_heart_tone", sa.Integer, nullable=True),
        sa.Column("presentation", sa.Text, nullable=True),
        sa.Column("edema", sa.Text, nullable=True),
        sa.Column("hgb", sa.Numeric(4, 1), nullable=True),
        sa.Column("gdm_positive", sa.Boolean, nullable=True),
        sa.Column("tt_dose", sa.Integer, nullable=True),
        sa.Column("iron_supplementation", sa.Boolean, nullable=True),
        sa.Column("counseling_notes", sa.Text, nullable=True),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_prenatal_visits_prenatal_enrollment_id",
        "prenatal_visits",
        ["prenatal_enrollment_id"],
    )

    # -------------------------------------------------------------------------
    # Step 4: postpartum_enrollments
    # prenatal_enrollment_id is nullable (ON DELETE SET NULL) — external facility
    # deliveries may have no matching prenatal record in the system
    # day1/week1/week6 dates computed from delivery_date by service layer at creation
    # -------------------------------------------------------------------------
    op.create_table(
        "postpartum_enrollments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id",
            sa.Integer,
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column(
            "health_station_id",
            sa.Integer,
            sa.ForeignKey("health_stations.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column(
            "prenatal_enrollment_id",
            sa.Integer,
            sa.ForeignKey("prenatal_enrollments.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("delivery_date", sa.Date, nullable=False),
        sa.Column("delivery_type", sa.Text, nullable=True),
        sa.Column("birth_outcome", sa.Text, nullable=True),
        sa.Column("day1_date", sa.Date, nullable=True),
        sa.Column("week1_date", sa.Date, nullable=True),
        sa.Column("week6_date", sa.Date, nullable=True),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_postpartum_enrollments_patient_id",
        "postpartum_enrollments",
        ["patient_id"],
    )
    op.create_index(
        "ix_postpartum_enrollments_health_station_id",
        "postpartum_enrollments",
        ["health_station_id"],
    )

    # -------------------------------------------------------------------------
    # Step 5: postpartum_visits
    # visit_type TEXT stores "day1" | "week1" | "week6"; validated by Pydantic Literal
    # NO health_station_id — BHS isolation via JOIN through enrollment
    # -------------------------------------------------------------------------
    op.create_table(
        "postpartum_visits",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "postpartum_enrollment_id",
            sa.Integer,
            sa.ForeignKey("postpartum_enrollments.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("visit_date", sa.Date, nullable=False),
        sa.Column("visit_type", sa.Text, nullable=False),
        sa.Column("bp_systolic", sa.Integer, nullable=True),
        sa.Column("bp_diastolic", sa.Integer, nullable=True),
        sa.Column("wound_status", sa.Text, nullable=True),
        sa.Column("breastfeeding", sa.Boolean, nullable=True),
        sa.Column("family_planning_counseling", sa.Boolean, nullable=True),
        sa.Column("newborn_status", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_postpartum_visits_postpartum_enrollment_id",
        "postpartum_visits",
        ["postpartum_enrollment_id"],
    )

    # -------------------------------------------------------------------------
    # Step 6: epi_enrollments
    # fic_status — ML Phase 8 barangay risk index flag (Fully Immunized Child)
    # next_visit_date — earliest upcoming dose; recomputed after each vaccination insert
    # -------------------------------------------------------------------------
    op.create_table(
        "epi_enrollments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id",
            sa.Integer,
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column(
            "health_station_id",
            sa.Integer,
            sa.ForeignKey("health_stations.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("enrollment_date", sa.Date, nullable=False),
        sa.Column(
            "fic_status",
            sa.Boolean,
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("next_visit_date", sa.Date, nullable=True),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_epi_enrollments_patient_id", "epi_enrollments", ["patient_id"]
    )
    op.create_index(
        "ix_epi_enrollments_health_station_id",
        "epi_enrollments",
        ["health_station_id"],
    )

    # -------------------------------------------------------------------------
    # Step 7: epi_vaccinations
    # vaccine is TEXT (not ENUM) — avoids migration churn if DOH adds vaccines
    # Validated at Pydantic layer via EPI_VACCINES Literal type
    # UniqueConstraint prevents duplicate dose recording per enrollment
    # NO health_station_id — BHS isolation via JOIN through enrollment
    # -------------------------------------------------------------------------
    op.create_table(
        "epi_vaccinations",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "epi_enrollment_id",
            sa.Integer,
            sa.ForeignKey("epi_enrollments.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("vaccine", sa.Text, nullable=False),
        sa.Column("dose_number", sa.Integer, nullable=False),
        sa.Column("date_given", sa.Date, nullable=False),
        sa.Column("lot_number", sa.Text, nullable=True),
        sa.Column("site", sa.Text, nullable=True),
        sa.Column("administered_by", sa.Text, nullable=True),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
        sa.UniqueConstraint(
            "epi_enrollment_id",
            "vaccine",
            "dose_number",
            name="uq_epi_vaccinations_enrollment_vaccine_dose",
        ),
    )
    op.create_index(
        "ix_epi_vaccinations_epi_enrollment_id",
        "epi_vaccinations",
        ["epi_enrollment_id"],
    )

    # -------------------------------------------------------------------------
    # Step 8: nutrition_enrollments
    # No next_visit_date — OPT+ visits driven by monthly weighing sessions
    # -------------------------------------------------------------------------
    op.create_table(
        "nutrition_enrollments",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "patient_id",
            sa.Integer,
            sa.ForeignKey("patients.id"),
            nullable=False,
        ),
        sa.Column(
            "health_station_id",
            sa.Integer,
            sa.ForeignKey("health_stations.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("enrollment_date", sa.Date, nullable=False),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_nutrition_enrollments_patient_id",
        "nutrition_enrollments",
        ["patient_id"],
    )
    op.create_index(
        "ix_nutrition_enrollments_health_station_id",
        "nutrition_enrollments",
        ["health_station_id"],
    )

    # -------------------------------------------------------------------------
    # Step 9: nutrition_visits
    # waz/haz/whz/nutrition_status — computed and set on save by service layer
    # severe_wasting — ML Phase 8 at-risk classifier flag; set when WHZ < -3
    # NO health_station_id — BHS isolation via JOIN through enrollment
    # -------------------------------------------------------------------------
    op.create_table(
        "nutrition_visits",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "nutrition_enrollment_id",
            sa.Integer,
            sa.ForeignKey("nutrition_enrollments.id"),
            nullable=False,
        ),
        sa.Column(
            "recorded_by",
            sa.Integer,
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("visit_date", sa.Date, nullable=False),
        sa.Column("weight", sa.Numeric(5, 2), nullable=False),
        sa.Column("height", sa.Numeric(5, 2), nullable=False),
        sa.Column("muac", sa.Numeric(4, 1), nullable=True),
        sa.Column("waz", sa.Numeric(5, 2), nullable=True),
        sa.Column("haz", sa.Numeric(5, 2), nullable=True),
        sa.Column("whz", sa.Numeric(5, 2), nullable=True),
        sa.Column("nutrition_status", sa.Text, nullable=True),
        sa.Column(
            "severe_wasting",
            sa.Boolean,
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("local_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", record_status, nullable=False, server_default="PENDING"),
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
    op.create_index(
        "ix_nutrition_visits_nutrition_enrollment_id",
        "nutrition_visits",
        ["nutrition_enrollment_id"],
    )


def downgrade() -> None:
    # Drop in reverse FK dependency order
    op.drop_table("nutrition_visits")
    op.drop_table("nutrition_enrollments")
    op.drop_table("epi_vaccinations")
    op.drop_table("epi_enrollments")
    op.drop_table("postpartum_visits")
    op.drop_table("postpartum_enrollments")
    op.drop_table("prenatal_visits")
    op.drop_table("prenatal_enrollments")
    # Drop the shared ENUM last — no tables depend on it after the tables are gone
    sa.Enum(name="record_status").drop(op.get_bind(), checkfirst=True)
