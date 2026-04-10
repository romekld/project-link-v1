from datetime import date
import uuid
from sqlalchemy import Text, Integer, Date, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class PostpartumEnrollment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "postpartum_enrollments"

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

    # Nullable per CONTEXT.md — external facility deliveries may have no prenatal record
    prenatal_enrollment_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("prenatal_enrollments.id", ondelete="SET NULL"),
        nullable=True,
    )

    delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    delivery_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    birth_outcome: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Computed from delivery_date by service layer at enrollment creation
    day1_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    week1_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    week6_date: Mapped[date | None] = mapped_column(Date, nullable=True)

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
    prenatal_enrollment = relationship("PrenatalEnrollment", lazy="raise")
    visits = relationship(
        "PostpartumVisit", back_populates="enrollment", lazy="raise"
    )

    __table_args__ = (
        Index("ix_postpartum_enrollments_patient_id", "patient_id"),
        Index("ix_postpartum_enrollments_health_station_id", "health_station_id"),
    )


class PostpartumVisit(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "postpartum_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    postpartum_enrollment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("postpartum_enrollments.id"), nullable=False
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    visit_type: Mapped[str] = mapped_column(Text, nullable=False)  # day1 | week1 | week6
    bp_systolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bp_diastolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wound_status: Mapped[str | None] = mapped_column(Text, nullable=True)
    breastfeeding: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    family_planning_counseling: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )
    newborn_status: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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
        "PostpartumEnrollment", back_populates="visits", lazy="raise"
    )
    recorded_by_user = relationship("User", lazy="raise")

    __table_args__ = (
        Index(
            "ix_postpartum_visits_postpartum_enrollment_id",
            "postpartum_enrollment_id",
        ),
    )
