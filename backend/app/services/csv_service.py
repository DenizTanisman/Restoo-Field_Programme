"""CSV import/export yardımcıları. pandas kullanır."""
from __future__ import annotations

import io
from typing import Iterable

import pandas as pd
from fastapi import HTTPException, UploadFile


# === Kolon kontratları ===
# Bu sabitler hem import hem export'ta kolon sırasını/isimlerini belirler.
# Kullanıcı export indirir, düzenler, geri yükler -> upsert by natural key.

RESTAURANT_COLUMNS = [
    "name",
    "district_id",
    "category_id",
    "is_active",
    "platforms",  # JSON-encoded "[{\"platform_id\":1,\"customers\":120}]" veya boş
]

DISTRICT_ANALYTICS_COLUMNS = [
    "district_id",
    "category_id",        # boş = NULL (tüm kategoriler)
    "platform_id",
    "period_date",        # YYYY-MM-DD
    "customers",
    "ad_budget",
    "campaign_rate",
    "coupon_rate",
    "flash_rate",
    "joker_rate",
    "daily_forecast",
    "monthly_forecast",
    "yearly_forecast",
]

NEIGHBORHOOD_ANALYTICS_COLUMNS = [
    "neighborhood_id",
    "category_id",
    "platform_id",
    "period_date",
    "customers",
    "ad_budget",
    "campaign_rate",
    "coupon_rate",
    "flash_rate",
    "joker_rate",
    "daily_forecast",
    "monthly_forecast",
    "yearly_forecast",
]

COMPETITOR_COLUMNS = [
    "district_id",
    "category_id",
    "platform_id",
    "period_date",
    "min_basket",
    "avg_rating",
    "monthly_revenue",
    "delivery_type",
    "discount_rate",
    "coupon_rate",
]

APPLICATION_COLUMNS = [
    "id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "city",
    "district",
    "vehicle",
    "message",
    "status",
    "created_at",
]

CASE_STUDY_COLUMNS = [
    "id",
    "title",
    "district_id",
    "category_id",
    "sort_order",
    "is_active",
    "before_image_url",
    "before_daily_order",
    "before_avg_basket",
    "before_complaints",      # | ile ayrılmış
    "after_image_url",
    "after_daily_order",
    "after_avg_basket",
    "after_improvements",
    "created_at",
]

# DistrictMetrics / NeighborhoodMetrics — JSON kolonları string olarak export edilir
_METRICS_BASE_COLUMNS = [
    "category_id",
    "period_date",
    "cancel_rate",
    "return_rate",
    "cancel_reasons",                    # JSON: [{"label","percent","color"}]
    "return_reasons",                    # JSON
    "area_performance_score",
    "area_rating",
    "highest_rating",
    "lowest_rating",
    "avg_basket",
    "avg_menu_price",
    "avg_monthly_revenue",
    "courier_fee",
    "hourly_heatmap",                    # JSON: number[7][24]
    "negative_comment_total",
    "negative_comment_rate",
    "negative_avg_rating",
    "platform_negative_distribution",    # JSON: [{"platform_id","percent"}]
    "rating_distribution",               # JSON: [{"stars","percent","count"}]
    "negative_word_cloud",               # JSON: [{"text","weight"}]
    "courier_comparison",                # JSON: {"restaurant_courier":{...}, "own_courier":{...}}
]

DISTRICT_METRICS_COLUMNS = ["district_id", *_METRICS_BASE_COLUMNS]
NEIGHBORHOOD_METRICS_COLUMNS = ["neighborhood_id", *_METRICS_BASE_COLUMNS]


def rows_to_csv(rows: Iterable[dict], columns: list[str]) -> str:
    df = pd.DataFrame(list(rows), columns=columns)
    return df.to_csv(index=False)


async def parse_csv_upload(file: UploadFile, required_columns: list[str]) -> list[dict]:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="CSV dosyası boş")
    try:
        df = pd.read_csv(io.BytesIO(raw), dtype=str, keep_default_na=False)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"CSV okunamadı: {exc}")

    missing = [c for c in required_columns if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Eksik sütun: {', '.join(missing)}. Beklenen: {', '.join(required_columns)}",
        )

    return df.to_dict(orient="records")
