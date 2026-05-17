# OpenCard

Türkçe B2B yemek platformu kontrol paneli. İstanbul ilçe + mahalle bazlı analytics, restoran yönetimi, sadakat programı ve yorum analitiği için multi-tenant uygulama.

## Sistem bileşenleri

| Servis | Port (dev) | Stack |
|---|---|---|
| `backend/` | 8003 | FastAPI · SQLAlchemy (async) · **PostgreSQL 15** · Alembic |
| `frontend/` | 5173 | React · Vite · Tailwind · daisyUI · Recharts |
| `admin/` | 5181 | React · Vite · Tailwind · daisyUI |

Üç servis bağımsız çalışır, tek backend her ikisini de besler.

---

## 1. Gereksinimler

- **Python 3.12+**
- **Node.js 20+** ve **npm**
- **PostgreSQL 15+**
- Git

Mac'te kurulum:
```bash
brew install python@3.12 node postgresql@15
brew services start postgresql@15
```

---

## 2. Repo'yu klonla

```bash
git clone https://github.com/Serkann123/opencard.git
cd opencard
```

---

## 3. Backend kurulumu

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
```

### `.env` dosyası

```bash
cp .env.example .env
```

`.env.example`'taki varsayılan PostgreSQL bağlantısı dev için yeterli:
```
DATABASE_URL=postgresql+asyncpg://opencard:opencard@localhost:5432/opencard
```

Prod'da `SECRET_KEY`, `ADMIN_DEFAULT_PASSWORD` ve DB şifresi mutlaka değiştirilmeli.

### PostgreSQL kurulumu (ilk kez)

```bash
# Brew servisi zaten çalışıyor olmalı
brew services start postgresql@15

# Role + DB yarat
psql postgres <<'SQL'
CREATE ROLE opencard WITH LOGIN PASSWORD 'opencard' CREATEDB;
CREATE DATABASE opencard OWNER opencard ENCODING 'UTF8';
SQL

# Test
PGPASSWORD=opencard psql -h localhost -U opencard -d opencard -c "SELECT version();"
```

### Şema + seed

```bash
cd backend
.venv/bin/python -m scripts.init_local_db        # şema (Base.metadata.create_all)
.venv/bin/python -m scripts.seed_admin           # admin kullanıcı
.venv/bin/python -m scripts.seed_neighborhoods   # 39 ilçe + ~874 mahalle
.venv/bin/python -m scripts.seed_local           # kategori + platform
.venv/bin/python ../scripts/generate_synthetic.py  # 195 restoran + analytics + metrics
```

> Eski SQLite kurulumundan geliyorsan: [scripts/migrate_to_postgres.py](backend/scripts/migrate_to_postgres.py) mevcut `opencard_dev.db` içeriğini Postgres'e taşır.

### Backend'i başlat

```bash
.venv/bin/uvicorn app.main:app --port 8003 --reload
```

Sağlık kontrolü: <http://localhost:8003/health>
Swagger UI: <http://localhost:8003/docs>

---

## 4. Frontend (public dashboard)

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8003" > .env.development
npm run dev
```

Açılış: <http://localhost:5173>

---

## 5. Admin panel

```bash
cd admin
npm install
echo "VITE_API_URL=http://localhost:8003" > .env.development
npm run dev
```

Açılış: <http://localhost:5181>

### Admin giriş bilgileri (dev varsayılan)

| Alan | Değer |
|---|---|
| URL | <http://localhost:5181/login> |
| E-posta | `admin@opencard.com` |
| Şifre | `opencard123` |

`backend/.env`'deki `ADMIN_DEFAULT_*` değişkenlerinden okunur, `seed_admin.py` çalıştığında DB'ye yazılır. Prod'da mutlaka değiştir.

---

## 6. Tema

Hem public hem admin **karanlık tema** (`opencarddark`) ile gelir. daisyUI custom theme tanımı [frontend/src/index.css](frontend/src/index.css) ve [admin/src/index.css](admin/src/index.css) içinde. Koyu mavi-siyah zemin, turuncu primary vurgu.

`<html data-theme="opencarddark">` her iki `index.html`'de set edilmiş — FOUC yok.

---

## 7. Veri akışı

### Cascade mantığı (önemli)

Public dashboard verileri **3 katmanlı cascade** ile beslenir:

1. **Restaurant-bazlı** (`restaurant_metrics`, `restaurant_analytics`) — bir restoran admin'den özel veri girildiyse en yüksek öncelik
2. **Neighborhood-bazlı** (`neighborhood_metrics`, `neighborhood_analytics`) — mahalle + kategori kombinasyonu
3. **District-bazlı** (`district_metrics`, `district_analytics`) — ilçe + kategori (fallback)

Her alan ayrı ayrı resolve edilir: `restaurant_value || neighborhood_value || district_value || empty`. Public API response'unda `analytics_source` ve `metrics_source` alanları kaynak seviyesini bildirir (`"restaurant" | "neighborhood" | "district_fallback" | "none"`).

### Platform Müşteri Dağılımı — restoranlardan summed

Dashboard'daki "Platform Müşteri Dağılımı" kartı, analytics tablosundan değil **aktif restoranların `platforms[].customers` toplamından** beslenir. Yani admin'de restoran müşteri sayısını değiştirince ana sayfa anında yansır.

---

## 8. Admin panel sayfaları

| Sayfa | Açıklama |
|---|---|
| **Dashboard** | Özet kartlar |
| **Veri Girişi** | Tek sayfada district + mahalle × kategori bazlı 11 alan (dashboard kartlarıyla aynı düzen). [Analytics + Metrics birleşimi] |
| **Restaurants** | Restoran CRUD + restaurant-level metric/analytics override (Faz 3). Sil + Pasifleştir + Aktifleştir. |
| **Case Studies** | Başarı hikayeleri (CSV export only, manuel + Sil/Pasifleştir/Aktifleştir) |
| **Applications** | Kurye başvuruları (admin'den de oluşturulabilir, düzenlenebilir) |
| **Categories** | 18 kategori (negatif sort_order engeli) |
| **Platforms** | Yemeksepeti/Getir/Trendyol — name normalize edilmiş duplicate kontrolü |
| **Districts** | 39 İstanbul ilçesi + ~874 mahalle. **"Sadece verisi olanlar"** toggle ile filtreleme |
| **Sadakat** | Loyalty sayfası içeriğini yönet (~20 alan + N feature card) |

---

## 9. CSV import / export

### Hangi sayfada hangi CSV var?

| Admin sayfası | CSV dosyası | Açıklama |
|---|---|---|
| Restaurants | `restaurants.csv` | name, district_id, **neighborhood_id**, category_id, is_active, platforms (JSON) |
| Veri Girişi → Analytics | `district_analytics.csv` / `neighborhood_analytics.csv` | platform × bütçe × forecast |
| Veri Girişi → Metrics | `district_metrics.csv` / `neighborhood_metrics.csv` | iptal/iade/heatmap/yorum (JSON sütunlar) |
| Analytics → Rakip | `competitors.csv` | rakip platform performansı |

### CSV tolerance

CSV import **tolerant**: eksik sütun → warning, satır atlanmaz; bozuk satır → skip + rapor. Response: `{ created, updated, skipped, warnings, errors }`.

### Hızlı sentetik veri üretimi

```bash
cd backend
.venv/bin/python ../scripts/generate_synthetic.py   # 195 restoran + analytics + metrics
```

Bu script backend ayağa kalkmışken `/admin/...` endpoint'lerine POST yapar.

---

## 10. Admin'de manuel veri girişi

CSV gerekmez. Tüm tablolar için admin'de manuel form var:

- **Veri Girişi sayfası**: tek scope seçimi (ilçe/mahalle × kategori × dönem) altında 11 kartlı form — dashboard layout'unun aynası
- **Restaurants**: temel alanlar + Faz 3 metric/analytics override
- **Heatmap editor**: 7×24 tıklamalı 5-renkli grid (KVKK uyumlu)
- **Courier comparison editor**: restoran kuryesi vs kendi kuryen yapılandırılmış form
- **Feature cards**: Sadakat sayfası için dinamik kart listesi (ekle/sil/sırala)

---

## 11. Klasör yapısı

```
opencard/
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy modelleri
│   │   │   ├── restaurant.py # Restaurant, RestaurantPlatform, RestaurantMetrics, RestaurantAnalytics
│   │   │   ├── analytics.py  # DistrictAnalytics, NeighborhoodAnalytics
│   │   │   ├── metrics.py    # DistrictMetrics, NeighborhoodMetrics, SiteSettings
│   │   │   └── ...
│   │   ├── routers/
│   │   │   ├── admin/        # JWT korumalı admin endpoint'leri
│   │   │   └── ...           # Public endpoint'ler
│   │   ├── schemas/          # Pydantic şemaları
│   │   ├── services/         # csv_service, restaurant_service, storage_service
│   │   └── main.py
│   ├── scripts/
│   │   ├── seed_*.py
│   │   ├── init_local_db.py
│   │   └── migrate_to_postgres.py  # SQLite → Postgres tek-shot
│   ├── alembic/              # Migrations (versions/ şimdilik boş — create_all kullanılıyor)
│   └── media/                # Yüklenen görseller (case studies)
│
├── admin/                    # Yönetim paneli (React)
│   └── src/
│       ├── pages/            # Dashboard, DataEntry, Restaurants, Districts, Sadakat, …
│       ├── components/
│       │   ├── layout/       # AdminLayout, Sidebar, ErrorBoundary
│       │   └── ui/           # HeatmapEditor, CourierComparisonEditor, DataTable, FormModal …
│       └── api/              # client.js + per-resource helpers
│
├── frontend/                 # Public landing + dashboard (React)
│   └── src/
│       ├── components/       # IstanbulMap, Kiyaslama, PlatformDonutCard, LoyaltyPage …
│       └── pages/            # HomePage, ApplyPage, NotFoundPage
│
├── synthetic_csves/          # 195 restoran + analytics + metrics test verisi (neighborhood_id dahil)
├── examples/                 # CSV şablonları (kolon kontratları)
├── scripts/                  # generate_synthetic.py, csv_fill_neighborhood.py
├── test_plans/               # Manuel test senaryoları (markdown)
└── POSTGRES_MIGRATION_PLAN.md  # SQLite → Postgres geçiş tarihçesi (✅ tamamlandı)
```

---

## 12. Temel kavramlar

- **Analytics** — platform bazlı veriler (her ilçe × kategori × platform × dönem için müşteri sayısı, bütçe, tahmin)
- **Metrics** — platform bağımsız aggregate veriler (iptal/iade oranları, performans skoru, kıyaslama, saatlik heatmap, yorum analizi, kurye karşılaştırması)
- **Restaurant-level override** (Faz 3) — bir restoran admin'den özel metric/analytics girildiyse cascade'in tepesinde durur
- **Case Studies** — anasayfada gösterilen başarı hikayeleri (önce/sonra metrikleri + görsel)
- **Applications** — kurye başvuruları (public form → admin'de listelenir, manuel oluşturulabilir, düzenlenebilir)
- **Site Settings** — Sadakat sayfasındaki tüm metinler, görseller, statlar ve feature cards (dinamik)
- **Cascade** — Restaurant → Neighborhood → District alan-bazlı fallback

---

## 13. Yetkilendirme

Backend JWT (HS256) tabanlı. İki endpoint:
- `POST /auth/login` — JSON body (`email`, `password`) — frontend admin paneli kullanır
- `POST /auth/token` — Form-encoded (OAuth2 password flow) — Swagger UI "Authorize" butonu kullanır

Token Authorization header'da `Bearer <token>` olarak gönderilir.

---

## 14. Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|---|---|
| `Address already in use` (port 8003/5173/5181) | `lsof -ti:<port> \| xargs kill -9` |
| Admin'de "401 Unauthorized" | Token süresi dolmuş — admin'den çıkıp tekrar giriş yap |
| Frontend'de "API 500" | Backend ayakta mı? `curl http://localhost:8003/health` |
| "Bu seçim için veri yok" banner'ı | Mahalle × kategori için Analytics/Metrics girilmemiş; cascade ile ilçe verisinden çekilecek veya admin'den giriş gerek |
| CSV import "Eksik sütun" uyarısı | Eksik sütun varsa import yine geçer (warning); kolon başlıkları `examples/` veya `synthetic_csves/` ile birebir aynı olmalı |
| `Module 'requests' not found` (generate_synthetic.py) | `cd backend && .venv/bin/pip install requests` |
| Postgres'e bağlanamıyor | `brew services list` → postgresql@15 started mi? `psql -U opencard -d opencard -h localhost` ile test |

---

## 15. Yol haritası / yapılan büyük güncellemeler

- ✅ SQLite → PostgreSQL geçişi (2026-05-17) — bkz. [POSTGRES_MIGRATION_PLAN.md](POSTGRES_MIGRATION_PLAN.md)
- ✅ Restaurant-level metric/analytics override (Faz 3)
- ✅ Cascade dashboard endpoint (restaurant → neighborhood → district)
- ✅ Heatmap interactive grid editor (KVKK uyumlu)
- ✅ Loyalty page tamamen dinamik (hero, stats, features, cards)
- ✅ Custom dark theme (opencarddark)
- ✅ Veri Girişi unified page (Analytics + Metrics birleşimi)
- ⏳ Alembic baseline migration (versions/ şu an boş, `create_all` kullanılıyor)
- ⏳ Integration test suite

---

## 16. API dökümantasyonu

Backend çalışırken Swagger UI: <http://localhost:8003/docs>

"Authorize" butonu (sağ üst) → username = admin email, password = admin şifresi. Token otomatik tüm `/admin/*` isteklerine eklenir.
