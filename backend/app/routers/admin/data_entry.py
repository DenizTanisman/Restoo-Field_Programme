"""Birleşik Veri Girişi endpoint'leri — ilçe/mahalle için tek dosyalı flat CSV.

Mayıs 2026 itibarıyla:
  - Her satır TEK scope+category+period birleşimini temsil eder
  - Analytics (3 platform için 9 alan = 27 sütun) ve Metrics (235 sütun)
    AYNI satırda
  - Hücreler saf skaler — JSON/dict/list yok

Şema kaynağı: app/services/csv_service.py
"""
from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Category,
    District,
    DistrictAnalytics,
    DistrictMetrics,
    Neighborhood,
    NeighborhoodAnalytics,
    NeighborhoodMetrics,
    Platform,
)
from app.services.csv_service import (
    DATA_ENTRY_DISTRICT_COLUMNS,
    DATA_ENTRY_NEIGHBORHOOD_COLUMNS,
    parse_csv_upload,
    rows_to_csv,
    flatten_metrics_model,
    unflatten_metrics_row,
    to_float, to_int,
)
from app.services.metric_schemas import (
    PLATFORM_KEYS, PLATFORM_DISPLAY, ANALYTICS_FIELDS,
)


router = APIRouter(prefix="/data-entry", tags=["Admin · Data Entry"])


# ============================================================================
# Yardımcılar
# ============================================================================
def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except Exception:
        return None


async def _platform_maps(db: AsyncSession) -> tuple[dict[int, str], dict[str, int]]:
    """DB'deki platforms tablosundan PLATFORM_KEYS ile ID eşlemeleri kur.

    Eşleme stratejisi: platform.name içinde anahtarın geçip geçmediğine bakar
    (case-insensitive). 'Uber Eats Trendyol Go' → 'trendyol' anahtarı.
    """
    rows = (await db.execute(select(Platform.id, Platform.name))).all()
    id_to_key: dict[int, str] = {}
    key_to_id: dict[str, int] = {}
    for pid, name in rows:
        lower = (name or "").lower()
        for key in PLATFORM_KEYS:
            if key in lower:
                id_to_key[pid] = key
                key_to_id.setdefault(key, pid)
                break
    return id_to_key, key_to_id


# ============================================================================
# CSV Import — district/neighborhood
# ============================================================================
@router.post("/csv/import")
async def import_data_csv(
    scope: str = Query(..., pattern="^(district|neighborhood)$"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Flat CSV importu. scope=district veya scope=neighborhood.

    Her satır: 1 scope+category+period birleşimi → 1 metric upsert +
    3 platform için analytics upsert.
    """
    columns = DATA_ENTRY_DISTRICT_COLUMNS if scope == "district" else DATA_ENTRY_NEIGHBORHOOD_COLUMNS
    records, warnings = await parse_csv_upload(file, columns)

    # Lookup tabloları
    cat_rows = (await db.execute(select(Category.id, Category.name))).all()
    cat_by_id: dict[int, str] = {row[0]: row[1] for row in cat_rows}
    cat_by_name: dict[str, int] = {(row[1] or "").strip().lower(): row[0] for row in cat_rows}

    district_ids: set[str] = {
        row[0] for row in (await db.execute(select(District.id))).all()
    }

    neigh_by_district_name: dict[tuple[str, str], int] = {}
    if scope == "neighborhood":
        for nid, dist_id, name in (
            await db.execute(select(Neighborhood.id, Neighborhood.district_id, Neighborhood.name))
        ).all():
            neigh_by_district_name[(dist_id, (name or "").strip().lower())] = nid

    platform_id_to_key, platform_key_to_id = await _platform_maps(db)

    skipped: list[dict] = []
    metrics_upserted = 0
    analytics_upserted = 0

    for idx, row in enumerate(records, start=2):
        # --- Scope keys ---
        district_id = (row.get("district_id") or "").strip()
        if not district_id or district_id not in district_ids:
            skipped.append({"row": idx, "reason": f"district_id geçersiz: {district_id}"})
            continue

        # category — id veya isim
        cat_raw = (row.get("category") or "").strip()
        category_id: int | None = None
        if cat_raw:
            try:
                cid = int(cat_raw)
                if cid in cat_by_id:
                    category_id = cid
                else:
                    skipped.append({"row": idx, "reason": f"category_id bulunamadı: {cid}"})
                    continue
            except ValueError:
                category_id = cat_by_name.get(cat_raw.lower())
                if category_id is None:
                    skipped.append({"row": idx, "reason": f"kategori bulunamadı: {cat_raw}"})
                    continue

        period_date = _parse_date(row.get("period_start"))
        if period_date is None:
            skipped.append({"row": idx, "reason": "period_start geçersiz/boş"})
            continue

        neighborhood_id: int | None = None
        if scope == "neighborhood":
            neigh_name = (row.get("neighborhood") or "").strip()
            if not neigh_name:
                skipped.append({"row": idx, "reason": "neighborhood boş"})
                continue
            neighborhood_id = neigh_by_district_name.get((district_id, neigh_name.lower()))
            if neighborhood_id is None:
                skipped.append({"row": idx, "reason": f"{district_id} ilçesinde '{neigh_name}' mahallesi yok"})
                continue

        # --- Metric upsert ---
        metric_payload = unflatten_metrics_row(row, platform_key_to_id)

        if scope == "district":
            existing_m = (await db.execute(
                select(DistrictMetrics).where(
                    DistrictMetrics.district_id == district_id,
                    DistrictMetrics.category_id == category_id,
                    DistrictMetrics.period_date == period_date,
                )
            )).scalar_one_or_none()
            if existing_m is None:
                db.add(DistrictMetrics(
                    district_id=district_id,
                    category_id=category_id,
                    period_date=period_date,
                    **metric_payload,
                ))
            else:
                for k, v in metric_payload.items():
                    setattr(existing_m, k, v)
        else:
            existing_m = (await db.execute(
                select(NeighborhoodMetrics).where(
                    NeighborhoodMetrics.neighborhood_id == neighborhood_id,
                    NeighborhoodMetrics.category_id == category_id,
                    NeighborhoodMetrics.period_date == period_date,
                )
            )).scalar_one_or_none()
            if existing_m is None:
                db.add(NeighborhoodMetrics(
                    neighborhood_id=neighborhood_id,
                    category_id=category_id,
                    period_date=period_date,
                    **metric_payload,
                ))
            else:
                for k, v in metric_payload.items():
                    setattr(existing_m, k, v)
        metrics_upserted += 1

        # --- Analytics upsert (her platform için) ---
        for plat_key in PLATFORM_KEYS:
            pid = platform_key_to_id.get(plat_key)
            if pid is None:
                continue
            analytics_payload = {
                f: (to_int(row.get(f"{f}_{plat_key}")) if f == "customers"
                    else to_float(row.get(f"{f}_{plat_key}")))
                for f in ANALYTICS_FIELDS
            }
            # Bu platformun tüm alanları 0 ise satır oluşturma (gürültüsüz)
            if not any(analytics_payload.values()):
                continue

            if scope == "district":
                existing_a = (await db.execute(
                    select(DistrictAnalytics).where(
                        DistrictAnalytics.district_id == district_id,
                        DistrictAnalytics.category_id == category_id,
                        DistrictAnalytics.platform_id == pid,
                        DistrictAnalytics.period_date == period_date,
                    )
                )).scalar_one_or_none()
                if existing_a is None:
                    db.add(DistrictAnalytics(
                        district_id=district_id,
                        category_id=category_id,
                        platform_id=pid,
                        period_date=period_date,
                        **analytics_payload,
                    ))
                else:
                    for k, v in analytics_payload.items():
                        setattr(existing_a, k, v)
            else:
                existing_a = (await db.execute(
                    select(NeighborhoodAnalytics).where(
                        NeighborhoodAnalytics.neighborhood_id == neighborhood_id,
                        NeighborhoodAnalytics.category_id == category_id,
                        NeighborhoodAnalytics.platform_id == pid,
                        NeighborhoodAnalytics.period_date == period_date,
                    )
                )).scalar_one_or_none()
                if existing_a is None:
                    db.add(NeighborhoodAnalytics(
                        neighborhood_id=neighborhood_id,
                        category_id=category_id,
                        platform_id=pid,
                        period_date=period_date,
                        **analytics_payload,
                    ))
                else:
                    for k, v in analytics_payload.items():
                        setattr(existing_a, k, v)
            analytics_upserted += 1

    await db.commit()
    return {
        "scope": scope,
        "rows_total": len(records),
        "metrics_upserted": metrics_upserted,
        "analytics_upserted": analytics_upserted,
        "warnings": warnings,
        "skipped": skipped,
    }


# ============================================================================
# CSV Export
# ============================================================================
@router.get("/csv/export", response_class=Response)
async def export_data_csv(
    scope: str = Query(..., pattern="^(district|neighborhood)$"),
    district_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Mevcut veriyi flat CSV olarak dışa aktar. district_id verilirse o ilçeye filtre."""
    platform_id_to_key, _ = await _platform_maps(db)

    cat_rows = (await db.execute(select(Category.id, Category.name))).all()
    cat_id_to_name: dict[int, str] = {row[0]: row[1] for row in cat_rows}

    csv_rows: list[dict] = []

    if scope == "district":
        columns = DATA_ENTRY_DISTRICT_COLUMNS
        m_stmt = select(DistrictMetrics)
        if district_id:
            m_stmt = m_stmt.where(DistrictMetrics.district_id == district_id)
        m_stmt = m_stmt.order_by(DistrictMetrics.district_id, DistrictMetrics.period_date)
        metrics_rows = (await db.execute(m_stmt)).scalars().all()

        for m in metrics_rows:
            base_row = {
                "district_id": m.district_id,
                "category": cat_id_to_name.get(m.category_id, "") if m.category_id else "",
                "period_start": m.period_date.isoformat() if m.period_date else "",
                "period_end": "",
            }
            # Metrics flatten
            base_row.update(flatten_metrics_model(m, platform_id_to_key))
            # Analytics flatten — aynı scope+category+period için
            a_stmt = select(DistrictAnalytics).where(
                DistrictAnalytics.district_id == m.district_id,
                DistrictAnalytics.category_id == m.category_id,
                DistrictAnalytics.period_date == m.period_date,
            )
            for a in (await db.execute(a_stmt)).scalars().all():
                key = platform_id_to_key.get(a.platform_id)
                if key is None:
                    continue
                for f in ANALYTICS_FIELDS:
                    base_row[f"{f}_{key}"] = getattr(a, f, 0)
            csv_rows.append(base_row)
        filename = "data_entry_district.csv"
    else:
        columns = DATA_ENTRY_NEIGHBORHOOD_COLUMNS
        m_stmt = select(NeighborhoodMetrics, Neighborhood).join(
            Neighborhood, Neighborhood.id == NeighborhoodMetrics.neighborhood_id
        )
        if district_id:
            m_stmt = m_stmt.where(Neighborhood.district_id == district_id)
        m_stmt = m_stmt.order_by(Neighborhood.district_id, Neighborhood.name, NeighborhoodMetrics.period_date)

        for m, nb in (await db.execute(m_stmt)).all():
            base_row = {
                "district_id": nb.district_id,
                "neighborhood": nb.name,
                "category": cat_id_to_name.get(m.category_id, "") if m.category_id else "",
                "period_start": m.period_date.isoformat() if m.period_date else "",
                "period_end": "",
            }
            base_row.update(flatten_metrics_model(m, platform_id_to_key))
            a_stmt = select(NeighborhoodAnalytics).where(
                NeighborhoodAnalytics.neighborhood_id == m.neighborhood_id,
                NeighborhoodAnalytics.category_id == m.category_id,
                NeighborhoodAnalytics.period_date == m.period_date,
            )
            for a in (await db.execute(a_stmt)).scalars().all():
                key = platform_id_to_key.get(a.platform_id)
                if key is None:
                    continue
                for f in ANALYTICS_FIELDS:
                    base_row[f"{f}_{key}"] = getattr(a, f, 0)
            csv_rows.append(base_row)
        filename = "data_entry_neighborhood.csv"

    csv_text = rows_to_csv(csv_rows, columns)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ============================================================================
# Manuel form için: veriyi getir + kaydet (admin DataEntryPage)
# ============================================================================
@router.get("/fetch")
async def fetch_scope_data(
    scope: str = Query(..., pattern="^(district|neighborhood)$"),
    district_id: str = Query(...),
    neighborhood_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Form için: belirli kapsamın en son periyodunu döner."""
    if scope == "district":
        m_stmt = select(DistrictMetrics).where(DistrictMetrics.district_id == district_id)
        if category_id is None:
            m_stmt = m_stmt.where(DistrictMetrics.category_id.is_(None))
        else:
            m_stmt = m_stmt.where(DistrictMetrics.category_id == category_id)
        m_stmt = m_stmt.order_by(DistrictMetrics.period_date.desc())
        metrics = (await db.execute(m_stmt)).scalars().first()

        a_stmt = select(DistrictAnalytics).where(DistrictAnalytics.district_id == district_id)
        if category_id is None:
            a_stmt = a_stmt.where(DistrictAnalytics.category_id.is_(None))
        else:
            a_stmt = a_stmt.where(DistrictAnalytics.category_id == category_id)
        if metrics is not None:
            a_stmt = a_stmt.where(DistrictAnalytics.period_date == metrics.period_date)
        analytics = (await db.execute(a_stmt)).scalars().all()
    else:
        if neighborhood_id is None:
            raise HTTPException(status_code=400, detail="neighborhood_id gerekli")
        m_stmt = select(NeighborhoodMetrics).where(NeighborhoodMetrics.neighborhood_id == neighborhood_id)
        if category_id is None:
            m_stmt = m_stmt.where(NeighborhoodMetrics.category_id.is_(None))
        else:
            m_stmt = m_stmt.where(NeighborhoodMetrics.category_id == category_id)
        m_stmt = m_stmt.order_by(NeighborhoodMetrics.period_date.desc())
        metrics = (await db.execute(m_stmt)).scalars().first()

        a_stmt = select(NeighborhoodAnalytics).where(NeighborhoodAnalytics.neighborhood_id == neighborhood_id)
        if category_id is None:
            a_stmt = a_stmt.where(NeighborhoodAnalytics.category_id.is_(None))
        else:
            a_stmt = a_stmt.where(NeighborhoodAnalytics.category_id == category_id)
        if metrics is not None:
            a_stmt = a_stmt.where(NeighborhoodAnalytics.period_date == metrics.period_date)
        analytics = (await db.execute(a_stmt)).scalars().all()

    return {
        "period_date": metrics.period_date.isoformat() if metrics else None,
        "metrics": None if metrics is None else _metrics_to_dict(metrics),
        "analytics": [_analytics_to_dict(a) for a in analytics],
    }


def _metrics_to_dict(m) -> dict:
    return {
        "cancel_rate": float(m.cancel_rate or 0),
        "return_rate": float(m.return_rate or 0),
        "cancel_reasons": list(m.cancel_reasons or []),
        "return_reasons": list(m.return_reasons or []),
        "area_performance_score": float(m.area_performance_score or 0),
        "area_rating": float(m.area_rating or 0),
        "highest_rating": float(m.highest_rating or 0),
        "lowest_rating": float(m.lowest_rating or 0),
        "avg_basket": float(m.avg_basket or 0),
        "avg_menu_price": float(m.avg_menu_price or 0),
        "avg_monthly_revenue": float(m.avg_monthly_revenue or 0),
        "courier_fee": float(m.courier_fee or 0),
        "hourly_heatmap": list(m.hourly_heatmap or []),
        "negative_comment_total": int(m.negative_comment_total or 0),
        "negative_comment_rate": float(m.negative_comment_rate or 0),
        "negative_avg_rating": float(m.negative_avg_rating or 0),
        "platform_negative_distribution": list(m.platform_negative_distribution or []),
        "rating_distribution": list(m.rating_distribution or []),
        "negative_word_cloud": list(m.negative_word_cloud or []),
        "courier_comparison": dict(m.courier_comparison or {}),
    }


def _analytics_to_dict(a) -> dict:
    return {
        "platform_id": a.platform_id,
        "customers": int(a.customers or 0),
        "ad_budget": float(a.ad_budget or 0),
        "campaign_rate": float(a.campaign_rate or 0),
        "coupon_rate": float(a.coupon_rate or 0),
        "flash_rate": float(a.flash_rate or 0),
        "joker_rate": float(a.joker_rate or 0),
        "daily_forecast": float(a.daily_forecast or 0),
        "monthly_forecast": float(a.monthly_forecast or 0),
        "yearly_forecast": float(a.yearly_forecast or 0),
    }


@router.post("/save")
async def save_scope_data(payload: dict, db: AsyncSession = Depends(get_db)):
    """Manuel formun 'Veriyi kaydet' butonu için (değişmedi)."""
    scope = payload.get("scope")
    if scope not in ("district", "neighborhood"):
        raise HTTPException(status_code=400, detail="scope district|neighborhood olmalı")

    district_id = payload.get("district_id")
    if not district_id:
        raise HTTPException(status_code=400, detail="district_id gerekli")

    category_id = payload.get("category_id")
    period_date_str = payload.get("period_date") or ""
    period_date = _parse_date(period_date_str)
    if period_date is None:
        raise HTTPException(status_code=400, detail="period_date geçersiz")

    metrics_data = payload.get("metrics") or {}
    analytics_list = payload.get("analytics") or []

    if scope == "district":
        existing = (await db.execute(
            select(DistrictMetrics).where(
                DistrictMetrics.district_id == district_id,
                DistrictMetrics.category_id == category_id,
                DistrictMetrics.period_date == period_date,
            )
        )).scalar_one_or_none()
        if existing is None:
            db.add(DistrictMetrics(
                district_id=district_id,
                category_id=category_id,
                period_date=period_date,
                **metrics_data,
            ))
        else:
            for k, v in metrics_data.items():
                setattr(existing, k, v)

        for a in analytics_list:
            pid = a.get("platform_id")
            if not pid:
                continue
            row = (await db.execute(
                select(DistrictAnalytics).where(
                    DistrictAnalytics.district_id == district_id,
                    DistrictAnalytics.category_id == category_id,
                    DistrictAnalytics.platform_id == pid,
                    DistrictAnalytics.period_date == period_date,
                )
            )).scalar_one_or_none()
            data = {k: a.get(k, 0) for k in (
                "customers", "ad_budget", "campaign_rate", "coupon_rate",
                "flash_rate", "joker_rate", "daily_forecast", "monthly_forecast", "yearly_forecast"
            )}
            if row is None:
                db.add(DistrictAnalytics(
                    district_id=district_id,
                    category_id=category_id,
                    platform_id=pid,
                    period_date=period_date,
                    **data,
                ))
            else:
                for k, v in data.items():
                    setattr(row, k, v)
    else:
        neighborhood_id = payload.get("neighborhood_id")
        if not neighborhood_id:
            raise HTTPException(status_code=400, detail="neighborhood_id gerekli")

        existing = (await db.execute(
            select(NeighborhoodMetrics).where(
                NeighborhoodMetrics.neighborhood_id == neighborhood_id,
                NeighborhoodMetrics.category_id == category_id,
                NeighborhoodMetrics.period_date == period_date,
            )
        )).scalar_one_or_none()
        if existing is None:
            db.add(NeighborhoodMetrics(
                neighborhood_id=neighborhood_id,
                category_id=category_id,
                period_date=period_date,
                **metrics_data,
            ))
        else:
            for k, v in metrics_data.items():
                setattr(existing, k, v)

        for a in analytics_list:
            pid = a.get("platform_id")
            if not pid:
                continue
            row = (await db.execute(
                select(NeighborhoodAnalytics).where(
                    NeighborhoodAnalytics.neighborhood_id == neighborhood_id,
                    NeighborhoodAnalytics.category_id == category_id,
                    NeighborhoodAnalytics.platform_id == pid,
                    NeighborhoodAnalytics.period_date == period_date,
                )
            )).scalar_one_or_none()
            data = {k: a.get(k, 0) for k in (
                "customers", "ad_budget", "campaign_rate", "coupon_rate",
                "flash_rate", "joker_rate", "daily_forecast", "monthly_forecast", "yearly_forecast"
            )}
            if row is None:
                db.add(NeighborhoodAnalytics(
                    neighborhood_id=neighborhood_id,
                    category_id=category_id,
                    platform_id=pid,
                    period_date=period_date,
                    **data,
                ))
            else:
                for k, v in data.items():
                    setattr(row, k, v)

    await db.commit()
    return {"ok": True}
