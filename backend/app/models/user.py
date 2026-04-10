from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base, TimestampMixin


class User(TimestampMixin, Base):
    """NO SoftDeleteMixin — uses is_active flag per Phase 2 CONTEXT.md decision.
    SoftDeleteMixin would auto-filter 'deleted' users, breaking deactivation UX."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    roles: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    health_station_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("health_stations.id"), nullable=True, index=True
    )

    health_station = relationship("HealthStation", lazy="raise")
    sessions = relationship("UserSession", back_populates="user", lazy="raise")
