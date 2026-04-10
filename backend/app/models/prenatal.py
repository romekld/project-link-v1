from datetime import date
from decimal import Decimal
import uuid
from sqlalchemy import Text, Integer, Date, Boolean, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class PrenatalEnrollment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "prenatal_enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("patients.id"), nullable=False
    )
    health_station_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("health_stations.id"), nullable=False
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    gravida: Mapped[int] = mapped_column(Integer, nullable=False)
    para: Mapped[int] = mapped_column(Integer, nullable=False)
    lmp: Mapped[date] = mapped_column(Date, nullable=False)
    edc: Mapped[date] = mapped_column(Date, nullable=False)
    risk_factors: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ML Phase 8 at-risk classifier flag
    is_high_risk: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # Updated by service layer after each prenatal visit save
    next_visit_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Offline sync fields
    local_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        Text, nullable=False, server_default="PENDING"
    )

    # Relationships (lazy="raise" per project convention)
    patient = relationship("Patient", lazy="raise")
    health_station = relationship("HealthStation", lazy="raise")
    recorded_by_user = relationship("User", lazy="raise")
    visits = relationship("PrenatalVisit", back_populates="enrollment", lazy="raise")

    __table_args__ = (
        Index("ix_prenatal_enrollments_patient_id", "patient_id"),
        Index("ix_prenatal_enrollments_health_station_id", "health_station_id"),
    )


class PrenatalVisit(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "prenatal_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prenatal_enrollment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("prenatal_enrollments.id"), nullable=False
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    aog_weeks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    bp_systolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bp_diastolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fundic_height: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    fetal_heart_tone: Mapped[int | None] = mapped_column(Integer, nullable=True)
    presentation: Mapped[str | None] = mapped_column(Text, nullable=True)
    edema: Mapped[str | None] = mapped_column(Text, nullable=True)
    hgb: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    gdm_positive: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    tt_dose: Mapped[int | None] = mapped_column(Integer, nullable=True)
    iron_supplementation: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    counseling_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # NO health_station_id — isolation via JOIN through enrollment (CONTEXT.md decision)

    # Offline sync fields
    local_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        Text, nullable=False, server_default="PENDING"
    )

    # Relationships (lazy="raise" per project convention)
    enrollment = relationship(
        "PrenatalEnrollment", back_populates="visits", lazy="raise"
    )
    recorded_by_user = relationship("User", lazy="raise")

    __table_args__ = (
        Index("ix_prenatal_visits_prenatal_enrollment_id", "prenatal_enrollment_id"),
    )
