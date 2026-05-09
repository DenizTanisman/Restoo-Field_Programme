from datetime import date, datetime
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base

class DistrictAnalytics(Base):
    __tablename__ = "district_analytics"
    
    # 🛡️ Saf Mantık Kilidi: NULLS NOT DISTINCT sayesinde kategori NULL olsa bile 
    # aynı ilçe/platform/tarih için ikinci kayıt atılmasını (duplicate) engelleriz.
    __table_args__ = (
        UniqueConstraint(
            'district_id', 'category_id', 'platform_id', 'period_date',
            name='uq_district_analytics',
            postgresql_nulls_not_distinct=True 
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    district_id: Mapped[str] = mapped_column(String(50), ForeignKey("districts.id"))
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    platform_id: Mapped[int] = mapped_column(Integer, ForeignKey("platforms.id"))
    period_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # 📊 Müşteri Verisi (Donut Card'ı besler)
    customers: Mapped[int] = mapped_column(Integer, default=0)
    
    # 💰 Bütçe ve Oran Verisi (Radial Bar'ı besler)
    ad_budget: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    campaign_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)  # % değeri
    coupon_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    flash_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    joker_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    
    # 📈 Tahmin Verisi (Sales Forecast'i besler)[cite: 1]
    daily_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    monthly_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    yearly_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    # ⏳ Zaman Damgaları[cite: 1]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 🔗 İlişkiler (Eager loading için ileride kullanılacak)
    platform = relationship("Platform")


class NeighborhoodAnalytics(Base):
    __tablename__ = "neighborhood_analytics"
    
    __table_args__ = (
        UniqueConstraint(
            'neighborhood_id', 'category_id', 'platform_id', 'period_date',
            name='uq_neighborhood_analytics',
            postgresql_nulls_not_distinct=True
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    neighborhood_id: Mapped[int] = mapped_column(Integer, ForeignKey("neighborhoods.id"))
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    platform_id: Mapped[int] = mapped_column(Integer, ForeignKey("platforms.id"))
    period_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    customers: Mapped[int] = mapped_column(Integer, default=0)
    ad_budget: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    campaign_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    coupon_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    flash_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    joker_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    
    daily_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    monthly_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    yearly_forecast: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())