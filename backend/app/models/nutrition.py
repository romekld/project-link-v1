from datetime import date
from decimal import Decimal
import uuid
from sqlalchemy import Text, Integer, Date, Boolean, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class NutritionEnrollment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "nutrition_enrollments"

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

    # No next_visit_date per CONTEXT.md — OPT+ visits driven by monthly weighing sessions

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
    visits = relationship(
        "NutritionVisit", back_populates="enrollment", lazy="raise"
    )

    __table_args__ = (
        Index("ix_nutrition_enrollments_patient_id", "patient_id"),
        Index("ix_nutrition_enrollments_health_station_id", "health_station_id"),
    )


class NutritionVisit(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "nutrition_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nutrition_enrollment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("nutrition_enrollments.id"), nullable=False
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    visit_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Anthropometric measurements
    weight: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)  # kg
    height: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)  # cm
    muac: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)  # cm

    # WHO Z-scores — computed and set on save by service layer (CONTEXT.md decision)
    waz: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    haz: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    whz: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Classification set by service layer (NORMAL, UNDERWEIGHT, STUNTED, WASTED, SEVERELY_WASTED)
    nutrition_status: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ML Phase 8 at-risk classifier flag — set when WHZ < -3
    severe_wasting: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

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
        "NutritionEnrollment", back_populates="visits", lazy="raise"
    )
    recorded_by_user = relationship("User", lazy="raise")

    __table_args__ = (
        Index(
            "ix_nutrition_visits_nutrition_enrollment_id", "nutrition_enrollment_id"
        ),
    )
