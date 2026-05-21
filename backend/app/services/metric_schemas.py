"""Flat CSV şeması için sabit etiketler ve slot ayarları.

Bu dosya, CSV<->JSON dönüşümünün tek doğruluk kaynağıdır. Frontend ve
scripts/build_example_csvs.py aynı listeleri kullanmalı.
"""
from __future__ import annotations

# ============================================================================
# Platformlar (sabit 3 — CSV sütun adlarında bu sırayla geçer)
# ============================================================================
PLATFORM_KEYS: tuple[str, ...] = ("yemeksepeti", "trendyol", "getir")

# Platform isimlerinin display adı + arama eşleme (case-insensitive)
PLATFORM_DISPLAY: dict[str, str] = {
    "yemeksepeti": "Yemeksepeti",
    "trendyol": "Trendyol",
    "getir": "Getir",
}

# ============================================================================
# Heatmap (7×24)
# ============================================================================
DAY_KEYS: tuple[str, ...] = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
HOUR_KEYS: tuple[str, ...] = tuple(f"{h:02d}" for h in range(24))

# ============================================================================
# Cancel sebepleri — sabit 5 etiket (label+color frontend ile aynı olmalı)
# ============================================================================
CANCEL_REASON_SCHEMA: list[dict] = [
    {"key": "uzun_bekleme",     "label": "Uzun bekleme",       "color": "#EE4444"},
    {"key": "yanlis_urun",      "label": "Yanlış ürün",        "color": "#A65EEA"},
    {"key": "lezzet",           "label": "Lezzet sorunu",      "color": "#F59E0B"},
    {"key": "urun_stokta_yok",  "label": "Ürün stokta yok",    "color": "#10B981"},
    {"key": "diger",            "label": "Diğer",              "color": "#6B7280"},
]

# ============================================================================
# Return sebepleri — sabit 4 etiket
# ============================================================================
RETURN_REASON_SCHEMA: list[dict] = [
    {"key": "eksik_malzeme",    "label": "Eksik malzeme",      "color": "#EE4444"},
    {"key": "soguk_geldi",      "label": "Soğuk geldi",        "color": "#A65EEA"},
    {"key": "yanlis_siparis",   "label": "Yanlış sipariş",     "color": "#F59E0B"},
    {"key": "ambalaj",          "label": "Ambalaj sorunu",     "color": "#10B981"},
]

# ============================================================================
# Rating dağılımı — 5 yıldız sabit (5, 4, 3, 2, 1 sırasıyla)
# ============================================================================
RATING_STARS: tuple[int, ...] = (5, 4, 3, 2, 1)

# ============================================================================
# Slot sayıları
# ============================================================================
WORD_SLOTS: int = 10
CASE_STUDY_SLOTS: int = 5
FEATURE_CARD_SLOTS: int = 6

# ============================================================================
# Analytics alanları (her platform için)
# ============================================================================
ANALYTICS_FIELDS: tuple[str, ...] = (
    "customers", "ad_budget",
    "campaign_rate", "coupon_rate", "flash_rate", "joker_rate",
    "daily_forecast", "monthly_forecast", "yearly_forecast",
)

# ============================================================================
# Skaler metric alanları (DB sütun adlarıyla birebir)
# ============================================================================
SCALAR_METRIC_FIELDS: tuple[str, ...] = (
    "cancel_rate", "return_rate",
    "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
    "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
    "negative_comment_total", "negative_comment_rate", "negative_avg_rating",
)

# ============================================================================
# Kurye karşılaştırma — 2 obje × 4 alan
# ============================================================================
COURIER_OBJECTS: tuple[tuple[str, str], ...] = (
    ("rc", "restaurant_courier"),
    ("oc", "own_courier"),
)
COURIER_FIELDS: tuple[str, ...] = ("fee", "avg_cost", "monthly_revenue", "churn_label")
