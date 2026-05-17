# Saha Rehberi

Bu döküman, OpenCard sisteminde **veri girişi yapan saha görevlileri** içindir.
Kod yazmana gerek yok — terminalden 3 komut çalıştıracaksın, gerisi admin panel üzerinden.

---

## 1. Otelin Turu — Sistem nelerden oluşuyor?

OpenCard üç ayrı kapı, ortak bir kasa ve birkaç önemli dolaptan oluşur.

### 🟦 Kapı 1 — Backend (port `8003`)
Sistemin **beyni**. Her isteği o cevaplar. İçeride **PostgreSQL** denilen verinin saklandığı kasaya ulaşan tek kişidir.
Tarayıcıdan açabilirsin ama ekranda görsel yoktur:
- `http://localhost:8003/health` → "ayakta mıyım?" sorusu
- `http://localhost:8003/docs` → **Swagger** denen API kataloğu. Tek tek bütün uç noktaları görür, deneyebilirsin.

### 🟩 Kapı 2 — Public Dashboard (port `5173`)
**Müşterilerin gördüğü ekran.** İstanbul haritası, kategoriler, restoran arama, sadakat sayfası burada.
Saha görevlisi olarak bunu sadece **kontrol** etmek için açar: girdiğin veriler buraya doğru yansıyor mu diye bakarsın.

### 🟧 Kapı 3 — Admin Panel (port `5181`)
**Veri girişinin yapıldığı yer**. Bütün operasyonel iş burada. Restoranlar, ilçeler, mahalleler, kategoriler, platformlar, sadakat içeriği — hepsi bu paneldedir.

### 🗄️ Kasa — PostgreSQL (port `5432`)
Verinin saklandığı yer. Sen doğrudan müdahale etmezsin; backend'in sorduğu sorulara cevap verir.
- DB adı: `opencard`
- Kullanıcı: `opencard`
- Şifre: `opencard`

### 📂 Dolaplar — Klasörler

| Klasör | İçinde ne var? |
|---|---|
| `backend/` | API kodu + Python sanal ortamı (`.venv/`) |
| `admin/` | Yönetim paneli React kodu |
| `frontend/` | Public dashboard React kodu |
| `synthetic_csves/` | Hazır örnek CSV'ler — buradan formatı öğren, kendi verini bu şablona göre hazırla |
| `examples/` | Daha sade, "ders kitabı" niteliğinde CSV şablonları |
| `scripts/` | `generate_synthetic.py` / `generate_full_synthetic.py` — örnek veri üreten yardımcılar |
| `backend/media/case-studies/` | Başarı hikayelerine yüklenen görseller (önce/sonra fotoğrafları) |

---

## 2. Anahtarlar — Giriş bilgileri

| Yer | Adres | Kullanıcı | Şifre |
|---|---|---|---|
| Admin panel | `http://localhost:5181/login` | `admin@opencard.com` | `opencard123` |
| Swagger (Authorize butonu) | `http://localhost:8003/docs` | aynı email | aynı şifre |
| PostgreSQL CLI | `psql -h localhost -U opencard -d opencard` | `opencard` | `opencard` |

> ⚠️ Bu şifreler **dev varsayılanları**. Canlı sisteme geçildiğinde mutlaka değiştirilecek — `backend/.env` dosyasındaki `ADMIN_DEFAULT_*` ve DB şifresi alanları üzerinden.

---

## 3. Sistemi Çalıştırmak — Tek seferlik komutlar

Üç ayrı terminal sekmesi aç, sırayla:

### Terminal 1 — Backend
```bash
cd /Users/ismaildeniz/Desktop/opencard/backend
.venv/bin/uvicorn app.main:app --port 8003 --reload
```
Yanıt: `Uvicorn running on http://0.0.0.0:8003`. Sayfa açılınca `http://localhost:8003/health` → `{"status":"ok"}` görmelisin.

### Terminal 2 — Public Dashboard
```bash
cd /Users/ismaildeniz/Desktop/opencard/frontend
npm run dev
```
Yanıt: `Local: http://localhost:5173/`

### Terminal 3 — Admin Panel
```bash
cd /Users/ismaildeniz/Desktop/opencard/admin
npm run dev
```
Yanıt: `Local: http://localhost:5181/`

### Port zaten dolu hatası?
```bash
lsof -ti:8003 | xargs -r kill -9    # backend için
lsof -ti:5173 | xargs -r kill -9    # public için
lsof -ti:5181 | xargs -r kill -9    # admin için
```

### PostgreSQL durdu mu?
```bash
brew services list                  # postgresql@15 "started" görmeli
brew services start postgresql@15   # durmuşsa
```

---

## 4. Admin Panel Turu — Hangi sayfada ne yapılır

Sol kenardaki menüden gezilir. Her sayfanın görevi farklı.

| Sayfa | İçerik | Genelde ne yaparsın? |
|---|---|---|
| **Dashboard** | Özet kartlar | Genel duruma göz at |
| **Veri Girişi** ⭐ | İlçe/mahalle × kategori × dönem için **tek sayfada** Platform Müşteri, Kampanya, Tahmini Satış, İptal/İade Sebepleri, Performans Skoru, Puan Kıyaslaması, Saat Yoğunluğu, Kurye Karşılaştırması, Yorum Analizi | **Bölgesel agregat veri** girersin. En çok kullanacağın sayfa. |
| **Restaurants** | Restoranların listesi | Yeni restoran ekle, mevcut düzenle, kalıcı sil, pasif/aktif yap. Her restoran için kendi metrikleri/analitikleri **opsiyonel** girilebilir. |
| **Case Studies** | Başarı hikayeleri | "Öncesi/sonrası" tarzında hikaye ekle, fotoğraf yükle, sırala |
| **Applications** | Kurye başvuruları | Public formdan gelen başvuruları görüntüle, durum ata (kabul/red), gerekirse manuel başvuru ekle |
| **Categories** | 18 kategori | Yeni kategori ekle (sort_order ≥ 0 olmalı) |
| **Platforms** | Yemeksepeti/Getir/Trendyol Go | Logo URL, renk hex (`#RRGGBB`) ile platform yönet |
| **Districts** | 39 İstanbul ilçesi + ~874 mahalle | İlçe/mahalle düzenle. **"Sadece verisi olanlar"** toggle ile yalnızca veri girilmiş olanları göster |
| **Sadakat** | Public Sadakat sayfasının içeriği | Hero görseli, başlık, statlar, "Neler Sunuyoruz?" kartları — hepsi buradan |

---

## 5. Veri Girerken Bilmen Gereken Yapı Taşları

### District ID formatı
Hep `34-<ilçe-slug>` şeklindedir:
```
34-kadıköy, 34-fatih, 34-beşiktaş, 34-adalar, 34-üsküdar …
```
- Küçük harf
- Boşluk yerine tire
- Türkçe karakterler korunur (ç, ş, ı, ğ, ü, ö)

### Neighborhood ID
Sayısal (1, 2, 513 gibi). Bir mahallenin ID'sini öğrenmek için:
1. Admin → **Districts**, ilgili ilçeyi aç (Göster)
2. Mahalle listesi açılır; "Neighborhood ID admin panelinden alınır" (yakında her birinin yanında ID gözükecek; şimdilik DB'den):
   ```bash
   PGPASSWORD=opencard psql -h localhost -U opencard -d opencard \
     -c "SELECT id, name FROM neighborhoods WHERE district_id='34-kadıköy' ORDER BY name;"
   ```

### Category ID
| ID | Kategori |
|----|---|
| 1 | Burger |
| 2 | Pizza |
| 3 | Kebap |
| 4 | Döner |
| 5 | Sushi |
| 6 | Tatlı |
| 7+ | Yeni eklenenler |

Admin → **Categories** sayfasından tam liste görünür.

### Platform ID
| ID | Platform |
|----|---|
| 1 | Uber Eats / Trendyol Go |
| 2 | Getir |
| 3 | Yemeksepeti |

### Tarih (period_date)
`YYYY-MM-DD` formatında, **ay başı** kullan (örn: `2026-05-01`). Aynı (alan, kategori, dönem) için ikinci kez girersen sistem otomatik **güncelleme** yapar (upsert).

### is_active
`true` / `false` (küçük harf). Boş bırakırsan `true` kabul edilir.

### JSON sütunlar
Bazı sütunlar **CSV içine gömülü JSON**. Çift tırnak içine alınır ve içteki tırnaklar `""` olur. Örnek `platforms`:
```
"[{""platform_id"": 1, ""customers"": 243}, {""platform_id"": 2, ""customers"": 88}]"
```

Excel/Numbers'tan kaydederken otomatik kaçış yapar. Bilgisayar başında doğrudan yazıyorsan dikkat.

---

## 6. CSV İçeri Aktarımı — Hangi sayfaya hangi dosya?

Admin'de ilgili sayfaya git, sağ üstte **"CSV İçe Aktar"** butonu vardır. Dosya seçer, yüklersin. Sistem cevap olarak:
```
CSV: 195 güncellendi · 0 eklendi · 0 atlandı
```
gibi bir özet gösterir. Hata olduğunda satır numarasıyla birlikte mesaj döner.

| Admin sayfası | CSV dosyası | Ne içerir? |
|---|---|---|
| Restaurants | `restaurants.csv` | Restoran listesi |
| Veri Girişi → İlçe Analytics | `district_analytics.csv` | İlçe × kategori × platform aylık veri |
| Veri Girişi → Mahalle Analytics | `neighborhood_analytics.csv` | Mahalle × kategori × platform aylık veri |
| Veri Girişi → İlçe Metrics | `district_metrics.csv` | İlçe × kategori metrikleri |
| Veri Girişi → Mahalle Metrics | `neighborhood_metrics.csv` | Mahalle × kategori metrikleri |
| Analytics → Rakip | `competitors.csv` | Rakip platform performansı |

> ⚠️ Excel'de açtığında karakter bozulması olabilir. Açarken **"UTF-8"** encoding seç.

> ✅ CSV import **tolerantı**: bir sütun eksikse uyarır ama yine de import eder. Tek bir bozuk satır tüm dosyayı patlatmaz — o satır atlanır, gerisi geçer.

---

## 7. CSV Dosyalarının Tam Şablonları

Aşağıdaki tüm sütunlar `synthetic_csves/` ve `examples/` klasörlerindeki örneklerle birebir eşleşir.

### 7.1 `restaurants.csv`
```
name, district_id, neighborhood_id, category_id, is_active, platforms
```
- `platforms` → JSON: `[{"platform_id": 1, "customers": 243}, ...]`
- `neighborhood_id` boş bırakılırsa restoran sadece ilçe seviyesinde gözükür

**Örnek satır:**
```
Burger Stop - Fatih,34-fatih,429,1,true,"[{""platform_id"": 1, ""customers"": 243}, {""platform_id"": 2, ""customers"": 88}]"
```

### 7.2 `district_analytics.csv`
```
district_id, category_id, platform_id, period_date,
customers, ad_budget, campaign_rate, coupon_rate, flash_rate, joker_rate,
daily_forecast, monthly_forecast, yearly_forecast
```
- `category_id` boş bırakılırsa "tüm kategoriler aggregate"
- Oranlar 0-100 arası ondalıklı (örn: `42.5`)

### 7.3 `neighborhood_analytics.csv`
İlk sütun `neighborhood_id` (tamsayı), diğerleri 7.2 ile aynı.

### 7.4 `competitors.csv`
```
district_id, category_id, platform_id, period_date,
min_basket, avg_rating, monthly_revenue, delivery_type, discount_rate, coupon_rate
```
- `delivery_type`: `platform` / `restaurant` / `own`
- `avg_rating`: 0-5 arası (örn: `3.48`)

### 7.5 `district_metrics.csv` / `neighborhood_metrics.csv` (en karmaşık)
```
district_id (veya neighborhood_id), category_id, period_date,
cancel_rate, return_rate, cancel_reasons, return_reasons,
area_performance_score, area_rating, highest_rating, lowest_rating,
avg_basket, avg_menu_price, avg_monthly_revenue, courier_fee,
hourly_heatmap,
negative_comment_total, negative_comment_rate, negative_avg_rating,
platform_negative_distribution, rating_distribution, negative_word_cloud,
courier_comparison
```

**JSON sütunlar — yapı şemaları:**

| Sütun | Yapı |
|---|---|
| `cancel_reasons` / `return_reasons` | `[{"label": "Geç", "percent": 45, "color": "#EE4444"}, ...]` |
| `hourly_heatmap` | `[[7 gün × 24 saat int 0-100], ...]` — 7 satırlı matris |
| `platform_negative_distribution` | `[{"platform_id": 1, "percent": 42.9}, ...]` |
| `rating_distribution` | `[{"stars": 5, "percent": 25, "count": 500}, ...]` |
| `negative_word_cloud` | `[{"text": "Soğuk", "weight": 5}, ...]` |
| `courier_comparison` | `{"restaurant_courier": {"fee": 24, "avg_cost": 30.82, "monthly_revenue": 4579, "churn_label": "YÜKSEK"}, "own_courier": {...}}` |

> 🎯 **İpucu**: Bu CSV'leri elle yazmaya çalışma. `synthetic_csves/district_metrics.csv` dosyasını şablon olarak kopyala, sadece sayıları değiştir. JSON yapısına dokunma.

---

## 8. Sık Yapılan İşler — Adım Adım

### A) Yeni bir restoran ekle (admin paneli)
1. Admin → **Restaurants** → "+ Yeni Restoran"
2. Doldur: Ad, İlçe seç, Mahalle seç (ilçe seçince dropdown dolar), Kategori, Aktif toggle
3. Platformlar bölümünde Yemeksepeti/Getir/Trendyol Go için müşteri sayısı gir
4. (Opsiyonel) Aşağıdaki "Kampanya & Katılım" ve "Restoran Metrikleri" bölümlerini doldur. Boş bırakırsan ana sayfada **mahalle/ilçe verisi** kullanılır (cascade)
5. **Kaydet** → Restoran ana sayfada aratılabilir, dashboard cascade'i çalışır

### B) Bir ilçe + kategori için toplu veri gir (en yaygın iş)
1. Admin → **Veri Girişi**
2. Üstte: **Kapsam** (İlçe veya Mahalle), **İlçe** seç, gerekirse **Mahalle** seç, **Kategori** (boş = tümü), **Dönem** (varsayılan bugün)
3. **"↻ Mevcut veriyi getir"** → eğer önceden veri varsa formlar dolar
4. 11 bölümün her birini doldur (Platform Müşteri Dağılımı zaten otomatik, sadece görüntülenir):
   - ② Kampanya & Katılım (5 oran)
   - ③ Tahmini Satış (her platforma günlük/aylık/yıllık)
   - ④ İptal Sebepleri (oran + JSON)
   - ⑤ İade Sebepleri
   - ⑥ Performans Skoru (0-100)
   - ⑦ Puan Kıyaslaması (senin puanın + en yüksek + en düşük)
   - ⑧ Kıyaslama Metrikleri (sepet, menü, ciro, kurye)
   - ⑨ Saat Yoğunluğu (7×24 **tıklamalı grid** — her hücreye tıkla, yoğunluk artar)
   - ⑩ Kurye Karşılaştırması (yapılandırılmış form)
   - ⑪ Yorum Analizi (3 JSON dağılım)
5. **Hepsini Kaydet** (sticky alt bar)

### C) CSV ile toplu içe aktar
1. CSV dosyanı hazırla (yukarıdaki şablonlardan birini esas al)
2. Admin → ilgili sayfa → **"CSV İçe Aktar"** → dosyayı seç
3. Özet toast'ı oku (`created: X, updated: Y, skipped: Z`)
4. **Önemli**: Hata varsa tarayıcı DevTools (F12) → Console'da detay görünür

### D) Sadakat sayfasının içeriğini değiştir
1. Admin → **Sadakat**
2. 5 kart halinde gelir: stat sayıları, stat etiketleri, hero, features başlığı, feature kartları
3. Feature kartlarında **+ Kart Ekle / ↑↓ Sırala / Sil**
4. **Hepsini Kaydet** → public Sadakat sayfası anında güncellenir

### E) Verinin doğru girildiğini doğrula
1. Public dashboard'ı aç: `http://localhost:5173`
2. Sol kenardaki ilçeden istediğin yeri seç
3. Sağdaki Kategoriler listesinden bir kategori seç
4. Sayfadaki kartlar doluyorsa OK. Boşsa "İlçe ortalaması gösteriliyor" bilgisi olabilir — bu, mahalle bazlı veri yok ama ilçeden fallback ile beslendi demek (normal davranış)

---

## 9. Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|---|---|
| Admin'de 401 Unauthorized | Oturum süresi dolmuş. Çıkış → tekrar giriş |
| Public sayfada veri yok | Backend ayakta mı? `curl http://localhost:8003/health` |
| CSV import "Eksik sütun" uyarısı | Uyarıdır, kritik değil — yine de import yapılır. Doğru sütun başlığını `synthetic_csves/` ile karşılaştır |
| Türkçe karakter bozuk | Excel'den kaydederken UTF-8 seç. Notepad/TextEdit'te de UTF-8 kaydet |
| Port dolu hatası | `lsof -ti:<port> \| xargs kill -9` |
| PostgreSQL bağlanmıyor | `brew services start postgresql@15` |
| "Bu seçim için veri yok" sarı banner | O mahalle × kategori için Analytics/Metrics girilmemiş. Admin → Veri Girişi'nden gir |
| Yeni restoranı ana sayfada bulamıyorum | Search kutusuna **restoran adının** ilk birkaç harfini yaz. Sadece ilçe/kategori seçimi restoran listesini açmaz, sadece arama açar |
| Heatmap'i grid yerine JSON olarak yapıştırdım | Her ikisi de çalışır. Grid kullanıcı dostu, JSON ileri seviye |

---

## 10. Hızlı Referans Kartı (yazıcıdan basabilirsin)

```
SERVİSLER
  Backend     http://localhost:8003       /docs   /health
  Public      http://localhost:5173
  Admin       http://localhost:5181/login

ADMIN GİRİŞİ
  admin@opencard.com  /  opencard123

DB (gerekirse)
  psql -h localhost -U opencard -d opencard   (şifre: opencard)

REFERANS ID'LER
  Platform:  1=Uber Eats/Trendyol Go  2=Getir  3=Yemeksepeti
  Kategori:  1=Burger  2=Pizza  3=Kebap  4=Döner  5=Sushi  6=Tatlı
  Tarih:     YYYY-MM-DD  (ay başı önerilen)
  District:  34-<ilçe-slug>   örn. 34-kadıköy

ŞABLON CSV'LER
  synthetic_csves/   ← örnek doldurulmuş veri (kopyala, üzerine yaz)
  examples/          ← daha sade ders kitabı şablonları

ACİL DURDUR / BAŞLAT
  lsof -ti:<port> | xargs kill -9
  brew services restart postgresql@15
```

---

İyi çalışmalar — sorularını veya bozulanı çekinmeden ilet.
