# OpenCard

Türkçe B2B yemek platformu kontrol paneli. İstanbul ilçe + mahalle bazlı analytics, restoran yönetimi, sadakat programı ve yorum analitiği için multi-tenant uygulama.

## Sistem bileşenleri

| Servis | Port (dev) | Stack |
|---|---|---|
| `backend/` | 8003 | FastAPI · SQLAlchemy (async) · **PostgreSQL 15** · Alembic |
| `frontend/` | 5173 | React · Vite · Tailwind · daisyUI · Recharts |
| `admin/` | **5181** | React · Vite · Tailwind · daisyUI |

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

Dev için varsayılan PostgreSQL bağlantısı yeterli:
```
DATABASE_URL=postgresql+asyncpg://opencard:opencard@localhost:5432/opencard
```

### PostgreSQL ilk kurulum

```bash
brew services start postgresql@15

psql postgres <<'SQL'
CREATE ROLE opencard WITH LOGIN PASSWORD 'opencard' CREATEDB;
CREATE DATABASE opencard OWNER opencard ENCODING 'UTF8';
SQL

PGPASSWORD=opencard psql -h localhost -U opencard -d opencard -c "SELECT version();"
```

### Şema + seed

```bash
cd backend
.venv/bin/python -m scripts.init_local_db        # şema (Base.metadata.create_all)
.venv/bin/python -m scripts.seed_admin           # admin kullanıcı
.venv/bin/python -m scripts.seed_neighborhoods   # 39 ilçe + ~874 mahalle
.venv/bin/python -m scripts.seed_local           # kategori + platform
```

### Backend'i başlat

```bash
.venv/bin/uvicorn app.main:app --port 8003 --reload
```

- Sağlık kontrolü: <http://localhost:8003/health>
- Swagger UI: <http://localhost:8003/docs>

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

Prod'da `backend/.env` içindeki `ADMIN_DEFAULT_*` ve `SECRET_KEY` mutlaka değiştirilmeli.

---

## 6. Tema

Hem public hem admin **karanlık tema** (`opencarddark`) ile gelir; light tema da var. daisyUI custom theme tanımı [frontend/src/index.css](frontend/src/index.css) ve [admin/src/index.css](admin/src/index.css) içinde. `<html data-theme="opencarddark">` her iki `index.html`'de set edilmiş — FOUC yok.

**Kural:** Aydınlık modda yazılar siyah, karanlık modda beyaz. Hardcoded `text-white`/`text-black` yerine `text-base-content` kullan; renkli arka plan üzerinde kasıtlı kontrast renkleri kabul edilir.

---

## 7. Veri akışı

### Cascade mantığı

Public dashboard verileri **3 katmanlı cascade** ile beslenir:

1. **Restaurant-bazlı** (`restaurant_metrics`, `restaurant_analytics`) — bir restoran admin'den özel veri girildiyse en yüksek öncelik
2. **Neighborhood-bazlı** (`neighborhood_metrics`, `neighborhood_analytics`) — mahalle + kategori kombinasyonu
3. **District-bazlı** (`district_metrics`, `district_analytics`) — ilçe + kategori (fallback)

Her alan ayrı ayrı resolve edilir: `restaurant_value || neighborhood_value || district_value || empty`. Public API response'unda `analytics_source` ve `metrics_source` alanları kaynak seviyesini bildirir.

### Platform Müşteri Dağılımı

Dashboard'daki "Platform Müşteri Dağılımı" kartı, analytics tablosundan değil **aktif restoranların `platforms[].customers` toplamından** beslenir.

---

## 8. Admin panel sayfaları

| Sayfa | Açıklama |
|---|---|
| **Dashboard** | Özet kartlar |
| **Veri Girişi** | Tek sayfada district/neighborhood × kategori × dönem; dashboard layout'unun aynası |
| **Restaurants** | Restoran CRUD + restaurant-level metric/analytics override |
| **Case Studies** | Başarı hikayeleri (görsel + before/after metrikler) |
| **Applications** | Kurye başvuruları |
| **Categories** | 18+ kategori |
| **Platforms** | Yemeksepeti / Trendyol / Getir |
| **Districts** | 39 İstanbul ilçesi + ~874 mahalle |
| **Sadakat** | Loyalty sayfası içeriğini yönet (stats + hero + 6 feature card) |

---

## 9. CSV import / export — **Flat şema** (Mayıs 2026)

Tüm CSV'ler **flat** — hiçbir hücrede JSON/dict/list yok. Her sütun saf skaler (yazı veya rakam). Sabit-uzunluklu yapılar (cancel sebepleri, heatmap, vb.) prefix'li çoklu sütunlara açılır.

### 5 CSV dosyası

| CSV | Sütun | Endpoint | Ne içerir |
|---|---|---|---|
| `restaurants.csv` | 9 | `/admin/restaurants/csv` | Restoran adı + ilçe + 3 platform müşteri sayısı |
| `data_entry_district.csv` | **262** | `/admin/data-entry/csv/{import,export}?scope=district` | İlçe × kategori × dönem için TÜM analytics + metrics (analytics 27 + scaler 13 + cancel 5 + return 4 + rating 10 + courier 8 + neg_platform 3 + word_cloud 20 + heatmap 168) |
| `data_entry_neighborhood.csv` | **263** | `/admin/data-entry/csv/...?scope=neighborhood` | Aynısı + `neighborhood` sütunu |
| `case_studies.csv` | 20 | `/admin/case-studies/csv` | Başarı hikayeleri (5 slot before_complaint + 5 slot after_improvement) |
| `loyalty.csv` | 27 | `/admin/loyalty/csv` | Sadakat sayfası içeriği (stats + hero + 6 slot feature card) |

### Şema kaynağı (tek doğruluk noktası)

- [backend/app/services/metric_schemas.py](backend/app/services/metric_schemas.py) — sabit etiketler + slot sayıları (PLATFORM_KEYS, CANCEL_REASON_SCHEMA, RETURN_REASON_SCHEMA, RATING_STARS, WORD_SLOTS, CASE_STUDY_SLOTS, FEATURE_CARD_SLOTS, DAY_KEYS/HOUR_KEYS)
- [backend/app/services/csv_service.py](backend/app/services/csv_service.py) — kolon listeleri + flatten/unflatten helpers
- Yeni sebep/slot eklemek için `metric_schemas.py`'yi düzenle, sonra `python scripts/build_example_csvs.py` ile örnekleri yeniden üret

### Görseller CSV'de DEĞİL

CSV'lerde URL/binary yok. Görseller admin'den ayrı upload edilir:
- `restaurants` — görsel yok
- `case_studies` — `before_image_url`, `after_image_url` (admin form)
- `loyalty` — `loyalty_hero_bg_url` + her feature card için `image_url`

### Örnek dosyalar

`examples/` klasöründe 5 hazır CSV. Yeniden üretmek için:
```bash
python scripts/build_example_csvs.py
```

### CSV tolerance

- Eksik sütun → warning, satır atlanmaz (default değer)
- Boş satır → atlanır + uyarı
- NOT NULL ihlali (örn. district_id boş) → satır skip + hata
- FK referansı yoksa (örn. district yok) → satır skip + hata
- Min/Max ihlali → değer kabul edilir, uyarı

Response formatı: `{ created, updated, skipped, warnings, errors }`

---

## 10. Admin'de manuel veri girişi

CSV gerekmez. Tüm tablolar için admin'de manuel form var:

- **Veri Girişi sayfası**: scope (ilçe/mahalle × kategori × dönem) altında 11 kartlı form
- **Restaurants**: temel alanlar + restaurant-bazlı override
- **Heatmap editor**: 7×24 tıklamalı 5-renkli grid (KVKK uyumlu)
- **Courier comparison editor**: yapılandırılmış form
- **Feature cards**: Sadakat sayfası için 6 slot

---

## 11. Klasör yapısı

```
opencard/
├── backend/
│   ├── app/
│   │   ├── models/                 # SQLAlchemy modelleri
│   │   ├── routers/
│   │   │   ├── admin/              # JWT korumalı endpoint'ler
│   │   │   │   ├── data_entry.py   # CSV import/export (district+neighborhood)
│   │   │   │   ├── loyalty.py      # SiteSettings + CSV
│   │   │   │   ├── case_studies.py # 5-slot CSV
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── csv_service.py      # Flat CSV kolon listeleri + flatten/unflatten
│   │   │   ├── metric_schemas.py   # Sabit etiketler + slot sayıları
│   │   │   └── ...
│   │   └── main.py
│   ├── scripts/
│   │   ├── seed_*.py
│   │   └── init_local_db.py
│   └── alembic/
│
├── admin/                          # Yönetim paneli (React, port 5181)
├── frontend/                       # Public dashboard (React, port 5173)
│
├── examples/                       # 5 örnek CSV (flat şema)
│   ├── restaurants.csv             # 9 sütun
│   ├── data_entry_district.csv     # 262 sütun
│   ├── data_entry_neighborhood.csv # 263 sütun
│   ├── case_studies.csv            # 20 sütun
│   └── loyalty.csv                 # 27 sütun
│
├── scripts/
│   ├── build_example_csvs.py       # Örnek CSV'leri programatik üretir
│   └── generate_synthetic.py       # Synthetic veri (eski format — kullanma)
│
├── sunum/                          # Saha/müdür için CSV sunumu + örnekler
└── SAHA_REHBERI.md                 # Saha ekibi için Türkçe rehber
```

---

## 12. Temel kavramlar

- **Analytics** — platform bazlı veriler (ilçe × kategori × platform × dönem için müşteri/bütçe/tahmin)
- **Metrics** — platform bağımsız aggregate veriler (iptal/iade, performans, kıyaslama, heatmap, yorum)
- **Restaurant-level override** — restoran admin'den özel veri girildiyse cascade'in tepesi
- **Case Studies** — anasayfada başarı hikayeleri (önce/sonra metrik + görsel)
- **Site Settings** — Sadakat sayfasındaki tüm metinler/görseller/statlar
- **Cascade** — Restaurant → Neighborhood → District alan-bazlı fallback
- **Flat CSV** — JSON-free şema; nested yapılar prefix'li sütunlara açılır (Mayıs 2026)

---

## 13. Yetkilendirme

Backend JWT (HS256) tabanlı. İki endpoint:
- `POST /auth/login` — JSON body (`email`, `password`)
- `POST /auth/token` — Form-encoded (OAuth2 password flow) — Swagger UI "Authorize" butonu

Token Authorization header'da `Bearer <token>` olarak gönderilir.

---

## 14. Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|---|---|
| `Address already in use` (8003/5173/5181) | `lsof -ti:<port> \| xargs kill -9` |
| Admin'de "401 Unauthorized" | Token süresi dolmuş — admin'den çıkıp tekrar giriş yap |
| Frontend'de "API 500" | `curl http://localhost:8003/health` |
| "Bu seçim için veri yok" banner | Mahalle × kategori için veri yok; cascade fallback veya admin'den giriş |
| CSV import "Eksik sütun" | Eksik sütun → warning, default değer atanır; başlıklar `examples/`'le aynı olmalı |
| Postgres'e bağlanamıyor | `brew services list` → postgresql@15 started; `psql -U opencard -d opencard -h localhost` |
| `Module 'requests' not found` | `cd backend && .venv/bin/pip install requests` |

---

## 15. Yol haritası / büyük güncellemeler

- ✅ SQLite → PostgreSQL geçişi (2026-05-17)
- ✅ Restaurant-level override
- ✅ Cascade dashboard endpoint
- ✅ Heatmap interactive grid editor (KVKK uyumlu)
- ✅ Loyalty page dinamik (hero, stats, features, cards)
- ✅ Custom dark theme (opencarddark)
- ✅ Veri Girişi unified page
- ✅ **Flat CSV mimarisi** (2026-05-21) — 5 CSV, JSON-free, slot-tabanlı
- ⏳ Alembic baseline migration
- ⏳ Integration test suite

---

## 16. API dökümantasyonu

Backend çalışırken Swagger UI: <http://localhost:8003/docs>

"Authorize" butonu (sağ üst) → username = admin email, password = admin şifresi. Token otomatik tüm `/admin/*` isteklerine eklenir.

---

## 17. İlgili dokümanlar

- [SAHA_REHBERI.md](SAHA_REHBERI.md) — Saha ekibi için Türkçe operasyonel rehber
- [sunum/CSV_KILAVUZU.md](sunum/CSV_KILAVUZU.md) — Müdür sunumu: CSV alanları + örnekler
- [POSTGRES_MIGRATION_PLAN.md](POSTGRES_MIGRATION_PLAN.md) — SQLite → Postgres geçiş tarihçesi
