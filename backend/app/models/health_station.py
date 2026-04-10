from geoalchemy2 import Geometry
from sqlalchemy import Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.base import Base, TimestampMixin


class HealthStation(TimestampMixin, Base):
    """Reference data — no SoftDeleteMixin."""
    __tablename__ = "health_stations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    psgc_code: Mapped[str] = mapped_column(
        Text, ForeignKey("barangays.psgc_code"), nullable=False
    )
    location: Mapped[object] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    contact_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    barangay = relationship("Barangay", back_populates="health_stations", lazy="raise")
