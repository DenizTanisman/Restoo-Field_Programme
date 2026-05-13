# Opencard

## Sistem bileşenleri

| Servis | Port (dev) | Stack |
|---|---|---|
| `backend/` | 8003 | FastAPI · SQLAlchemy (async) · SQLite (dev) / PostgreSQL (prod) · Alembic |
| `frontend/` | 5173 | React · Vite · Tailwind · daisyUI · Recharts |
| `admin/` | 5174 | React · Vite · Tailwind · daisyUI |

---

## 1. Gereksinimler

- **Python 3.12+**
- **Node.js 20+** ve **npm**
- Git

Mac'te:
```bash
brew install python@3.12 node
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

# Sanal ortam
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
```

### `.env` dosyasını oluştur

```bash
cp .env.example .env
```

Varsayılan değerler lokal dev için yeterli. (Prod'da `SECRET_KEY` ve `ADMIN_DEFAULT_PASSWORD` mutlaka değiştirilmeli.)

### Veritabanı

Repo'da `backend/opencard_dev.db` **önceden doldurulmuş** olarak gelir:

- 39 ilçe + tüm mahalleleri (≈800+ mahalle)
- 18 kategori, 3 platform (Yemeksepeti, Getir, Trendyol Go/UberEats)
- 195 restoran, 195 rakip
- 117 satır district + 117 satır neighborhood analytics
- 39 satır district + 39 satır neighborhood metrics
- 3 başarı hikayesi (görselleriyle, `backend/media/case-studies/` altında)
- 3 kurye başvurusu
- 1 default admin kullanıcı

**Yani backend'i direkt başlatabilirsiniz**, ekstra seed komutuna gerek yok.

> Sıfırdan kurmak isterseniz (DB'yi silip yeniden başlatmak):
> ```bash
> rm -f opencard_dev.db
> .venv/bin/python -m scripts.init_local_db        # şema
> .venv/bin/python -m scripts.seed_admin           # admin kullanıcı
> .venv/bin/python -m scripts.seed_neighborhoods   # ilçe + mahalleler
> .venv/bin/python -m scripts.seed_local           # kategori + platform
> .venv/bin/pip install requests                   # generate_synthetic için
> .venv/bin/python ../scripts/generate_synthetic.py  # test verisi (CSV + import)
> ```

### Backend'i başlat

```bash
.venv/bin/uvicorn app.main:app --port 8003 --reload
```

Sağlık kontrolü: <http://localhost:8003/health>

---

## 4. Frontend kurulumu (halka açık dashboard)

Yeni bir terminalde:

```bash
cd frontend
npm install

# Backend adresini ayarla
echo "VITE_API_URL=http://localhost:8003" > .env.development

npx vite --port 5173
```

Açılış: <http://localhost:5173>

---

## 5. Admin panel kurulumu

Yeni bir terminalde:

```bash
cd admin
npm install

echo "VITE_API_URL=http://localhost:8003" > .env.development

npx vite --port 5174
```

Açılış: <http://localhost:5174>

### Admin giriş bilgileri (dev varsayılan)

| Alan | Değer |
|---|---|
| URL | <http://localhost:5174/login> |
| E-posta | `admin@opencard.com` |
| Şifre | `opencard123` |

> Bu bilgiler `backend/.env`'deki `ADMIN_DEFAULT_*` değişkenlerinden okunur ve `seed_admin.py` çalıştırıldığında DB'ye yazılır. Prod'da mutlaka değiştirin.

---

## 6. Test verisi

Repo'daki DB **zaten doldurulmuş**. İçindeki veriyi yeniden üretmek veya boş bir DB'yi doldurmak isterseniz:

```bash
cd backend
.venv/bin/pip install requests   # ilk seferde
.venv/bin/python ../scripts/generate_synthetic.py
```

Bu script:
- Yeniden CSV üretir (`synthetic_csves/` altına yazar)
- Admin API üzerinden upsert eder (mevcut kayıtları günceller)
- 3 başarı hikayesi (görsellerle), 3 kurye başvurusu ve Loyalty stat'larını ekler

> Backend ayakta olmalı! Script `/admin/...` endpoint'lerine HTTP istek atar.

Çıktı:
```
→ Restaurants import: 195
→ Competitors import: 195
→ District analytics: 117
→ Neighborhood analytics: 117
→ District metrics: 39
→ Neighborhood metrics: 39
→ Case Studies (multipart upload): 3 hikaye + 6 görsel
→ Applications: 3 başvuru
→ Site Settings: kaydedildi
```

### Alternatif — admin UI'dan manuel CSV import

Eğer script çalıştırmak yerine admin UI'dan teker teker yüklemek istersen, sırayla:

| Admin sayfası | CSV |
|---|---|
| `/restaurants` | `synthetic_csves/restaurants.csv` |
| `/analytics` → **İlçe** | `synthetic_csves/district_analytics.csv` |
| `/analytics` → **Mahalle** | `synthetic_csves/neighborhood_analytics.csv` |
| `/analytics` → **Rakip** | `synthetic_csves/competitors.csv` |
| `/metrics` → **İlçe** | `synthetic_csves/district_metrics.csv` |
| `/metrics` → **Mahalle** | `synthetic_csves/neighborhood_metrics.csv` |

Başarı hikayeleri ve başvurular admin UI'dan **manuel** girilir (CSV import yok). Settings → Loyalty stat'ları da manuel.

---

## 7. Klasör yapısı

```
opencard/
├── backend/                  # FastAPI servisleri
│   ├── app/
│   │   ├── models/           # SQLAlchemy modelleri (analytics, metrics, restaurant…)
│   │   ├── routers/          # Public + admin endpoint'leri
│   │   │   └── admin/        # JWT ile korunmuş admin endpoint'leri
│   │   ├── schemas/          # Pydantic şemaları
│   │   ├── services/         # csv_service, storage_service…
│   │   └── main.py
│   ├── scripts/              # seed_*, init_local_db
│   ├── media/                # Yüklenen görseller (case studies)
│   └── opencard_dev.db       # SQLite (lokal dev)
│
├── admin/                    # Yönetim paneli (React)
│   └── src/pages/            # Dashboard, Analytics, Metrics, Restaurants…
│
├── frontend/                 # Halka açık landing + dashboard (React)
│   └── src/
│       ├── components/       # IstanbulMap, Kiyaslama, CommentAnalist…
│       └── pages/            # HomePage, ApplyPage, NotFoundPage
│
├── synthetic_csves/          # 195 restoran + analytics + metrics test verisi
├── examples/                 # CSV şablonları (kolon kontratları)
└── scripts/                  # generate_synthetic.py
```

---

## 8. Sistemin temel kavramları

- **Analytics** — platform bazlı veriler (her ilçe × kategori × platform × dönem için müşteri sayısı, bütçe, tahmin)
- **Metrics** — platform bağımsız aggregate veriler (iptal/iade oranları, performans skoru, kıyaslama, saatlik heatmap, yorum analizi, kurye karşılaştırması)
- **Case Studies** — anasayfada gösterilen başarı hikayeleri (önce/sonra metrikleri + görsel)
- **Applications** — kurye başvuruları (public form → admin'de listelenir/onaylanır)
- **Site Settings** — Loyalty sayfasındaki global stat'lar

---

## 9. Sık karşılaşılan problemler

| Sorun | Çözüm |
|---|---|
| `Address already in use` (port 8003/5173/5174) | `lsof -ti:<port> \| xargs kill -9` |
| Admin'de "401 Unauthorized" | Token süresi dolmuş — admin'den çıkıp tekrar giriş yap |
| Frontend'de "API 500" | Backend ayakta mı? `curl http://localhost:8003/health` |
| Mahalle seçince "Veri yok" uyarısı | O mahalle için admin'den Metrics girişi yapılmamış — beklenen davranış |
| CSV import "Eksik sütun" hatası | CSV'deki kolon başlıkları `examples/` veya `synthetic_csves/` ile birebir aynı olmalı |
| `Module 'requests' not found` (generate_synthetic.py) | `cd backend && .venv/bin/pip install requests` |

---

## 10. API dökümantasyonu

Backend çalışırken Swagger UI: <http://localhost:8003/docs>
