"""Birleşik Veri Girişi endpoint'leri — ilçe/mahalle CSV import + 'Veriyi getir' + 'Veriyi kaydet'.

Public sayfanın 3 kapsamı ile uyumlu:
  - district + category=NULL → Genel İlçe
  - district + category=X    → İlçe-Kategori
  - neighborhood + category=X → Mahalle-Kategori

CSV formatı (her satır 1 platform için analytics + ortak metrics):
  scope, district_id, neighborhood, category, period_date, platform, customers,
  ad_budget, campaign_rate, coupon_rate, flash_rate, joker_rate,
  daily_forecast, monthly_forecast, yearly_forecast,
  cancel_rate, return_rate, cancel_reasons_json, return_reasons_json,
  area_performance_score, area_rating, highest_rating, lowest_rating,
  avg_basket, avg_menu_price, avg_monthly_revenue, courier_fee,
  hourly_heatmap_json, negative_comment_total, negative_comment_rate, negative_avg_rating,
  platform_negative_distribution_json, rating_distribution_json,
  negative_word_cloud_json, courier_comparison_json

Aynı (district/neighborhood, category, period_date) için metric alanları tek bir
satırda gerekli; platform-bağımlı alanlar her satırda. Metric grubunun ilk dolu
satırı kullanılır; sonraki satırlar sadece analytics için işlenir.
"""
from __future__ import annotations

import io
import json
from datetime import date
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import select, text
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


router = APIRouter(prefix="/data-entry", tags=["Admin · Data Entry"])


# -------- Yardımcılar --------

def _parse_json(value: Any, default: Any) -> Any:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    if isinstance(value, (list, dict)):
        return value
    s = str(value).strip()
    if not s:
        return default
    try:
        return json.loads(s)
    except Exception:
        return default


def _num(value: Any, default: float = 0.0) -> float:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    try:
        return float(value)
    except Exception:
        return default


def _int(value: Any, default: int = 0) -> int:
    return int(_num(value, default))


def _str(value: Any) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return str(value).strip()


def _parse_date(value: Any) -> date | None:
    s = _str(value)
    if not s:
        return None
    try:
        return date.fromisoformat(s[:10])
    except Exception:
        return None


# -------- CSV Import --------

@router.post("/csv/import")
async def import_data_csv(
    scope: str = Query(..., pattern="^(district|neighborhood)$"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Birleşik CSV importu. scope=district veya scope=neighborhood.

    Dönüş:
      {
        "scope": "district",
        "rows_total": N,
        "metrics_upserted": M,
        "analytics_upserted": A,
        "skipped": [{"row": int, "reason": str}, ...]
      }
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV dosyası bekleniyor")

    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content), dtype=str, keep_default_na=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV okunamadı: {e}")

    # Lookup tabloları
    cat_rows = (await db.execute(select(Category.id, Category.name))).all()
    cat_by_name = {row[1].strip().lower(): row[0] for row in cat_rows}

    plat_rows = (await db.execute(select(Platform.id, Platform.name))).all()
    plat_by_name = {row[1].strip().lower(): row[0] for row in plat_rows}

    district_rows = (await db.execute(select(District.id))).all()
    district_ids = {row[0] for row in district_rows}

    # Mahalle: district+name → id
    neigh_rows = (await db.execute(select(Neighborhood.id, Neighborhood.district_id, Neighborhood.name))).all()
    neigh_by_district_name: dict[tuple[str, str], int] = {
        (r[1], r[2].strip().lower()): r[0] for r in neigh_rows
    }

    skipped: list[dict] = []
    # Metric grup için key → ilk dolu satırın verisi
    # key: (district_id, neighborhood_id_or_None, category_id_or_None, period_date)
    metric_done: set[tuple] = set()
    metrics_upserted = 0
    analytics_upserted = 0

    METRIC_FIELDS = [
        "cancel_rate", "return_rate",
        "cancel_reasons_json", "return_reasons_json",
        "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
        "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
        "hourly_heatmap_json",
        "negative_comment_total", "negative_comment_rate", "negative_avg_rating",
        "platform_negative_distribution_json", "rating_distribution_json",
        "negative_word_cloud_json", "courier_comparison_json",
    ]

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # CSV satır numarası (header=1)
        # Scope kontrol
        row_scope = _str(row.get("scope", scope)).lower() or scope
        if row_scope != scope:
            skipped.append({"row": row_num, "reason": f"scope uyumsuz: {row_scope} != {scope}"})
            continue

        # Ortak alanlar
        district_id = _str(row.get("district_id"))
        if not district_id or district_id not in district_ids:
            skipped.append({"row": row_num, "reason": f"district_id geçersiz: {district_id}"})
            continue

        cat_name = _str(row.get("category"))
        category_id: int | None = None
        if cat_name:
            category_id = cat_by_name.get(cat_name.lower())
            if category_id is None:
                skipped.append({"row": row_num, "reason": f"kategori bulunamadı: {cat_name}"})
                continue

        period_date = _parse_date(row.get("period_date"))
        if period_date is None:
            skipped.append({"row": row_num, "reason": "period_date geçersiz"})
            continue

        neighborhood_id: int | None = None
        if scope == "neighborhood":
            neigh_name = _str(row.get("neighborhood"))
            if not neigh_name:
                skipped.append({"row": row_num, "reason": "mahalle adı boş"})
                continue
            neighborhood_id = neigh_by_district_name.get((district_id, neigh_name.lower()))
            if neighborhood_id is None:
                skipped.append({"row": row_num, "reason": f"{district_id} ilçesinde '{neigh_name}' mahallesi yok"})
                continue

        # === Metric upsert (grup başına bir kez) ===
        metric_key = (district_id, neighborhood_id, category_id, period_date)
        if metric_key not in metric_done:
            metric_done.add(metric_key)
            # Bu grubun ilk satırı: metric alanlarını al
            metric_payload = {
                "cancel_rate": _num(row.get("cancel_rate")),
                "return_rate": _num(row.get("return_rate")),
                "cancel_reasons": _parse_json(row.get("cancel_reasons_json"), []),
                "return_reasons": _parse_json(row.get("return_reasons_json"), []),
                "area_performance_score": _num(row.get("area_performance_score")),
                "area_rating": _num(row.get("area_rating")),
                "highest_rating": _num(row.get("highest_rating")),
                "lowest_rating": _num(row.get("lowest_rating")),
                "avg_basket": _num(row.get("avg_basket")),
                "avg_menu_price": _num(row.get("avg_menu_price")),
                "avg_monthly_revenue": _num(row.get("avg_monthly_revenue")),
                "courier_fee": _num(row.get("courier_fee")),
                "hourly_heatmap": _parse_json(row.get("hourly_heatmap_json"), []),
                "negative_comment_total": _int(row.get("negative_comment_total")),
                "negative_comment_rate": _num(row.get("negative_comment_rate")),
                "negative_avg_rating": _num(row.get("negative_avg_rating")),
                "platform_negative_distribution": _parse_json(row.get("platform_negative_distribution_json"), []),
                "rating_distribution": _parse_json(row.get("rating_distribution_json"), []),
                "negative_word_cloud": _parse_json(row.get("negative_word_cloud_json"), []),
                "courier_comparison": _parse_json(row.get("courier_comparison_json"), {}),
            }
            # Var olan satırı bul (district/neigh + category + period unique)
            if scope == "district":
                existing = (await db.execute(
                    select(DistrictMetrics).where(
                        DistrictMetrics.district_id == district_id,
                        DistrictMetrics.category_id == category_id,
                        DistrictMetrics.period_date == period_date,
                    )
                )).scalar_one_or_none()
                if existing is None:
                    obj = DistrictMetrics(
                        district_id=district_id,
                        category_id=category_id,
                        period_date=period_date,
                        **metric_payload,
                    )
                    db.add(obj)
                else:
                    for k, v in metric_payload.items():
                        setattr(existing, k, v)
            else:
                existing = (await db.execute(
                    select(NeighborhoodMetrics).where(
                        NeighborhoodMetrics.neighborhood_id == neighborhood_id,
                        NeighborhoodMetrics.category_id == category_id,
                        NeighborhoodMetrics.period_date == period_date,
                    )
                )).scalar_one_or_none()
                if existing is None:
                    obj = NeighborhoodMetrics(
                        neighborhood_id=neighborhood_id,
                        category_id=category_id,
                        period_date=period_date,
                        **metric_payload,
                    )
                    db.add(obj)
                else:
                    for k, v in metric_payload.items():
                        setattr(existing, k, v)
            metrics_upserted += 1

        # === Analytics upsert ===
        plat_name = _str(row.get("platform"))
        if not plat_name:
            # Platform yok → sadece metric vardı, atla
            continue
        platform_id = plat_by_name.get(plat_name.lower())
        if platform_id is None:
            skipped.append({"row": row_num, "reason": f"platform bulunamadı: {plat_name}"})
            continue

        analytics_payload = {
            "customers": _int(row.get("customers")),
            "ad_budget": _num(row.get("ad_budget")),
            "campaign_rate": _num(row.get("campaign_rate")),
            "coupon_rate": _num(row.get("coupon_rate")),
            "flash_rate": _num(row.get("flash_rate")),
            "joker_rate": _num(row.get("joker_rate")),
            "daily_forecast": _num(row.get("daily_forecast")),
            "monthly_forecast": _num(row.get("monthly_forecast")),
            "yearly_forecast": _num(row.get("yearly_forecast")),
        }

        if scope == "district":
            existing = (await db.execute(
                select(DistrictAnalytics).where(
                    DistrictAnalytics.district_id == district_id,
                    DistrictAnalytics.category_id == category_id,
                    DistrictAnalytics.platform_id == platform_id,
                    DistrictAnalytics.period_date == period_date,
                )
            )).scalar_one_or_none()
            if existing is None:
                db.add(DistrictAnalytics(
                    district_id=district_id,
                    category_id=category_id,
                    platform_id=platform_id,
                    period_date=period_date,
                    **analytics_payload,
                ))
            else:
                for k, v in analytics_payload.items():
                    setattr(existing, k, v)
        else:
            existing = (await db.execute(
                select(NeighborhoodAnalytics).where(
                    NeighborhoodAnalytics.neighborhood_id == neighborhood_id,
                    NeighborhoodAnalytics.category_id == category_id,
                    NeighborhoodAnalytics.platform_id == platform_id,
                    NeighborhoodAnalytics.period_date == period_date,
                )
            )).scalar_one_or_none()
            if existing is None:
                db.add(NeighborhoodAnalytics(
                    neighborhood_id=neighborhood_id,
                    category_id=category_id,
                    platform_id=platform_id,
                    period_date=period_date,
                    **analytics_payload,
                ))
            else:
                for k, v in analytics_payload.items():
                    setattr(existing, k, v)
        analytics_upserted += 1

    await db.commit()
    return {
        "scope": scope,
        "rows_total": int(len(df)),
        "metrics_upserted": metrics_upserted,
        "analytics_upserted": analytics_upserted,
        "skipped": skipped,
    }


# -------- Veriyi getir (manuel form için tek satır) --------

@router.get("/fetch")
async def fetch_scope_data(
    scope: str = Query(..., pattern="^(district|neighborhood)$"),
    district_id: str = Query(...),
    neighborhood_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Belirli kapsam için (en son periyodun) metric + analytics verilerini döner.
    Manuel form 'Veriyi getir' butonu için.
    """
    if scope == "district":
        m_stmt = select(DistrictMetrics).where(DistrictMetrics.district_id == district_id)
        if category_id is None:
            m_stmt = m_stmt.where(DistrictMetrics.category_id == None)  # noqa: E711
        else:
            m_stmt = m_stmt.where(DistrictMetrics.category_id == category_id)
        m_stmt = m_stmt.order_by(DistrictMetrics.period_date.desc())
        metrics = (await db.execute(m_stmt)).scalars().first()

        a_stmt = select(DistrictAnalytics).where(DistrictAnalytics.district_id == district_id)
        if category_id is None:
            a_stmt = a_stmt.where(DistrictAnalytics.category_id == None)  # noqa: E711
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
            m_stmt = m_stmt.where(NeighborhoodMetrics.category_id == None)  # noqa: E711
        else:
            m_stmt = m_stmt.where(NeighborhoodMetrics.category_id == category_id)
        m_stmt = m_stmt.order_by(NeighborhoodMetrics.period_date.desc())
        metrics = (await db.execute(m_stmt)).scalars().first()

        a_stmt = select(NeighborhoodAnalytics).where(NeighborhoodAnalytics.neighborhood_id == neighborhood_id)
        if category_id is None:
            a_stmt = a_stmt.where(NeighborhoodAnalytics.category_id == None)  # noqa: E711
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


# -------- Veriyi kaydet (manuel form gönderiyor) --------

@router.post("/save")
async def save_scope_data(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """Manuel formun 'Veriyi kaydet' butonu için.
    Payload örneği:
      {
        "scope": "district" | "neighborhood",
        "district_id": "34-fatih",
        "neighborhood_id": 429,        # mahalle scope ise
        "category_id": null | int,
        "period_date": "2026-05-01",
        "metrics": { ... },            # _metrics_to_dict() yapısı
        "analytics": [
          { "platform_id": 1, "customers": ..., "ad_budget": ..., ... },
          ...
        ]
      }
    """
    scope = payload.get("scope")
    if scope not in ("district", "neighborhood"):
        raise HTTPException(status_code=400, detail="scope district|neighborhood olmalı")

    district_id = payload.get("district_id")
    if not district_id:
        raise HTTPException(status_code=400, detail="district_id gerekli")

    category_id = payload.get("category_id")  # None veya int
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

        # Analytics
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

    else:  # neighborhood
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
