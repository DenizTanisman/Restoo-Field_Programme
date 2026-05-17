# OpenCard — Backend & Admin Panel Geliştirme Planı

## İçindekiler

1. [Genel Mimari](#1-genel-mimari)
2. [Veritabanı Şeması](#2-veritabanı-şeması)
3. [API Endpointleri](#3-api-endpointleri)
4. [Admin Panel Frontend](#4-admin-panel-frontend)
5. [Backend Proje Yapısı](#5-backend-proje-yapısı)
6. [Admin Panel Proje Yapısı](#6-admin-panel-proje-yapısı)
7. [Seed Verisi](#7-seed-verisi)
8. [Environment Variables](#8-environment-variables)
9. [Geliştirme Öncelik Sırası](#9-geliştirme-öncelik-sırası)

---

## 1. Genel Mimari

```
Public Frontend (React)
        ↕
    FastAPI (REST)
        ↕
   PostgreSQL DB
        ↑
Admin Panel (React) — ayrı bir uygulama
```

**Backend Stack:**
- Framework: FastAPI (Python)
- Database: PostgreSQL
- ORM: SQLAlchemy 2.0 (async)
- Migration: Alembic
- Auth: JWT (admin için)
- Dosya Depolama: S3 / Cloudflare R2
- Validation: Pydantic v2

---

## 2. Veritabanı Şeması

### `districts` — İlçeler

```sql
CREATE TABLE districts (
    id          VARCHAR(50) PRIMARY KEY,      -- "34-beykoz"
    name        VARCHAR(100) NOT NULL,         -- "Beykoz"
    side        VARCHAR(20) NOT NULL,          -- "avrupa" | "anadolu" | "adalar"
    svg_path    TEXT NOT NULL,                 -- SVG path (harita çizimi için)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `neighborhoods` — Mahalleler

```sql
CREATE TABLE neighborhoods (
    id          SERIAL PRIMARY KEY,
    district_id VARCHAR(50) REFERENCES districts(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `categories` — Kategoriler

```sql
CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    label      VARCHAR(100) NOT NULL,          -- "Burger"
    emoji      VARCHAR(10) NOT NULL,            -- "🍔"
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `platforms` — Teslimat Platformları

```sql
CREATE TABLE platforms (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,   -- "Trendyol Go"
    color_hex  VARCHAR(7),                     -- "#FF6000"
    logo_url   TEXT,
    is_active  BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `restaurants` — Restoranlar

```sql
CREATE TABLE restaurants (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    district_id  VARCHAR(50) REFERENCES districts(id),
    category_id  INTEGER REFERENCES categories(id),
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### `restaurant_platforms` — Restoran × Platform

```sql
CREATE TABLE restaurant_platforms (
    id            SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    platform_id   INTEGER REFERENCES platforms(id),
    customers     INTEGER DEFAULT 0,           -- Aktif müşteri sayısı
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `district_analytics` — İlçe Analitik Verileri

```sql
CREATE TABLE district_analytics (
    id               SERIAL PRIMARY KEY,
    district_id      VARCHAR(50) REFERENCES districts(id),
    category_id      INTEGER REFERENCES categories(id) NULL,  -- NULL = tüm kategoriler
    platform_id      INTEGER REFERENCES platforms(id),
    period_date      DATE NOT NULL,
    -- Müşteri verisi
    customers        INTEGER DEFAULT 0,
    -- Bütçe verisi
    ad_budget        NUMERIC(10,2) DEFAULT 0,
    campaign_rate    NUMERIC(5,2) DEFAULT 0,      -- %
    coupon_rate      NUMERIC(5,2) DEFAULT 0,       -- %
    flash_rate       NUMERIC(5,2) DEFAULT 0,       -- %
    joker_rate       NUMERIC(5,2) DEFAULT 0,       -- %
    -- Tahmin verisi
    daily_forecast   NUMERIC(12,2) DEFAULT 0,      -- TL
    monthly_forecast NUMERIC(12,2) DEFAULT 0,
    yearly_forecast  NUMERIC(12,2) DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(district_id, category_id, platform_id, period_date)
);
```

### `neighborhood_analytics` — Mahalle Analitik Verileri

```sql
CREATE TABLE neighborhood_analytics (
    id               SERIAL PRIMARY KEY,
    neighborhood_id  INTEGER REFERENCES neighborhoods(id),
    category_id      INTEGER REFERENCES categories(id) NULL,
    platform_id      INTEGER REFERENCES platforms(id),
    period_date      DATE NOT NULL,
    customers        INTEGER DEFAULT 0,
    ad_budget        NUMERIC(10,2) DEFAULT 0,
    campaign_rate    NUMERIC(5,2) DEFAULT 0,
    coupon_rate      NUMERIC(5,2) DEFAULT 0,
    flash_rate       NUMERIC(5,2) DEFAULT 0,
    joker_rate       NUMERIC(5,2) DEFAULT 0,
    daily_forecast   NUMERIC(12,2) DEFAULT 0,
    monthly_forecast NUMERIC(12,2) DEFAULT 0,
    yearly_forecast  NUMERIC(12,2) DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);
```

### `competitors` — Rakip Analizi (Kıyaslama)

```sql
CREATE TABLE competitors (
    id              SERIAL PRIMARY KEY,
    district_id     VARCHAR(50) REFERENCES districts(id),
    category_id     INTEGER REFERENCES categories(id) NULL,
    platform_id     INTEGER REFERENCES platforms(id) NULL,
    min_basket      NUMERIC(10,2),
    avg_rating      NUMERIC(3,2),
    monthly_revenue NUMERIC(12,2),
    delivery_type   VARCHAR(50),               -- "platform" | "own"
    discount_rate   NUMERIC(5,2),
    coupon_rate     NUMERIC(5,2),
    period_date     DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `case_studies` — Başarı Hikayeleri (Öncesi/Sonrası)

```sql
CREATE TABLE case_studies (
    id                   SERIAL PRIMARY KEY,
    title                VARCHAR(200) NOT NULL,   -- "Pizza Napoli - Kadıköy"
    district_id          VARCHAR(50) REFERENCES districts(id) NULL,
    category_id          INTEGER REFERENCES categories(id) NULL,
    sort_order           INTEGER DEFAULT 0,
    is_active            BOOLEAN DEFAULT TRUE,
    -- Öncesi
    before_image_url     TEXT,
    before_daily_order   VARCHAR(50),             -- "8-12 adet"
    before_avg_basket    VARCHAR(50),             -- "120 ₺"
    before_complaints    TEXT[],                  -- ["şikayet1", "şikayet2"]
    -- Sonrası
    after_image_url      TEXT,
    after_daily_order    VARCHAR(50),             -- "35-50 adet"
    after_avg_basket     VARCHAR(50),             -- "165 ₺"
    after_improvements   TEXT[],
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### `applications` — Kurye Başvuruları

```sql
CREATE TABLE applications (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(200) NOT NULL,
    phone       VARCHAR(20) NOT NULL,
    city        VARCHAR(100),
    district    VARCHAR(100),
    vehicle     VARCHAR(50),                     -- "bisiklet" | "elektrikli_bisiklet" | "motorsiklet" | "otomobil"
    message     TEXT,
    status      VARCHAR(50) DEFAULT 'pending',   -- pending | reviewed | accepted | rejected
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `admin_users` — Admin Kullanıcıları

```sql
CREATE TABLE admin_users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    full_name     VARCHAR(200),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API Endpointleri

**Base URL:** `/api/v1`

---

### 3.1 Auth

#### `POST /auth/login`

**Request:**
```json
{
  "email": "admin@opencard.com",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

#### `POST /auth/refresh`

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

### 3.2 Districts

#### `GET /districts`

Tüm ilçeleri SVG path verisiyle döner (harita için kullanılır).

**Response `200`:**
```json
[
  {
    "id": "34-beykoz",
    "name": "Beykoz",
    "side": "anadolu",
    "svg_path": "M 123 456 L ..."
  }
]
```

---

#### `GET /districts/{district_id}/neighborhoods`

**Response `200`:**
```json
{
  "district_id": "34-beykoz",
  "district_name": "Beykoz",
  "neighborhoods": [
    { "id": 1, "name": "Anadoluhisarı" },
    { "id": 2, "name": "Paşabahçe" }
  ]
}
```

---

### 3.3 Categories

#### `GET /categories`

**Response `200`:**
```json
[
  {
    "id": 1,
    "label": "Burger",
    "emoji": "🍔",
    "sort_order": 1
  }
]
```

---

### 3.4 Analytics

#### `GET /analytics/district/{district_id}`

İlçe bazlı analitik verisi. Frontend'deki donut chart, radial bar chart ve sales forecast bu endpoint'ten beslenir.

**Query Parameters:**

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `category_id` | number | hayır | Kategori filtresi |
| `period` | string | hayır | `"latest"` veya `"YYYY-MM"` (default: `"latest"`) |

**Response `200`:**
```json
{
  "district_id": "34-beykoz",
  "district_name": "Beykoz",
  "category": {
    "id": 1,
    "label": "Burger",
    "emoji": "🍔"
  },
  "platforms": [
    {
      "platform_id": 1,
      "platform_name": "Trendyol Go",
      "color_hex": "#FF6000",
      "customers": 180
    },
    {
      "platform_id": 2,
      "platform_name": "Getir",
      "color_hex": "#5C3EBC",
      "customers": 95
    },
    {
      "platform_id": 3,
      "platform_name": "Yemeksepeti",
      "color_hex": "#CC0000",
      "customers": 142
    }
  ],
  "budget": {
    "ad_budget": 7500.00,
    "campaign_rate": 65.5,
    "coupon_rate": 45.0,
    "flash_rate": 30.0,
    "joker_rate": 22.5
  },
  "forecast": {
    "daily": [
      { "platform_name": "Trendyol Go", "amount": 3200.00 },
      { "platform_name": "Getir", "amount": 1800.00 },
      { "platform_name": "Yemeksepeti", "amount": 2400.00 }
    ],
    "monthly": [
      { "platform_name": "Trendyol Go", "amount": 96000.00 },
      { "platform_name": "Getir", "amount": 54000.00 },
      { "platform_name": "Yemeksepeti", "amount": 72000.00 }
    ],
    "yearly": [
      { "platform_name": "Trendyol Go", "amount": 1152000.00 },
      { "platform_name": "Getir", "amount": 648000.00 },
      { "platform_name": "Yemeksepeti", "amount": 864000.00 }
    ]
  },
  "period_date": "2026-04-01"
}
```

---

#### `GET /analytics/neighborhood/{neighborhood_id}`

Mahalle bazlı analitik. District analitik ile aynı response yapısı, sadece `district_id`/`district_name` yerine `neighborhood_id`/`neighborhood_name` döner.

**Query Parameters:** `category_id?`, `period?`

---

#### `GET /analytics/competitors`

Kıyaslama sayfası için rakip analiz verisi.

**Query Parameters:**

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `district_id` | string | evet |
| `category_id` | number | hayır |
| `platform_id` | number | hayır |
| `period` | string | hayır |

**Response `200`:**
```json
{
  "district_id": "34-beykoz",
  "competitors": [
    {
      "platform_name": "Trendyol Go",
      "min_basket": 75.00,
      "avg_rating": 4.3,
      "monthly_revenue": 145000.00,
      "delivery_type": "platform",
      "discount_rate": 15.5,
      "coupon_rate": 30.0
    }
  ],
  "period_date": "2026-04-01"
}
```

---

### 3.5 Restaurants

#### `GET /restaurants`

**Query Parameters:**

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `search` | string | İsim araması |
| `district_id` | string | İlçe filtresi |
| `category_id` | number | Kategori filtresi |
| `page` | number | default: 1 |
| `limit` | number | default: 20 |

**Response `200`:**
```json
{
  "total": 2,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": 1,
      "name": "Gül Balık",
      "district_id": "34-beykoz",
      "district_name": "Beykoz",
      "category": {
        "id": 10,
        "label": "Balık & Deniz Ürünleri",
        "emoji": "🐟"
      },
      "platforms": [
        { "platform_name": "Trendyol Go", "customers": 150 }
      ]
    }
  ]
}
```

---

### 3.6 Case Studies

#### `GET /case-studies`

Aktif başarı hikayelerini `sort_order`'a göre sıralı döner.

**Response `200`:**
```json
[
  {
    "id": 1,
    "title": "Pizza Napoli - Kadıköy",
    "sort_order": 1,
    "district": { "id": "34-kadıköy", "name": "Kadıköy" },
    "category": { "id": 2, "label": "Pizza", "emoji": "🍕" },
    "before": {
      "image_url": "https://cdn.opencard.com/cases/pizza-napoli-before.jpg",
      "daily_order": "8-12 adet",
      "avg_basket": "120 ₺",
      "complaints": [
        "Fotoğraf kalitesi düşük",
        "Menü bilgileri eksik",
        "Teslimat süresi belirsiz"
      ]
    },
    "after": {
      "image_url": "https://cdn.opencard.com/cases/pizza-napoli-after.jpg",
      "daily_order": "35-50 adet",
      "avg_basket": "165 ₺",
      "improvements": [
        "Profesyonel fotoğraf çekimi",
        "Menü optimizasyonu",
        "Kampanya yönetimi"
      ]
    }
  }
]
```

---

### 3.7 Applications

#### `POST /applications`

Kurye başvurusu.

**Request Body:**
```json
{
  "first_name": "Ali",
  "last_name": "Yılmaz",
  "email": "ali@example.com",
  "phone": "05551234567",
  "city": "İstanbul",
  "district": "Beykoz",
  "vehicle": "motorsiklet",
  "message": "Opsiyonel mesaj"
}
```

**Response `201`:**
```json
{
  "id": 42,
  "message": "Başvurunuz alındı. En kısa sürede iletişime geçeceğiz.",
  "created_at": "2026-04-28T10:30:00Z"
}
```

---

### 3.8 Admin Endpointleri

> Tüm `/admin/*` endpointleri `Authorization: Bearer <token>` header'ı gerektirir.

---

#### Analytics — Veri Girişi

##### `POST /admin/analytics/district`

İlçe analitik verisi ekle veya güncelle (upsert).

**Request Body:**
```json
{
  "district_id": "34-beykoz",
  "category_id": 1,
  "period_date": "2026-04-01",
  "platform_analytics": [
    {
      "platform_id": 1,
      "customers": 180,
      "daily_forecast": 3200.00,
      "monthly_forecast": 96000.00,
      "yearly_forecast": 1152000.00
    },
    {
      "platform_id": 2,
      "customers": 95,
      "daily_forecast": 1800.00,
      "monthly_forecast": 54000.00,
      "yearly_forecast": 648000.00
    }
  ],
  "budget": {
    "ad_budget": 7500.00,
    "campaign_rate": 65.5,
    "coupon_rate": 45.0,
    "flash_rate": 30.0,
    "joker_rate": 22.5
  }
}
```

**Response `200`:**
```json
{ "message": "Analytics updated", "records_affected": 2 }
```

---

##### `POST /admin/analytics/neighborhood`

Mahalle analitik verisi ekle/güncelle. District ile aynı yapı.

---

##### `POST /admin/analytics/competitors`

Rakip analiz verisi ekle/güncelle.

**Request Body:**
```json
{
  "district_id": "34-beykoz",
  "category_id": 1,
  "period_date": "2026-04-01",
  "competitors": [
    {
      "platform_id": 1,
      "min_basket": 75.00,
      "avg_rating": 4.3,
      "monthly_revenue": 145000.00,
      "delivery_type": "platform",
      "discount_rate": 15.5,
      "coupon_rate": 30.0
    }
  ]
}
```

---

#### Restaurants CRUD

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/admin/restaurants` | Listele (sayfalı) |
| `POST` | `/admin/restaurants` | Yeni restoran ekle |
| `PUT` | `/admin/restaurants/{id}` | Güncelle |
| `DELETE` | `/admin/restaurants/{id}` | Sil (soft delete) |

**POST Request Body:**
```json
{
  "name": "Yeni Restoran",
  "district_id": "34-beykoz",
  "category_id": 1,
  "platforms": [
    { "platform_id": 1, "customers": 120 },
    { "platform_id": 2, "customers": 80 }
  ]
}
```

---

#### Case Studies CRUD

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/admin/case-studies` | Tüm hikayeleri listele |
| `POST` | `/admin/case-studies` | Yeni hikaye ekle |
| `PUT` | `/admin/case-studies/{id}` | Güncelle |
| `DELETE` | `/admin/case-studies/{id}` | Sil (soft delete) |
| `PATCH` | `/admin/case-studies/reorder` | Sıralamayı güncelle |

**POST — `multipart/form-data`:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `title` | string | Başlık |
| `district_id` | string | opsiyonel |
| `category_id` | number | opsiyonel |
| `sort_order` | number | Gösterim sırası |
| `before_daily_order` | string | `"8-12 adet"` |
| `before_avg_basket` | string | `"120 ₺"` |
| `before_complaints` | JSON string | `["şikayet1", "şikayet2"]` |
| `after_daily_order` | string | `"35-50 adet"` |
| `after_avg_basket` | string | `"165 ₺"` |
| `after_improvements` | JSON string | `["iyileştirme1"]` |
| `before_image` | File | Öncesi görseli |
| `after_image` | File | Sonrası görseli |

**PATCH /reorder Request Body:**
```json
[
  { "id": 1, "sort_order": 2 },
  { "id": 2, "sort_order": 1 }
]
```

---

#### Applications

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/admin/applications` | Listele (`?status=pending`) |
| `PATCH` | `/admin/applications/{id}/status` | Durumu güncelle |

**PATCH Request Body:**
```json
{ "status": "accepted" }
```

---

#### Categories & Platforms CRUD

| Method | Endpoint |
|--------|----------|
| `GET` | `/admin/categories` |
| `POST` | `/admin/categories` |
| `PUT` | `/admin/categories/{id}` |
| `DELETE` | `/admin/categories/{id}` |
| `GET` | `/admin/platforms` |
| `POST` | `/admin/platforms` |
| `PUT` | `/admin/platforms/{id}` |

---

#### Dosya Yükleme

##### `POST /admin/upload`

**Request — `multipart/form-data`:**

| Alan | Açıklama |
|------|----------|
| `file` | Yüklenecek dosya |
| `folder` | `"case-studies"` \| `"restaurants"` \| `"general"` |

**Response `200`:**
```json
{
  "url": "https://cdn.opencard.com/case-studies/abc123.jpg",
  "filename": "abc123.jpg",
  "size": 245120
}
```

---

## 4. Admin Panel Frontend

Admin panel, public frontend'den tamamen bağımsız bir React uygulaması olarak geliştirilecek. Ayrı bir repo veya monorepo içinde `admin/` klasörü altında tutulabilir.

### Tech Stack

- **Framework:** React + Vite
- **Styling:** TailwindCSS + shadcn/ui (hazır UI bileşenleri)
- **State/Fetch:** TanStack Query (React Query) — cache ve loading yönetimi için
- **Form:** React Hook Form + Zod (validasyon)
- **Tablolar:** TanStack Table
- **Drag & Drop (sıralama):** dnd-kit
- **Editor:** React Quill veya TipTap (metin alanları için)
- **Auth:** JWT localStorage / httpOnly cookie

---

### 4.1 Sayfalar ve Özellikler

#### `/login` — Giriş Sayfası
- Email + şifre formu
- JWT token alıp localStorage'a kaydetme
- Hatalı giriş mesajı
- Başarılı girişte `/dashboard` yönlendirme

---

#### `/dashboard` — Genel Bakış
- Özet kartlar:
  - Toplam restoran sayısı
  - Toplam başvuru sayısı (pending kaç adet)
  - Toplam case study sayısı
  - Son güncellenen analitik tarihi
- Son 5 başvuru listesi (hızlı erişim)
- Son eklenen restoranlar

---

#### `/analytics` — Analitik Veri Yönetimi

**Alt Sekmeler: İlçe / Mahalle / Rakip**

**İlçe Analitik Formu:**
- İlçe seçimi (dropdown — `GET /districts`)
- Kategori seçimi (dropdown — opsiyonel)
- Dönem seçimi (ay/yıl picker)
- Platform kartları (Trendyol / Getir / Yemeksepeti):
  - Müşteri sayısı input
  - Günlük tahmin (TL) input
  - Aylık tahmin (TL) input
  - Yıllık tahmin (TL) input
- Bütçe & Kampanya bölümü:
  - Reklam bütçesi (TL) input
  - Kampanya katılım oranı (%) input
  - Kupon oranı (%) input
  - Flash indirim oranı (%) input
  - Joker oranı (%) input
- Kaydet butonu (upsert)

**Mahalle Analitik Formu:**
- İlçe seç → mahalle dropdown dolsun
- Geri kalan form aynı

**Rakip Analiz Formu:**
- İlçe seçimi
- Kategori seçimi (opsiyonel)
- Her platform için:
  - Minimum sepet
  - Ortalama puan
  - Aylık ciro
  - Teslimat modeli (platform/kendi)
  - İndirim oranı
  - Kupon oranı

> **Not:** Mevcut veriler varsa form otomatik doldurulacak. Kaydet = upsert.

---

#### `/restaurants` — Restoran Yönetimi

**Liste Görünümü:**
- Tablo: ID | Ad | İlçe | Kategori | Platform Sayısı | Durum | İşlemler
- Arama (isim filtresi)
- İlçe ve kategori filtresi
- Sayfalama
- Aktif/pasif toggle

**Restoran Ekle / Düzenle Formu:**
- Ad input
- İlçe dropdown
- Kategori dropdown
- Platform seçimi (checkbox):
  - Her seçilen platform için müşteri sayısı input
- Kaydet / İptal

---

#### `/case-studies` — Başarı Hikayeleri Yönetimi

**Liste Görünümü:**
- Sürükle-bırak ile sıralama (dnd-kit)
- Her kart: küçük önizleme, başlık, aktif/pasif toggle
- Ekle butonu

**Case Study Ekle / Düzenle Formu:**
- Başlık input
- İlçe dropdown (opsiyonel)
- Kategori dropdown (opsiyonel)
- **Öncesi Bölümü:**
  - Resim yükleme (drag & drop, önizleme)
  - Günlük sipariş input (`"8-12 adet"`)
  - Ortalama sepet input (`"120 ₺"`)
  - Şikayetler listesi (dinamik — ekle/sil)
- **Sonrası Bölümü:**
  - Resim yükleme (drag & drop, önizleme)
  - Günlük sipariş input
  - Ortalama sepet input
  - İyileştirmeler listesi (dinamik — ekle/sil)
- Kaydet / İptal

---

#### `/applications` — Başvuru Yönetimi

**Liste Görünümü:**
- Tablo: Ad Soyad | Email | Telefon | Araç | Şehir | Tarih | Durum | İşlemler
- Durum filtresi (pending / reviewed / accepted / rejected)
- Tarih filtresi
- Sayfalama
- Dışa aktar (CSV) butonu

**Başvuru Detay Modal:**
- Tüm başvuru bilgileri
- Durum güncelleme dropdown
- Mesaj alanı görüntüleme

---

#### `/categories` — Kategori Yönetimi

- Tablo: ID | Emoji | Ad | Sıra | İşlemler
- Sürükle-bırak ile sıralama
- Kategori ekle/düzenle/sil

---

#### `/platforms` — Platform Yönetimi

- Tablo: ID | Ad | Renk | Logo | Aktif | İşlemler
- Platform ekle/düzenle
- Renk picker

---

### 4.2 Layout & Navigation

```
┌─────────────────────────────────────────────┐
│  OpenCard Admin        [Caner ▾] [Çıkış]   │
├──────────────┬──────────────────────────────┤
│              │                              │
│  Dashboard   │                              │
│  Analytics   │        İçerik Alanı          │
│  Restaurants │                              │
│  Case Studies│                              │
│  Applications│                              │
│  Categories  │                              │
│  Platforms   │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

- Sol sidebar sabit
- Header'da kullanıcı adı ve çıkış
- Mobil görünüm: hamburger menü
- Route koruması: token yoksa `/login`'e yönlendir

---

### 4.3 Ortak UI Bileşenleri

| Bileşen | Kullanım Yeri |
|---------|---------------|
| `DataTable` | Restoran, başvuru, kategori listeleri |
| `FormModal` | Ekle/düzenle formları overlay olarak |
| `ImageUploader` | Case study resim yükleme |
| `TagInput` | Şikayet/iyileştirme listesi girişi |
| `StatusBadge` | Başvuru durumu renk kodları |
| `PeriodPicker` | Analitik dönem seçimi |
| `ConfirmDialog` | Silme onayı |
| `Toast` | Başarı/hata bildirimleri |

---

## 5. Backend Proje Yapısı

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, CORS, router mount
│   ├── config.py                  # Env var settings (pydantic-settings)
│   ├── database.py                # SQLAlchemy async engine + session
│   ├── deps.py                    # Dependency injection (db, current_user)
│   ├── models/
│   │   ├── district.py
│   │   ├── neighborhood.py
│   │   ├── category.py
│   │   ├── platform.py
│   │   ├── restaurant.py
│   │   ├── analytics.py
│   │   ├── competitor.py
│   │   ├── case_study.py
│   │   ├── application.py
│   │   └── admin_user.py
│   ├── schemas/
│   │   ├── district.py
│   │   ├── analytics.py
│   │   ├── restaurant.py
│   │   ├── case_study.py
│   │   ├── application.py
│   │   └── auth.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── districts.py
│   │   ├── categories.py
│   │   ├── analytics.py
│   │   ├── restaurants.py
│   │   ├── case_studies.py
│   │   ├── applications.py
│   │   └── admin/
│   │       ├── analytics.py
│   │       ├── restaurants.py
│   │       ├── case_studies.py
│   │       ├── applications.py
│   │       ├── categories.py
│   │       ├── platforms.py
│   │       └── upload.py
│   └── services/
│       ├── analytics_service.py
│       ├── restaurant_service.py
│       ├── storage_service.py     # S3/R2 dosya yükleme
│       └── auth_service.py
├── alembic/
│   └── versions/
├── seeds/
│   ├── districts.py               # 39 ilçe + SVG path'leri
│   ├── neighborhoods.py           # 400+ mahalle
│   ├── categories.py              # 18 kategori
│   └── platforms.py               # 3 platform
├── .env
├── requirements.txt
└── alembic.ini
```

---

## 6. Admin Panel Proje Yapısı

```
admin/
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── RestaurantsPage.jsx
│   │   ├── CaseStudiesPage.jsx
│   │   ├── ApplicationsPage.jsx
│   │   ├── CategoriesPage.jsx
│   │   └── PlatformsPage.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── ui/
│   │   │   ├── DataTable.jsx
│   │   │   ├── FormModal.jsx
│   │   │   ├── ImageUploader.jsx
│   │   │   ├── TagInput.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── PeriodPicker.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── Toast.jsx
│   │   ├── analytics/
│   │   │   ├── DistrictAnalyticsForm.jsx
│   │   │   ├── NeighborhoodAnalyticsForm.jsx
│   │   │   └── CompetitorForm.jsx
│   │   ├── restaurants/
│   │   │   ├── RestaurantTable.jsx
│   │   │   └── RestaurantForm.jsx
│   │   ├── case-studies/
│   │   │   ├── CaseStudyList.jsx   # dnd-kit sürükle-bırak
│   │   │   └── CaseStudyForm.jsx
│   │   └── applications/
│   │       ├── ApplicationTable.jsx
│   │       └── ApplicationDetail.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useToast.js
│   ├── api/
│   │   ├── client.js              # axios instance, token interceptor
│   │   ├── analytics.js
│   │   ├── restaurants.js
│   │   ├── caseStudies.js
│   │   └── applications.js
│   ├── App.jsx
│   └── main.jsx
├── .env
├── package.json
└── vite.config.js
```

---

## 7. Seed Verisi

İlk kurulumda otomatik yüklenecek veriler:

| Tablo | Veri Kaynağı | Adet |
|-------|-------------|------|
| `districts` | `frontend/src/data/mapData.js` | 39 |
| `neighborhoods` | `frontend/src/data/mock/neighborhoodData.js` | 400+ |
| `categories` | `frontend/src/components/SideBarCategories.jsx` | 18 |
| `platforms` | `frontend/src/data/mock/restourantData.js` | 3 |

Analytics, restoran ve case study verileri admin panelinden manuel girilecek.

---

## 8. Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/opencard
SECRET_KEY=your-jwt-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Dosya depolama
STORAGE_PROVIDER=s3             # s3 | r2 | local
S3_BUCKET=opencard-assets
S3_REGION=eu-central-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
CDN_BASE_URL=https://cdn.opencard.com

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5181,https://opencard.com
```

### Admin Panel `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Public Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 9. Geliştirme Öncelik Sırası

### Aşama 1 — Backend Temel (P1)

> Public frontend mock datadan kurtulsun.

| # | Görev |
|---|-------|
| 1 | PostgreSQL bağlantısı, SQLAlchemy kurulumu, Alembic ayarı |
| 2 | Tüm tabloları migration ile oluştur |
| 3 | Seed scriptleri çalıştır (districts, neighborhoods, categories, platforms) |
| 4 | `GET /districts` ve `GET /districts/{id}/neighborhoods` |
| 5 | `GET /categories` |
| 6 | `GET /analytics/district/{id}` |
| 7 | `GET /analytics/neighborhood/{id}` |
| 8 | `GET /restaurants` (arama dahil) |
| 9 | Public frontend'de fetch çağrılarını mock datanın yerine koy |

### Aşama 2 — Diğer Public Endpointler (P2)

| # | Görev |
|---|-------|
| 10 | `GET /case-studies` |
| 11 | `POST /applications` |
| 12 | `GET /analytics/competitors` |

### Aşama 3 — Admin Backend (P3)

| # | Görev |
|---|-------|
| 13 | JWT auth (`/auth/login`, `/auth/refresh`) |
| 14 | `/admin/analytics/district` ve `/admin/analytics/neighborhood` (upsert) |
| 15 | `/admin/analytics/competitors` |
| 16 | `/admin/restaurants` CRUD |
| 17 | `/admin/case-studies` CRUD + resim yükleme |
| 18 | `/admin/applications` listeleme + durum güncelleme |
| 19 | `/admin/categories` ve `/admin/platforms` CRUD |
| 20 | `/admin/upload` genel dosya yükleme |

### Aşama 4 — Admin Panel Frontend (P4)

| # | Görev |
|---|-------|
| 21 | Proje kurulumu (Vite + React + Tailwind + shadcn/ui) |
| 22 | Login sayfası + JWT akışı + korumalı rotalar |
| 23 | Layout (sidebar + header) |
| 24 | Dashboard sayfası (özet kartlar) |
| 25 | Analytics sayfası (ilçe + mahalle + rakip formları) |
| 26 | Restaurants sayfası (tablo + ekle/düzenle formu) |
| 27 | Case Studies sayfası (sürükle-bırak + resim yükleme formu) |
| 28 | Applications sayfası (tablo + detay modal + durum güncelleme) |
| 29 | Categories ve Platforms sayfaları |
