from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Iterable

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Category,
    Competitor,
    District,
    DistrictAnalytics,
    Neighborhood,
    NeighborhoodAnalytics,
    Platform,
)
from app.services.csv_service import (
    COMPETITOR_COLUMNS,
    DISTRICT_ANALYTICS_COLUMNS,
    NEIGHBORHOOD_ANALYTICS_COLUMNS,
    parse_csv_upload,
    rows_to_csv,
)


router = APIRouter(prefix="/analytics", tags=["Admin Analytics"])


# ============================== Schemas ==============================

class PlatformAnalyticsInput(BaseModel):
    platform_id: int
    customers: int = Field(ge=0, default=0)
    daily_forecast: float = 0
    monthly_forecast: float = 0
    yearly_forecast: float = 0


class BudgetInput(BaseModel):
    ad_budget: float = 0
    campaign_rate: float = 0
    coupon_rate: float = 0
    flash_rate: float = 0
    joker_rate: float = 0


class DistrictAnalyticsUpsert(BaseModel):
    district_id: str
    category_id: int | None = None
    period_date: date
    platform_analytics: list[PlatformAnalyticsInput]
    budget: BudgetInput = Field(default_factory=BudgetInput)


class NeighborhoodAnalyticsUpsert(BaseModel):
    neighborhood_id: int
    category_id: int | None = None
    period_date: date
    platform_analytics: list[PlatformAnalyticsInput]
    budget: BudgetInput = Field(default_factory=BudgetInput)


class CompetitorRowInput(BaseModel):
    platform_id: int | None = None
    min_basket: float
    avg_rating: float
    monthly_revenue: float
    delivery_type: str
    discount_rate: float
    coupon_rate: float


class CompetitorUpsert(BaseModel):
    district_id: str
    category_id: int | None = None
    period_date: date
    competitors: list[CompetitorRowInput]


# ============================== Helpers ==============================

async def _validate_common(
    db: AsyncSession,
    *,
    district_id: str | None = None,
    neighborhood_id: int | None = None,
    category_id: int | None = None,
    platform_ids: Iterable[int | None] = (),
) -> None:
    if district_id:
        d = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
        if not d:
            raise HTTPException(status_code=400, detail=f"district_id '{district_id}' bulunamadı")
    if neighborhood_id is not None:
        n = (await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))).scalar_one_or_none()
        if not n:
            raise HTTPException(status_code=400, detail=f"neighborhood_id '{neighborhood_id}' bulunamadı")
    if category_id is not None:
        c = (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=400, detail=f"category_id '{category_id}' bulunamadı")
    pids = [p for p in platform_ids if p is not None]
    if pids:
        found = (await db.execute(select(Platform.id).where(Platform.id.in_(pids)))).scalars().all()
        missing = set(pids) - set(found)
        if missing:
            raise HTTPException(status_code=400, detail=f"platform_id bulunamadı: {sorted(missing)}")


# ============================== District ==============================

@router.get("/district")
async def list_district_analytics(
    db: AsyncSession = Depends(get_db),
    district_id: str | None = Query(default=None),
    period_date: date | None = Query(default=None),
):
    base = select(DistrictAnalytics).order_by(DistrictAnalytics.period_date.desc(), DistrictAnalytics.id)
    if district_id:
        base = base.where(DistrictAnalytics.district_id == district_id)
    if period_date:
        base = base.where(DistrictAnalytics.period_date == period_date)
    rows = (await db.execute(base)).scalars().all()
    return [
        {
            "id": r.id,
            "district_id": r.district_id,
            "category_id": r.category_id,
            "platform_id": r.platform_id,
            "period_date": r.period_date.isoformat(),
            "customers": r.customers,
            "ad_budget": float(r.ad_budget),
            "campaign_rate": float(r.campaign_rate),
            "coupon_rate": float(r.coupon_rate),
            "flash_rate": float(r.flash_rate),
            "joker_rate": float(r.joker_rate),
            "daily_forecast": float(r.daily_forecast),
            "monthly_forecast": float(r.monthly_forecast),
            "yearly_forecast": float(r.yearly_forecast),
        }
        for r in rows
    ]


@router.post("/district", status_code=status.HTTP_200_OK)
async def upsert_district_analytics(payload: DistrictAnalyticsUpsert, db: AsyncSession = Depends(get_db)):
    await _validate_common(
        db,
        district_id=payload.district_id,
        category_id=payload.category_id,
        platform_ids=[p.platform_id for p in payload.platform_analytics],
    )

    affected = 0
    for plat in payload.platform_analytics:
        existing = (
            await db.execute(
                select(DistrictAnalytics).where(
                    DistrictAnalytics.district_id == payload.district_id,
                    DistrictAnalytics.category_id.is_(payload.category_id) if payload.category_id is None
                    else DistrictAnalytics.category_id == payload.category_id,
                    DistrictAnalytics.platform_id == plat.platform_id,
                    DistrictAnalytics.period_date == payload.period_date,
                )
            )
        ).scalar_one_or_none()

        values = {
            "customers": plat.customers,
            "daily_forecast": plat.daily_forecast,
            "monthly_forecast": plat.monthly_forecast,
            "yearly_forecast": plat.yearly_forecast,
            "ad_budget": payload.budget.ad_budget,
            "campaign_rate": payload.budget.campaign_rate,
            "coupon_rate": payload.budget.coupon_rate,
            "flash_rate": payload.budget.flash_rate,
            "joker_rate": payload.budget.joker_rate,
        }

        if existing:
            for k, v in values.items():
                setattr(existing, k, v)
        else:
            db.add(
                DistrictAnalytics(
                    district_id=payload.district_id,
                    category_id=payload.category_id,
                    platform_id=plat.platform_id,
                    period_date=payload.period_date,
                    **values,
                )
            )
        affected += 1

    await db.commit()
    return {"records_affected": affected}


@router.get("/district/csv", response_class=Response)
async def export_district_csv(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(DistrictAnalytics).order_by(DistrictAnalytics.period_date, DistrictAnalytics.id))).scalars().all()
    csv_text = rows_to_csv(
        (
            {
                "district_id": r.district_id,
                "category_id": r.category_id if r.category_id is not None else "",
                "platform_id": r.platform_id,
                "period_date": r.period_date.isoformat(),
                "customers": r.customers,
                "ad_budget": float(r.ad_budget),
                "campaign_rate": float(r.campaign_rate),
                "coupon_rate": float(r.coupon_rate),
                "flash_rate": float(r.flash_rate),
                "joker_rate": float(r.joker_rate),
                "daily_forecast": float(r.daily_forecast),
                "monthly_forecast": float(r.monthly_forecast),
                "yearly_forecast": float(r.yearly_forecast),
            }
            for r in rows
        ),
        DISTRICT_ANALYTICS_COLUMNS,
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="district_analytics.csv"'},
    )


def _parse_int(v: str, name: str, row: int, allow_none: bool = False) -> int | None:
    if v in (None, "", "None"):
        if allow_none:
            return None
        raise HTTPException(status_code=400, detail=f"satır {row}: {name} zorunlu")
    try:
        return int(v)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"satır {row}: {name} sayı olmalı")


def _parse_float(v: str, default: float = 0.0) -> float:
    if v in (None, ""):
        return default
    try:
        return float(v)
    except ValueError:
        return default


def _parse_date(v: str, row: int) -> date:
    if not v:
        raise HTTPException(status_code=400, detail=f"satır {row}: period_date zorunlu")
    try:
        return date.fromisoformat(v.strip())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"satır {row}: period_date YYYY-MM-DD formatında olmalı")


@router.post("/district/csv")
async def import_district_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records, warnings = await parse_csv_upload(file, DISTRICT_ANALYTICS_COLUMNS)
    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []
    for idx, row in enumerate(records, start=2):
        try:
            did = (row.get("district_id") or "").strip()
            if not did:
                raise HTTPException(status_code=400, detail=f"satır {idx}: district_id zorunlu")
            category_id = _parse_int(row.get("category_id", ""), "category_id", idx, allow_none=True)
            platform_id = _parse_int(row.get("platform_id", ""), "platform_id", idx)
            period = _parse_date(row.get("period_date", ""), idx)

            await _validate_common(db, district_id=did, category_id=category_id, platform_ids=[platform_id])

            existing = (
                await db.execute(
                    select(DistrictAnalytics).where(
                        DistrictAnalytics.district_id == did,
                        DistrictAnalytics.category_id.is_(None) if category_id is None
                        else DistrictAnalytics.category_id == category_id,
                        DistrictAnalytics.platform_id == platform_id,
                        DistrictAnalytics.period_date == period,
                    )
                )
            ).scalar_one_or_none()

            values = {
                "customers": _parse_int(row.get("customers", "0") or "0", "customers", idx) or 0,
                "ad_budget": _parse_float(row.get("ad_budget", "")),
                "campaign_rate": _parse_float(row.get("campaign_rate", "")),
                "coupon_rate": _parse_float(row.get("coupon_rate", "")),
                "flash_rate": _parse_float(row.get("flash_rate", "")),
                "joker_rate": _parse_float(row.get("joker_rate", "")),
                "daily_forecast": _parse_float(row.get("daily_forecast", "")),
                "monthly_forecast": _parse_float(row.get("monthly_forecast", "")),
                "yearly_forecast": _parse_float(row.get("yearly_forecast", "")),
            }

            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                db.add(
                    DistrictAnalytics(
                        district_id=did,
                        category_id=category_id,
                        platform_id=platform_id,
                        period_date=period,
                        **values,
                    )
                )
                created += 1
        except HTTPException as exc:
            errors.append(f"{exc.detail} — atlandı")
            skipped += 1
            continue

    await db.commit()
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "warnings": warnings,
        "errors": errors,
    }


# ============================== Neighborhood ==============================

@router.get("/neighborhood")
async def list_neighborhood_analytics(
    db: AsyncSession = Depends(get_db),
    neighborhood_id: int | None = Query(default=None),
    period_date: date | None = Query(default=None),
):
    base = select(NeighborhoodAnalytics).order_by(NeighborhoodAnalytics.period_date.desc(), NeighborhoodAnalytics.id)
    if neighborhood_id is not None:
        base = base.where(NeighborhoodAnalytics.neighborhood_id == neighborhood_id)
    if period_date:
        base = base.where(NeighborhoodAnalytics.period_date == period_date)
    rows = (await db.execute(base)).scalars().all()
    return [
        {
            "id": r.id,
            "neighborhood_id": r.neighborhood_id,
            "category_id": r.category_id,
            "platform_id": r.platform_id,
            "period_date": r.period_date.isoformat(),
            "customers": r.customers,
            "ad_budget": float(r.ad_budget),
            "campaign_rate": float(r.campaign_rate),
            "coupon_rate": float(r.coupon_rate),
            "flash_rate": float(r.flash_rate),
            "joker_rate": float(r.joker_rate),
            "daily_forecast": float(r.daily_forecast),
            "monthly_forecast": float(r.monthly_forecast),
            "yearly_forecast": float(r.yearly_forecast),
        }
        for r in rows
    ]


@router.post("/neighborhood")
async def upsert_neighborhood_analytics(payload: NeighborhoodAnalyticsUpsert, db: AsyncSession = Depends(get_db)):
    await _validate_common(
        db,
        neighborhood_id=payload.neighborhood_id,
        category_id=payload.category_id,
        platform_ids=[p.platform_id for p in payload.platform_analytics],
    )
    affected = 0
    for plat in payload.platform_analytics:
        existing = (
            await db.execute(
                select(NeighborhoodAnalytics).where(
                    NeighborhoodAnalytics.neighborhood_id == payload.neighborhood_id,
                    NeighborhoodAnalytics.category_id.is_(None) if payload.category_id is None
                    else NeighborhoodAnalytics.category_id == payload.category_id,
                    NeighborhoodAnalytics.platform_id == plat.platform_id,
                    NeighborhoodAnalytics.period_date == payload.period_date,
                )
            )
        ).scalar_one_or_none()

        values = {
            "customers": plat.customers,
            "daily_forecast": plat.daily_forecast,
            "monthly_forecast": plat.monthly_forecast,
            "yearly_forecast": plat.yearly_forecast,
            "ad_budget": payload.budget.ad_budget,
            "campaign_rate": payload.budget.campaign_rate,
            "coupon_rate": payload.budget.coupon_rate,
            "flash_rate": payload.budget.flash_rate,
            "joker_rate": payload.budget.joker_rate,
        }
        if existing:
            for k, v in values.items():
                setattr(existing, k, v)
        else:
            db.add(
                NeighborhoodAnalytics(
                    neighborhood_id=payload.neighborhood_id,
                    category_id=payload.category_id,
                    platform_id=plat.platform_id,
                    period_date=payload.period_date,
                    **values,
                )
            )
        affected += 1
    await db.commit()
    return {"records_affected": affected}


@router.get("/neighborhood/csv", response_class=Response)
async def export_neighborhood_csv(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(NeighborhoodAnalytics).order_by(NeighborhoodAnalytics.period_date, NeighborhoodAnalytics.id))).scalars().all()
    csv_text = rows_to_csv(
        (
            {
                "neighborhood_id": r.neighborhood_id,
                "category_id": r.category_id if r.category_id is not None else "",
                "platform_id": r.platform_id,
                "period_date": r.period_date.isoformat(),
                "customers": r.customers,
                "ad_budget": float(r.ad_budget),
                "campaign_rate": float(r.campaign_rate),
                "coupon_rate": float(r.coupon_rate),
                "flash_rate": float(r.flash_rate),
                "joker_rate": float(r.joker_rate),
                "daily_forecast": float(r.daily_forecast),
                "monthly_forecast": float(r.monthly_forecast),
                "yearly_forecast": float(r.yearly_forecast),
            }
            for r in rows
        ),
        NEIGHBORHOOD_ANALYTICS_COLUMNS,
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="neighborhood_analytics.csv"'},
    )


@router.post("/neighborhood/csv")
async def import_neighborhood_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records, warnings = await parse_csv_upload(file, NEIGHBORHOOD_ANALYTICS_COLUMNS)
    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []
    for idx, row in enumerate(records, start=2):
        try:
            nid = _parse_int(row.get("neighborhood_id", ""), "neighborhood_id", idx) or 0
            category_id = _parse_int(row.get("category_id", ""), "category_id", idx, allow_none=True)
            platform_id = _parse_int(row.get("platform_id", ""), "platform_id", idx)
            period = _parse_date(row.get("period_date", ""), idx)

            await _validate_common(db, neighborhood_id=nid, category_id=category_id, platform_ids=[platform_id])

            existing = (
                await db.execute(
                    select(NeighborhoodAnalytics).where(
                        NeighborhoodAnalytics.neighborhood_id == nid,
                        NeighborhoodAnalytics.category_id.is_(None) if category_id is None
                        else NeighborhoodAnalytics.category_id == category_id,
                        NeighborhoodAnalytics.platform_id == platform_id,
                        NeighborhoodAnalytics.period_date == period,
                    )
                )
            ).scalar_one_or_none()

            values = {
                "customers": _parse_int(row.get("customers", "0") or "0", "customers", idx) or 0,
                "ad_budget": _parse_float(row.get("ad_budget", "")),
                "campaign_rate": _parse_float(row.get("campaign_rate", "")),
                "coupon_rate": _parse_float(row.get("coupon_rate", "")),
                "flash_rate": _parse_float(row.get("flash_rate", "")),
                "joker_rate": _parse_float(row.get("joker_rate", "")),
                "daily_forecast": _parse_float(row.get("daily_forecast", "")),
                "monthly_forecast": _parse_float(row.get("monthly_forecast", "")),
                "yearly_forecast": _parse_float(row.get("yearly_forecast", "")),
            }
            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                db.add(
                    NeighborhoodAnalytics(
                        neighborhood_id=nid,
                        category_id=category_id,
                        platform_id=platform_id,
                        period_date=period,
                        **values,
                    )
                )
                created += 1
        except HTTPException as exc:
            errors.append(f"{exc.detail} — atlandı")
            skipped += 1
            continue
    await db.commit()
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "warnings": warnings,
        "errors": errors,
    }


# ============================== Competitors ==============================

@router.get("/competitors")
async def list_competitors(
    db: AsyncSession = Depends(get_db),
    district_id: str | None = Query(default=None),
    period_date: date | None = Query(default=None),
):
    base = select(Competitor).order_by(Competitor.period_date.desc(), Competitor.id)
    if district_id:
        base = base.where(Competitor.district_id == district_id)
    if period_date:
        base = base.where(Competitor.period_date == period_date)
    rows = (await db.execute(base)).scalars().all()
    return [
        {
            "id": r.id,
            "district_id": r.district_id,
            "category_id": r.category_id,
            "platform_id": r.platform_id,
            "period_date": r.period_date.isoformat(),
            "min_basket": float(r.min_basket),
            "avg_rating": float(r.avg_rating),
            "monthly_revenue": float(r.monthly_revenue),
            "delivery_type": r.delivery_type,
            "discount_rate": float(r.discount_rate),
            "coupon_rate": float(r.coupon_rate),
        }
        for r in rows
    ]


@router.post("/competitors")
async def upsert_competitors(payload: CompetitorUpsert, db: AsyncSession = Depends(get_db)):
    await _validate_common(
        db,
        district_id=payload.district_id,
        category_id=payload.category_id,
        platform_ids=[c.platform_id for c in payload.competitors],
    )
    affected = 0
    for c in payload.competitors:
        existing = (
            await db.execute(
                select(Competitor).where(
                    Competitor.district_id == payload.district_id,
                    Competitor.category_id.is_(None) if payload.category_id is None
                    else Competitor.category_id == payload.category_id,
                    Competitor.platform_id == c.platform_id if c.platform_id is not None
                    else Competitor.platform_id.is_(None),
                    Competitor.period_date == payload.period_date,
                )
            )
        ).scalar_one_or_none()
        values = {
            "min_basket": c.min_basket,
            "avg_rating": c.avg_rating,
            "monthly_revenue": c.monthly_revenue,
            "delivery_type": c.delivery_type,
            "discount_rate": c.discount_rate,
            "coupon_rate": c.coupon_rate,
        }
        if existing:
            for k, v in values.items():
                setattr(existing, k, v)
        else:
            db.add(
                Competitor(
                    district_id=payload.district_id,
                    category_id=payload.category_id,
                    platform_id=c.platform_id,
                    period_date=payload.period_date,
                    **values,
                )
            )
        affected += 1
    await db.commit()
    return {"records_affected": affected}


@router.get("/competitors/csv", response_class=Response)
async def export_competitors_csv(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Competitor).order_by(Competitor.period_date, Competitor.id))).scalars().all()
    csv_text = rows_to_csv(
        (
            {
                "district_id": r.district_id,
                "category_id": r.category_id if r.category_id is not None else "",
                "platform_id": r.platform_id if r.platform_id is not None else "",
                "period_date": r.period_date.isoformat(),
                "min_basket": float(r.min_basket),
                "avg_rating": float(r.avg_rating),
                "monthly_revenue": float(r.monthly_revenue),
                "delivery_type": r.delivery_type,
                "discount_rate": float(r.discount_rate),
                "coupon_rate": float(r.coupon_rate),
            }
            for r in rows
        ),
        COMPETITOR_COLUMNS,
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="competitors.csv"'},
    )


@router.post("/competitors/csv")
async def import_competitors_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records, warnings = await parse_csv_upload(file, COMPETITOR_COLUMNS)
    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []
    for idx, row in enumerate(records, start=2):
        try:
            did = (row.get("district_id") or "").strip()
            if not did:
                raise HTTPException(status_code=400, detail=f"satır {idx}: district_id zorunlu")
            category_id = _parse_int(row.get("category_id", ""), "category_id", idx, allow_none=True)
            platform_id = _parse_int(row.get("platform_id", ""), "platform_id", idx, allow_none=True)
            period = _parse_date(row.get("period_date", ""), idx)

            await _validate_common(
                db,
                district_id=did,
                category_id=category_id,
                platform_ids=[platform_id] if platform_id is not None else [],
            )

            existing = (
                await db.execute(
                    select(Competitor).where(
                        Competitor.district_id == did,
                        Competitor.category_id.is_(None) if category_id is None
                        else Competitor.category_id == category_id,
                        Competitor.platform_id.is_(None) if platform_id is None
                        else Competitor.platform_id == platform_id,
                        Competitor.period_date == period,
                    )
                )
            ).scalar_one_or_none()

            values = {
                "min_basket": _parse_float(row.get("min_basket", "")),
                "avg_rating": _parse_float(row.get("avg_rating", "")),
                "monthly_revenue": _parse_float(row.get("monthly_revenue", "")),
                "delivery_type": (row.get("delivery_type") or "platform").strip(),
                "discount_rate": _parse_float(row.get("discount_rate", "")),
                "coupon_rate": _parse_float(row.get("coupon_rate", "")),
            }
            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                db.add(
                    Competitor(
                        district_id=did,
                        category_id=category_id,
                        platform_id=platform_id,
                        period_date=period,
                        **values,
                    )
                )
                created += 1
        except HTTPException as exc:
            errors.append(f"{exc.detail} — atlandı")
            skipped += 1
            continue
    await db.commit()
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "warnings": warnings,
        "errors": errors,
    }
