"""Sentetik veri üretici + içeri aktarıcı.

Her ilçenin ilk mahallesi için:
  * 5 restoran (3 platform müşterisi eksiksiz)
  * 5 rakip (restoran başına 1, kategori bazlı)
  * 3 platforma district_analytics satırı
  * 3 platforma neighborhood_analytics satırı (sadece ilk mahalle)
  * 1 district_metrics satırı (Operasyon + Skor + Kıyaslama + Heatmap + Yorum)
  * 1 neighborhood_metrics satırı (aynı yapı)
Ayrıca:
  * 3 başarı hikayesi (görseller dahil — unsplash CDN)
  * 3 başvuru (public form gibi)

Önce CSV dosyaları synthetic_csves/ altına yazılır, sonra admin API
üzerinden import edilir. Tek başına çalıştırılabilir:

    cd backend && .venv/bin/python ../scripts/generate_synthetic.py
"""
from __future__ import annotations

import csv
import io
import json
import random
import sys
from datetime import date
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "synthetic_csves"
OUT_DIR.mkdir(exist_ok=True)

API = "http://localhost:8003"
ADMIN_EMAIL = "admin@opencard.com"
ADMIN_PASSWORD = "opencard123"
PERIOD = "2026-05-01"

# Platform ID konvansiyonu (DB'den):
#   1 = Uber Eats Trendyol Go
#   2 = Getir
#   3 = Yemeksepeti
PLATFORM_IDS = [1, 2, 3]
PLATFORM_NAMES = {1: "Uber Eats Trendyol Go", 2: "Getir", 3: "Yemeksepeti"}

# Her ilçeye atanacak 5 kategori (deterministik, çeşitlilik için ilk 5 popüler)
CATEGORIES_FOR_DISTRICT = [1, 2, 3, 4, 5]  # Burger, Pizza, Kebap, Döner, Sushi

# Kategori → restoran adı havuzu
NAME_POOL = {
    1: ["Burger Stop", "Beef House", "Smash Lab", "Grill Master", "Black Bun", "Çiftlik Burger", "Brioche Burger", "Crispy Burger"],
    2: ["Pizza Napoli", "Pizzeria Roma", "Bella Italia", "Hot Slice", "La Forno", "Stone Pizza", "Margherita Lab"],
    3: ["Kebapçı Hasan", "Adana Sofrası", "Urfa Mutfağı", "Ocakbaşı Hüsnü", "Kebap Evi", "Antep Sofrası"],
    4: ["Döner Sarayı", "Pidem Döner", "Anadolu Döner", "İskender Pala", "Tombik Döner", "Sultan Döner"],
    5: ["Sushi Tokyo", "Maki Roll", "Sakura House", "Wasabi", "Ginza Sushi", "Roll'n Bowl"],
}

# Operasyon sebep şablonları
CANCEL_REASONS_TEMPLATE = [
    {"label": "Uzun bekleme", "color": "#EE4444", "percent": 45},
    {"label": "Yanlış ürün", "color": "#A65EEA", "percent": 25},
    {"label": "Lezzet", "color": "#22CCEE", "percent": 15},
    {"label": "Ürün stokta yok", "color": "#66DD22", "percent": 10},
    {"label": "Diğer", "color": "#F99F1B", "percent": 5},
]
RETURN_REASONS_TEMPLATE = [
    {"label": "Eksik Malzeme", "color": "#EE4444", "percent": 48},
    {"label": "Soğuk Geldi", "color": "#A65EEA", "percent": 34},
    {"label": "Yanlış Sipariş", "color": "#22CCEE", "percent": 18},
    {"label": "Ambalaj", "color": "#F99F1B", "percent": 12},
]
WORDS_TEMPLATE = [
    {"text": "Soğuk", "weight": 5},
    {"text": "Geç", "weight": 4},
    {"text": "Bayat", "weight": 3},
    {"text": "Kötü", "weight": 3},
    {"text": "Eksik", "weight": 2},
    {"text": "Pahalı", "weight": 2},
    {"text": "İade", "weight": 1},
]
RATING_DIST_TEMPLATE = [
    {"stars": 5, "percent": 25, "count": 500},
    {"stars": 4, "percent": 30, "count": 600},
    {"stars": 3, "percent": 20, "count": 400},
    {"stars": 2, "percent": 15, "count": 300},
    {"stars": 1, "percent": 10, "count": 200},
]

# Saatlik heatmap deseni: öğle + akşam pikleri, hafta sonu boost
def gen_heatmap(seed: int) -> list[list[int]]:
    rng = random.Random(seed)
    out = []
    for d in range(7):
        row = []
        for h in range(24):
            if 11 <= h <= 14:
                v = 65 + rng.randint(-10, 15)
            elif 18 <= h <= 22:
                v = 80 + rng.randint(-10, 15)
            elif 8 <= h <= 23:
                v = 25 + rng.randint(-10, 10)
            else:
                v = 5 + rng.randint(-3, 5)
            if d >= 5:  # hafta sonu
                v = int(v * 1.15)
            row.append(max(0, min(100, v)))
        out.append(row)
    return out


def login() -> str:
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    r.raise_for_status()
    return r.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def get_districts() -> list[dict]:
    return requests.get(f"{API}/districts", timeout=10).json()


def get_first_neighborhood(district_id: str) -> dict:
    arr = requests.get(f"{API}/districts/{district_id}/neighborhoods", timeout=10).json()
    return arr[0] if arr else None


# ============================== CSV Builders ==============================

def write_csv(name: str, rows: list[dict], columns: list[str]) -> Path:
    p = OUT_DIR / name
    with p.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columns)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return p


def build_restaurants(districts: list[dict]) -> list[dict]:
    rows = []
    rng = random.Random(42)
    for d_idx, dist in enumerate(districts):
        used_names: set[str] = set()
        for c_idx, cat_id in enumerate(CATEGORIES_FOR_DISTRICT):
            pool = NAME_POOL[cat_id]
            base = pool[d_idx % len(pool)]
            name = f"{base} - {dist['name']}"
            # Garanti benzersizlik (aynı ilçede aynı ad olmasın)
            i = 1
            while name in used_names:
                i += 1
                name = f"{base} {i} - {dist['name']}"
            used_names.add(name)

            # Her platform için makul müşteri sayısı
            customers = {
                1: rng.randint(80, 260),   # Trendyol/UberEats
                2: rng.randint(60, 220),   # Getir
                3: rng.randint(100, 320),  # Yemeksepeti
            }
            platforms = [{"platform_id": pid, "customers": customers[pid]} for pid in PLATFORM_IDS]
            rows.append({
                "name": name,
                "district_id": dist["id"],
                "category_id": cat_id,
                "is_active": "true",
                "platforms": json.dumps(platforms, ensure_ascii=False),
            })
    return rows


def build_competitors(districts: list[dict]) -> list[dict]:
    rows = []
    rng = random.Random(7)
    for d_idx, dist in enumerate(districts):
        for c_idx, cat_id in enumerate(CATEGORIES_FOR_DISTRICT):
            # Her restoran için 1 rakip — platform_id rotasyonu
            platform_id = PLATFORM_IDS[c_idx % 3]
            rows.append({
                "district_id": dist["id"],
                "category_id": cat_id,
                "platform_id": platform_id,
                "period_date": PERIOD,
                "min_basket": round(60 + rng.uniform(-15, 25), 2),
                "avg_rating": round(3.8 + rng.uniform(-0.5, 0.7), 2),
                "monthly_revenue": rng.randint(400_000, 1_400_000),
                "delivery_type": rng.choice(["platform", "own"]),
                "discount_rate": round(rng.uniform(5, 30), 2),
                "coupon_rate": round(rng.uniform(5, 25), 2),
            })
    return rows


def build_district_analytics(districts: list[dict]) -> list[dict]:
    rows = []
    rng = random.Random(11)
    for dist in districts:
        for pid in PLATFORM_IDS:
            rows.append({
                "district_id": dist["id"],
                "category_id": "",   # NULL = tüm kategoriler aggregate
                "platform_id": pid,
                "period_date": PERIOD,
                "customers": rng.randint(800, 3500),
                "ad_budget": rng.randint(8000, 45000),
                "campaign_rate": round(rng.uniform(20, 70), 2),
                "coupon_rate": round(rng.uniform(15, 50), 2),
                "flash_rate": round(rng.uniform(10, 40), 2),
                "joker_rate": round(rng.uniform(15, 55), 2),
                "daily_forecast": round(rng.uniform(6000, 24000), 2),
                "monthly_forecast": round(rng.uniform(180000, 720000), 2),
                "yearly_forecast": round(rng.uniform(2_200_000, 8_500_000), 2),
            })
    return rows


def build_neighborhood_analytics(neighborhoods: list[dict]) -> list[dict]:
    rows = []
    rng = random.Random(13)
    for n in neighborhoods:
        for pid in PLATFORM_IDS:
            rows.append({
                "neighborhood_id": n["id"],
                "category_id": "",
                "platform_id": pid,
                "period_date": PERIOD,
                "customers": rng.randint(150, 900),
                "ad_budget": rng.randint(1500, 9000),
                "campaign_rate": round(rng.uniform(20, 70), 2),
                "coupon_rate": round(rng.uniform(15, 50), 2),
                "flash_rate": round(rng.uniform(10, 40), 2),
                "joker_rate": round(rng.uniform(15, 55), 2),
                "daily_forecast": round(rng.uniform(1500, 6000), 2),
                "monthly_forecast": round(rng.uniform(45000, 180000), 2),
                "yearly_forecast": round(rng.uniform(540000, 2_200_000), 2),
            })
    return rows


def courier_comparison_json(rng: random.Random) -> str:
    return json.dumps({
        "restaurant_courier": {
            "fee": rng.randint(15, 28),
            "avg_cost": round(rng.uniform(28, 42), 2),
            "monthly_revenue": rng.randint(4000, 9000),
            "churn_label": "YÜKSEK",
        },
        "own_courier": {
            "fee": 0,
            "avg_cost": round(rng.uniform(26, 38), 2),
            "monthly_revenue": rng.randint(700_000, 1_400_000),
            "churn_label": "DÜŞÜK",
        },
    }, ensure_ascii=False)


def build_district_metrics(districts: list[dict]) -> list[dict]:
    rows = []
    rng = random.Random(19)
    for idx, dist in enumerate(districts):
        cancel_rate = round(rng.uniform(6, 18), 2)
        return_rate = round(rng.uniform(4, 12), 2)
        area_rating = round(rng.uniform(3.8, 4.7), 2)
        area_score = round(rng.uniform(60, 88), 0)
        neg_rate = round(rng.uniform(10, 32), 2)
        neg_total = rng.randint(220, 2200)
        # Platform negative dist: 3 platform, toplamları yaklaşık 100'e eşit
        a, b, c = rng.uniform(20, 50), rng.uniform(15, 35), rng.uniform(15, 35)
        s = a + b + c
        platform_neg = [
            {"platform_id": 1, "percent": round(a / s * 100, 1)},
            {"platform_id": 2, "percent": round(b / s * 100, 1)},
            {"platform_id": 3, "percent": round(c / s * 100, 1)},
        ]
        rows.append({
            "district_id": dist["id"],
            "category_id": "",
            "period_date": PERIOD,
            "cancel_rate": cancel_rate,
            "return_rate": return_rate,
            "cancel_reasons": json.dumps(CANCEL_REASONS_TEMPLATE, ensure_ascii=False),
            "return_reasons": json.dumps(RETURN_REASONS_TEMPLATE, ensure_ascii=False),
            "area_performance_score": area_score,
            "area_rating": area_rating,
            "highest_rating": round(area_rating + rng.uniform(0.2, 0.5), 2),
            "lowest_rating": round(area_rating - rng.uniform(0.4, 0.9), 2),
            "avg_basket": rng.randint(70, 145),
            "avg_menu_price": rng.randint(110, 190),
            "avg_monthly_revenue": rng.randint(700_000, 1_500_000),
            "courier_fee": rng.randint(15, 30),
            "hourly_heatmap": json.dumps(gen_heatmap(idx + 100), ensure_ascii=False),
            "negative_comment_total": neg_total,
            "negative_comment_rate": neg_rate,
            "negative_avg_rating": round(rng.uniform(2.2, 3.1), 2),
            "platform_negative_distribution": json.dumps(platform_neg, ensure_ascii=False),
            "rating_distribution": json.dumps(RATING_DIST_TEMPLATE, ensure_ascii=False),
            "negative_word_cloud": json.dumps(WORDS_TEMPLATE, ensure_ascii=False),
            "courier_comparison": courier_comparison_json(rng),
        })
    return rows


def build_neighborhood_metrics(neighborhoods: list[dict]) -> list[dict]:
    rows = []
    rng = random.Random(23)
    for idx, n in enumerate(neighborhoods):
        cancel_rate = round(rng.uniform(6, 18), 2)
        return_rate = round(rng.uniform(4, 12), 2)
        area_rating = round(rng.uniform(3.8, 4.7), 2)
        area_score = round(rng.uniform(60, 88), 0)
        neg_rate = round(rng.uniform(10, 32), 2)
        a, b, c = rng.uniform(20, 50), rng.uniform(15, 35), rng.uniform(15, 35)
        s = a + b + c
        platform_neg = [
            {"platform_id": 1, "percent": round(a / s * 100, 1)},
            {"platform_id": 2, "percent": round(b / s * 100, 1)},
            {"platform_id": 3, "percent": round(c / s * 100, 1)},
        ]
        rows.append({
            "neighborhood_id": n["id"],
            "category_id": "",
            "period_date": PERIOD,
            "cancel_rate": cancel_rate,
            "return_rate": return_rate,
            "cancel_reasons": json.dumps(CANCEL_REASONS_TEMPLATE, ensure_ascii=False),
            "return_reasons": json.dumps(RETURN_REASONS_TEMPLATE, ensure_ascii=False),
            "area_performance_score": area_score,
            "area_rating": area_rating,
            "highest_rating": round(area_rating + rng.uniform(0.2, 0.5), 2),
            "lowest_rating": round(area_rating - rng.uniform(0.4, 0.9), 2),
            "avg_basket": rng.randint(60, 130),
            "avg_menu_price": rng.randint(100, 175),
            "avg_monthly_revenue": rng.randint(450_000, 1_100_000),
            "courier_fee": rng.randint(15, 28),
            "hourly_heatmap": json.dumps(gen_heatmap(idx + 200), ensure_ascii=False),
            "negative_comment_total": rng.randint(80, 850),
            "negative_comment_rate": neg_rate,
            "negative_avg_rating": round(rng.uniform(2.2, 3.1), 2),
            "platform_negative_distribution": json.dumps(platform_neg, ensure_ascii=False),
            "rating_distribution": json.dumps(RATING_DIST_TEMPLATE, ensure_ascii=False),
            "negative_word_cloud": json.dumps(WORDS_TEMPLATE, ensure_ascii=False),
            "courier_comparison": courier_comparison_json(rng),
        })
    return rows


CASE_STUDIES = [
    {
        "title": "Pizza Napoli - Kadıköy",
        "district_id": "34-kadıköy",
        "category_id": 2,
        "sort_order": 1,
        "is_active": True,
        "before_image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80",
        "before_daily_order": "8-12 adet",
        "before_avg_basket": "120 ₺",
        "before_complaints": ["Fotoğraf kalitesi düşük", "Menü bilgileri eksik", "Teslimat süresi belirsiz"],
        "after_image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
        "after_daily_order": "35-50 adet",
        "after_avg_basket": "165 ₺",
        "after_improvements": ["Profesyonel fotoğraf çekimi", "Menü optimizasyonu", "Kampanya yönetimi"],
    },
    {
        "title": "Kebapçı Hasan - Üsküdar",
        "district_id": "34-üsküdar",
        "category_id": 3,
        "sort_order": 2,
        "is_active": True,
        "before_image_url": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=1200&q=80",
        "before_daily_order": "15-20 adet",
        "before_avg_basket": "95 ₺",
        "before_complaints": ["Soğuk teslimat", "Az porsiyon", "Yanlış sipariş"],
        "after_image_url": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=80",
        "after_daily_order": "55-70 adet",
        "after_avg_basket": "140 ₺",
        "after_improvements": ["Termal paketleme", "Porsiyon standartı", "QR doğrulama sistemi"],
    },
    {
        "title": "Burger Stop - Beşiktaş",
        "district_id": "34-beşiktaş",
        "category_id": 1,
        "sort_order": 3,
        "is_active": True,
        "before_image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
        "before_daily_order": "20-25 adet",
        "before_avg_basket": "180 ₺",
        "before_complaints": ["Yavaş hazırlama", "Lezzet tutarsız"],
        "after_image_url": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1200&q=80",
        "after_daily_order": "60-80 adet",
        "after_avg_basket": "225 ₺",
        "after_improvements": ["Sandviç hattı kurulumu", "Tarif standardı"],
    },
]


APPLICATIONS = [
    {
        "first_name": "Mehmet",
        "last_name": "Yıldız",
        "email": "mehmet.yildiz@example.com",
        "phone": "+905321112233",
        "city": "İstanbul",
        "district": "Kadıköy",
        "vehicle": "motor",
        "message": "10 yıl kurye deneyimim var, Kadıköy bölgesinde çalışmak istiyorum.",
    },
    {
        "first_name": "Ayşe",
        "last_name": "Demir",
        "email": "ayse.demir@example.com",
        "phone": "+905334445566",
        "city": "İstanbul",
        "district": "Üsküdar",
        "vehicle": "bisiklet",
        "message": "Üniversite öğrencisiyim, hafta sonu ve akşam vardiyalarında çalışabilirim.",
    },
    {
        "first_name": "Emre",
        "last_name": "Çelik",
        "email": "emre.celik@example.com",
        "phone": "+905457778899",
        "city": "İstanbul",
        "district": "Beşiktaş",
        "vehicle": "yaya",
        "message": "Beşiktaş merkezde yürüyüş ile teslimat yapmak istiyorum.",
    },
]


# ============================== CSV import ==============================

def post_csv(token: str, path: str, csv_path: Path) -> dict:
    with csv_path.open("rb") as f:
        r = requests.post(
            f"{API}{path}",
            headers=auth_headers(token),
            files={"file": (csv_path.name, f, "text/csv")},
            timeout=60,
        )
    r.raise_for_status()
    return r.json()


def post_json(token: str, path: str, payload) -> dict:
    r = requests.post(f"{API}{path}", json=payload, headers=auth_headers(token), timeout=20)
    if not r.ok:
        raise RuntimeError(f"{path} → {r.status_code}: {r.text}")
    return r.json() if r.text else {}


# ============================== Run ==============================

def main():
    print("→ Login")
    token = login()

    print("→ Districts + first neighborhood")
    districts = get_districts()
    neighborhoods: list[dict] = []
    missing = []
    for d in districts:
        n = get_first_neighborhood(d["id"])
        if not n:
            missing.append(d["id"])
            continue
        neighborhoods.append({"id": n["id"], "name": n["name"], "district_id": d["id"], "district_name": d["name"]})
    print(f"   {len(districts)} ilçe, {len(neighborhoods)} mahalle eşleşti", "missing:" if missing else "", missing)

    # ---- CSV üret ----
    print("→ CSV üretiliyor synthetic_csves/")
    REST_COLS = ["name", "district_id", "category_id", "is_active", "platforms"]
    COMP_COLS = ["district_id", "category_id", "platform_id", "period_date",
                 "min_basket", "avg_rating", "monthly_revenue", "delivery_type",
                 "discount_rate", "coupon_rate"]
    DA_COLS = ["district_id", "category_id", "platform_id", "period_date",
               "customers", "ad_budget", "campaign_rate", "coupon_rate", "flash_rate",
               "joker_rate", "daily_forecast", "monthly_forecast", "yearly_forecast"]
    NA_COLS = ["neighborhood_id", "category_id", "platform_id", "period_date",
               "customers", "ad_budget", "campaign_rate", "coupon_rate", "flash_rate",
               "joker_rate", "daily_forecast", "monthly_forecast", "yearly_forecast"]
    METRIC_BASE = [
        "category_id", "period_date",
        "cancel_rate", "return_rate", "cancel_reasons", "return_reasons",
        "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
        "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
        "hourly_heatmap",
        "negative_comment_total", "negative_comment_rate", "negative_avg_rating",
        "platform_negative_distribution", "rating_distribution", "negative_word_cloud",
        "courier_comparison",
    ]
    DM_COLS = ["district_id", *METRIC_BASE]
    NM_COLS = ["neighborhood_id", *METRIC_BASE]

    rest_rows = build_restaurants(districts)
    comp_rows = build_competitors(districts)
    da_rows = build_district_analytics(districts)
    na_rows = build_neighborhood_analytics(neighborhoods)
    dm_rows = build_district_metrics(districts)
    nm_rows = build_neighborhood_metrics(neighborhoods)

    rest_p = write_csv("restaurants.csv", rest_rows, REST_COLS)
    comp_p = write_csv("competitors.csv", comp_rows, COMP_COLS)
    da_p   = write_csv("district_analytics.csv", da_rows, DA_COLS)
    na_p   = write_csv("neighborhood_analytics.csv", na_rows, NA_COLS)
    dm_p   = write_csv("district_metrics.csv", dm_rows, DM_COLS)
    nm_p   = write_csv("neighborhood_metrics.csv", nm_rows, NM_COLS)

    print(f"   restaurants: {len(rest_rows)} → {rest_p}")
    print(f"   competitors: {len(comp_rows)} → {comp_p}")
    print(f"   district_analytics: {len(da_rows)} → {da_p}")
    print(f"   neighborhood_analytics: {len(na_rows)} → {na_p}")
    print(f"   district_metrics: {len(dm_rows)} → {dm_p}")
    print(f"   neighborhood_metrics: {len(nm_rows)} → {nm_p}")

    # ---- Import et ----
    print("→ Restaurants import")
    print("  ", post_csv(token, "/admin/restaurants/csv", rest_p))
    print("→ Competitors import")
    print("  ", post_csv(token, "/admin/analytics/competitors/csv", comp_p))
    print("→ District analytics import")
    print("  ", post_csv(token, "/admin/analytics/district/csv", da_p))
    print("→ Neighborhood analytics import")
    print("  ", post_csv(token, "/admin/analytics/neighborhood/csv", na_p))
    print("→ District metrics import")
    print("  ", post_csv(token, "/admin/metrics/district/csv", dm_p))
    print("→ Neighborhood metrics import")
    print("  ", post_csv(token, "/admin/metrics/neighborhood/csv", nm_p))

    # ---- Case studies (multipart/form-data, görselleri Unsplash'tan indirip yükle) ----
    print("→ Case Studies (multipart upload)")
    # İdempotency: mevcutları title üzerinden bul; varsa PUT, yoksa POST
    try:
        existing = requests.get(f"{API}/admin/case-studies", headers=auth_headers(token), timeout=10).json()
        existing_by_title = {e["title"]: e["id"] for e in existing}
    except Exception:
        existing_by_title = {}

    def fetch_bytes(url: str) -> bytes:
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return r.content

    for cs in CASE_STUDIES:
        try:
            before_bytes = fetch_bytes(cs["before_image_url"])
            after_bytes = fetch_bytes(cs["after_image_url"])
            data = {
                "title": cs["title"],
                "district_id": cs["district_id"],
                "category_id": str(cs["category_id"]),
                "sort_order": str(cs["sort_order"]),
                "is_active": "true" if cs["is_active"] else "false",
                "before_daily_order": cs["before_daily_order"],
                "before_avg_basket": cs["before_avg_basket"],
                "before_complaints": json.dumps(cs["before_complaints"], ensure_ascii=False),
                "after_daily_order": cs["after_daily_order"],
                "after_avg_basket": cs["after_avg_basket"],
                "after_improvements": json.dumps(cs["after_improvements"], ensure_ascii=False),
            }
            files = {
                "before_image": ("before.jpg", before_bytes, "image/jpeg"),
                "after_image":  ("after.jpg",  after_bytes,  "image/jpeg"),
            }
            existing_id = existing_by_title.get(cs["title"])
            if existing_id:
                r = requests.put(f"{API}/admin/case-studies/{existing_id}",
                                  data=data, files=files,
                                  headers=auth_headers(token), timeout=60)
                action = "güncellendi"
            else:
                r = requests.post(f"{API}/admin/case-studies",
                                  data=data, files=files,
                                  headers=auth_headers(token), timeout=60)
                action = "eklendi"
            r.raise_for_status()
            print(f"   ✓ {cs['title']} ({action})")
        except Exception as exc:  # noqa: BLE001
            print(f"   ! {cs['title']} → {exc}")

    # ---- Applications (public POST) ----
    print("→ Applications (public POST)")
    for app in APPLICATIONS:
        try:
            r = requests.post(f"{API}/applications", json=app, timeout=20)
            r.raise_for_status()
            print(f"   ✓ {app['first_name']} {app['last_name']}")
        except Exception as exc:  # noqa: BLE001
            print(f"   ! {app['first_name']} → {exc}")

    # ---- Site settings (Loyalty stats) ----
    print("→ Site Settings (Loyalty stats)")
    try:
        r = requests.post(
            f"{API}/admin/metrics/site-settings",
            json={
                "loyalty_active_firms": "340+",
                "loyalty_churn_reduction": "%38",
                "loyalty_avg_roi": "2.6x",
                "loyalty_payback_period": "90 Gün",
            },
            headers=auth_headers(token), timeout=10,
        )
        r.raise_for_status()
        print("   ✓ kaydedildi")
    except Exception as exc:  # noqa: BLE001
        print(f"   ! {exc}")

    print("\n✓ DONE")


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print(f"HTTP ERROR: {e}\n{e.response.text}", file=sys.stderr)
        sys.exit(1)
