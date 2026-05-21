"""CSV import/export yardımcıları. pandas kullanır.

Mayıs 2026 itibarıyla tüm CSV'ler **flat** — hiçbir hücrede JSON/dict/list yok,
her sütun saf skaler. JSON sütunlar (cancel_reasons, hourly_heatmap, vb.)
prefix'li çoklu sütunlara açılır.

Sütun ve slot şeması: app/services/metric_schemas.py
"""
from __future__ import annotations

import io
from typing import Any, Iterable

import pandas as pd
from fastapi import HTTPException, UploadFile

from app.services.metric_schemas import (
    PLATFORM_KEYS,
    DAY_KEYS, HOUR_KEYS,
    CANCEL_REASON_SCHEMA, RETURN_REASON_SCHEMA,
    RATING_STARS,
    WORD_SLOTS, CASE_STUDY_SLOTS, FEATURE_CARD_SLOTS,
    ANALYTICS_FIELDS, SCALAR_METRIC_FIELDS,
    COURIER_OBJECTS, COURIER_FIELDS,
)


# ============================================================================
# Kolon liste üreticileri
# ============================================================================
def analytics_columns() -> list[str]:
    """3 platform × 9 analytics alanı = 27 sütun."""
    cols: list[str] = []
    for plat in PLATFORM_KEYS:
        for f in ANALYTICS_FIELDS:
            cols.append(f"{f}_{plat}")
    return cols


def cancel_columns() -> list[str]:
    return [f"cancel_pct_{r['key']}" for r in CANCEL_REASON_SCHEMA]


def return_columns() -> list[str]:
    return [f"return_pct_{r['key']}" for r in RETURN_REASON_SCHEMA]


def rating_columns() -> list[str]:
    cols: list[str] = []
    for s in RATING_STARS:
        cols.append(f"rating_{s}_pct")
        cols.append(f"rating_{s}_count")
    return cols


def courier_columns() -> list[str]:
    cols: list[str] = []
    for prefix, _obj in COURIER_OBJECTS:
        for f in COURIER_FIELDS:
            cols.append(f"{prefix}_{f}")
    return cols


def neg_platform_columns() -> list[str]:
    return [f"neg_pct_{p}" for p in PLATFORM_KEYS]


def word_columns() -> list[str]:
    cols: list[str] = []
    for i in range(1, WORD_SLOTS + 1):
        cols.append(f"word_{i}_text")
        cols.append(f"word_{i}_weight")
    return cols


def heatmap_columns() -> list[str]:
    return [f"heat_{d}_{h}" for d in DAY_KEYS for h in HOUR_KEYS]


# ============================================================================
# Tam CSV sütun listeleri
# ============================================================================
RESTAURANT_COLUMNS: list[str] = [
    "id", "name", "district_id", "neighborhood_id", "category_id", "is_active",
    *(f"{p}_customers" for p in PLATFORM_KEYS),
]

DATA_ENTRY_DISTRICT_COLUMNS: list[str] = [
    "district_id", "category", "period_start", "period_end",
    *analytics_columns(),
    *SCALAR_METRIC_FIELDS,
    *cancel_columns(),
    *return_columns(),
    *rating_columns(),
    *courier_columns(),
    *neg_platform_columns(),
    *word_columns(),
    *heatmap_columns(),
]

DATA_ENTRY_NEIGHBORHOOD_COLUMNS: list[str] = [
    "district_id", "neighborhood", "category", "period_start", "period_end",
    *analytics_columns(),
    *SCALAR_METRIC_FIELDS,
    *cancel_columns(),
    *return_columns(),
    *rating_columns(),
    *courier_columns(),
    *neg_platform_columns(),
    *word_columns(),
    *heatmap_columns(),
]

CASE_STUDY_COLUMNS: list[str] = [
    "id", "title", "district_id", "category_id", "sort_order", "is_active",
    "before_daily_order", "before_avg_basket",
    *(f"before_complaint_{i}" for i in range(1, CASE_STUDY_SLOTS + 1)),
    "after_daily_order", "after_avg_basket",
    *(f"after_improvement_{i}" for i in range(1, CASE_STUDY_SLOTS + 1)),
]

LOYALTY_COLUMNS: list[str] = [
    "loyalty_active_firms", "loyalty_stats_active_firms_label",
    "loyalty_churn_reduction", "loyalty_stats_churn_label",
    "loyalty_avg_roi", "loyalty_stats_roi_label",
    "loyalty_payback_period", "loyalty_stats_payback_label",
    "loyalty_hero_badge", "loyalty_hero_title",
    "loyalty_hero_title_accent", "loyalty_hero_subtitle",
    "loyalty_hero_cta_text",
    "loyalty_features_title", "loyalty_features_subtitle",
    *(col for i in range(1, FEATURE_CARD_SLOTS + 1) for col in (f"card_{i}_title", f"card_{i}_text")),
]

# Mevcut analytics + competitor + application CSV'leri — değişmedi
DISTRICT_ANALYTICS_COLUMNS = [
    "district_id", "category_id", "platform_id", "period_date",
    "customers", "ad_budget", "campaign_rate", "coupon_rate", "flash_rate", "joker_rate",
    "daily_forecast", "monthly_forecast", "yearly_forecast",
]

NEIGHBORHOOD_ANALYTICS_COLUMNS = [
    "neighborhood_id", "category_id", "platform_id", "period_date",
    "customers", "ad_budget", "campaign_rate", "coupon_rate", "flash_rate", "joker_rate",
    "daily_forecast", "monthly_forecast", "yearly_forecast",
]

COMPETITOR_COLUMNS = [
    "district_id", "category_id", "platform_id", "period_date",
    "min_basket", "avg_rating", "monthly_revenue", "delivery_type",
    "discount_rate", "coupon_rate",
]

APPLICATION_COLUMNS = [
    "id", "first_name", "last_name", "email", "phone",
    "city", "district", "vehicle", "message", "status", "created_at",
]


# ============================================================================
# Skaler dönüştürme yardımcıları
# ============================================================================
def to_float(v: Any, default: float = 0.0) -> float:
    """Boş/None → default; aksi takdirde float'a çevir."""
    if v is None or v == "":
        return default
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def to_int(v: Any, default: int = 0) -> int:
    if v is None or v == "":
        return default
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def to_bool(v: Any, default: bool = True) -> bool:
    if v is None or v == "":
        return default
    s = str(v).strip().lower()
    return s in ("true", "1", "yes", "evet")


def fmt_scalar(v: Any) -> Any:
    """Export için: None → boş string, sayı/string olduğu gibi."""
    return "" if v is None else v


# ============================================================================
# Flatten — DB modelinden flat CSV row dict
# ============================================================================
def flatten_cancel_reasons(reasons: list | None) -> dict[str, float]:
    """Backend list of {label, percent, color} → {cancel_pct_<key>: percent}.

    Eşleme: schema label ile eşle (case-insensitive). Bulunamayan label
    'diger' slot'una düşer.
    """
    out: dict[str, float] = {f"cancel_pct_{r['key']}": 0.0 for r in CANCEL_REASON_SCHEMA}
    if not isinstance(reasons, list):
        return out
    label_to_key = {r["label"].lower(): r["key"] for r in CANCEL_REASON_SCHEMA}
    for item in reasons:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "")).lower()
        key = label_to_key.get(label, "diger")
        out[f"cancel_pct_{key}"] = to_float(item.get("percent"))
    return out


def unflatten_cancel_reasons(row: dict[str, Any]) -> list[dict]:
    """Flat row → list of {label, percent, color}."""
    out: list[dict] = []
    for r in CANCEL_REASON_SCHEMA:
        pct = to_float(row.get(f"cancel_pct_{r['key']}"))
        if pct > 0:
            out.append({"label": r["label"], "percent": pct, "color": r["color"]})
    return out


def flatten_return_reasons(reasons: list | None) -> dict[str, float]:
    out: dict[str, float] = {f"return_pct_{r['key']}": 0.0 for r in RETURN_REASON_SCHEMA}
    if not isinstance(reasons, list):
        return out
    label_to_key = {r["label"].lower(): r["key"] for r in RETURN_REASON_SCHEMA}
    for item in reasons:
        if not isinstance(item, dict):
            continue
        label = str(item.get("label", "")).lower()
        key = label_to_key.get(label)
        if key:
            out[f"return_pct_{key}"] = to_float(item.get("percent"))
    return out


def unflatten_return_reasons(row: dict[str, Any]) -> list[dict]:
    out: list[dict] = []
    for r in RETURN_REASON_SCHEMA:
        pct = to_float(row.get(f"return_pct_{r['key']}"))
        if pct > 0:
            out.append({"label": r["label"], "percent": pct, "color": r["color"]})
    return out


def flatten_rating_distribution(dist: list | None) -> dict[str, float | int]:
    out: dict[str, float | int] = {}
    for s in RATING_STARS:
        out[f"rating_{s}_pct"] = 0.0
        out[f"rating_{s}_count"] = 0
    if not isinstance(dist, list):
        return out
    for item in dist:
        if not isinstance(item, dict):
            continue
        stars = to_int(item.get("stars"))
        if stars in RATING_STARS:
            out[f"rating_{stars}_pct"] = to_float(item.get("percent"))
            out[f"rating_{stars}_count"] = to_int(item.get("count"))
    return out


def unflatten_rating_distribution(row: dict[str, Any]) -> list[dict]:
    out: list[dict] = []
    for s in RATING_STARS:
        pct = to_float(row.get(f"rating_{s}_pct"))
        count = to_int(row.get(f"rating_{s}_count"))
        if pct > 0 or count > 0:
            out.append({"stars": s, "percent": pct, "count": count})
    return out


def flatten_courier_comparison(comp: dict | None) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for prefix, obj_key in COURIER_OBJECTS:
        obj = (comp or {}).get(obj_key) or {} if isinstance(comp, dict) else {}
        for f in COURIER_FIELDS:
            v = obj.get(f) if isinstance(obj, dict) else None
            if f == "churn_label":
                out[f"{prefix}_{f}"] = str(v) if v is not None else ""
            else:
                out[f"{prefix}_{f}"] = to_float(v)
    return out


def unflatten_courier_comparison(row: dict[str, Any]) -> dict:
    out: dict = {}
    for prefix, obj_key in COURIER_OBJECTS:
        obj: dict = {}
        for f in COURIER_FIELDS:
            v = row.get(f"{prefix}_{f}")
            obj[f] = str(v).strip() if f == "churn_label" else to_float(v)
        out[obj_key] = obj
    return out


def flatten_platform_negative(dist: list | None, platform_id_to_key: dict[int, str]) -> dict[str, float]:
    """[{platform_id, percent}] → {neg_pct_<key>: percent}.

    platform_id_to_key: DB'deki platforms tablosundaki id → PLATFORM_KEYS eşlemesi.
    """
    out: dict[str, float] = {f"neg_pct_{p}": 0.0 for p in PLATFORM_KEYS}
    if not isinstance(dist, list):
        return out
    for item in dist:
        if not isinstance(item, dict):
            continue
        pid = to_int(item.get("platform_id"))
        key = platform_id_to_key.get(pid)
        if key:
            out[f"neg_pct_{key}"] = to_float(item.get("percent"))
    return out


def unflatten_platform_negative(row: dict[str, Any], platform_key_to_id: dict[str, int]) -> list[dict]:
    out: list[dict] = []
    for p in PLATFORM_KEYS:
        pct = to_float(row.get(f"neg_pct_{p}"))
        pid = platform_key_to_id.get(p)
        if pct > 0 and pid is not None:
            out.append({"platform_id": pid, "percent": pct})
    return out


def flatten_word_cloud(words: list | None) -> dict[str, Any]:
    out: dict[str, Any] = {}
    items = words if isinstance(words, list) else []
    for i in range(1, WORD_SLOTS + 1):
        if i <= len(items) and isinstance(items[i - 1], dict):
            it = items[i - 1]
            out[f"word_{i}_text"] = str(it.get("text") or "")
            out[f"word_{i}_weight"] = to_int(it.get("weight"))
        else:
            out[f"word_{i}_text"] = ""
            out[f"word_{i}_weight"] = 0
    return out


def unflatten_word_cloud(row: dict[str, Any]) -> list[dict]:
    out: list[dict] = []
    for i in range(1, WORD_SLOTS + 1):
        text = str(row.get(f"word_{i}_text") or "").strip()
        if text:
            out.append({"text": text, "weight": to_int(row.get(f"word_{i}_weight"))})
    return out


def flatten_heatmap(matrix: list | None) -> dict[str, int]:
    out: dict[str, int] = {}
    is_matrix = (
        isinstance(matrix, list) and len(matrix) == 7
        and all(isinstance(row, list) and len(row) == 24 for row in matrix)
    )
    for d_idx, day in enumerate(DAY_KEYS):
        for h_idx, hour in enumerate(HOUR_KEYS):
            v = matrix[d_idx][h_idx] if is_matrix else 0
            out[f"heat_{day}_{hour}"] = to_int(v)
    return out


def unflatten_heatmap(row: dict[str, Any]) -> list[list[int]]:
    matrix: list[list[int]] = []
    for day in DAY_KEYS:
        row_vals: list[int] = []
        for hour in HOUR_KEYS:
            row_vals.append(to_int(row.get(f"heat_{day}_{hour}")))
        matrix.append(row_vals)
    return matrix


# ============================================================================
# Üst seviye metrics flatten/unflatten
# ============================================================================
def flatten_metrics_model(
    model: Any,
    platform_id_to_key: dict[int, str],
) -> dict[str, Any]:
    """DistrictMetrics / NeighborhoodMetrics / RestaurantMetrics → flat dict.

    Skaler metric alanları + tüm flatten'lar.
    """
    out: dict[str, Any] = {}

    # Skaler alanlar
    for f in SCALAR_METRIC_FIELDS:
        out[f] = getattr(model, f, 0)

    # Nested → flat
    out.update(flatten_cancel_reasons(getattr(model, "cancel_reasons", None)))
    out.update(flatten_return_reasons(getattr(model, "return_reasons", None)))
    out.update(flatten_rating_distribution(getattr(model, "rating_distribution", None)))
    out.update(flatten_courier_comparison(getattr(model, "courier_comparison", None)))
    out.update(flatten_platform_negative(
        getattr(model, "platform_negative_distribution", None),
        platform_id_to_key,
    ))
    out.update(flatten_word_cloud(getattr(model, "negative_word_cloud", None)))
    out.update(flatten_heatmap(getattr(model, "hourly_heatmap", None)))

    return out


def unflatten_metrics_row(
    row: dict[str, Any],
    platform_key_to_id: dict[str, int],
) -> dict[str, Any]:
    """Flat CSV row → DB payload dict.

    DB model alanlarıyla aynı adlandırma: cancel_rate, cancel_reasons (list), …
    """
    payload: dict[str, Any] = {}

    # Skaler — int / float ayrımı
    int_fields = {"negative_comment_total"}
    for f in SCALAR_METRIC_FIELDS:
        payload[f] = to_int(row.get(f)) if f in int_fields else to_float(row.get(f))

    payload["cancel_reasons"] = unflatten_cancel_reasons(row)
    payload["return_reasons"] = unflatten_return_reasons(row)
    payload["rating_distribution"] = unflatten_rating_distribution(row)
    payload["courier_comparison"] = unflatten_courier_comparison(row)
    payload["platform_negative_distribution"] = unflatten_platform_negative(row, platform_key_to_id)
    payload["negative_word_cloud"] = unflatten_word_cloud(row)
    payload["hourly_heatmap"] = unflatten_heatmap(row)

    return payload


# ============================================================================
# Restaurant platforms — flatten/unflatten
# ============================================================================
def flatten_restaurant_platforms(
    platform_links: list,
    platform_id_to_key: dict[int, str],
) -> dict[str, int]:
    """Restaurant.platforms (list of RestaurantPlatform) → {<key>_customers: int}."""
    out = {f"{p}_customers": 0 for p in PLATFORM_KEYS}
    for link in platform_links or []:
        key = platform_id_to_key.get(getattr(link, "platform_id", None))
        if key:
            out[f"{key}_customers"] = to_int(getattr(link, "customers", 0))
    return out


def unflatten_restaurant_platforms(
    row: dict[str, Any],
    platform_key_to_id: dict[str, int],
) -> list[dict]:
    """Flat row → list of {platform_id, customers}. Sadece >0 customers'lar dahil."""
    out: list[dict] = []
    for p in PLATFORM_KEYS:
        customers = to_int(row.get(f"{p}_customers"))
        pid = platform_key_to_id.get(p)
        if pid is not None and customers > 0:
            out.append({"platform_id": pid, "customers": customers})
    return out


# ============================================================================
# CSV I/O
# ============================================================================
def rows_to_csv(rows: Iterable[dict], columns: list[str]) -> str:
    df = pd.DataFrame(list(rows), columns=columns)
    return df.to_csv(index=False)


async def parse_csv_upload(
    file: UploadFile,
    expected_columns: list[str],
) -> tuple[list[dict], list[str]]:
    """Tolerant CSV parser.

    - Eksik sütun: tüm satırlar için boş ("") kabul edilir, warning eklenir.
    - Boş satır (tüm hücreler boş): atlanır, warning eklenir.
    - Geri döner: (records, warnings). Çağıran row-level hatalarını ekler.
    """
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="CSV dosyası boş")
    try:
        df = pd.read_csv(io.BytesIO(raw), dtype=str, keep_default_na=False)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV okunamadı: {exc}")

    warnings: list[str] = []

    missing = [c for c in expected_columns if c not in df.columns]
    if missing:
        warnings.append(
            f"Eksik sütunlar boş kabul edildi: {', '.join(missing[:5])}"
            + (f" (+{len(missing) - 5} sütun daha)" if len(missing) > 5 else "")
        )
        for col in missing:
            df[col] = ""

    records: list[dict] = []
    for idx, raw_row in enumerate(df.to_dict(orient="records"), start=2):
        row = {k: ("" if v is None else str(v).strip()) for k, v in raw_row.items()}
        if not any(row.get(c, "") for c in expected_columns):
            warnings.append(f"satır {idx}: tamamen boş, atlandı")
            continue
        records.append(row)

    return records, warnings


# ============================================================================
# Geriye dönük import isim uyumu (eski kodun çalışmaya devam etmesi için)
# ============================================================================
# Geçiş süresinde diğer router'lar bu sabitleri import ediyorsa kırılmasın.
# Birebir aynı ad/şekil değil, sadece DISTRICT_METRICS_COLUMNS/NEIGHBORHOOD_METRICS_COLUMNS
# eski adlandırması — yeni şemada DATA_ENTRY_*_COLUMNS olarak adlanıyor.
DISTRICT_METRICS_COLUMNS = DATA_ENTRY_DISTRICT_COLUMNS
NEIGHBORHOOD_METRICS_COLUMNS = DATA_ENTRY_NEIGHBORHOOD_COLUMNS
