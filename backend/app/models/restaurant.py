from datetime import datetime

from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    district_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("districts.id"), nullable=False, index=True
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id"), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    district: Mapped["District"] = relationship("District")
    category: Mapped["Category"] = relationship("Category")
    platforms: Mapped[list["RestaurantPlatform"]] = relationship(
        "RestaurantPlatform", back_populates="restaurant", cascade="all, delete-orphan"
    )


class RestaurantPlatform(Base):
    __tablename__ = "restaurant_platforms"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "platform_id", name="uq_restaurant_platform"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform_id: Mapped[int] = mapped_column(
        ForeignKey("platforms.id"), nullable=False, index=True
    )
    customers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="platforms")
    platform: Mapped["Platform"] = relationship("Platform")
