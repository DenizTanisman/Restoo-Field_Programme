"""Admin endpoints for DistrictMetrics, NeighborhoodMetrics, SiteSettings."""
from __future__ import annotations

import json
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
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
    SiteSettings,
)
from app.services.csv_service import (
    DISTRICT_METRICS_COLUMNS,
    NEIGHBORHOOD_METRICS_COLUMNS,
    parse_csv_upload,
    rows_to_csv,
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


class SiteSettingsUpsert(BaseModel):
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
    loyalty_feature_cards: list[dict] = []


# ============================== Helpers ==============================

_METRIC_FIELDS = (
    "cancel_rate",
    "return_rate",
    "cancel_reasons",
    "return_reasons",
    "area_performance_score",
    "area_rating",
    "highest_rating",
    "lowest_rating",
    "avg_basket",
    "avg_menu_price",
    "avg_monthly_revenue",
    "courier_fee",
    "hourly_heatmap",
    "negative_comment_total",
    "negative_comment_rate",
    "negative_avg_rating",
    "platform_negative_distribution",
    "rating_distribution",
    "negative_word_cloud",
    "courier_comparison",
)


def _row_to_dict(r) -> dict[str, Any]:
    return {f: getattr(r, f) for f in _METRIC_FIELDS}


def _serialize_row(r, scope: str) -> dict[str, Any]:
    d = {
        "id": r.id,
        "category_id": r.category_id,
        "period_date": r.period_date.isoformat(),
        **{f: (float(getattr(r, f)) if not isinstance(getattr(r, f), (list, dict, int, type(None))) else getattr(r, f)) for f in _METRIC_FIELDS},
    }
    if scope == "district":
        d["district_id"] = r.district_id
    else:
        d["neighborhood_id"] = r.neighborhood_id
    return d


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


# ============================== CSV (district & neighborhood metrics) ==============================

def _json_field_to_csv(value: Any) -> str:
    if value is None or value == [] or value == {}:
        return ""
    return json.dumps(value, ensure_ascii=False)


def _json_field_from_csv(value: str, default: Any = None) -> Any:
    if value in (None, "", "[]", "{}"):
        return default if default is not None else []
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        raise HTTPException(400, f"JSON parse edilemedi: {value[:60]}...")


def _row_to_csv_dict(r, scope: str) -> dict[str, Any]:
    json_fields = {
        "cancel_reasons", "return_reasons", "hourly_heatmap",
        "platform_negative_distribution", "rating_distribution", "negative_word_cloud",
        "courier_comparison",
    }
    out = {
        "category_id": r.category_id if r.category_id is not None else "",
        "period_date": r.period_date.isoformat(),
    }
    if scope == "district":
        out["district_id"] = r.district_id
    else:
        out["neighborhood_id"] = r.neighborhood_id
    for f in _METRIC_FIELDS:
        v = getattr(r, f)
        if f in json_fields:
            out[f] = _json_field_to_csv(v)
        elif v is None:
            out[f] = ""
        elif isinstance(v, (int, float)):
            out[f] = float(v) if isinstance(v, float) else int(v) if f.endswith("_total") else float(v)
        else:
            out[f] = v
    return out


@router.get("/district/csv", response_class=Response)
async def export_district_metrics_csv(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(DistrictMetrics).order_by(DistrictMetrics.period_date, DistrictMetrics.id))
    ).scalars().all()
    csv_text = rows_to_csv((_row_to_csv_dict(r, "district") for r in rows), DISTRICT_METRICS_COLUMNS)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="district_metrics.csv"'},
    )


@router.get("/neighborhood/csv", response_class=Response)
async def export_neighborhood_metrics_csv(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(NeighborhoodMetrics).order_by(NeighborhoodMetrics.period_date, NeighborhoodMetrics.id))
    ).scalars().all()
    csv_text = rows_to_csv((_row_to_csv_dict(r, "neighborhood") for r in rows), NEIGHBORHOOD_METRICS_COLUMNS)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="neighborhood_metrics.csv"'},
    )


def _parse_int(v: str, name: str, row_no: int, allow_none: bool = False) -> int | None:
    if v in (None, "", "None"):
        if allow_none:
            return None
        raise HTTPException(400, f"satır {row_no}: {name} zorunlu")
    try:
        return int(v)
    except ValueError:
        raise HTTPException(400, f"satır {row_no}: {name} sayı olmalı")


def _parse_float(v: str, default: float = 0.0) -> float:
    if v in (None, ""):
        return default
    try:
        return float(v)
    except ValueError:
        return default


def _parse_date(v: str, row_no: int) -> date:
    if not v:
        raise HTTPException(400, f"satır {row_no}: period_date zorunlu")
    try:
        return date.fromisoformat(v.strip())
    except ValueError:
        raise HTTPException(400, f"satır {row_no}: period_date YYYY-MM-DD formatında olmalı")


def _record_to_values(row: dict, idx: int) -> dict[str, Any]:
    return {
        "cancel_rate": _parse_float(row.get("cancel_rate", "")),
        "return_rate": _parse_float(row.get("return_rate", "")),
        "cancel_reasons": _json_field_from_csv(row.get("cancel_reasons", ""), []),
        "return_reasons": _json_field_from_csv(row.get("return_reasons", ""), []),
        "area_performance_score": _parse_float(row.get("area_performance_score", "")),
        "area_rating": _parse_float(row.get("area_rating", "")),
        "highest_rating": _parse_float(row.get("highest_rating", "")),
        "lowest_rating": _parse_float(row.get("lowest_rating", "")),
        "avg_basket": _parse_float(row.get("avg_basket", "")),
        "avg_menu_price": _parse_float(row.get("avg_menu_price", "")),
        "avg_monthly_revenue": _parse_float(row.get("avg_monthly_revenue", "")),
        "courier_fee": _parse_float(row.get("courier_fee", "")),
        "hourly_heatmap": _json_field_from_csv(row.get("hourly_heatmap", ""), []),
        "negative_comment_total": _parse_int(row.get("negative_comment_total", "0") or "0", "negative_comment_total", idx) or 0,
        "negative_comment_rate": _parse_float(row.get("negative_comment_rate", "")),
        "negative_avg_rating": _parse_float(row.get("negative_avg_rating", "")),
        "platform_negative_distribution": _json_field_from_csv(row.get("platform_negative_distribution", ""), []),
        "rating_distribution": _json_field_from_csv(row.get("rating_distribution", ""), []),
        "negative_word_cloud": _json_field_from_csv(row.get("negative_word_cloud", ""), []),
        "courier_comparison": _json_field_from_csv(row.get("courier_comparison", ""), {}),
    }


@router.post("/district/csv")
async def import_district_metrics_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records, warnings = await parse_csv_upload(file, DISTRICT_METRICS_COLUMNS)
    created = updated = skipped = 0
    errors: list[str] = []
    for idx, row in enumerate(records, start=2):
        try:
            did = (row.get("district_id") or "").strip()
            if not did:
                raise HTTPException(400, f"satır {idx}: district_id zorunlu")
            category_id = _parse_int(row.get("category_id", ""), "category_id", idx, allow_none=True)
            period = _parse_date(row.get("period_date", ""), idx)
            await _validate_refs(db, district_id=did, category_id=category_id)

            existing = (
                await db.execute(
                    select(DistrictMetrics).where(
                        DistrictMetrics.district_id == did,
                        DistrictMetrics.category_id.is_(None) if category_id is None
                        else DistrictMetrics.category_id == category_id,
                        DistrictMetrics.period_date == period,
                    )
                )
            ).scalar_one_or_none()

            values = _record_to_values(row, idx)
            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                db.add(DistrictMetrics(district_id=did, category_id=category_id, period_date=period, **values))
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


@router.post("/neighborhood/csv")
async def import_neighborhood_metrics_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records, warnings = await parse_csv_upload(file, NEIGHBORHOOD_METRICS_COLUMNS)
    created = updated = skipped = 0
    errors: list[str] = []
    for idx, row in enumerate(records, start=2):
        try:
            nid = _parse_int(row.get("neighborhood_id", ""), "neighborhood_id", idx) or 0
            category_id = _parse_int(row.get("category_id", ""), "category_id", idx, allow_none=True)
            period = _parse_date(row.get("period_date", ""), idx)
            await _validate_refs(db, neighborhood_id=nid, category_id=category_id)

            existing = (
                await db.execute(
                    select(NeighborhoodMetrics).where(
                        NeighborhoodMetrics.neighborhood_id == nid,
                        NeighborhoodMetrics.category_id.is_(None) if category_id is None
                        else NeighborhoodMetrics.category_id == category_id,
                        NeighborhoodMetrics.period_date == period,
                    )
                )
            ).scalar_one_or_none()

            values = _record_to_values(row, idx)
            if existing:
                for k, v in values.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                db.add(NeighborhoodMetrics(neighborhood_id=nid, category_id=category_id, period_date=period, **values))
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


# ============================== Site Settings ==============================

_LOYALTY_FIELDS = (
    "loyalty_active_firms", "loyalty_churn_reduction", "loyalty_avg_roi", "loyalty_payback_period",
    "loyalty_stats_active_firms_label", "loyalty_stats_churn_label", "loyalty_stats_roi_label", "loyalty_stats_payback_label",
    "loyalty_hero_bg_url", "loyalty_hero_badge", "loyalty_hero_title", "loyalty_hero_title_accent",
    "loyalty_hero_subtitle", "loyalty_hero_cta_text",
    "loyalty_features_title", "loyalty_features_subtitle",
)


@router.get("/site-settings")
async def get_site_settings_admin(db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    if not row:
        return {f: "" for f in _LOYALTY_FIELDS} | {"loyalty_feature_cards": []}
    out = {f: (getattr(row, f, "") or "") for f in _LOYALTY_FIELDS}
    out["loyalty_feature_cards"] = list(row.loyalty_feature_cards or [])
    return out


@router.post("/site-settings")
async def upsert_site_settings(payload: SiteSettingsUpsert, db: AsyncSession = Depends(get_db)):
    row = (await db.execute(select(SiteSettings).where(SiteSettings.id == 1))).scalar_one_or_none()
    if row:
        for k, v in payload.model_dump().items():
            setattr(row, k, v)
    else:
        db.add(SiteSettings(id=1, **payload.model_dump()))
    await db.commit()
    return {"ok": True}
