"""Admin endpoints for DistrictMetrics, NeighborhoodMetrics (JSON upsert + listele).

CSV import/export burada DEĞİL — `/admin/data-entry/csv/*` üzerinden yapılır.
SiteSettings/Loyalty da burada DEĞİL — `/admin/loyalty/*` üzerinden yapılır.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Category,
    District,
    DistrictMetrics,
    Neighborhood,
    NeighborhoodMetrics,
)


router = APIRouter(prefix="/metrics", tags=["Admin Metrics"])


# ============================== Schemas ==============================
class MetricsBase(BaseModel):
    category_id: int | None = None
    period_date: date

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


class DistrictMetricsUpsert(MetricsBase):
    district_id: str


class NeighborhoodMetricsUpsert(MetricsBase):
    neighborhood_id: int


# ============================== Helpers ==============================
_METRIC_FIELDS = (
    "cancel_rate", "return_rate", "cancel_reasons", "return_reasons",
    "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
    "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
    "hourly_heatmap",
    "negative_comment_total", "negative_comment_rate", "negative_avg_rating",
    "platform_negative_distribution", "rating_distribution", "negative_word_cloud",
    "courier_comparison",
)


def _serialize_row(r, scope: str) -> dict[str, Any]:
    out: dict[str, Any] = {
        "id": r.id,
        "category_id": r.category_id,
        "period_date": r.period_date.isoformat(),
    }
    for f in _METRIC_FIELDS:
        v = getattr(r, f)
        if isinstance(v, (list, dict)) or v is None:
            out[f] = v
        elif isinstance(v, int) and f.endswith("_total"):
            out[f] = int(v)
        else:
            out[f] = float(v)
    if scope == "district":
        out["district_id"] = r.district_id
    else:
        out["neighborhood_id"] = r.neighborhood_id
    return out


async def _validate_refs(
    db: AsyncSession,
    *,
    district_id: str | None = None,
    neighborhood_id: int | None = None,
    category_id: int | None = None,
):
    if district_id:
        if not (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none():
            raise HTTPException(400, f"district_id '{district_id}' bulunamadı")
    if neighborhood_id is not None:
        if not (await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))).scalar_one_or_none():
            raise HTTPException(400, f"neighborhood_id '{neighborhood_id}' bulunamadı")
    if category_id is not None:
        if not (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none():
            raise HTTPException(400, f"category_id '{category_id}' bulunamadı")


# ============================== District Metrics ==============================
@router.get("/district")
async def list_district_metrics(
    db: AsyncSession = Depends(get_db),
    district_id: str | None = Query(default=None),
    period_date: date | None = Query(default=None),
):
    base = select(DistrictMetrics).order_by(DistrictMetrics.period_date.desc(), DistrictMetrics.id)
    if district_id:
        base = base.where(DistrictMetrics.district_id == district_id)
    if period_date:
        base = base.where(DistrictMetrics.period_date == period_date)
    rows = (await db.execute(base)).scalars().all()
    return [_serialize_row(r, "district") for r in rows]


@router.post("/district")
async def upsert_district_metrics(payload: DistrictMetricsUpsert, db: AsyncSession = Depends(get_db)):
    await _validate_refs(db, district_id=payload.district_id, category_id=payload.category_id)
    existing = (
        await db.execute(
            select(DistrictMetrics).where(
                DistrictMetrics.district_id == payload.district_id,
                DistrictMetrics.category_id.is_(None) if payload.category_id is None
                else DistrictMetrics.category_id == payload.category_id,
                DistrictMetrics.period_date == payload.period_date,
            )
        )
    ).scalar_one_or_none()
    values = payload.model_dump(exclude={"district_id"})
    if existing:
        for k, v in values.items():
            setattr(existing, k, v)
    else:
        db.add(DistrictMetrics(district_id=payload.district_id, **values))
    await db.commit()
    return {"ok": True}


# ============================== Neighborhood Metrics ==============================
@router.get("/neighborhood")
async def list_neighborhood_metrics(
    db: AsyncSession = Depends(get_db),
    neighborhood_id: int | None = Query(default=None),
    period_date: date | None = Query(default=None),
):
    base = select(NeighborhoodMetrics).order_by(NeighborhoodMetrics.period_date.desc(), NeighborhoodMetrics.id)
    if neighborhood_id is not None:
        base = base.where(NeighborhoodMetrics.neighborhood_id == neighborhood_id)
    if period_date:
        base = base.where(NeighborhoodMetrics.period_date == period_date)
    rows = (await db.execute(base)).scalars().all()
    return [_serialize_row(r, "neighborhood") for r in rows]


@router.post("/neighborhood")
async def upsert_neighborhood_metrics(payload: NeighborhoodMetricsUpsert, db: AsyncSession = Depends(get_db)):
    await _validate_refs(db, neighborhood_id=payload.neighborhood_id, category_id=payload.category_id)
    existing = (
        await db.execute(
            select(NeighborhoodMetrics).where(
                NeighborhoodMetrics.neighborhood_id == payload.neighborhood_id,
                NeighborhoodMetrics.category_id.is_(None) if payload.category_id is None
                else NeighborhoodMetrics.category_id == payload.category_id,
                NeighborhoodMetrics.period_date == payload.period_date,
            )
        )
    ).scalar_one_or_none()
    values = payload.model_dump(exclude={"neighborhood_id"})
    if existing:
        for k, v in values.items():
            setattr(existing, k, v)
    else:
        db.add(NeighborhoodMetrics(neighborhood_id=payload.neighborhood_id, **values))
    await db.commit()
    return {"ok": True}
