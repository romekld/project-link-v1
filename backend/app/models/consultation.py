from decimal import Decimal
from sqlalchemy import Text, Integer, ForeignKey, Numeric, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class Consultation(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "consultations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("patients.id"), nullable=False
    )
    recorded_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    chief_complaint: Mapped[str] = mapped_column(Text, nullable=False)

    # Discrete vitals — all optional
    # Range validation enforced in Pydantic schema (ConsultationCreate)
    bp_systolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bp_diastolic: Mapped[int | None] = mapped_column(Integer, nullable=True)
    heart_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    respiratory_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    temperature: Mapped[Decimal | None] = mapped_column(Numeric(4, 1), nullable=True)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    height: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    # JSONB overflow for additional vitals (oxygen saturation, etc.)
    vitals_extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)
    referring_to: Mapped[str | None] = mapped_column(Text, nullable=True)

    # BMI is NOT stored — computed on read in ConsultationResponse.bmi computed_field

    # Relationships (lazy="raise" per project convention)
    patient = relationship("Patient", back_populates="consultations", lazy="raise")
    recorded_by_user = relationship("User", lazy="raise")

    __table_args__ = (
        Index("ix_consultations_patient_id", "patient_id"),
    )
