from datetime import datetime
from typing import Any

from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Float, Integer, String, UniqueConstraint, func


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    district_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("districts.id"), nullable=False, index=True
    )
    neighborhood_id: Mapped[int | None] = mapped_column(
        ForeignKey("neighborhoods.id"), nullable=True, index=True
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
    neighborhood: Mapped["Neighborhood | None"] = relationship("Neighborhood")
    category: Mapped["Category"] = relationship("Category")
    platforms: Mapped[list["RestaurantPlatform"]] = relationship(
        "RestaurantPlatform", back_populates="restaurant", cascade="all, delete-orphan"
    )
    metrics: Mapped["RestaurantMetrics | None"] = relationship(
        "RestaurantMetrics", back_populates="restaurant", uselist=False, cascade="all, delete-orphan"
    )
    analytics: Mapped[list["RestaurantAnalytics"]] = relationship(
        "RestaurantAnalytics", back_populates="restaurant", cascade="all, delete-orphan"
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


class RestaurantMetrics(Base):
    """Restoran-bazlı aggregate metrikler. 1:1 Restaurant. Cascade'in en üstü."""
    __tablename__ = "restaurant_metrics"

    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), primary_key=True
    )
    cancel_rate: Mapped[float] = mapped_column(Float, default=0)
    return_rate: Mapped[float] = mapped_column(Float, default=0)
    cancel_reasons: Mapped[Any] = mapped_column(JSON, default=list)
    return_reasons: Mapped[Any] = mapped_column(JSON, default=list)
    area_performance_score: Mapped[float] = mapped_column(Float, default=0)
    area_rating: Mapped[float] = mapped_column(Float, default=0)
    highest_rating: Mapped[float] = mapped_column(Float, default=0)
    lowest_rating: Mapped[float] = mapped_column(Float, default=0)
    avg_basket: Mapped[float] = mapped_column(Float, default=0)
    avg_menu_price: Mapped[float] = mapped_column(Float, default=0)
    avg_monthly_revenue: Mapped[float] = mapped_column(Float, default=0)
    courier_fee: Mapped[float] = mapped_column(Float, default=0)
    hourly_heatmap: Mapped[Any] = mapped_column(JSON, default=list)
    negative_comment_total: Mapped[int] = mapped_column(Integer, default=0)
    negative_comment_rate: Mapped[float] = mapped_column(Float, default=0)
    negative_avg_rating: Mapped[float] = mapped_column(Float, default=0)
    platform_negative_distribution: Mapped[Any] = mapped_column(JSON, default=list)
    rating_distribution: Mapped[Any] = mapped_column(JSON, default=list)
    negative_word_cloud: Mapped[Any] = mapped_column(JSON, default=list)
    courier_comparison: Mapped[Any] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="metrics")


class RestaurantAnalytics(Base):
    """Restoran × platform için analytics: müşteri/bütçe/forecast."""
    __tablename__ = "restaurant_analytics"
    __table_args__ = (
        UniqueConstraint("restaurant_id", "platform_id", name="uq_restaurant_analytics_platform"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    restaurant_id: Mapped[int] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    platform_id: Mapped[int] = mapped_column(
        ForeignKey("platforms.id"), nullable=False, index=True
    )
    ad_budget: Mapped[float] = mapped_column(Float, default=0)
    campaign_rate: Mapped[float] = mapped_column(Float, default=0)
    coupon_rate: Mapped[float] = mapped_column(Float, default=0)
    flash_rate: Mapped[float] = mapped_column(Float, default=0)
    joker_rate: Mapped[float] = mapped_column(Float, default=0)
    daily_forecast: Mapped[float] = mapped_column(Float, default=0)
    monthly_forecast: Mapped[float] = mapped_column(Float, default=0)
    yearly_forecast: Mapped[float] = mapped_column(Float, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="analytics")
    platform: Mapped["Platform"] = relationship("Platform")
