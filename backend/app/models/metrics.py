from datetime import date, datetime
from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.base import Base


class DistrictMetrics(Base):
    """İlçe seviyesinde platform-bağımsız metrikler.
    HomePage'deki Kıyaslama, Operasyon Kartları, Performans Skoru,
    Sales Hour Heatmap, Yorum Analizi gibi bileşenleri besler."""
    __tablename__ = "district_metrics"

    __table_args__ = (
        UniqueConstraint(
            "district_id", "category_id", "period_date",
            name="uq_district_metrics",
            postgresql_nulls_not_distinct=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    district_id: Mapped[str] = mapped_column(String(50), ForeignKey("districts.id"))
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    period_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Operasyon — RestaurantOperationalCard
    cancel_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    return_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    cancel_reasons: Mapped[list | None] = mapped_column(JSON, nullable=True)
    return_reasons: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Skor & Puan — GeneralPerformanceScore, CustomerRatingCompare
    area_performance_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    area_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    highest_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    lowest_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)

    # Kıyaslama özet kartları
    avg_basket: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    avg_menu_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    avg_monthly_revenue: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    courier_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    # Saatlik yoğunluk — SalesHourHeatmap (7 gün x 24 saat)
    hourly_heatmap: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Yorum analizi — CommentAnalist
    negative_comment_total: Mapped[int] = mapped_column(Integer, default=0)
    negative_comment_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    negative_avg_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    platform_negative_distribution: Mapped[list | None] = mapped_column(JSON, nullable=True)
    rating_distribution: Mapped[list | None] = mapped_column(JSON, nullable=True)
    negative_word_cloud: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # İş modeli kıyaslaması — Kiyaslama bileşeninin alt bölümünü besler
    # Yapı: {"restaurant_courier": {fee, avg_cost, monthly_revenue, churn_label}, "own_courier": {...}}
    courier_comparison: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class NeighborhoodMetrics(Base):
    __tablename__ = "neighborhood_metrics"

    __table_args__ = (
        UniqueConstraint(
            "neighborhood_id", "category_id", "period_date",
            name="uq_neighborhood_metrics",
            postgresql_nulls_not_distinct=True,
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    neighborhood_id: Mapped[int] = mapped_column(Integer, ForeignKey("neighborhoods.id"))
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    period_date: Mapped[date] = mapped_column(Date, nullable=False)

    cancel_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    return_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    cancel_reasons: Mapped[list | None] = mapped_column(JSON, nullable=True)
    return_reasons: Mapped[list | None] = mapped_column(JSON, nullable=True)

    area_performance_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    area_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    highest_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    lowest_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)

    avg_basket: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    avg_menu_price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    avg_monthly_revenue: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    courier_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    hourly_heatmap: Mapped[list | None] = mapped_column(JSON, nullable=True)

    negative_comment_total: Mapped[int] = mapped_column(Integer, default=0)
    negative_comment_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    negative_avg_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0)
    platform_negative_distribution: Mapped[list | None] = mapped_column(JSON, nullable=True)
    rating_distribution: Mapped[list | None] = mapped_column(JSON, nullable=True)
    negative_word_cloud: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # İş modeli kıyaslaması — Kiyaslama bileşeninin alt bölümünü besler
    # Yapı: {"restaurant_courier": {fee, avg_cost, monthly_revenue, churn_label}, "own_courier": {...}}
    courier_comparison: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SiteSettings(Base):
    """Anasayfada görünen global ayarlar — özellikle Sadakat (Loyalty) sayfası.
    Tek satır olarak kullanılır (id=1)."""
    __tablename__ = "site_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Stats sayıları
    loyalty_active_firms: Mapped[str] = mapped_column(String(50), default="")
    loyalty_churn_reduction: Mapped[str] = mapped_column(String(50), default="")
    loyalty_avg_roi: Mapped[str] = mapped_column(String(50), default="")
    loyalty_payback_period: Mapped[str] = mapped_column(String(50), default="")

    # Stats etiketleri
    loyalty_stats_active_firms_label: Mapped[str] = mapped_column(String(100), default="")
    loyalty_stats_churn_label: Mapped[str] = mapped_column(String(100), default="")
    loyalty_stats_roi_label: Mapped[str] = mapped_column(String(100), default="")
    loyalty_stats_payback_label: Mapped[str] = mapped_column(String(100), default="")

    # Hero
    loyalty_hero_bg_url: Mapped[str] = mapped_column(String(500), default="")
    loyalty_hero_badge: Mapped[str] = mapped_column(String(100), default="")
    loyalty_hero_title: Mapped[str] = mapped_column(String(200), default="")
    loyalty_hero_title_accent: Mapped[str] = mapped_column(String(200), default="")
    loyalty_hero_subtitle: Mapped[str] = mapped_column(String(500), default="")
    loyalty_hero_cta_text: Mapped[str] = mapped_column(String(100), default="")

    # Features section header
    loyalty_features_title: Mapped[str] = mapped_column(String(200), default="")
    loyalty_features_subtitle: Mapped[str] = mapped_column(String(500), default="")

    # 4 feature card: JSON list of {title, text, image_url}
    loyalty_feature_cards: Mapped[list | None] = mapped_column(JSON, default=list, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
