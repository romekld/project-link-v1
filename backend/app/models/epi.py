from datetime import date
import uuid
from sqlalchemy import Text, Integer, Date, Boolean, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class EpiEnrollment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "epi_enrollments"

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

    enrollment_date: Mapped[date] = mapped_column(Date, nullable=False)

    # ML Phase 8 barangay risk index flag
    fic_status: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # Earliest upcoming dose across all vaccine types; recomputed by service after each vaccination
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
    vaccinations = relationship(
        "EpiVaccination", back_populates="enrollment", lazy="raise"
    )

    __table_args__ = (
        Index("ix_epi_enrollments_patient_id", "patient_id"),
        Index("ix_epi_enrollments_health_station_id", "health_station_id"),
    )


class EpiVaccination(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "epi_vaccinations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    epi_enrollment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("epi_enrollments.id"), nullable=False
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    # TEXT per CONTEXT.md — not PostgreSQL ENUM; validate allowed values at Pydantic layer
    vaccine: Mapped[str] = mapped_column(Text, nullable=False)
    dose_number: Mapped[int] = mapped_column(Integer, nullable=False)
    date_given: Mapped[date] = mapped_column(Date, nullable=False)
    lot_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    site: Mapped[str | None] = mapped_column(Text, nullable=True)
    administered_by: Mapped[str | None] = mapped_column(Text, nullable=True)

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
        "EpiEnrollment", back_populates="vaccinations", lazy="raise"
    )
    recorded_by_user = relationship("User", lazy="raise")

    __table_args__ = (
        Index("ix_epi_vaccinations_epi_enrollment_id", "epi_enrollment_id"),
        # Prevent duplicate dose recording for the same vaccine
        UniqueConstraint(
            "epi_enrollment_id",
            "vaccine",
            "dose_number",
            name="uq_epi_vaccinations_enrollment_vaccine_dose",
        ),
    )
