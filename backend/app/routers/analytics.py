from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import DistrictAnalytics, NeighborhoodAnalytics, District, Neighborhood, Platform
from app.schemas import DistrictAnalyticsResponse, NeighborhoodAnalyticsResponse
from app.schemas.analytics import PlatformCustomers, BudgetData, ForecastData, PlatformForecast

router = APIRouter(prefix="/analytics", tags=["Analytics"])


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

    return DistrictAnalyticsResponse(
        district_id=district_id,
        district_name=district.name,
        category_id=category_id,
        platforms=platforms,
        budget=budget,
        forecast=forecast,
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

    return NeighborhoodAnalyticsResponse(
        neighborhood_id=neighborhood_id,
        neighborhood_name=neighborhood.name,
        category_id=category_id,
        platforms=platforms,
        budget=budget,
        forecast=forecast,
    )
