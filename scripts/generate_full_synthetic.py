"""Full sentetik üretici: her ilçenin ilk 3 mahallesi için yoğun veri.

Üretilen veri:
  * Her mahalle için 5 restoran (rastgele kategori) — restoran-bazlı metrics + analytics
    dahil (Faz 3 cascade'in tepesi). Ana sayfada restoran aratıldığında dolu görünür.
  * Her ilçe için Competitor satırları (her platform için 1 = 3 satır × ilçe)
  * Her ilçe × kategori için district_analytics (3 platform) + district_metrics
  * Her mahalle (ilk 3) × kategori için neighborhood_analytics + neighborhood_metrics

Tüm restoran-level metrics + analytics, RESTAURANT form'undaki alanlarla birebir
eşleşir. CSV'ye gömülü JSON olarak yazılır; import API üzerinden yapılır.

Çalıştır:
    cd backend && .venv/bin/python ../scripts/generate_full_synthetic.py
"""
from __future__ import annotations

import csv
import json
import random
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

PLATFORM_IDS = [1, 2, 3]
PLATFORM_NAMES = {1: "Uber Eats Trendyol Go", 2: "Getir", 3: "Yemeksepeti"}

ALL_CATEGORIES = [1, 2, 3, 4, 5, 6]  # Burger, Pizza, Kebap, Döner (?), Sushi, Tatlı

NAME_BASES = {
    1: ["Burger Stop", "Smash Lab", "Beef House", "Brioche Burger", "Black Bun", "Crispy Burger", "Çiftlik Burger", "Grill Master"],
    2: ["Pizza Napoli", "Bella Italia", "Pizzeria Roma", "La Forno", "Stone Pizza", "Margherita Lab", "Hot Slice"],
    3: ["Kebapçı Hasan", "Urfa Mutfağı", "Adana Sofrası", "Antep Sofrası", "Kebap Evi", "İskender Pala", "Ocakbaşı Hüsnü"],
    4: ["Anadolu Döner", "Döner Sarayı", "Pidem Döner", "Sultan Döner", "Tombik Döner"],
    5: ["Sushi Tokyo", "Sakura House", "Maki Roll", "Wasabi", "Ginza Sushi", "Roll'n Bowl"],
    6: ["Tatlıcı Mahmut", "Pasta Garden", "Sweet Dreams", "Şekerlemeler", "Künefe Evi"],
}

DELIVERY_TYPES = ["platform", "restaurant", "own"]
CHURN_LABELS = ["DÜŞÜK", "ORTA", "YÜKSEK"]


# ============================== Üretim helper'ları ==============================

def gen_heatmap(rng: random.Random) -> list[list[int]]:
    """7 gün × 24 saat trafik desenli matris (0-100)."""
    base = [5, 5, 5, 5, 5, 5, 5, 10, 15, 20, 30, 60, 80, 70, 50, 40, 35, 50, 75, 85, 75, 50, 25, 10]
    out = []
    for day in range(7):
        peak = 1.2 if day in (5, 6) else 1.0
        row = [max(0, min(100, int(base[h] * peak * rng.uniform(0.85, 1.15)))) for h in range(24)]
        out.append(row)
    return out


def gen_cancel_reasons(rng: random.Random) -> list[dict]:
    pool = [
        ("Uzun bekleme", "#EE4444"), ("Yanlış ürün", "#A65EEA"), ("Lezzet", "#22CCEE"),
        ("Ürün stokta yok", "#66DD22"), ("Diğer", "#F99F1B"),
    ]
    parts = [(label, color, rng.randint(5, 35)) for label, color in pool]
    total = sum(p[2] for p in parts)
    return [{"label": l, "color": c, "percent": round(p / total * 100, 1)} for l, c, p in parts]


def gen_return_reasons(rng: random.Random) -> list[dict]:
    pool = [
        ("Eksik Malzeme", "#EE4444"), ("Soğuk Geldi", "#A65EEA"),
        ("Yanlış Sipariş", "#22CCEE"), ("Ambalaj", "#F99F1B"),
    ]
    parts = [(label, color, rng.randint(10, 50)) for label, color in pool]
    total = sum(p[2] for p in parts)
    return [{"label": l, "color": c, "percent": round(p / total * 100, 1)} for l, c, p in parts]


def gen_platform_negative_dist(rng: random.Random) -> list[dict]:
    parts = [(pid, rng.uniform(20, 80)) for pid in PLATFORM_IDS]
    total = sum(p[1] for p in parts)
    return [{"platform_id": pid, "percent": round(v / total * 100, 1)} for pid, v in parts]


def gen_rating_distribution(rng: random.Random) -> list[dict]:
    pcts = [rng.randint(10, 35) for _ in range(5)]
    total = sum(pcts)
    out = []
    for i, stars in enumerate([5, 4, 3, 2, 1]):
        percent = round(pcts[i] / total * 100, 1)
        count = int(pcts[i] * rng.randint(20, 80))
        out.append({"stars": stars, "percent": percent, "count": count})
    return out


def gen_word_cloud(rng: random.Random) -> list[dict]:
    words = ["Soğuk", "Geç", "Bayat", "Kötü", "Eksik", "Pahalı", "Lezzetsiz", "Yağlı", "Az porsiyon", "Tatsız"]
    rng.shuffle(words)
    return [{"text": w, "weight": rng.randint(1, 5)} for w in words[:6]]


def gen_courier_comparison(rng: random.Random) -> dict:
    return {
        "restaurant_courier": {
            "fee": rng.choice([22, 24, 26, 28]),
            "avg_cost": round(rng.uniform(28, 38), 2),
            "monthly_revenue": rng.randint(3000, 6000),
            "churn_label": rng.choice(["YÜKSEK", "ORTA"]),
        },
        "own_courier": {
            "fee": 0,
            "avg_cost": round(rng.uniform(33, 40), 2),
            "monthly_revenue": rng.randint(600_000, 1_300_000),
            "churn_label": rng.choice(["DÜŞÜK", "ORTA"]),
        },
    }


def gen_restaurant_metrics(rng: random.Random) -> dict:
    return {
        "cancel_rate": round(rng.uniform(5, 18), 2),
        "return_rate": round(rng.uniform(3, 12), 2),
        "cancel_reasons": gen_cancel_reasons(rng),
        "return_reasons": gen_return_reasons(rng),
        "area_performance_score": round(rng.uniform(60, 90), 1),
        "area_rating": round(rng.uniform(3.5, 4.9), 2),
        "highest_rating": round(rng.uniform(4.5, 5.0), 2),
        "lowest_rating": round(rng.uniform(2.8, 4.0), 2),
        "avg_basket": round(rng.uniform(80, 220), 2),
        "avg_menu_price": round(rng.uniform(100, 250), 2),
        "avg_monthly_revenue": rng.randint(400_000, 1_500_000),
        "courier_fee": rng.choice([16, 18, 20, 22, 24]),
        "hourly_heatmap": gen_heatmap(rng),
        "negative_comment_total": rng.randint(200, 2500),
        "negative_comment_rate": round(rng.uniform(15, 30), 2),
        "negative_avg_rating": round(rng.uniform(2.0, 3.2), 2),
        "platform_negative_distribution": gen_platform_negative_dist(rng),
        "rating_distribution": gen_rating_distribution(rng),
        "negative_word_cloud": gen_word_cloud(rng),
        "courier_comparison": gen_courier_comparison(rng),
    }


def gen_restaurant_analytics(rng: random.Random) -> list[dict]:
    """Her platform için 1 satır."""
    return [
        {
            "platform_id": pid,
            "ad_budget": rng.randint(2000, 80000),
            "campaign_rate": round(rng.uniform(15, 60), 2),
            "coupon_rate": round(rng.uniform(10, 50), 2),
            "flash_rate": round(rng.uniform(5, 40), 2),
            "joker_rate": round(rng.uniform(10, 50), 2),
            "daily_forecast": round(rng.uniform(2000, 18000), 2),
            "monthly_forecast": round(rng.uniform(60000, 600000), 2),
            "yearly_forecast": round(rng.uniform(800000, 8000000), 2),
        }
        for pid in PLATFORM_IDS
    ]


# ============================== API çağrıları ==============================

def login() -> str:
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    r.raise_for_status()
    return r.json()["access_token"]


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def get_districts() -> list[dict]:
    r = requests.get(f"{API}/districts", timeout=15)
    r.raise_for_status()
    return r.json()


def get_neighborhoods(district_id: str) -> list[dict]:
    r = requests.get(f"{API}/districts/{district_id}/neighborhoods", timeout=15)
    r.raise_for_status()
    return r.json()


# ============================== Ana akış ==============================

def main():
    print("→ Login")
    token = login()
    H = auth(token)

    print("→ İlçeler + her ilçenin ilk 3 mahallesi")
    districts = get_districts()
    rows_per_district = []
    for d in districts:
        nbs = get_neighborhoods(d["id"])
        first3 = sorted(nbs, key=lambda n: n["name"])[:3]
        if not first3:
            continue
        rows_per_district.append({"district": d, "neighborhoods": first3})
    total_nbs = sum(len(d["neighborhoods"]) for d in rows_per_district)
    print(f"   {len(rows_per_district)} ilçe, {total_nbs} mahalle (ilk 3)")

    rng = random.Random(12345)
    # ---- 1) Restoranlar (mahalle başına 5) ----
    print(f"→ Restoranlar üretiliyor ({total_nbs * 5} hedef)…")
    restaurant_rows: list[dict] = []
    used_names = set()
    for entry in rows_per_district:
        d = entry["district"]
        for nb in entry["neighborhoods"]:
            for i in range(5):
                cat_id = rng.choice(ALL_CATEGORIES)
                base = rng.choice(NAME_BASES.get(cat_id, ["Restoran"]))
                name = f"{base} - {d['name']} - {nb['name']}"
                # benzersizleştir
                j = 1
                base_name = name
                while name in used_names:
                    j += 1
                    name = f"{base_name} {j}"
                used_names.add(name)

                platforms = [
                    {"platform_id": pid, "customers": rng.randint(80, 400)}
                    for pid in PLATFORM_IDS
                ]
                metrics = gen_restaurant_metrics(rng)
                analytics = gen_restaurant_analytics(rng)

                restaurant_rows.append({
                    "name": name,
                    "district_id": d["id"],
                    "neighborhood_id": nb["id"],
                    "category_id": cat_id,
                    "is_active": "true",
                    "platforms": json.dumps(platforms, ensure_ascii=False),
                    "restaurant_metrics": json.dumps(metrics, ensure_ascii=False),
                    "restaurant_analytics": json.dumps(analytics, ensure_ascii=False),
                })

    # CSV — tek dosyada her şey (gömülü JSON)
    rest_csv = OUT_DIR / "restaurants_full.csv"
    REST_FULL_COLS = [
        "name", "district_id", "neighborhood_id", "category_id", "is_active",
        "platforms", "restaurant_metrics", "restaurant_analytics",
    ]
    with rest_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=REST_FULL_COLS)
        w.writeheader()
        w.writerows(restaurant_rows)
    print(f"   {len(restaurant_rows)} satır → {rest_csv}")

    # ---- 2) Restoranları admin API ile import et (POST + nested) ----
    print(f"→ Restoranlar admin API'ye gönderiliyor…")
    created = updated = errors = 0
    for row in restaurant_rows:
        payload = {
            "name": row["name"],
            "district_id": row["district_id"],
            "neighborhood_id": int(row["neighborhood_id"]),
            "category_id": int(row["category_id"]),
            "is_active": True,
            "platforms": json.loads(row["platforms"]),
            "metrics": json.loads(row["restaurant_metrics"]),
            "analytics": json.loads(row["restaurant_analytics"]),
        }
        # İdempotent yaklaşım: önce list ile var mı bak, varsa PUT, yoksa POST
        # ama 585 satır için bu çok HTTP — basitleştir: POST'u dene, 409/duplicate olursa update et
        r = requests.post(f"{API}/admin/restaurants", json=payload, headers=H, timeout=15)
        if r.status_code == 201:
            created += 1
        else:
            # Try update by finding via name+district
            srch = requests.get(
                f"{API}/admin/restaurants",
                params={"search": payload["name"], "district_id": payload["district_id"]},
                headers=H, timeout=15,
            ).json()
            if srch.get("data"):
                rid = srch["data"][0]["id"]
                up = requests.put(f"{API}/admin/restaurants/{rid}", json=payload, headers=H, timeout=15)
                if up.status_code == 200:
                    updated += 1
                else:
                    errors += 1
                    if errors < 3:
                        print(f"   ✗ update fail {payload['name']}: {up.status_code} {up.text[:120]}")
            else:
                errors += 1
                if errors < 3:
                    print(f"   ✗ create fail {payload['name']}: {r.status_code} {r.text[:120]}")
    print(f"   ✓ created={created}, updated={updated}, errors={errors}")

    # ---- 3) Per-ilçe district_metrics + district_analytics (her kategori için) ----
    print("→ District metrics + analytics üretiliyor…")
    dm_rows = []
    da_rows = []
    for entry in rows_per_district:
        d = entry["district"]
        # Tüm kategoriler için bir district_metrics (cat_id=NULL → category bağımsız agregat)
        m = gen_restaurant_metrics(rng)
        dm_rows.append({
            "district_id": d["id"],
            "category_id": "",  # NULL = tüm kategoriler
            "period_date": PERIOD,
            **{k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v) for k, v in m.items()},
        })
        # Her platform için district_analytics (cat_id=NULL)
        for pid in PLATFORM_IDS:
            a = gen_restaurant_analytics(rng)[0]
            a["platform_id"] = pid
            da_rows.append({
                "district_id": d["id"],
                "category_id": "",
                "platform_id": pid,
                "period_date": PERIOD,
                "customers": rng.randint(500, 4000),
                "ad_budget": a["ad_budget"],
                "campaign_rate": a["campaign_rate"],
                "coupon_rate": a["coupon_rate"],
                "flash_rate": a["flash_rate"],
                "joker_rate": a["joker_rate"],
                "daily_forecast": a["daily_forecast"],
                "monthly_forecast": a["monthly_forecast"],
                "yearly_forecast": a["yearly_forecast"],
            })

    # ---- 4) Per-mahalle neighborhood_metrics + neighborhood_analytics (ilk 3) ----
    print("→ Neighborhood metrics + analytics üretiliyor (ilk 3 mahalle/ilçe)…")
    nm_rows = []
    na_rows = []
    for entry in rows_per_district:
        for nb in entry["neighborhoods"]:
            m = gen_restaurant_metrics(rng)
            nm_rows.append({
                "neighborhood_id": nb["id"],
                "category_id": "",
                "period_date": PERIOD,
                **{k: (json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v) for k, v in m.items()},
            })
            for pid in PLATFORM_IDS:
                a = gen_restaurant_analytics(rng)[0]
                na_rows.append({
                    "neighborhood_id": nb["id"],
                    "category_id": "",
                    "platform_id": pid,
                    "period_date": PERIOD,
                    "customers": rng.randint(150, 1500),
                    "ad_budget": a["ad_budget"],
                    "campaign_rate": a["campaign_rate"],
                    "coupon_rate": a["coupon_rate"],
                    "flash_rate": a["flash_rate"],
                    "joker_rate": a["joker_rate"],
                    "daily_forecast": a["daily_forecast"],
                    "monthly_forecast": a["monthly_forecast"],
                    "yearly_forecast": a["yearly_forecast"],
                })

    # CSV'lere yaz
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

    def write_csv(name, rows, cols):
        p = OUT_DIR / name
        with p.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerows(rows)
        return p

    da_p = write_csv("district_analytics_full.csv", da_rows, DA_COLS)
    na_p = write_csv("neighborhood_analytics_full.csv", na_rows, NA_COLS)
    dm_p = write_csv("district_metrics_full.csv", dm_rows, DM_COLS)
    nm_p = write_csv("neighborhood_metrics_full.csv", nm_rows, NM_COLS)
    print(f"   {len(da_rows)} district_analytics → {da_p.name}")
    print(f"   {len(na_rows)} neighborhood_analytics → {na_p.name}")
    print(f"   {len(dm_rows)} district_metrics → {dm_p.name}")
    print(f"   {len(nm_rows)} neighborhood_metrics → {nm_p.name}")

    # ---- 5) CSV'leri admin API'ye import et ----
    print("→ District/Neighborhood CSV'leri import ediliyor…")
    for path, route in [
        (da_p, "/admin/analytics/district/csv"),
        (na_p, "/admin/analytics/neighborhood/csv"),
        (dm_p, "/admin/metrics/district/csv"),
        (nm_p, "/admin/metrics/neighborhood/csv"),
    ]:
        with path.open("rb") as f:
            r = requests.post(f"{API}{route}", files={"file": (path.name, f, "text/csv")}, headers=H, timeout=60)
        if r.ok:
            j = r.json()
            print(f"   ✓ {path.name}: created={j.get('created',0)} updated={j.get('updated',0)} skipped={j.get('skipped',0)}")
        else:
            print(f"   ✗ {path.name}: {r.status_code} {r.text[:150]}")

    print("\n✓ DONE")


if __name__ == "__main__":
    main()
