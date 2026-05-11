from datetime import date, datetime
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship # relationship eklendi
from sqlalchemy.sql import func
from app.models.base import Base

class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(primary_key=True)
    district_id: Mapped[str] = mapped_column(String(50), ForeignKey("districts.id"))
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    platform_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("platforms.id"), nullable=True)
    
    # Veri Alanları
    min_basket: Mapped[float] = mapped_column(Numeric(10, 2))
    avg_rating: Mapped[float] = mapped_column(Numeric(3, 2))
    monthly_revenue: Mapped[float] = mapped_column(Numeric(12, 2))
    delivery_type: Mapped[str] = mapped_column(String(50)) # "platform" | "own"
    discount_rate: Mapped[float] = mapped_column(Numeric(5, 2))
    coupon_rate: Mapped[float] = mapped_column(Numeric(5, 2))
    period_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Zaman Damgaları
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # İlişkiler
    platform = relationship("Platform") # Platform ismine ulaşmak için hayati