from geoalchemy2 import Geometry
from sqlalchemy import Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin


class Barangay(TimestampMixin, Base):
    """Reference data — no SoftDeleteMixin (barangay boundaries are never soft-deleted)."""
    __tablename__ = "barangays"

    psgc_code: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    city_name: Mapped[str] = mapped_column(Text, nullable=False)
    boundary: Mapped[object] = mapped_column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326),
        nullable=False,
    )
    area_sqkm: Mapped[float] = mapped_column(nullable=True)

    health_stations = relationship(
        "HealthStation",
        back_populates="barangay",
        lazy="raise",   # MANDATORY on all relationships
    )
