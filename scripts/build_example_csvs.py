"""5 örnek CSV'yi examples/ klasörüne üretir.

Yeni flat şema (Mayıs 2026): hiçbir hücrede JSON yok, her sütun saf skaler.

Kullanım:
    python scripts/build_example_csvs.py
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT / "examples"
EXAMPLES.mkdir(exist_ok=True)

# ============================================================================
# SABİT ŞEMALAR (backend ile aynı olmalı — backend/app/services/metric_schemas.py)
# ============================================================================
PLATFORMS = ("yemeksepeti", "trendyol", "getir")
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
HOURS = tuple(f"{h:02d}" for h in range(24))

ANALYTICS_FIELDS = (
    "customers", "ad_budget",
    "campaign_rate", "coupon_rate", "flash_rate", "joker_rate",
    "daily_forecast", "monthly_forecast", "yearly_forecast",
)

CANCEL_REASON_KEYS = (
    "uzun_bekleme", "yanlis_urun", "lezzet", "urun_stokta_yok", "diger",
)
RETURN_REASON_KEYS = (
    "eksik_malzeme", "soguk_geldi", "yanlis_siparis", "ambalaj",
)
RATING_STARS = (5, 4, 3, 2, 1)
WORD_SLOTS = 10
FEATURE_CARD_SLOTS = 6
CASE_STUDY_SLOTS = 5

# ============================================================================
# Heatmap örnek matrisi — DataEntryPage.jsx eski örneğinden
# ============================================================================
EXAMPLE_HEATMAP = [
    # mon
    [5, 5, 4, 5, 5, 4, 5, 8, 15, 19, 28, 63, 77, 65, 44, 36, 36, 44, 83, 96, 86, 42, 25, 9],
    # tue
    [5, 4, 5, 4, 5, 4, 5, 9, 16, 21, 26, 54, 73, 67, 54, 35, 37, 43, 81, 91, 69, 54, 23, 9],
    # wed
    [5, 4, 5, 4, 5, 5, 4, 9, 13, 17, 32, 65, 80, 64, 50, 38, 31, 50, 80, 73, 82, 53, 22, 10],
    # thu
    [5, 4, 5, 4, 4, 5, 5, 10, 13, 19, 27, 62, 88, 61, 53, 34, 39, 53, 81, 90, 70, 51, 27, 9],
    # fri
    [5, 5, 5, 5, 5, 5, 5, 9, 16, 18, 28, 59, 83, 72, 42, 34, 33, 52, 84, 78, 73, 52, 26, 9],
    # sat
    [6, 6, 6, 6, 5, 5, 5, 13, 18, 23, 31, 73, 100, 82, 56, 52, 40, 60, 81, 100, 85, 52, 27, 13],
    # sun
    [5, 5, 6, 6, 5, 6, 6, 10, 19, 21, 33, 71, 100, 93, 54, 45, 37, 63, 82, 99, 79, 62, 33, 11],
]


# ============================================================================
# Yardımcı sütun listeleri
# ============================================================================
def analytics_columns() -> list[str]:
    cols = []
    for plat in PLATFORMS:
        for f in ANALYTICS_FIELDS:
            cols.append(f"{f}_{plat}")
    return cols


def cancel_columns() -> list[str]:
    return [f"cancel_pct_{k}" for k in CANCEL_REASON_KEYS]


def return_columns() -> list[str]:
    return [f"return_pct_{k}" for k in RETURN_REASON_KEYS]


def rating_columns() -> list[str]:
    cols = []
    for s in RATING_STARS:
        cols.append(f"rating_{s}_pct")
        cols.append(f"rating_{s}_count")
    return cols


def courier_columns() -> list[str]:
    return [
        "rc_fee", "rc_avg_cost", "rc_monthly_revenue", "rc_churn_label",
        "oc_fee", "oc_avg_cost", "oc_monthly_revenue", "oc_churn_label",
    ]


def neg_platform_columns() -> list[str]:
    return [f"neg_pct_{p}" for p in PLATFORMS]


def word_columns() -> list[str]:
    cols = []
    for i in range(1, WORD_SLOTS + 1):
        cols.append(f"word_{i}_text")
        cols.append(f"word_{i}_weight")
    return cols


def heatmap_columns() -> list[str]:
    return [f"heat_{d}_{h}" for d in DAYS for h in HOURS]


SKALAR_METRIC_COLUMNS = [
    "cancel_rate", "return_rate",
    "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
    "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
    "negative_comment_total", "negative_comment_rate", "negative_avg_rating",
]


# ============================================================================
# Tam sütun listeleri (her CSV için)
# ============================================================================
def restaurants_columns() -> list[str]:
    return [
        "id", "name", "district_id", "neighborhood_id", "category_id", "is_active",
        *(f"{p}_customers" for p in PLATFORMS),
    ]


def data_entry_district_columns() -> list[str]:
    return [
        "district_id", "category", "period_start", "period_end",
        *analytics_columns(),
        *SKALAR_METRIC_COLUMNS,
        *cancel_columns(),
        *return_columns(),
        *rating_columns(),
        *courier_columns(),
        *neg_platform_columns(),
        *word_columns(),
        *heatmap_columns(),
    ]


def data_entry_neighborhood_columns() -> list[str]:
    return [
        "district_id", "neighborhood", "category", "period_start", "period_end",
        *analytics_columns(),
        *SKALAR_METRIC_COLUMNS,
        *cancel_columns(),
        *return_columns(),
        *rating_columns(),
        *courier_columns(),
        *neg_platform_columns(),
        *word_columns(),
        *heatmap_columns(),
    ]


def case_studies_columns() -> list[str]:
    cols = [
        "id", "title", "district_id", "category_id", "sort_order", "is_active",
        "before_daily_order", "before_avg_basket",
    ]
    cols += [f"before_complaint_{i}" for i in range(1, CASE_STUDY_SLOTS + 1)]
    cols += ["after_daily_order", "after_avg_basket"]
    cols += [f"after_improvement_{i}" for i in range(1, CASE_STUDY_SLOTS + 1)]
    return cols


def loyalty_columns() -> list[str]:
    cols = [
        # Stats
        "loyalty_active_firms", "loyalty_stats_active_firms_label",
        "loyalty_churn_reduction", "loyalty_stats_churn_label",
        "loyalty_avg_roi", "loyalty_stats_roi_label",
        "loyalty_payback_period", "loyalty_stats_payback_label",
        # Hero (bg_url hariç)
        "loyalty_hero_badge", "loyalty_hero_title",
        "loyalty_hero_title_accent", "loyalty_hero_subtitle",
        "loyalty_hero_cta_text",
        # Features section
        "loyalty_features_title", "loyalty_features_subtitle",
    ]
    # 6 feature card slot — image_url hariç
    for i in range(1, FEATURE_CARD_SLOTS + 1):
        cols.append(f"card_{i}_title")
        cols.append(f"card_{i}_text")
    return cols


# ============================================================================
# Örnek satır verileri
# ============================================================================
def fatih_data_entry_row(neighborhood: str | None = None) -> dict:
    row = {
        "district_id": "34-fatih",
        "category": "",
        "period_start": "2026-05-01",
        "period_end": "",  # boş = otomatik +1 ay
        # Analytics — Yemeksepeti
        "customers_yemeksepeti": 2273, "ad_budget_yemeksepeti": 43157,
        "campaign_rate_yemeksepeti": 30.0, "coupon_rate_yemeksepeti": 36.1,
        "flash_rate_yemeksepeti": 29.4, "joker_rate_yemeksepeti": 47.8,
        "daily_forecast_yemeksepeti": 11747, "monthly_forecast_yemeksepeti": 357884,
        "yearly_forecast_yemeksepeti": 7507349,
        # Trendyol
        "customers_trendyol": 1820, "ad_budget_trendyol": 38000,
        "campaign_rate_trendyol": 28.0, "coupon_rate_trendyol": 32.0,
        "flash_rate_trendyol": 25.0, "joker_rate_trendyol": 40.0,
        "daily_forecast_trendyol": 9500, "monthly_forecast_trendyol": 290000,
        "yearly_forecast_trendyol": 6100000,
        # Getir
        "customers_getir": 1450, "ad_budget_getir": 28000,
        "campaign_rate_getir": 25.0, "coupon_rate_getir": 30.0,
        "flash_rate_getir": 22.0, "joker_rate_getir": 35.0,
        "daily_forecast_getir": 7200, "monthly_forecast_getir": 218000,
        "yearly_forecast_getir": 4500000,
        # Skaler
        "cancel_rate": 17.7, "return_rate": 11.7,
        "area_performance_score": 86.2, "area_rating": 4.03,
        "highest_rating": 4.59, "lowest_rating": 3.73,
        "avg_basket": 130, "avg_menu_price": 226,
        "avg_monthly_revenue": 496232, "courier_fee": 22,
        "negative_comment_total": 2206, "negative_comment_rate": 22.9,
        "negative_avg_rating": 2.42,
        # Cancel sebepleri
        "cancel_pct_uzun_bekleme": 4.5, "cancel_pct_yanlis_urun": 3.2,
        "cancel_pct_lezzet": 2.1, "cancel_pct_urun_stokta_yok": 1.5,
        "cancel_pct_diger": 0.8,
        # Return sebepleri
        "return_pct_eksik_malzeme": 2.5, "return_pct_soguk_geldi": 12.8,
        "return_pct_yanlis_siparis": 1.2, "return_pct_ambalaj": 3.5,
        # Rating dağılımı
        "rating_5_pct": 16.8, "rating_5_count": 1034,
        "rating_4_pct": 42.3, "rating_4_count": 2600,
        "rating_3_pct": 22.0, "rating_3_count": 1352,
        "rating_2_pct": 12.0, "rating_2_count": 737,
        "rating_1_pct": 6.9, "rating_1_count": 424,
        # Kurye karşılaştırması
        "rc_fee": 22, "rc_avg_cost": 34.79, "rc_monthly_revenue": 5114,
        "rc_churn_label": "YÜKSEK",
        "oc_fee": 0, "oc_avg_cost": 33.27, "oc_monthly_revenue": 1060128,
        "oc_churn_label": "DÜŞÜK",
        # Platform olumsuz yorum
        "neg_pct_yemeksepeti": 31.9, "neg_pct_trendyol": 28.5,
        "neg_pct_getir": 39.6,
    }

    # Word cloud — 5 slot dolu, 5 boş
    words = [("Geç", 15), ("Soğuk", 12), ("Az", 9), ("Tuzlu", 7), ("Kötü", 5)]
    for i in range(1, WORD_SLOTS + 1):
        if i <= len(words):
            row[f"word_{i}_text"] = words[i - 1][0]
            row[f"word_{i}_weight"] = words[i - 1][1]
        else:
            row[f"word_{i}_text"] = ""
            row[f"word_{i}_weight"] = 0

    # Heatmap (7×24)
    for d_idx, day in enumerate(DAYS):
        for h_idx, hour in enumerate(HOURS):
            row[f"heat_{day}_{hour}"] = EXAMPLE_HEATMAP[d_idx][h_idx]

    if neighborhood:
        row["neighborhood"] = neighborhood

    return row


def write_csv(path: Path, columns: list[str], rows: list[dict]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            # Eksik sütun varsa boş yaz
            writer.writerow({c: row.get(c, "") for c in columns})
    print(f"  ✓ {path.relative_to(ROOT)}  ({len(columns)} sütun, {len(rows)} satır)")


# ============================================================================
# 1. restaurants.csv
# ============================================================================
def build_restaurants() -> None:
    cols = restaurants_columns()
    rows = [
        {
            "id": "",
            "name": "Ali Usta Kebap",
            "district_id": "34-fatih",
            "neighborhood_id": "",  # opsiyonel
            "category_id": 3,
            "is_active": "true",
            "yemeksepeti_customers": 1240,
            "trendyol_customers": 860,
            "getir_customers": 420,
        },
        {
            "id": "",
            "name": "Pizza Roma",
            "district_id": "34-besiktas",
            "neighborhood_id": "",
            "category_id": 5,
            "is_active": "true",
            "yemeksepeti_customers": 980,
            "trendyol_customers": 1100,
            "getir_customers": 510,
        },
        {
            "id": "",
            "name": "Burger House",
            "district_id": "34-kadikoy",
            "neighborhood_id": "",
            "category_id": 7,
            "is_active": "false",
            "yemeksepeti_customers": 0,
            "trendyol_customers": 0,
            "getir_customers": 0,
        },
    ]
    write_csv(EXAMPLES / "restaurants.csv", cols, rows)


# ============================================================================
# 2. data_entry_district.csv
# ============================================================================
def build_data_entry_district() -> None:
    cols = data_entry_district_columns()
    rows = [fatih_data_entry_row()]
    write_csv(EXAMPLES / "data_entry_district.csv", cols, rows)


# ============================================================================
# 3. data_entry_neighborhood.csv
# ============================================================================
def build_data_entry_neighborhood() -> None:
    cols = data_entry_neighborhood_columns()
    row = fatih_data_entry_row(neighborhood="Aksaray")
    # Mahalle örneğinde rakamları biraz farklılaştır
    row["customers_yemeksepeti"] = 1274
    row["customers_trendyol"] = 920
    row["customers_getir"] = 780
    row["ad_budget_yemeksepeti"] = 74922
    row["cancel_rate"] = 9.9
    row["return_rate"] = 4.8
    row["area_rating"] = 3.99
    row["avg_basket"] = 112
    row["avg_menu_price"] = 145
    row["avg_monthly_revenue"] = 1270914
    rows = [row]
    write_csv(EXAMPLES / "data_entry_neighborhood.csv", cols, rows)


# ============================================================================
# 4. case_studies.csv
# ============================================================================
def build_case_studies() -> None:
    cols = case_studies_columns()
    rows = [
        {
            "id": "",
            "title": "Ali Usta — 3 ayda ciro 3 katı",
            "district_id": "34-fatih",
            "category_id": 3,
            "sort_order": 1,
            "is_active": "true",
            "before_daily_order": "25/gün",
            "before_avg_basket": "85 ₺",
            "before_complaint_1": "Soğuk teslimat",
            "before_complaint_2": "Az porsiyon",
            "before_complaint_3": "Yanlış sipariş",
            "before_complaint_4": "",
            "before_complaint_5": "",
            "after_daily_order": "75/gün",
            "after_avg_basket": "145 ₺",
            "after_improvement_1": "Sıcak çanta",
            "after_improvement_2": "Porsiyon kontrolü",
            "after_improvement_3": "Çift kontrol",
            "after_improvement_4": "Yeni paketleme",
            "after_improvement_5": "",
        },
        {
            "id": "",
            "title": "Pizza Roma — Aylık ciro 5 katına çıktı",
            "district_id": "34-besiktas",
            "category_id": 5,
            "sort_order": 2,
            "is_active": "true",
            "before_daily_order": "40/gün",
            "before_avg_basket": "110 ₺",
            "before_complaint_1": "Geç teslimat",
            "before_complaint_2": "Hamur kötü",
            "before_complaint_3": "",
            "before_complaint_4": "",
            "before_complaint_5": "",
            "after_daily_order": "200/gün",
            "after_avg_basket": "180 ₺",
            "after_improvement_1": "30dk garanti",
            "after_improvement_2": "Yeni fırın",
            "after_improvement_3": "Sıcak çanta",
            "after_improvement_4": "",
            "after_improvement_5": "",
        },
    ]
    write_csv(EXAMPLES / "case_studies.csv", cols, rows)


# ============================================================================
# 5. loyalty.csv
# ============================================================================
def build_loyalty() -> None:
    cols = loyalty_columns()
    # Eski varsayılan içerik — admin/src/pages/SettingsPage.jsx DEFAULT_VALUES ile uyumlu
    rows = [
        {
            "loyalty_active_firms": "+150",
            "loyalty_stats_active_firms_label": "Aktif Firma",
            "loyalty_churn_reduction": "%34",
            "loyalty_stats_churn_label": "Ortalama Churn Azalması",
            "loyalty_avg_roi": "4.2x",
            "loyalty_stats_roi_label": "Ortalama ROI",
            "loyalty_payback_period": "90 Gün",
            "loyalty_stats_payback_label": "Ortalama Geri Ödeme Süresi",
            "loyalty_hero_badge": "Sadakat Programı",
            "loyalty_hero_title": "Müşterini koru,",
            "loyalty_hero_title_accent": "gelirini büyüt.",
            "loyalty_hero_subtitle": "Yemek platformlarındaki müşterilerini sadık takipçilere dönüştür. Her siparişte tekrar gelme oranını artır.",
            "loyalty_hero_cta_text": "Nasıl Çalışır?",
            "loyalty_features_title": "Neler Sunuyoruz?",
            "loyalty_features_subtitle": "Her özellik, somut bir kazanımla geliyor.",
            "card_1_title": "Puan Sistemi",
            "card_1_text": "Her siparişte müşteri puan kazanır; biriken puanları indirim olarak kullanır.",
            "card_2_title": "Kişisel Kuponlar",
            "card_2_text": "Davranış bazlı kuponlar ile geri dönüşü artır; pasif müşteriyi tekrar aktif et.",
            "card_3_title": "Anlık Bildirim",
            "card_3_text": "Kampanyalar ve özel teklifler için segmentli push bildirimleri gönder.",
            "card_4_title": "Analitik Panel",
            "card_4_text": "Sadakat KPI'larını ve müşteri davranışlarını gerçek zamanlı takip et.",
            "card_5_title": "",
            "card_5_text": "",
            "card_6_title": "",
            "card_6_text": "",
        }
    ]
    write_csv(EXAMPLES / "loyalty.csv", cols, rows)


# ============================================================================
# Main
# ============================================================================
if __name__ == "__main__":
    print("Örnek CSV'ler üretiliyor...")
    build_restaurants()
    build_data_entry_district()
    build_data_entry_neighborhood()
    build_case_studies()
    build_loyalty()
    print("\nTamamlandı. examples/ klasöründe 5 dosya var.")
