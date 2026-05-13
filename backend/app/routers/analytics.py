from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import (
    DistrictAnalytics,
    NeighborhoodAnalytics,
    District,
    Neighborhood,
    Platform,
    DistrictMetrics,
    NeighborhoodMetrics,
    SiteSettings,
)
from app.schemas import (
    DistrictAnalyticsResponse,
    NeighborhoodAnalyticsResponse,
    MetricsData,
    SiteSettingsResponse,
    DistrictCommentSummary,
)
from app.schemas.analytics import PlatformCustomers, BudgetData, ForecastData, PlatformForecast

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _metrics_from_row(row) -> MetricsData:
    if row is None:
        return MetricsData()
    return MetricsData(
        cancel_rate=float(row.cancel_rate or 0),
        return_rate=float(row.return_rate or 0),
        cancel_reasons=list(row.cancel_reasons or []),
        return_reasons=list(row.return_reasons or []),
        area_performance_score=float(row.area_performance_score or 0),
        area_rating=float(row.area_rating or 0),
        highest_rating=float(row.highest_rating or 0),
        lowest_rating=float(row.lowest_rating or 0),
        avg_basket=float(row.avg_basket or 0),
        avg_menu_price=float(row.avg_menu_price or 0),
        avg_monthly_revenue=float(row.avg_monthly_revenue or 0),
        courier_fee=float(row.courier_fee or 0),
        hourly_heatmap=list(row.hourly_heatmap or []),
        negative_comment_total=int(row.negative_comment_total or 0),
        negative_comment_rate=float(row.negative_comment_rate or 0),
        negative_avg_rating=float(row.negative_avg_rating or 0),
        platform_negative_distribution=list(row.platform_negative_distribution or []),
        rating_distribution=list(row.rating_distribution or []),
        negative_word_cloud=list(row.negative_word_cloud or []),
        courier_comparison=dict(row.courier_comparison or {}),
    )


async def _fetch_district_metrics(
    db: AsyncSession, district_id: str, category_id: int | None
) -> MetricsData:
    stmt = select(DistrictMetrics).where(DistrictMetrics.district_id == district_id)
    if category_id is not None:
        stmt = stmt.where(DistrictMetrics.category_id == category_id)
    else:
        stmt = stmt.where(DistrictMetrics.category_id == None)  # noqa: E711
    stmt = stmt.order_by(DistrictMetrics.period_date.desc())
    row = (await db.execute(stmt)).scalars().first()
    return _metrics_from_row(row)


async def _fetch_neighborhood_metrics(
    db: AsyncSession, neighborhood_id: int, category_id: int | None
) -> MetricsData:
    stmt = select(NeighborhoodMetrics).where(NeighborhoodMetrics.neighborhood_id == neighborhood_id)
    if category_id is not None:
        stmt = stmt.where(NeighborhoodMetrics.category_id == category_id)
    else:
        stmt = stmt.where(NeighborhoodMetrics.category_id == None)  # noqa: E711
    stmt = stmt.order_by(NeighborhoodMetrics.period_date.desc())
    row = (await db.execute(stmt)).scalars().first()
    return _metrics_from_row(row)


def _build_analytics_response(rows, platform_map: dict, restaurant_count_map: dict):
    platforms = []
    budget_acc = {"adBudget": 0, "campaignRate": 0, "couponRate": 0, "flashRate": 0, "jokerRate": 0}
    forecast_daily, forecast_monthly, forecast_yearly = [], [], []
    count = len(rows)

    for row in rows:
        pname = platform_map.get(row.platform_id, f"Platform {row.platform_id}")
        r_count = restaurant_count_map.get(row.platform_id, 0)
        platforms.append(PlatformCustomers(name=pname, customers=row.customers, restaurants=r_count))
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

    return (
        BudgetData(**budget_acc),
        ForecastData(daily=forecast_daily, monthly=forecast_monthly, yearly=forecast_yearly),
        platforms,
    )


@router.get("/district", response_model=DistrictAnalyticsResponse)
async def district_analytics(
    district_id: str = Query(...),
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    district = await db.get(District, district_id)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    stmt = select(DistrictAnalytics).where(DistrictAnalytics.district_id == district_id)
    if category_id is not None:
        stmt = stmt.where(DistrictAnalytics.category_id == category_id)
    else:
        stmt = stmt.where(DistrictAnalytics.category_id == None)

    result = await db.execute(stmt)
    rows = result.scalars().all()

    platforms_result = await db.execute(select(Platform).where(Platform.is_active == True))
    platform_map = {p.id: p.name for p in platforms_result.scalars().all()}

    budget, forecast, platforms = _build_analytics_response(rows, platform_map, {})
    metrics = await _fetch_district_metrics(db, district_id, category_id)

    return DistrictAnalyticsResponse(
        district_id=district_id,
        district_name=district.name,
        category_id=category_id,
        platforms=platforms,
        budget=budget,
        forecast=forecast,
        metrics=metrics,
    )


@router.get("/neighborhood", response_model=NeighborhoodAnalyticsResponse)
async def neighborhood_analytics(
    neighborhood_id: int = Query(...),
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    neighborhood = await db.get(Neighborhood, neighborhood_id)
    if not neighborhood:
        raise HTTPException(status_code=404, detail="Neighborhood not found")

    stmt = select(NeighborhoodAnalytics).where(NeighborhoodAnalytics.neighborhood_id == neighborhood_id)
    if category_id is not None:
        stmt = stmt.where(NeighborhoodAnalytics.category_id == category_id)
    else:
        stmt = stmt.where(NeighborhoodAnalytics.category_id == None)

    result = await db.execute(stmt)
    rows = result.scalars().all()

    platforms_result = await db.execute(select(Platform).where(Platform.is_active == True))
    platform_map = {p.id: p.name for p in platforms_result.scalars().all()}

    budget, forecast, platforms = _build_analytics_response(rows, platform_map, {})
    metrics = await _fetch_neighborhood_metrics(db, neighborhood_id, category_id)

    return NeighborhoodAnalyticsResponse(
        neighborhood_id=neighborhood_id,
        neighborhood_name=neighborhood.name,
        category_id=category_id,
        platforms=platforms,
        budget=budget,
        forecast=forecast,
        metrics=metrics,
    )


@router.get("/comments/by-district", response_model=list[DistrictCommentSummary])
async def comments_by_district(
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """CommentAnalist 'İlçe Bazlı Olumsuz Yorum Oranı' tablosu için.
    Her ilçe için DistrictMetrics'ten en son kaydı al, oran ve adet döndür, risk seviyesini türet."""
    # En son period_date'i olan kayıt başına district
    stmt = select(DistrictMetrics).order_by(DistrictMetrics.period_date.desc())
    if category_id is not None:
        stmt = stmt.where(DistrictMetrics.category_id == category_id)
    else:
        stmt = stmt.where(DistrictMetrics.category_id == None)  # noqa: E711
    rows = (await db.execute(stmt)).scalars().all()
    seen: dict[str, DistrictMetrics] = {}
    for r in rows:
        seen.setdefault(r.district_id, r)

    districts_result = await db.execute(select(District))
    name_by_id = {d.id: d.name for d in districts_result.scalars().all()}

    out: list[DistrictCommentSummary] = []
    for did, row in seen.items():
        pct = float(row.negative_comment_rate or 0)
        risk = "Yüksek Risk" if pct >= 25 else "Orta" if pct >= 18 else "İyi"
        out.append(DistrictCommentSummary(
            district_id=did,
            district_name=name_by_id.get(did, did),
            percent=pct,
            count=int(row.negative_comment_total or 0),
            risk=risk,
        ))
    out.sort(key=lambda x: x.percent, reverse=True)
    return out


@router.get("/site-settings", response_model=SiteSettingsResponse)
async def get_site_settings(db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    if not row:
        return SiteSettingsResponse()
    return SiteSettingsResponse(
        loyalty_active_firms=row.loyalty_active_firms or "",
        loyalty_churn_reduction=row.loyalty_churn_reduction or "",
        loyalty_avg_roi=row.loyalty_avg_roi or "",
        loyalty_payback_period=row.loyalty_payback_period or "",
    )
