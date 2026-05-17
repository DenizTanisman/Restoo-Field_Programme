# Postgres'e Geçiş Planı

> **Durum**: ✅ **TAMAMLANDI** — 2026-05-17
> **Aktif DB**: PostgreSQL 15 (native, brew, `localhost:5432/opencard`)
> **Sonuç**: 2265 satır SQLite'tan Postgres'e taşındı, tüm endpoint'ler doğrulandı.
> **SQLite backup**: `backend/opencard_dev.db.backup-20260517-010804` (rollback için)

## ✅ Yapılan iş özeti (2026-05-17)

| Adım | Sonuç |
|---|---|
| 1. SQLite backup | `opencard_dev.db` → `opencard_dev.db.backup-20260517-010804` |
| 2. Postgres servisi | native PG 15 (brew, zaten kuruluydu) |
| 3. Role + DB | `CREATE ROLE opencard / CREATE DATABASE opencard OWNER opencard` |
| 4. Şema | `Base.metadata.create_all()` ile 17 tablo |
| 5. Veri taşıma | `backend/scripts/migrate_to_postgres.py` ile 2265 satır |
| 6. Sequence reset | `pg_get_serial_sequence` ile 15 sequence max(id)+1'e set |
| 7. Cutover | `.env` Postgres'e çevrildi, backend restart |
| 8. Smoke test | 6/6 geçti (restoran, cascade dashboard, district analytics, site-settings, data-coverage, heatmap) |
| 9. Docs | README, `.env.example`, bu plan güncellendi |

### Veri sayıları (taşıma sonrası)
- admin_users: 1, categories: 18, platforms: 3
- districts: 39, neighborhoods: 874
- restaurants: 208 (orijinal 195 + test eklenen 13)
- restaurant_platforms: 599
- restaurant_metrics: 1 (DEnemeeee), restaurant_analytics: 1
- district_analytics: 119, neighborhood_analytics: 117
- district_metrics: 40, neighborhood_metrics: 39
- competitors: 195, case_studies: 4, applications: 6
- site_settings: 1 (loyalty content dolu)

---

## 📜 Tarihçe — geçiş öncesi denetim notları (referans için)

> Aşağıdaki bölüm geçiş öncesi yapılan denetimin notlarıdır. Şu an artık geçerli değil ama gelecekte benzer bir geçiş gerekirse referans olur.

---

## 0. Geçişe başlamadan ÖNCE tekrar doğrulanması gerekenler

Bu denetim sırasında SQLite üzerinde manuel `ALTER TABLE` ile yapılan değişiklikler şunlardı — Postgres'e geçişten önce **ORM modellerinin ve DB şemasının uyumlu olduğunu doğrula**:

- [ ] `restaurants` tablosuna `neighborhood_id INTEGER NULL REFERENCES neighborhoods(id)` eklendi
  - Konum: [backend/app/models/restaurant.py:14](backend/app/models/restaurant.py)
  - Index: `ix_restaurants_neighborhood_id`
- [ ] Yeni tablo `restaurant_metrics` (1:1 Restaurant, ~20 alan, 7 JSON)
  - Model: `RestaurantMetrics` — [backend/app/models/restaurant.py](backend/app/models/restaurant.py)
- [ ] Yeni tablo `restaurant_analytics` (Restaurant × Platform, budget + forecast)
  - Model: `RestaurantAnalytics`, unique constraint `(restaurant_id, platform_id)`
- [ ] Geçiş anında olası ek şema değişikliklerini taramak için:
  ```bash
  cd backend
  .venv/bin/python -c "
  from sqlalchemy import inspect
  from app.database import engine
  from app.models import Base
  import asyncio
  async def main():
      async with engine.connect() as conn:
          tables = await conn.run_sync(lambda c: inspect(c).get_table_names())
          print('DB tabloları:', sorted(tables))
          print()
          print('Model tabloları:', sorted(Base.metadata.tables.keys()))
  asyncio.run(main())
  "
  ```
  Bu iki listenin eşleşmesi şart.

- [ ] Son commit'ten sonra eklenen kolonlar/tablolar Alembic migration'ında **otomatik** algılansın diye `git diff HEAD~10 -- backend/app/models/` çıktısını oku.

---

## 1. Mevcut durum (Ekim 2026)

### Aktif DB
- **SQLite** via `aiosqlite` async driver
- Dosya: `backend/opencard_dev.db` (~668 KB, git'e dahil)
- [backend/.env:8](backend/.env): `DATABASE_URL=sqlite+aiosqlite:///./opencard_dev.db`

### Driver desteği
- [backend/requirements.txt](backend/requirements.txt) → `aiosqlite` + `asyncpg` ikisi de yüklü
- `database.py` engine `create_async_engine()` ile dialect-agnostic

### Şema yönetimi
- Dev: `Base.metadata.create_all()` via `scripts/init_local_db.py`
- Prod: **Alembic var ama versions/ klasörü boş** — migration yazılmamış
- Son Faz 3 değişiklikleri (neighborhood_id + 2 yeni tablo) doğrudan SQL ile uygulandı; ORM modelleri güncellendi

---

## 2. Geçişe ENGEL noktalar

### 2.1 — Postgres-specific schema arg'ları
- `postgresql_nulls_not_distinct=True` iki yerde:
  - [backend/app/models/analytics.py:16](backend/app/models/analytics.py#L16) — DistrictAnalytics
  - [backend/app/models/analytics.py:56](backend/app/models/analytics.py#L56) — NeighborhoodAnalytics
- SQLAlchemy'nin `postgresql_*` prefix'li argümanları SQLite'ta otomatik ignore ettiği için **şu an sorun çıkarmıyor**. Postgres'te aktif olacak — semantik kontrol et: bu constraint NULL'ları unique sayar; mevcut SQLite verisi bunu ihlal ediyor olabilir.

### 2.2 — Alembic migration tarihçesi yok
- `backend/alembic/versions/` boş
- Tüm şema `metadata.create_all()` ile inşa ediliyor (idempotent, ama versiyon takibi yok)
- Bu olmadan prod deploy'da downtime'sız upgrade mümkün değil

### 2.3 — Son şema değişiklikleri
Yukarıda Bölüm 0'da listelendi. Migration'da bunların görünür olmasını sağla.

### 2.4 — Test suite yok
- `tests/`, `pytest.ini`, `conftest.py` **yok**
- Geçiş sonrası regresyon manuel doğrulamayla yapılacak (Swagger + UI smoke test)

---

## 3. Zaten cross-DB olan yerler (değişiklik gerekmez)

- ✅ Tüm router'lar SQLAlchemy ORM; raw SQL yok
- ✅ `ilike`, `func.lower`, `func.now`, `func.count` her iki DB'de çalışır
- ✅ `import sqlite3` veya `PRAGMA` çağrısı yok
- ✅ JSON sütunları opaque blob — path query yok (Postgres'te `JSON` tipi yeterli, `JSONB`'ye yükseltme opsiyonel)
- ✅ `DateTime(timezone=True)` her yerde (Postgres native TZ)
- ✅ `CaseStudy._StrList` dialect-aware (`ARRAY.with_variant(JSON, "sqlite")`) — gelecek için örnek desen
- ✅ Seed scriptleri ORM kullanıyor, idempotent
- ✅ `docker-compose.yml` zaten `postgres:16-alpine` servisli, healthcheck dahil
- ✅ `requirements.txt` Alembic + asyncpg dahil

---

## 4. Geçiş adımları (Postgres karar verildiğinde)

### Adım 1 — Hazırlık (10 dk)
```bash
# SQLite veritabanını yedekle
cp backend/opencard_dev.db backend/opencard_dev.db.backup-$(date +%Y%m%d)

# Postgres'i Docker ile ayağa kaldır
docker compose up -d db

# Bağlantıyı test et
docker compose exec db psql -U postgres -c "SELECT version();"
```

### Adım 2 — Schema kontrolü (10 dk)
- Bölüm 0'daki doğrulama scriptini çalıştır
- Tüm modeller `Base.metadata.tables` içinde olduğundan emin ol

### Adım 3 — Alembic migration (1-2 saat)
```bash
cd backend
# Postgres'e geçici olarak boş bir DB ile bağlan
export DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5436/opencard

# İlk autogenerate migration
.venv/bin/alembic revision --autogenerate -m "Initial schema (faz 3 dahil)"

# Üretilen dosyayı GÖZDEN GEÇİR:
# - postgresql_nulls_not_distinct doğru basıldı mı?
# - Tüm 15 tablo dahil mi?
# - neighborhood_id, restaurant_metrics, restaurant_analytics var mı?
# - JSON tipler doğru mu?

# Test et (Postgres boş DB'de)
.venv/bin/alembic upgrade head

# Tabloların oluştuğunu doğrula
docker compose exec db psql -U postgres -d opencard -c "\dt"
```

### Adım 4 — Veri aktarımı (30 dk - 2 saat, kapsama göre)

#### Seçenek A — Sıfırdan seed (mevcut dev verisini koruma)
```bash
# Postgres'i temizle, migration'ı yeniden uygula
.venv/bin/alembic upgrade head
.venv/bin/python -m scripts.seed_admin
.venv/bin/python -m scripts.seed_neighborhoods
.venv/bin/python -m scripts.seed_local
.venv/bin/python ../scripts/generate_synthetic.py
```

#### Seçenek B — Mevcut SQLite verisini taşı
- pgloader veya sqlite3 + manual COPY
- Detaylı plan ihtiyaca göre yazılır

### Adım 5 — Cutover (10 dk)
```bash
# .env'de DATABASE_URL'yi Postgres'e çevir
# Backend'i restart et
lsof -ti:8003 | xargs -r kill -9
.venv/bin/uvicorn app.main:app --port 8003 --reload
```

### Adım 6 — Smoke test (1 saat manuel)
- [ ] Admin login (admin@opencard.com / opencard123)
- [ ] Tüm admin sayfaları: Restaurants, Analytics, Metrics, Case Studies, Applications, Categories, Platforms, Districts, Settings
- [ ] Restoran ekle (mahalle + metrics + analytics dahil — Faz 3)
- [ ] Public dashboard: Search "DEnemeeee" → cascade dashboard çağrısı
- [ ] CSV import + export
- [ ] Görsel upload (case study)

### Adım 7 — Opsiyonel iyileştirmeler (gelecekteki PR)
- Connection pool ayarları: `database.py`'ye `pool_size=20, max_overflow=10, pool_pre_ping=True`
- JSON sütunlarını `JSONB`'ye yükselt (metrics/analytics) — index ihtiyacı doğarsa
- Integration test suite (pytest + Postgres test container)
- CI'da Alembic migration smoke test

---

## 5. Tahmini maliyet

| Aşama | Süre | Risk |
|---|---|---|
| Hazırlık + Postgres ayağa kaldırma | 10 dk | Yok |
| Schema doğrulama | 10 dk | Yok |
| Alembic init + migration yazma | 1-2 saat | Düşük (autogenerate gözden geçirilmeli) |
| Veri aktarımı (sıfırdan seed) | 30 dk | Düşük |
| Cutover | 10 dk | Yok |
| Smoke test | 1 saat | Test suite yokluğu → manuel |
| **Toplam (test hariç)** | **~3-4 saat** | — |
| Opsiyonel test suite (sonraki PR) | 3-5 saat | — |

---

## 6. Karar günlüğü

| Tarih | Karar | Sebep |
|---|---|---|
| 2026-05-16 | Şimdilik SQLite'ta kal | Geliştirme hızı ön planda, prod yakın değil |

---

## 7. Referanslar

- **Mevcut audit raporu**: `Postgres migration audit` (bu denetim, oturum içinde yapıldı)
- **README**: "[backend/](backend/) — FastAPI · SQLAlchemy (async) · SQLite (dev) / PostgreSQL (prod) · Alembic"
- **Docker Compose**: [docker-compose.yml](docker-compose.yml) — Postgres servisi tanımlı
- **Backend plan**: [BACKEND_PLAN.md](BACKEND_PLAN.md) — orijinal mimari kararlar
