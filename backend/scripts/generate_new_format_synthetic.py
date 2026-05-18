"""Yeni birleşik CSV formatı için sentetik veri üretici.

Her ilçe için:
  - Genel ilçe (category=NULL): 3 platform için satır
  - İlçe-Kategori (her 26 kategori): 3 platform için satır × 5 kategori örneği
Her ilçenin ilk 3 mahallesi için:
  - Mahalle (category=NULL): 3 platform için satır
  - Mahalle-Kategori (3 kategori örneği): 3 platform için satır

Çıktı:
  synthetic_csves/district_data.csv
  synthetic_csves/neighborhood_data.csv

Çalıştırma:
    cd backend && python -m scripts.generate_new_format_synthetic
"""
import asyncio
import csv
import json
import random
from datetime import date
from pathlib import Path

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Category, District, Neighborhood, Platform


PERIOD_DATE = date(2026, 5, 1).isoformat()
SEED = 42
random.seed(SEED)

# Kullanılacak platform seçenekleri (DB'den çekilecek, ama listede sabit)
DEFAULT_PLATFORMS = ["Yemeksepeti", "Trendyol", "Getir"]

# Her ilçe için kaç kategori örneği üretelim (ilk N'i alır)
CATS_PER_DISTRICT = 5
CATS_PER_NEIGHBORHOOD = 3
NEIGHBORHOODS_PER_DISTRICT = 3


def rand_cancel_reasons():
    return [
        {"label": "Uzun bekleme", "percent": round(random.uniform(5, 30), 1), "color": "#EE4444"},
        {"label": "Yanlış ürün", "percent": round(random.uniform(5, 30), 1), "color": "#A65EEA"},
        {"label": "Lezzet", "percent": round(random.uniform(5, 25), 1), "color": "#22CCEE"},
        {"label": "Ürün stokta yok", "percent": round(random.uniform(5, 30), 1), "color": "#66DD22"},
        {"label": "Diğer", "percent": round(random.uniform(5, 25), 1), "color": "#F99F1B"},
    ]


def rand_return_reasons():
    return [
        {"label": "Eksik Malzeme", "percent": round(random.uniform(10, 30), 1), "color": "#EE4444"},
        {"label": "Soğuk Geldi", "percent": round(random.uniform(10, 30), 1), "color": "#A65EEA"},
        {"label": "Yanlış Sipariş", "percent": round(random.uniform(20, 50), 1), "color": "#22CCEE"},
        {"label": "Ambalaj", "percent": round(random.uniform(10, 30), 1), "color": "#F99F1B"},
    ]


def rand_heatmap():
    return [[random.randint(4, 100) for _ in range(24)] for _ in range(7)]


def rand_rating_distribution():
    return [
        {"stars": 5, "percent": round(random.uniform(10, 35), 1), "count": random.randint(500, 2500)},
        {"stars": 4, "percent": round(random.uniform(15, 30), 1), "count": random.randint(800, 2500)},
        {"stars": 3, "percent": round(random.uniform(15, 30), 1), "count": random.randint(500, 2500)},
        {"stars": 2, "percent": round(random.uniform(10, 30), 1), "count": random.randint(500, 2500)},
        {"stars": 1, "percent": round(random.uniform(5, 25), 1), "count": random.randint(300, 1500)},
    ]


def rand_word_cloud():
    pool = ["Bayat", "Geç", "Soğuk", "Kötü", "Tatsız", "Yağlı", "Az porsiyon", "Eksik", "Lezzetsiz"]
    return [{"text": w, "weight": random.randint(1, 5)} for w in random.sample(pool, k=6)]


def rand_courier_comparison():
    return {
        "restaurant_courier": {
            "fee": random.randint(15, 30),
            "avg_cost": round(random.uniform(25, 45), 2),
            "monthly_revenue": random.randint(3000, 8000),
            "churn_label": random.choice(["YÜKSEK", "ORTA", "DÜŞÜK"]),
        },
        "own_courier": {
            "fee": 0,
            "avg_cost": round(random.uniform(25, 40), 2),
            "monthly_revenue": random.randint(700000, 1500000),
            "churn_label": random.choice(["DÜŞÜK", "ORTA"]),
        },
    }


def rand_platform_neg_dist():
    a, b = sorted([random.uniform(15, 50), random.uniform(15, 50)])
    c = 100 - a - b
    return [
        {"platform_id": 1, "percent": round(a, 1)},
        {"platform_id": 2, "percent": round(b, 1)},
        {"platform_id": 3, "percent": round(c, 1)},
    ]


def metric_block():
    """Bir satır için ortak metric alanları."""
    return {
        "cancel_rate": round(random.uniform(5, 25), 2),
        "return_rate": round(random.uniform(3, 15), 2),
        "cancel_reasons_json": json.dumps(rand_cancel_reasons(), ensure_ascii=False),
        "return_reasons_json": json.dumps(rand_return_reasons(), ensure_ascii=False),
        "area_performance_score": round(random.uniform(70, 95), 1),
        "area_rating": round(random.uniform(3.5, 4.8), 2),
        "highest_rating": round(random.uniform(4.5, 5.0), 2),
        "lowest_rating": round(random.uniform(2.8, 4.0), 2),
        "avg_basket": round(random.uniform(80, 200), 2),
        "avg_menu_price": round(random.uniform(120, 280), 2),
        "avg_monthly_revenue": random.randint(300000, 2000000),
        "courier_fee": random.randint(15, 30),
        "hourly_heatmap_json": json.dumps(rand_heatmap()),
        "negative_comment_total": random.randint(500, 3000),
        "negative_comment_rate": round(random.uniform(15, 35), 2),
        "negative_avg_rating": round(random.uniform(2.0, 3.5), 2),
        "platform_negative_distribution_json": json.dumps(rand_platform_neg_dist()),
        "rating_distribution_json": json.dumps(rand_rating_distribution(), ensure_ascii=False),
        "negative_word_cloud_json": json.dumps(rand_word_cloud(), ensure_ascii=False),
        "courier_comparison_json": json.dumps(rand_courier_comparison(), ensure_ascii=False),
    }


def empty_metric_block():
    """İlk satırdan sonraki platformlar için boş metric alanları (metric grup başına 1 kez)."""
    return {k: "" for k in [
        "cancel_rate", "return_rate", "cancel_reasons_json", "return_reasons_json",
        "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
        "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
        "hourly_heatmap_json", "negative_comment_total", "negative_comment_rate",
        "negative_avg_rating", "platform_negative_distribution_json",
        "rating_distribution_json", "negative_word_cloud_json", "courier_comparison_json",
    ]}


def analytics_block(platform):
    return {
        "platform": platform,
        "customers": random.randint(500, 3000),
        "ad_budget": random.randint(20000, 80000),
        "campaign_rate": round(random.uniform(25, 50), 1),
        "coupon_rate": round(random.uniform(25, 45), 1),
        "flash_rate": round(random.uniform(25, 45), 1),
        "joker_rate": round(random.uniform(25, 50), 1),
        "daily_forecast": round(random.uniform(4000, 15000), 2),
        "monthly_forecast": round(random.uniform(150000, 400000), 2),
        "yearly_forecast": round(random.uniform(3000000, 8000000), 2),
    }


DISTRICT_COLUMNS = [
    "scope", "district_id", "category", "period_date", "platform",
    "customers", "ad_budget", "campaign_rate", "coupon_rate", "flash_rate", "joker_rate",
    "daily_forecast", "monthly_forecast", "yearly_forecast",
    "cancel_rate", "return_rate", "cancel_reasons_json", "return_reasons_json",
    "area_performance_score", "area_rating", "highest_rating", "lowest_rating",
    "avg_basket", "avg_menu_price", "avg_monthly_revenue", "courier_fee",
    "hourly_heatmap_json", "negative_comment_total", "negative_comment_rate", "negative_avg_rating",
    "platform_negative_distribution_json", "rating_distribution_json",
    "negative_word_cloud_json", "courier_comparison_json",
]
NEIGH_COLUMNS = ["scope", "district_id", "neighborhood"] + DISTRICT_COLUMNS[2:]


def make_row(scope, district_id, neighborhood, category, platform, is_first_of_group):
    base = {
        "scope": scope,
        "district_id": district_id,
        "category": category or "",
        "period_date": PERIOD_DATE,
    }
    if scope == "neighborhood":
        base["neighborhood"] = neighborhood or ""
    base.update(analytics_block(platform))
    if is_first_of_group:
        base.update(metric_block())
    else:
        base.update(empty_metric_block())
    return base


async def main():
    async with AsyncSessionLocal() as session:
        districts = (await session.execute(select(District).order_by(District.name))).scalars().all()
        categories = (await session.execute(select(Category).order_by(Category.sort_order))).scalars().all()
        platforms_db = (await session.execute(select(Platform).where(Platform.is_active == True))).scalars().all()  # noqa: E712
        platform_names = [p.name for p in platforms_db] or DEFAULT_PLATFORMS

    out_dir = Path(__file__).resolve().parents[2] / "synthetic_csves"
    out_dir.mkdir(parents=True, exist_ok=True)
    district_csv = out_dir / "district_data.csv"
    neigh_csv = out_dir / "neighborhood_data.csv"

    cat_names = [c.name for c in categories]
    district_cats = cat_names[:CATS_PER_DISTRICT]
    neigh_cats = cat_names[:CATS_PER_NEIGHBORHOOD]

    # === İlçe CSV ===
    drows = 0
    with district_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=DISTRICT_COLUMNS)
        w.writeheader()
        for d in districts:
            # 1) Genel ilçe (category boş)
            for i, plat in enumerate(platform_names):
                w.writerow(make_row("district", d.id, None, "", plat, is_first_of_group=(i == 0)))
                drows += 1
            # 2) Her kategori için
            for cat in district_cats:
                for i, plat in enumerate(platform_names):
                    w.writerow(make_row("district", d.id, None, cat, plat, is_first_of_group=(i == 0)))
                    drows += 1

    # === Mahalle CSV ===
    nrows = 0
    async with AsyncSessionLocal() as session:
        with neigh_csv.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=NEIGH_COLUMNS)
            w.writeheader()
            for d in districts:
                # İlk 3 mahalleyi al (sort_order'a göre)
                neighborhoods = (await session.execute(
                    select(Neighborhood)
                    .where(Neighborhood.district_id == d.id)
                    .order_by(Neighborhood.id)
                    .limit(NEIGHBORHOODS_PER_DISTRICT)
                )).scalars().all()
                for n in neighborhoods:
                    # Genel mahalle (category boş)
                    for i, plat in enumerate(platform_names):
                        w.writerow(make_row("neighborhood", d.id, n.name, "", plat, is_first_of_group=(i == 0)))
                        nrows += 1
                    # Kategoriler için
                    for cat in neigh_cats:
                        for i, plat in enumerate(platform_names):
                            w.writerow(make_row("neighborhood", d.id, n.name, cat, plat, is_first_of_group=(i == 0)))
                            nrows += 1

    print(f"OK — district_data.csv ({drows} satır), neighborhood_data.csv ({nrows} satır)")
    print(f"   {district_csv}")
    print(f"   {neigh_csv}")


if __name__ == "__main__":
    asyncio.run(main())
