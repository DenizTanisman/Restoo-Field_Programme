from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import (
    DistrictAnalytics,
    DistrictMetrics,
    NeighborhoodAnalytics,
    NeighborhoodMetrics,
    Platform,
    Restaurant,
    RestaurantAnalytics,
    RestaurantMetrics,
)
from app.schemas import RestaurantSchema
from app.schemas.analytics import (
    BudgetData,
    ForecastData,
    MetricsData,
    NeighborhoodAnalyticsResponse,
    PlatformCustomers,
    PlatformForecast,
)
from app.services.restaurant_service import LOAD_OPTIONS, serialize_restaurant


router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/search", response_model=list[RestaurantSchema])
async def search_restaurants(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant)
        .where(Restaurant.name.ilike(f"%{q}%"), Restaurant.is_active == True)
        .options(*LOAD_OPTIONS)
        .limit(20)
    )
    return [serialize_restaurant(r) for r in result.scalars().all()]


def _is_set(v):
    """Bir alan 'verili sayılır mı?' Cascade merge için."""
    if v is None:
        return False
    if isinstance(v, (int, float)):
        return v != 0
    if isinstance(v, (list, dict, str)):
        return len(v) > 0
    return bool(v)


_METRIC_FIELDS = [
    "cancel_rate", "return_rate", "cancel_reasons", "return_reasons",
    "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
    "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
    "hourly_heatmap", "negative_comment_total", "negative_comment_rate",
    "negative_avg_rating", "platform_negative_distribution", "rating_distribution",
    "negative_word_cloud", "courier_comparison",
]


def _cascade_metrics(restaurant_m, neighborhood_m, district_m) -> tuple[MetricsData, dict[str, str]]:
    """Alan-bazlı cascade: restaurant → neighborhood → district → default.
    Returns (MetricsData, sources_dict) — sources_dict her alanın hangi seviyeden geldiğini söyler.
    """
    out = {}
    sources = {}
    for f in _METRIC_FIELDS:
        for level, src in [("restaurant", restaurant_m), ("neighborhood", neighborhood_m), ("district", district_m)]:
            if src is None:
                continue
            v = getattr(src, f, None)
            if _is_set(v):
                out[f] = v
                sources[f] = level
                break
        else:
            sources[f] = "none"
    # Boş alanları default'la doldur
    defaults = {
        "cancel_rate": 0.0, "return_rate": 0.0, "cancel_reasons": [], "return_reasons": [],
        "area_performance_score": 0.0, "area_rating": 0.0, "highest_rating": 0.0, "lowest_rating": 0.0,
        "avg_basket": 0.0, "avg_menu_price": 0.0, "avg_monthly_revenue": 0.0, "courier_fee": 0.0,
        "hourly_heatmap": [], "negative_comment_total": 0, "negative_comment_rate": 0.0,
        "negative_avg_rating": 0.0, "platform_negative_distribution": [], "rating_distribution": [],
        "negative_word_cloud": [], "courier_comparison": {},
    }
    for f in _METRIC_FIELDS:
        if f not in out:
            out[f] = defaults[f]
    # JSON list/dict alanları için list()/dict() kopya — Pydantic mutation güvenliği
    return MetricsData(**out), sources


@router.get("/{restaurant_id}/dashboard", response_model=NeighborhoodAnalyticsResponse)
async def restaurant_dashboard(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    """Restoran-özel cascade dashboard verisi.
    Sırayla: RestaurantMetrics/Analytics → NeighborhoodMetrics/Analytics → DistrictMetrics/Analytics.
    NeighborhoodAnalyticsResponse shape'inde döner; analytics_source/metrics_source
    en yüksek (en spesifik) kaynağı bildirir.
    """
    r = (
        await db.execute(
            select(Restaurant)
            .where(Restaurant.id == restaurant_id, Restaurant.is_active == True)
            .options(
                selectinload(Restaurant.metrics),
                selectinload(Restaurant.analytics),
                selectinload(Restaurant.neighborhood),
                selectinload(Restaurant.district),
                selectinload(Restaurant.platforms),
            )
        )
    ).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")

    cat_id = r.category_id

    # === Metrics cascade ===
    nb_metric = None
    if r.neighborhood_id is not None:
        nb_metric = (await db.execute(
            select(NeighborhoodMetrics).where(
                NeighborhoodMetrics.neighborhood_id == r.neighborhood_id,
                NeighborhoodMetrics.category_id == cat_id,
            ).order_by(NeighborhoodMetrics.period_date.desc())
        )).scalars().first()
    d_metric = (await db.execute(
        select(DistrictMetrics).where(
            DistrictMetrics.district_id == r.district_id,
            DistrictMetrics.category_id == cat_id,
        ).order_by(DistrictMetrics.period_date.desc())
    )).scalars().first()

    metrics, _sources = _cascade_metrics(r.metrics, nb_metric, d_metric)

    if r.metrics is not None:
        metrics_source = "restaurant"
    elif nb_metric is not None:
        metrics_source = "neighborhood"
    elif d_metric is not None:
        metrics_source = "district_fallback"
    else:
        metrics_source = "none"

    # === Analytics cascade (per platform) ===
    platforms_result = await db.execute(select(Platform).where(Platform.is_active == True))
    platform_map = {p.id: p.name for p in platforms_result.scalars().all()}

    # Restoran kendi analytics'i (ad_budget/forecast) varsa, platforms'taki customers ile birleştir
    rp_customers = {rp.platform_id: rp.customers for rp in r.platforms}

    analytics_source = "restaurant" if r.analytics else "none"
    used_rows = r.analytics

    if not used_rows and r.neighborhood_id is not None:
        nb_rows = (await db.execute(
            select(NeighborhoodAnalytics).where(
                NeighborhoodAnalytics.neighborhood_id == r.neighborhood_id,
                NeighborhoodAnalytics.category_id == cat_id,
            )
        )).scalars().all()
        if nb_rows:
            used_rows = nb_rows
            analytics_source = "neighborhood"

    if not used_rows:
        d_rows = (await db.execute(
            select(DistrictAnalytics).where(
                DistrictAnalytics.district_id == r.district_id,
                DistrictAnalytics.category_id == cat_id,
            )
        )).scalars().all()
        if d_rows:
            used_rows = d_rows
            analytics_source = "district_fallback"

    # platforms listesi (customers): source=restaurant ise her zaman RestaurantPlatform'dan
    # (kullanıcı 3 platform için müşteri girdi ama belki sadece 1'i için budget detayı var)
    platforms: list[PlatformCustomers] = []
    if analytics_source == "restaurant" and rp_customers:
        for pid, customers in rp_customers.items():
            platforms.append(PlatformCustomers(name=platform_map.get(pid, f"Platform {pid}"), customers=customers, restaurants=0))
    else:
        for row in used_rows or []:
            pname = platform_map.get(row.platform_id, f"Platform {row.platform_id}")
            customers = int(getattr(row, "customers", 0) or 0)
            platforms.append(PlatformCustomers(name=pname, customers=customers, restaurants=0))

    # Budget + forecast: analytics satırlarından aggregate
    budget_acc = {"adBudget": 0, "campaignRate": 0, "couponRate": 0, "flashRate": 0, "jokerRate": 0}
    forecast_daily, forecast_monthly, forecast_yearly = [], [], []
    count = len(used_rows or [])
    for row in used_rows or []:
        pname = platform_map.get(row.platform_id, f"Platform {row.platform_id}")
        budget_acc["adBudget"] += float(row.ad_budget)
        budget_acc["campaignRate"] += float(row.campaign_rate)
        budget_acc["couponRate"] += float(row.coupon_rate)
        budget_acc["flashRate"] += float(row.flash_rate)
        budget_acc["jokerRate"] += float(row.joker_rate)
        forecast_daily.append(PlatformForecast(platform=pname, amount=float(row.daily_forecast)))
        forecast_monthly.append(PlatformForecast(platform=pname, amount=float(row.monthly_forecast)))
        forecast_yearly.append(PlatformForecast(platform=pname, amount=float(row.yearly_forecast)))

    if count > 1:
        for k in ["campaignRate", "couponRate", "flashRate", "jokerRate"]:
            budget_acc[k] /= count

    return NeighborhoodAnalyticsResponse(
        neighborhood_id=r.neighborhood_id or 0,
        neighborhood_name=r.neighborhood.name if r.neighborhood else (r.district.name if r.district else ""),
        category_id=cat_id,
        platforms=platforms,
        budget=BudgetData(**budget_acc),
        forecast=ForecastData(daily=forecast_daily, monthly=forecast_monthly, yearly=forecast_yearly),
        metrics=metrics,
        analytics_source=analytics_source,
        metrics_source=metrics_source,
    )


@router.get("", response_model=list[RestaurantSchema])
async def list_restaurants(
    district_id: str | None = Query(default=None),
    neighborhood_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Public list with filters. Hepsi opsiyonel; herhangi biri seçilebilir."""
    stmt = select(Restaurant).where(Restaurant.is_active == True).options(*LOAD_OPTIONS)
    if district_id:
        stmt = stmt.where(Restaurant.district_id == district_id)
    if neighborhood_id is not None:
        stmt = stmt.where(Restaurant.neighborhood_id == neighborhood_id)
    if category_id is not None:
        stmt = stmt.where(Restaurant.category_id == category_id)
    stmt = stmt.order_by(Restaurant.name).limit(limit)
    result = await db.execute(stmt)
    return [serialize_restaurant(r) for r in result.scalars().all()]
