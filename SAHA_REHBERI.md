# OpenCard Saha Rehberi

Bu rehber **veri girişi yapan saha ekibi** içindir. Programcı bilgisi gerektirmez. Sistemin ne yaptığını, hangi sayfanın ne işe yaradığını ve veri girişinin nasıl yapılacağını adım adım anlatır.

> **Son güncelleme:** Mayıs 2026 — Flat CSV mimarisi (JSON içermez)

---

## 1. Opencard nedir?

Opencard, **restoranların yemek platformlarındaki (Yemeksepeti, Trendyol Go, Getir) performansını analiz eden** bir B2B kontrol panelidir.

İstanbul'un **39 ilçesi** ve **~874 mahallesi** için:

- **Müşteri sayısı**, sipariş tahminleri, reklam bütçeleri
- **İptal/iade oranları** ve sebepleri
- **Yorum analizi** (olumsuz yorum kelimeleri, puan dağılımı)
- **Kıyaslama** (sepet tutarı, menü fiyatı, kurye ücreti)
- **Saatlik yoğunluk** haritası (7 gün × 24 saat)

verilerini tutar. Restoranların hangi platformda nasıl performans göstereceğini öngörmek için kullanılır.

---

## 2. Sistemin parçaları

| Parça | Adres (dev) | Kullanan | Görevi |
|---|---|---|---|
| 🟦 **Backend** | http://localhost:8003 | (görünmez) | Sistemin beyni; veriyi yöneten API |
| 🟩 **Public Dashboard** | http://localhost:5173 | Müşteriler / dış paydaşlar | Restoran arama, kıyaslama, sadakat sayfası |
| 🟧 **Admin Panel** | http://localhost:5181 | **Saha ekibi** | Veri girişi & yönetim |
| 🗄️ **PostgreSQL** | localhost:5432 | (sadece backend) | Verinin saklandığı veritabanı |

> **Canlı sistemde** adresler farklıdır (örn. `https://admin.opencard.com.tr`). Doğru adresi yöneticinden iste.

### Klasör yapısı (sade)

| Klasör | İçinde ne var? |
|---|---|
| `backend/` | API kodu + Python sanal ortamı |
| `admin/` | Yönetim paneli kodu |
| `frontend/` | Public dashboard kodu |
| `examples/` | 5 örnek CSV (sisteme yüklemeye hazır şablonlar) |
| `sunum/` | Müdür sunumu + 3 ana CSV |
| `scripts/` | Yardımcı scriptler |
| `backend/media/` | Yüklenen görseller (case studies, loyalty) |

---

## 3. Sisteme giriş

### Admin giriş bilgileri (dev varsayılan)

| Alan | Değer |
|---|---|
| URL | http://localhost:5181/login |
| E-posta | `admin@opencard.com` |
| Şifre | `opencard123` |

> **Canlıda** bu şifreler değiştirilmiştir — yöneticiden kendi bilgilerini al.

---

## 4. Sistemi çalıştırmak (geliştirici makinesinde)

Üç ayrı terminal penceresi aç:

```bash
# Terminal 1 — Backend
cd backend
.venv/bin/uvicorn app.main:app --port 8003 --reload

# Terminal 2 — Public Dashboard
cd frontend && npm run dev

# Terminal 3 — Admin Panel
cd admin && npm run dev
```

### Port dolu hatası?

```bash
lsof -ti:8003 | xargs kill -9    # backend
lsof -ti:5173 | xargs kill -9    # public
lsof -ti:5181 | xargs kill -9    # admin
```

### PostgreSQL durdu mu?

```bash
brew services list                  # postgresql@15 "started" görünmeli
brew services start postgresql@15   # durmuşsa
```

---

## 5. Admin paneldeki sayfalar — neye yarar?

Sol menüden gezilir.

### 📊 Dashboard
Özet kartlar. Sistemin genel durumuna bak.

### 🍽️ Restaurants
Sistemdeki restoranları yönetir.
- Restoran ekle / düzenle / soft delete (pasifleştir) / hard delete
- Her restoran için: ad, ilçe, mahalle, kategori, aktif/pasif
- Her platformda kaç müşterisi var (Yemeksepeti, Trendyol, Getir)
- 📁 **CSV ile toplu yükleme** mümkün

### 📝 Data Entry (Veri Girişi) ⭐
En çok kullanacağın sayfa. İlçe veya mahalle bazında **tüm analytics ve metrics** verilerini girer.

İki kapsam (scope):
- **İlçe**: Fatih, Beşiktaş gibi bir ilçenin verisi
- **Mahalle**: O ilçedeki spesifik bir mahalle (örn. Fatih > Aksaray)

Her kapsam için **kategori filtresi** opsiyonel:
- Kategori boş → "Tüm kategoriler ortalaması"
- Kategori dolu → Sadece o kategori için (örn. Kebap, Pizza)

**Dönem (period_start):** Verinin geçerli olduğu ay başı (örn. `2026-05-01`).
**Dönem sonu (period_end):** Otomatik hesaplanır (period_start + 1 ay). Manuel girilmesi gerekmez.

Sayfa 11 karta bölünmüş:
| # | Kart | İçerik |
|---|---|---|
| ① | Platform Müşteri | (otomatik — restoranlardan toplanır) |
| ② | Kampanya & Katılım | Reklam bütçesi + 4 oran |
| ③ | Tahmini Satış | Her platform için günlük/aylık/yıllık |
| ④ | İptal Sebepleri | İptal oranı + 5 sebep yüzdesi |
| ⑤ | İade Sebepleri | İade oranı + 4 sebep yüzdesi |
| ⑥ | Performans Skoru | 0-100 |
| ⑦ | Puan Kıyaslaması | Senin/en yüksek/en düşük puan |
| ⑧ | Kıyaslama Metrikleri | Sepet, menü fiyatı, ciro, kurye |
| ⑨ | Saatlik Yoğunluk | **7×24 tıklamalı grid** |
| ⑩ | Kurye Karşılaştırması | Restoran kuryesi vs kendi kuryen |
| ⑪ | Yorum Analizi | Olumsuz toplam, oran, puan dağılımı, kelime bulutu |

**Üst kısımda CSV butonları:**
- 📁 İlçe CSV içeri aktar
- 📁 Mahalle CSV içeri aktar
- 📤 İlçe verisini indir (mevcut veriyi CSV olarak al)
- 📤 Mahalle verisini indir

### 📚 Case Studies (Başarı Hikayeleri)
Anasayfada gösterilen "önce/sonra" başarı hikayeleri.

Her hikaye için:
- Başlık, ilçe, kategori
- **Önce:** günlük sipariş, ortalama sepet, **5 slot şikayet** (örn. "Soğuk teslimat")
- **Sonra:** günlük sipariş, ortalama sepet, **5 slot iyileştirme** (örn. "Sıcak çanta")
- **Önce/sonra görselleri** (admin formundan yüklenir — CSV'de değil)

📁 CSV ile toplu yükleme mümkün (görsel hariç).

### 💎 Loyalty (Sadakat)
Sadakat sayfasının içeriğini yönetir.
- 4 istatistik (Aktif Firma, Müşteri Kaybı Azaltma, ROI, Geri Ödeme Süresi)
- Hero bölümü (başlık, alt başlık, CTA, arka plan görseli)
- "Neler sunuyoruz?" başlığı + alt başlığı
- **6 feature card slot** (her birinde başlık + açıklama + görsel)

📁 CSV ile yükleme mümkün (görseller hariç).

### 🛵 Applications (Kurye Başvuruları)
Public siteden gelen kurye başvuruları. Manuel ekleme/düzenleme mümkün.

### 🏷️ Categories
Sistem genelindeki kategoriler (Kebap, Pizza, Burger, …).

### 📱 Platforms
Sistemdeki 3 platform: **Yemeksepeti, Trendyol, Getir** (sabit).

### 🗺️ Districts
İstanbul'un 39 ilçesi + mahalleleri. "Sadece verisi olanlar" toggle var.

---

## 6. CSV ile toplu veri yükleme — Yeni Flat Mimari

Sistemde **5 farklı CSV** var. Her birinin **belirli sütunları** ve `examples/` klasöründe **örnek dosyası** var.

### Genel kurallar

| Konu | Kural |
|---|---|
| **Dosya formatı** | UTF-8 kodlu CSV |
| **Tarih** | `YYYY-MM-DD` (örn. `2026-05-01`) |
| **Boolean** | `true` veya `false` (küçük harf) |
| **Ondalık ayraç** | Nokta (`.`) — virgül DEĞİL |
| **Binlik ayraç** | YOK — `1247` doğru, `1.247` veya `1,247` yanlış |
| **Boş hücre** | Kabul edilir; default değer atanır |
| **Hücrede liste yok** | Her hücre **tek bir** yazı veya rakam |

### 5 CSV özet

| CSV | Sütun | Ne içerir? |
|---|---|---|
| `restaurants.csv` | 9 | Restoran listesi + 3 platformdaki müşteri sayısı |
| `data_entry_district.csv` | **262** | İlçeyle ilgili **her şey** tek satırda |
| `data_entry_neighborhood.csv` | **263** | Mahalleyle ilgili **her şey** tek satırda |
| `case_studies.csv` | 20 | Başarı hikayeleri (5 slot before/after) |
| `loyalty.csv` | 27 | Sadakat sayfası içeriği (6 slot feature card) |

### Adım adım toplu yükleme

1. **Şablonu al:** Admin panelinde ilgili sayfanın **"📤 Verisini indir"** butonu (mevcut veriyi CSV olarak) veya `examples/` klasöründeki dosyayı kopyala.
2. **Excel/Google Sheets'te aç.** Her sütunun ne anlama geldiği için → [sunum/CSV_KILAVUZU.md](sunum/CSV_KILAVUZU.md)
3. **Verileri doldur.** Zorunlu sütunları boş bırakma; opsiyonel olanlar boş kalabilir (default değer atanır).
4. **CSV olarak kaydet** (Excel: "Farklı Kaydet" → "CSV UTF-8").
5. **Admin'de yükle:** İlgili sayfada **"📁 CSV İçe Aktar"** butonu.
6. **Sonuç ekranı:** Kaç satır eklendi/güncellendi, hata varsa hangi satırlarda.

### CSV içeriği detayları

#### 6.1 `restaurants.csv` (9 sütun)

| Sütun | Zorunlu? | Örnek | Açıklama |
|---|---|---|---|
| `id` | Hayır | (boş) veya `42` | Boş = yeni kayıt; dolu = update |
| `name` | **EVET** | `Ali Usta Kebap` | |
| `district_id` | **EVET** | `34-fatih` | Districts sayfasından doğru ID'yi al |
| `neighborhood_id` | Hayır | `127` | İlçeyle uyumlu olmalı |
| `category_id` | **EVET** | `3` | Categories sayfasından |
| `is_active` | Hayır (default true) | `true` | |
| `yemeksepeti_customers` | Hayır (default 0) | `1240` | |
| `trendyol_customers` | Hayır (default 0) | `860` | |
| `getir_customers` | Hayır (default 0) | `420` | |

> **District ID** Districts sayfasında her ilçenin yanında görünür (örn. `34-fatih`, `34-besiktas`).

#### 6.2 `data_entry_district.csv` (262 sütun)

En geniş CSV. Çoğu sütun **opsiyonel** ve **default 0**. Sadece doldurmak istediğin alanları gir.

| Bölüm | Sütun sayısı | İçerik |
|---|---|---|
| **Scope** | 4 | district_id, category, period_start, period_end |
| **Analytics** | 27 | 3 platform × 9 alan (müşteri, bütçe, kampanya oranları, satış tahminleri) |
| **Skaler metric** | 13 | İptal/iade oranı, performans skoru, sepet/menü/ciro, kurye ücreti, olumsuz yorum |
| **İptal sebepleri** | 5 | Uzun bekleme, yanlış ürün, lezzet, stokta yok, diğer |
| **İade sebepleri** | 4 | Eksik malzeme, soğuk geldi, yanlış sipariş, ambalaj |
| **Puan dağılımı** | 10 | Her yıldız için % ve adet (5/4/3/2/1) |
| **Kurye karşılaştırma** | 8 | Restoran kuryesi + kendi kuryen |
| **Platform olumsuz** | 3 | Her platform için olumsuz yorum % |
| **Şikayet kelimeleri** | 20 | 10 slot × (text + weight) |
| **Saatlik yoğunluk** | 168 | 7 gün × 24 saat (0-100 yoğunluk) |
| **TOPLAM** | **262** | |

**Önemli notlar:**
- Sadece doldurmak istediğin alanları doldur. Diğerleri 0 kalır.
- Saatlik yoğunluk 168 sütun — **elle doldurmaya çalışma**. Admin'in Veri Girişi → Kart 9 (Heatmap Editor) ile tıklayarak doldur.
- `rc_` = restoran kuryesi (restaurant courier), `oc_` = kendi kuryen (own courier)
- `neg_pct_yemeksepeti` = Yemeksepeti'ndeki olumsuz yorum yüzdesi

#### 6.3 `data_entry_neighborhood.csv` (263 sütun)

İlçe CSV'siyle birebir aynı, sadece **`neighborhood`** sütunu var (mahalle adı).

Örnek:
```
district_id,neighborhood,category,period_start,period_end,...
34-fatih,Aksaray,,2026-05-01,,...
```

#### 6.4 `case_studies.csv` (20 sütun)

```
id, title, district_id, category_id, sort_order, is_active,
before_daily_order, before_avg_basket,
before_complaint_1, ..., before_complaint_5,
after_daily_order, after_avg_basket,
after_improvement_1, ..., after_improvement_5
```

5 şikayet + 5 iyileştirme slot. Boş slot kabul.

> **Görseller CSV'de yok.** Önce satırı yükle, sonra admin formundan görseli upload et.

#### 6.5 `loyalty.csv` (27 sütun)

Tek satır (sistemde tek sadakat sayfası var).

```
loyalty_active_firms, loyalty_stats_active_firms_label,
loyalty_churn_reduction, ... (8 stat sütun)
loyalty_hero_badge, loyalty_hero_title, ... (5 hero sütun)
loyalty_features_title, loyalty_features_subtitle, (2 features)
card_1_title, card_1_text, ..., card_6_title, card_6_text (12 sütun)
```

> **Hero arka plan görseli ve her card görseli** CSV'de yok. Admin formundan yüklenir.

---

## 7. Görsel yükleme

CSV'lerde görsel YOK. Bütün görseller admin'in **kendi formlarından** yüklenir:

| Sayfa | Görsel |
|---|---|
| **Case Studies** | "Önce" + "Sonra" görseli (her hikaye için 2) |
| **Loyalty** | Hero arka plan + her feature card için bir görsel |

Görsel yükleme:
1. Admin'de ilgili kaydı aç (yeni veya mevcut)
2. "Görsel Yükle" butonuna tıkla
3. JPEG/PNG/WebP seç (max 5MB önerilir)
4. **Kaydet** butonuna bas

Yüklenen dosyalar `backend/media/...` altında, public URL ile servis edilir.

---

## 8. Sık karşılaşılan durumlar

### "district_id bulunamadı"
CSV'deki ilçe ID, sistemde kayıtlı bir ilçeyle eşleşmiyor. Districts sayfasından doğru ID'yi al, CSV'de düzelt.

### "Eksik sütunlar boş kabul edildi: …"
CSV'nde bazı sütun başlıkları yok. Sistem onları boş kabul edip default değer atadı. Eğer dolu olmalıydıysa şablonu yeniden indir.

### "Tüm hücreler boş — satır atlandı"
Excel bazen "hayalet satırlar" oluşturur. Onları silmek gerek.

### Verilerim public sayfada görünmüyor
1. Restoran **aktif** mi? (`is_active = true`)
2. İlçe/mahalle/kategori filtresi tutuyor mu?
3. Veri girilen **dönem** doğru mu?
4. Cascade: mahalle için veri yoksa ilçeden çekilir. Hiçbir seviyede yoksa "veri yok" banner görünür.

### Olumsuz yorum kelime sayısı 10'dan fazla
CSV'de sadece **10 slot** var. En önemli 10'u seç. Daha fazla istiyorsan admin'in Veri Girişi → Kart 11 formunu kullan (slot kuralı orada da geçerli).

### Müşteri sayısı çok büyük (örn. 1.500.000)
Binlik ayraç YASAK. `1500000` yaz.

### Excel tarihi bozuyor
Excel CSV'yi açarken `2026-05-01`'i `01.05.2026`'ya çevirebilir. **Sütunu önce "Metin" formatına çevir, sonra aç.** Veya Google Sheets kullan.

### Türkçe karakterler bozuk
Excel'den kaydederken **"UTF-8"** encoding seç. Notepad/TextEdit'te de UTF-8 kaydet.

### Admin'de 401 Unauthorized
Oturum süresi dolmuş. Çıkış → tekrar giriş.

### Backend çalışmıyor
`curl http://localhost:8003/health` → `{"status":"ok"}` görmelisin. Görmezsen yöneticiye haber ver.

---

## 9. Çalışma akışı önerileri

### A) Yeni bir ilçenin verisini sisteme girmek

1. **Restoranları yükle:** `restaurants.csv`'ye o ilçedeki tüm restoranları ekle (yeni satırlar, id boş).
2. **İlçe verisini yükle:** `data_entry_district.csv` (1 satır, kategori boş = "tüm kategoriler").
3. **Mahalle verisini yükle:** `data_entry_neighborhood.csv` (her mahalle için 1 satır).
4. Public dashboard'da (http://localhost:5173) ilçeyi seç → veriler görünmeli.

### B) Mevcut veriyi güncelleme

1. **Verisini indir** butonuyla mevcut CSV'yi al.
2. Değişiklikleri yap. `id` sütunu DOLU kalsın — yoksa yeni kayıt oluşturur.
3. Aynı CSV'yi tekrar yükle. Sistem id'den eşleştirip günceller.

### C) Bir hata yapınca

CSV import **eklemekle güncellemek** dışında bir şey yapmaz — yanlışlıkla bir şey silmez:
- `is_active=false` yapmak = soft delete (verisi kalır, public'te görünmez)
- Yanlış veriyi düzeltmek için ilgili satırı tekrar yükle (id ile eşleşip update edecek)

### D) Tek bir restoranı admin'den manuel girmek

1. Admin → **Restaurants** → "+ Yeni Restoran"
2. Doldur: Ad, İlçe, Mahalle, Kategori, Aktif toggle
3. Platformlar: Yemeksepeti/Trendyol/Getir müşteri sayısı
4. **Kaydet**

### E) Verinin doğru girildiğini doğrulamak

1. Public dashboard'ı aç: `http://localhost:5173`
2. Sol kenardaki ilçeden istediğin yeri seç
3. Sağdaki Kategori dropdown'undan bir kategori seç
4. Kartlar dolarsa OK. Boşsa cascade fallback işliyor olabilir — bu normal.

---

## 10. Hızlı Referans Kartı (yazıcıdan basabilirsin)

```
SERVİSLER (dev)
  Backend     http://localhost:8003       /docs   /health
  Public      http://localhost:5173
  Admin       http://localhost:5181/login

ADMIN GİRİŞİ (dev varsayılan)
  admin@opencard.com  /  opencard123

5 CSV
  restaurants.csv             9 sütun
  data_entry_district.csv     262 sütun
  data_entry_neighborhood.csv 263 sütun
  case_studies.csv            20 sütun
  loyalty.csv                 27 sütun

ÖRNEKLER
  examples/ klasöründe 5 hazır dosya

KURAL ÖZETİ
  Tarih:        YYYY-MM-DD  (ay başı önerilen)
  Boolean:      true / false (küçük harf)
  Ondalık:      nokta (.)  —  virgül YASAK
  Binlik:       yok  —  1247  (1.247 değil)
  Boş hücre:    kabul; default değer atanır
  Liste hücre:  yasak; her hücre tek skaler

PLATFORM ID
  yemeksepeti, trendyol, getir (CSV sütunlarında)

DISTRICT ID
  34-<slug>  örn. 34-fatih, 34-besiktas, 34-kadıköy

ACİL
  lsof -ti:<port> | xargs kill -9       portu boşalt
  brew services start postgresql@15     DB başlat
```

---

## 11. Dokümanlar

- **README.md** — Geliştiriciler için teknik referans (sen okuma)
- **sunum/CSV_KILAVUZU.md** — CSV alanları detaylı tablo + örnekler (müdür sunumu)
- **examples/** — 5 örnek CSV dosyası (sisteme yüklemeye hazır)
- **sunum/** — 3 ana CSV + kılavuz (müdüre gönderilecek paket)

---

İyi çalışmalar. Tıkanırsan yöneticiye sor — bozuk veri yüklemek geri alınabilir, soru sormak ücretsiz.
