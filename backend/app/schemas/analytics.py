from typing import Any
from pydantic import BaseModel, Field


class PlatformCustomers(BaseModel):
    name: str
    customers: int
    restaurants: int


class PlatformForecast(BaseModel):
    platform: str
    amount: float


class ForecastData(BaseModel):
    daily: list[PlatformForecast]
    monthly: list[PlatformForecast]
    yearly: list[PlatformForecast]


class BudgetData(BaseModel):
    adBudget: float
    campaignRate: float
    couponRate: float
    flashRate: float
    jokerRate: float


class MetricsData(BaseModel):
    """İlçe/mahalle seviyesinde platform-bağımsız metrikler.
    Veri yoksa tüm alanlar 0/boş döner — frontend skeleton göstermek için kullanır."""
    cancel_rate: float = 0
    return_rate: float = 0
    cancel_reasons: list[dict[str, Any]] = Field(default_factory=list)
    return_reasons: list[dict[str, Any]] = Field(default_factory=list)

    area_performance_score: float = 0
    area_rating: float = 0
    highest_rating: float = 0
    lowest_rating: float = 0

    avg_basket: float = 0
    avg_menu_price: float = 0
    avg_monthly_revenue: float = 0
    courier_fee: float = 0

    hourly_heatmap: list[list[float]] = Field(default_factory=list)

    negative_comment_total: int = 0
    negative_comment_rate: float = 0
    negative_avg_rating: float = 0
    platform_negative_distribution: list[dict[str, Any]] = Field(default_factory=list)
    rating_distribution: list[dict[str, Any]] = Field(default_factory=list)
    negative_word_cloud: list[dict[str, Any]] = Field(default_factory=list)

    courier_comparison: dict[str, Any] = Field(default_factory=dict)


class DistrictCommentSummary(BaseModel):
    """CommentAnalist'in 'İlçe Bazlı Olumsuz Yorum Oranı' tablosu için."""
    district_id: str
    district_name: str
    percent: float
    count: int
    risk: str  # "Yüksek Risk" | "Orta" | "İyi"


class DistrictAnalyticsResponse(BaseModel):
    district_id: str
    district_name: str
    category_id: int | None
    platforms: list[PlatformCustomers]
    budget: BudgetData
    forecast: ForecastData
    metrics: MetricsData = Field(default_factory=MetricsData)


class NeighborhoodAnalyticsResponse(BaseModel):
    neighborhood_id: int
    neighborhood_name: str
    category_id: int | None
    platforms: list[PlatformCustomers]
    budget: BudgetData
    forecast: ForecastData
    metrics: MetricsData = Field(default_factory=MetricsData)
    # Fallback bilgisi — frontend banner için
    analytics_source: str = "neighborhood"  # "neighborhood" | "district_fallback" | "none"
    metrics_source: str = "neighborhood"    # "neighborhood" | "district_fallback" | "none"


class SiteSettingsResponse(BaseModel):
    # Stats sayıları
    loyalty_active_firms: str = ""
    loyalty_churn_reduction: str = ""
    loyalty_avg_roi: str = ""
    loyalty_payback_period: str = ""
    # Stats etiketleri
    loyalty_stats_active_firms_label: str = ""
    loyalty_stats_churn_label: str = ""
    loyalty_stats_roi_label: str = ""
    loyalty_stats_payback_label: str = ""
    # Hero
    loyalty_hero_bg_url: str = ""
    loyalty_hero_badge: str = ""
    loyalty_hero_title: str = ""
    loyalty_hero_title_accent: str = ""
    loyalty_hero_subtitle: str = ""
    loyalty_hero_cta_text: str = ""
    # Features
    loyalty_features_title: str = ""
    loyalty_features_subtitle: str = ""
    loyalty_feature_cards: list[dict[str, Any]] = Field(default_factory=list)
