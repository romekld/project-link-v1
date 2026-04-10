from datetime import date
from sqlalchemy import Index, Computed, Text, Integer, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin, SoftDeleteMixin


class Patient(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    middle_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    birthdate: Mapped[date] = mapped_column(Date, nullable=False)
    sex: Mapped[str] = mapped_column(Text, nullable=False)  # 'male' or 'female' — CHECK constraint in migration
    barangay_psgc_code: Mapped[str] = mapped_column(
        Text, ForeignKey("barangays.psgc_code"), nullable=False
    )
    address_line: Mapped[str | None] = mapped_column(Text, nullable=True)
    health_station_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("health_stations.id"), nullable=False
    )
    mobile_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    possible_duplicate: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default="false", nullable=False
    )

    # STORED generated tsvector for full-text search (GIN index in __table_args__)
    # 'simple' config used (not 'english') — Filipino names must not be stemmed
    search_vector: Mapped[object] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('simple', coalesce(last_name, '') || ' ' || coalesce(first_name, ''))",
            persisted=True,
        ),
    )

    # Relationships (all lazy="raise" per project convention — explicit joins required)
    consultations = relationship("Consultation", back_populates="patient", lazy="raise")
    barangay = relationship("Barangay", lazy="raise")
    health_station = relationship("HealthStation", lazy="raise")

    __table_args__ = (
        # GIN index on search_vector — raw SQL CREATE INDEX used in migration to avoid
        # autogenerate detection issues (Alembic cannot reflect expression-based indexes)
        Index("ix_patients_search_vector", "search_vector", postgresql_using="gin"),
        Index("ix_patients_health_station_id", "health_station_id"),
        Index("ix_patients_barangay_psgc_code", "barangay_psgc_code"),
    )
