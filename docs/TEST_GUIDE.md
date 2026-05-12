# OpenCard QA & Test Rehberi

Bu dosya saha ekibi ve QA için kullanım/test rehberidir. Üç bölümden oluşur:
1. **Ana sayfa ↔ Admin denetim matrisi** — neyi nereden yönetiyoruz
2. **Test senaryoları** — adım adım smoke + edge cases
3. **Kırma senaryoları** — sistemi zorlamak / pen-test

---

## 0. Hızlı Başlangıç

### Servisleri çalıştır

```bash
# Terminal 1 — backend
cd backend
.venv/bin/uvicorn app.main:app --port 8003 --reload

# Terminal 2 — public site
cd frontend
npm run dev          # http://localhost:5180

# Terminal 3 — admin panel
cd admin
npm run dev          # http://localhost:5181
```

### Admin giriş bilgileri
- E-posta: `admin@opencard.com`
- Şifre: `opencard123` (backend/.env'den değiştirilebilir, sonra `python -m scripts.seed_admin`)

### Test verisini yükle
1. http://localhost:5181/restaurants → **⬆ CSV İçe Aktar** → [examples/restaurants_example.csv](../examples/restaurants_example.csv)
2. http://localhost:5181/platforms → "Uber Eats Trendyol Go" + "Getir" + "Yemeksepeti" var mı doğrula (yoksa ekle)
3. http://localhost:5181/categories → 18 kategori olmalı
4. http://localhost:5181/districts → 39 ilçe + her birinde mahalleler

---

## 1. Ana Sayfa ↔ Admin Denetim Matrisi

### ✅ Admin'den yönetilebilen (gerçek veri akışı)

| Ana sayfa öğesi | Veri kaynağı | Admin yönetimi |
|---|---|---|
| Sol sidebar — Kategoriler | `GET /categories` (DB) | Categories CRUD |
| Sol sidebar — İlçeler (isimler) | `mapData.js` (statik, SVG ile birlikte) | Districts CRUD (ama SVG path'i admin'den yönetimi pratik değil) |
| Sol sidebar — Mahalleler (accordion) | `GET /districts/{id}/neighborhoods` (DB) | Districts → Mahalleler |
| Harita — İlçe SVG'leri + tooltip | `mapData.js` (statik) | — (admin'den path düzenleme var ama 39 ilçe zaten DB'de seed'li) |
| Search bar + öneri dropdown | `GET /restaurants/search` (DB) | Restaurants CRUD + CSV in/out |
| Restoran sonuç kartları | aynı API | aynı |
| Platform Müşteri Dağılımı (donut) | `GET /analytics/district` → `platforms[]` | Analytics → İlçe upsert |
| Kampanya & Katılım Analizleri | `GET /analytics/district` → `budget` | Analytics → İlçe upsert (Bütçe & Kampanya bölümü) |
| Tahmini Satış Verisi (günlük/aylık/yıllık) | `GET /analytics/district` → `forecast` | Analytics → İlçe upsert (platform tahminleri) |
| Mahalle seçilince analytics değişimi | `GET /analytics/neighborhood` | Analytics → Mahalle upsert |
| Başarı Hikayeleri (Case Studies) | `GET /case-studies` | Case Studies CRUD + image upload + reorder |
| Header etiketi (İstanbul / \<İlçe\>) | seçim state'i + `mapData.js` | — |

### ⚠️ Admin'den YÖNETİLEMEYEN (hardcoded — eksik)

Bu içerikler frontend kodunda gömülü; saha ekibi UI üzerinden değiştiremez. Eğer dinamikleştirilmesi gerekiyorsa **backend tablosu + admin sayfası** eklenmeli.

| Ana sayfa öğesi | Konum | Detay |
|---|---|---|
| İptal Sebepleri (donut + lejant) | `RestaurantOperationalCard.jsx` | Uzun bekleme %45, Yanlış ürün %25, vs. — sabit |
| İade Sebepleri (donut + lejant) | `RestaurantOperationalCard.jsx` | Eksik Malzeme %48, Soğuk Geldi %34, vs. — sabit |
| Genel Performans Skoru (?, 78) | `GeneralPerformanceScore.jsx` | Default `areaScore=78` |
| Restoran Kıyaslama Paneli — üst 4 mini kart | `Kiyaslama.jsx` | 80₺, 4.5, 1M₺, 20₺ — sabit |
| Satış Saatleri Yoğunluğu (İlçe) heatmap | `SalesHourHeatmap.jsx` `SAMPLE_DISTRICT_DATA` | Sinüs paterni, dinamik değil |
| Ortalama Sepet Tutarı / Menü Fiyatı VS kartları | `Kiyaslama.jsx` | 120₺ / 139₺ sabit |
| Puan Kıyaslaması & Aksiyon Önerileri | `Kiyaslama.jsx` | 4.1 ilçe ort, 5 sabit aksiyon önerisi |
| Müşteri Puanı Kıyaslaması (gauge) | `CustomerRatingCompare.jsx` | Default `areaRating=4.2` |
| İndirim & Kupon Kullanım Oranları | `Kiyaslama.jsx` | %45 / %60 / %25 sabit |
| İş Modeli Karşılaştırması (Restoran/Senin Kuryen) | `Kiyaslama.jsx` | 20₺ / 35,10₺ / 5000₺ / YÜKSEK + 0₺ / 32,40₺ / 1M₺ / DÜŞÜK sabit |
| Olumsuz Yorumlar Analiz Paneli (tüm chart'lar) | `CommentAnalist.jsx` | 1452 yorum, %25 oran, 2.6 puan, platform dağılımı, puan dağılımı, kelime bulutu, ilçe listesi — **hepsi sabit** |
| Sadakat Programı stats | `LoyaltyPage.jsx` | "340+ Aktif Firma", "%38 Churn", "2.6x ROI", "90 Gün" sabit |
| Sadakat — 4 feature kartı (Performans/Tahmin/Genel Metrikler/Segmentasyon) | `LoyaltyPage.jsx` | Statik tanıtım metinleri (pazarlama içeriği) |

> **Öneri:** Eğer bu içerikler restoran/ilçe bazında değişmeli ise yeni backend tabloları gerekir (`reasons`, `kpi_snapshot`, `comment_metrics`, vs.). Şu anki yapıda saha ekibi ana sayfadaki çoğu KPI'yı değiştiremez.

---

## 2. Test Senaryoları

### 2.1 Authentication

| # | Adım | Beklenen |
|---|---|---|
| A1 | http://localhost:5181/login → boş form submit | "Geçersiz e-posta veya şifre" |
| A2 | Yanlış şifre dene | 401, hata mesajı |
| A3 | Doğru giriş | `/dashboard`'a yönlendir, sidebar görünür |
| A4 | Sağ üst "Çıkış" | `/login`, token silinir |
| A5 | localStorage'da token sil → sayfa yenile | `/login`'e yönlendirilir |
| A6 | localStorage'a geçersiz token koy → admin sayfa aç | 401 → otomatik logout |
| A7 | Token süresi 60 dk; bekleyip API çağır | 401 → logout |

### 2.2 Categories

| # | Adım | Beklenen |
|---|---|---|
| C1 | "Yeni Kategori" → Ad=Test, Emoji=🧪, Sıra=99 | Tabloda görünür |
| C2 | Düzenle → Sıra=1, Kaydet | Tablo güncellenir |
| C3 | Sil — restoranı olmayan kategori | Silinir |
| C4 | Sil — restoranı olan kategori (örn. Burger) | **409** "Bu kategori N restoran tarafından kullanılıyor" |
| C5 | Ad boş bırak | Form validation hatası |
| C6 | Emoji yerine düz harf "X" gir | Kabul eder (validasyon yok, kasıtlı) |
| C7 | Ana sayfa sol sidebar → 18+ yeni kategori görünür | API'den çekiyor |

### 2.3 Platforms

| # | Adım | Beklenen |
|---|---|---|
| P1 | Yeni platform: "Test", #FF00FF | Eklenir |
| P2 | Aynı isimde 2. ekle | **409** "Bu isimde platform zaten var" |
| P3 | Düzenle | Çalışır |
| P4 | Restoran ilişkisi varken sil | **409** "N restoran ilişkisinde kullanılıyor" |
| P5 | İlişki yok → sil | Silinir |
| P6 | Renk olarak geçersiz hex "ZZZZ" gir | Backend kabul eder (validasyon yok — UI'da görünüm bozulur) |

### 2.4 Districts + Neighborhoods

| # | Adım | Beklenen |
|---|---|---|
| D1 | "Göster" butonu → mahalleler yüklenir | "Yükleniyor…" → sayı badge'leri |
| D2 | Yeni mahalle ekle "Test Mh." → Ekle | Badge listede görünür |
| D3 | Mahalleyi ✕ ile sil | Listeden çıkar |
| D4 | Yeni ilçe: id="34-test", isim="Test", side="avrupa" | Eklenir (harita'da görünmez çünkü mapData statik) |
| D5 | Mevcut ilçe id ile yeni ekle | **409** "Bu ID'de ilçe zaten var" |
| D6 | Restoranı olan ilçeyi sil | **409** "N restoran tarafından kullanılıyor" |
| D7 | Mahalle ekle: 51+ karakter | **422** (model String(50) sınırı) |

### 2.5 Restaurants

| # | Adım | Beklenen |
|---|---|---|
| R1 | "+ Yeni Restoran" → Ad=Test, İlçe=Kadıköy, Kategori=Burger, Platform=Uber Eats (50) | Eklenir, tabloda görünür |
| R2 | Mevcut restoranı düzenle, platformu değiştir | Eski platform link'i silinir, yenisi eklenir |
| R3 | Pasifleştir (soft delete) | `is_active=false` → ana sayfa search'te çıkmaz |
| R4 | Arama: "test" | Liste filtrelenir |
| R5 | İlçe filtresi: Kadıköy | Sadece Kadıköy restoranları |
| R6 | Kategori filtresi: Burger | Sadece Burger |
| R7 | **CSV export** → indir | `restaurants.csv` dosyası, header doğru |
| R8 | **CSV import** [examples/restaurants_example.csv](../examples/restaurants_example.csv) | "7 eklendi" toast (veya update varsa "X eklendi, Y güncellendi") |
| R9 | CSV import: aynı dosya 2. kez | "0 eklendi, 7 güncellendi" (upsert by name+district) |
| R10 | CSV import: eksik kolonlu dosya | "Eksik sütun: …" hatası |
| R11 | Yeni Restoran: Platform seçilmedi | Eklenir, platforms boş |
| R12 | Yeni Restoran: var olmayan district_id (sadece API ile) | **400** "district_id '…' bulunamadı" |

### 2.6 Case Studies

| # | Adım | Beklenen |
|---|---|---|
| CS1 | "+ Yeni Case Study" → Başlık, ilçe, kategori, **Öncesi resmi** + **Sonrası resmi** + şikayet/iyileştirme tag'leri | Form kaydeder, tabloda thumbnail görünür |
| CS2 | Mevcut hikayeye yeni resim yükle | Eski silinir (`delete_media`), yeni `media/case-studies/UUID.png` |
| CS3 | TagInput: Enter ile şikayet ekle | Badge belirir, ✕ ile silinir |
| CS4 | Sırayı `↑` `↓` ile değiştir | Reorder API çağrısı, ana sayfa case-studies sırası güncellenir |
| CS5 | Pasifleştir (Pasif butonu) | Public `GET /case-studies` filtrelenir |
| CS6 | CSV export | Tüm hikayeler, complaints/improvements `\|` ayrılmış |
| CS7 | Resim dosyası 10MB üzeri | **413** "Dosya çok büyük" |
| CS8 | Resim olmayan dosya (.txt) | **400** "Desteklenmeyen dosya uzantısı" |
| CS9 | Resim hiç yüklemeden kaydet | Görsel yok placeholder ile kayıtlanır |

### 2.7 Applications

> Public POST `/applications` ile başvuru yaratılabilir; frontend Apply sayfasında form gönderir.

| # | Adım | Beklenen |
|---|---|---|
| AP1 | http://localhost:5180/apply → form doldur → gönder | Backend'e POST atar, `is_active=true status=pending` kayıt |
| AP2 | Admin: Applications listesi | Yeni başvuru görünür |
| AP3 | Durum dropdown'ı: pending → accepted | Anında güncellenir |
| AP4 | Status filtresi: "Bekliyor" | Sadece pending |
| AP5 | CSV export | applications.csv |
| AP6 | E-posta formatı bozuk girilse (curl ile) | **422** pydantic EmailStr |
| AP7 | Detay modal → mesaj görünür mü | Evet, `bg-base-200 p-2 rounded` panelde |

### 2.8 Analytics (İlçe / Mahalle / Rakip)

| # | Adım | Beklenen |
|---|---|---|
| AN1 | Analytics → İlçe sekmesi → İlçe=Kadıköy, Dönem=2026-04-01, Uber Eats müşteri=180 + daily/monthly/yearly forecast | "Kaydedildi (3 kayıt)" (her platform için 1) |
| AN2 | Aynı dönem + ilçe + kategori → "Mevcut veriyi yükle" | Önceki değerler form'a basılır |
| AN3 | Ana sayfa → Kadıköy seç → Platform donut + Bütçe + Forecast doluyor | Adminden girilen sayılar görünür |
| AN4 | CSV export → düzenle (müşteri değiştir) → import | "X güncellendi" |
| AN5 | CSV import: period_date "2026/04/01" (yanlış format) | "satır N: period_date YYYY-MM-DD formatında olmalı" |
| AN6 | CSV import: olmayan district_id | "satır N: district_id '…' bulunamadı" |
| AN7 | Mahalle sekmesi: ilçe seç → mahalle dropdown dolar | Mahalleler API'den gelir |
| AN8 | Rakip sekmesi: 3 platform için min_basket + rating + ciro vs. | Upsert, "Kaydedildi (3 kayıt)" |
| AN9 | İlçe analiz: hiçbir platform yokken kaydet | "0 kayıt" (boş platform listesi) |

### 2.9 Public site smoke

| # | Adım | Beklenen |
|---|---|---|
| PB1 | http://localhost:5180 | Harita + sidebarlar + ana içerik |
| PB2 | Sol sidebar → "Adalar" tıkla | Map'te Adalar koyu, header "İstanbul / Adalar", sidebar'da accordion açılır |
| PB3 | Adalar'ın altından "Burgazada" tıkla | Analytics mahalleye güncellenir, mahalle vurgulu |
| PB4 | Search bar: "Köfteci" | Dropdown'da Köfteci Hasan görünür |
| PB5 | Dropdown'dan seç | İlçesi seçilir, analytics yüklenir |
| PB6 | Search: rastgele harfler "zxq" | "Sonuç bulunamadı" |
| PB7 | Sağ sidebar → "Burger" tıkla | Highlight, analytics kategori param'ı eklenir |
| PB8 | Aynı kategoriyi tekrar tıkla | Seçim kalkar (toggle) |
| PB9 | Restoran Kıyaslama Paneli'nde alt başlık "Başakşehir ilçesindeki..." | Ana sayfa seçim ile sync |
| PB10 | Olumsuz Yorumlar Paneli üst selectorlar | İlçe seçince mahalle dropdown'ı yenilenir (UI-only — veri sabit) |
| PB11 | Case Studies bölgesi → numara butonları | Hikaye değişir |
| PB12 | http://localhost:5180/apply → form doldur | Onay ekranı |

### 2.10 Responsive

| # | Adım | Beklenen |
|---|---|---|
| RS1 | Tarayıcı 1920 → 1280 → 1024 → 768 → 640 → 360 | Her boyutta görsel olarak sıkışma yok |
| RS2 | 1280 civarı: ana sayfa 3 col → 2 col | 1 2 / 3 6 / 4 5 düzeni |
| RS3 | İş Modeli kartları → 4 metric → 2 metric → 1 metric | Yazılar kart dışına taşmaz |
| RS4 | İptal/İade pasta — dar ekranda chart üstte legend altta | Layout flex-col |

---

## 3. Kırma / Saldırı Senaryoları

> **Not:** Aşağıdaki senaryolar **lokal dev'de bilinçli olarak** denenmeli; başkasının sistemine asla.

### 3.1 Authentication & Authorization

| # | Saldırı | Mevcut savunma | Beklenen |
|---|---|---|---|
| S1 | Token olmadan `/admin/*` çağır | `Depends(get_current_admin)` | 401 |
| S2 | Geçersiz JWT (random string) | `decode_token` ValueError | 401 |
| S3 | Süresi geçmiş JWT | jose `exp` claim check | 401 |
| S4 | Başka kullanıcının token'ı (alg=none) | `algorithms=[HS256]` zorunlu | 401 |
| S5 | Brute force login (100x yanlış şifre) | **Rate limit YOK** ⚠️ | Backend dakikada 100+ deneme kabul eder |
| S6 | `/auth/login` SQL injection: email=`' OR 1=1 --` | SQLAlchemy parametrize ediyor | Güvenli |
| S7 | bcrypt 72 byte üstü password | bcrypt'i direkt kullanıyoruz, hash'leme `encode('utf-8')` ile | İlk 72 byte alınır (saldırı vektörü değil) |

**Eksik:** Rate-limiting (login + tüm API), audit log.

### 3.2 Input Injection

| # | Saldırı | Beklenen |
|---|---|---|
| S10 | Restoran adı `<script>alert(1)</script>` | DB'ye yazar, frontend React JSX otomatik escape eder → güvenli |
| S11 | Restoran adı 200+ karakter | **422** pydantic max_length |
| S12 | Search query: `%` veya `_` (SQL LIKE wildcard) | Backend `f"%{q}%"` → wildcard query çalışır (DoS değil ama beklenmeyen sonuç) ⚠️ |
| S13 | Search query: çok uzun string (10000 karakter) | İLİKE LIKE çok yavaş ⚠️ |
| S14 | CSV import: 100 MB dosya | **Boyut limiti yok** ⚠️ → backend OOM riski |
| S15 | CSV import: 100k satır | Tek transaction'da işler, RAM şişer ⚠️ |
| S16 | CSV import: kolon ismi UTF-8 BOM ile | pandas tolerant — çoğu zaman çalışır |

**Eksik:** Search query length limit, CSV upload size limit, LIKE wildcard escape.

### 3.3 File Upload

| # | Saldırı | Mevcut savunma | Sonuç |
|---|---|---|---|
| S20 | 10 MB üzeri resim | Var (`_MAX_BYTES`) | 413 ✓ |
| S21 | .exe / .php / .sh upload | İzin verilen uzantı listesi (jpg/jpeg/png/webp/gif) | 400 ✓ |
| S22 | İçeriği PHP olan dosyayı `.jpg` uzantısıyla yükle | **MIME doğrulaması yok** ⚠️ | Yüklenir; ama nginx/static serve eder, exec etmez |
| S23 | Path traversal: filename `../../etc/passwd` | UUID ile yeniden adlandırma | Güvenli ✓ |
| S24 | `folder=case-studies/../../..` | `folder.strip("/").replace("..", "")` | Güvenli ✓ |
| S25 | Zip bomb (.png içine zip) | Yok | Disk dolma riski (boyut limiti ile sınırlanır) |
| S26 | Aynı dosyayı 1000 kez upload | Yok | Disk şişer ⚠️ |

**Eksik:** Pillow ile gerçek görüntü doğrulaması (`Image.verify()`), kullanıcı başına storage quota.

### 3.4 Business Logic

| # | Saldırı | Mevcut savunma | Sonuç |
|---|---|---|---|
| S30 | Kategoriyi sil, FK kontrolünü atla | Sayım sorgusu var, 409 | ✓ Engellenir |
| S31 | Aynı anda 2 istek: aynı `district_id` ile create | **Concurrency lock yok** ⚠️ | İki kayıt da insert dener; primary key unique olduğu için biri başarısız olur |
| S32 | Analytics upsert: aynı period_date için 100 paralel post | Race condition: aynı satır 2x insert olabilir | UniqueConstraint var (`uq_district_analytics`) ✓ |
| S33 | Restaurant create: platforms `[{platform_id:9999}]` | `_ensure_refs` validate eder | 400 ✓ |
| S34 | Case study reorder: olmayan ID | Validate var | 400 ✓ |
| S35 | Application status: "deleted" gibi geçersiz değer | `Literal[...]` pydantic | 422 ✓ |

### 3.5 CORS / Cross-Origin

| # | Saldırı | Mevcut savunma | Sonuç |
|---|---|---|---|
| S40 | http://localhost:9999 origin'den fetch | ALLOWED_ORIGINS whitelist | CORS hatası ✓ |
| S41 | `null` origin (file:// üzerinden) | `*` değil, whitelist | Reddedilir ✓ |
| S42 | `evil.com` → JWT'yi CSRF ile çal | Token localStorage'da (cookie değil), CSRF değil ama XSS riski var | XSS olursa token çalınabilir ⚠️ |

**Eksik:** Content-Security-Policy header, httpOnly cookie session.

### 3.6 DB / Storage

| # | Saldırı | Sonuç |
|---|---|---|
| S50 | SQLite'a paralel 100 write | SQLite tek write at a time → kuyruğa girer (slow ama crash değil) |
| S51 | DB file silinirse | Backend 500'ler döner — restart + `init_local_db` lazım |
| S52 | `media/` klasörü read-only yapılırsa | Upload `OSError` → 500 |
| S53 | `media/` 100 GB doldurulursa | Disk doluluk hatası |

---

## 4. Bilinen Eksiklikler — Production'a hazırlık için yapılması gerekenler

### Yüksek öncelikli
- [ ] **Hardcoded mock veriler** (yukarıdaki Tablo 1'de "yönetilemeyen" liste) — saha ekibi değiştiremez
- [ ] **Rate limiting** — login + tüm API uçları (slowapi veya benzeri)
- [ ] **Audit log** — admin değişiklikleri kim/ne zaman
- [ ] **CSV upload size limit** — şu an sınırsız
- [ ] **Search query length limit** + LIKE wildcard escape
- [ ] **JWT refresh akışı** — şu an 60 dk'da otomatik çıkış
- [ ] **HTTPS** — prod'da arkasında reverse proxy
- [ ] **Postgres'e geçiş** — şu an SQLite (concurrent write sınırı)

### Orta öncelikli
- [ ] Pillow ile **image content verification** (uzantı yetersiz)
- [ ] Storage **quota** (kullanıcı başına / global)
- [ ] CommentAnalist için **gerçek metin analizi backend** (Comment modeli + NLP)
- [ ] RestaurantOperationalCard için **OperationalReason** tablosu
- [ ] **CSP header** + httpOnly cookie session (XSS sertleştirme)
- [ ] Email/SMS bildirimleri (yeni başvuru, durum değişimi)

### Düşük öncelikli
- [ ] Çoklu admin yönetimi UI'si (şu an env'den 1 admin)
- [ ] Çoklu dil
- [ ] Görsel kalite optimizasyonu (Pillow ile resize/WebP convert)
- [ ] Drag-drop case study reorder (mevcut: ↑↓ butonları)
- [ ] WYSIWYG editor (case study metni için)

---

## 5. Hızlı sistem kırma rehberi (smoke break)

```bash
# 1. Boş arama — boş array dönmeli
curl -s 'http://localhost:8003/restaurants/search?q='   # 422 (min_length=1)

# 2. SQL injection — etkisiz olmalı
curl -s "http://localhost:8003/restaurants/search?q=%27%20OR%201=1%20--"   # tek string olarak match denenir

# 3. Token olmadan admin
curl -s http://localhost:8003/admin/restaurants   # 401

# 4. Yanlış content-type ile POST
curl -X POST http://localhost:8003/auth/login -d 'email=x&password=y'   # 422 (json bekleniyor)

# 5. Aşırı uzun query
curl -s "http://localhost:8003/restaurants/search?q=$(python3 -c 'print("a"*100000)')"   # yavaş ama 200

# 6. Var olmayan endpoint
curl -s http://localhost:8003/foo   # 404
```

---

Bu rehber kapsamlı bir referans; saha ekibi smoke test için **bölüm 2**'yi adım adım izleyebilir. Bulunan herhangi bir tutarsızlık veya eksiklik için bölüm 4'e ekleme yapın.
