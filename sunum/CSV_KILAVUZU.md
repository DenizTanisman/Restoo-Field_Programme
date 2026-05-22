# Opencard Veri Yükleme Kılavuzu

> **Hedef:** Bu doküman, sisteme **veri yükleyecek olan ekibe** (saha + ofis) verilecek CSV şablonlarını ve her sütunun ne anlama geldiğini açıklar.
>
> **Mayıs 2026 itibarıyla** Opencard CSV mimarisi yenilendi: **hiçbir hücrede JSON, dict veya liste yoktur**. Her sütun saf bir yazı veya rakam içerir. Excel'de açıp düzenlemek, Google Sheets'te paylaşmak rahattır.

---

## 1. Kısa özet

Sistemde toplam **5 CSV** kullanılır. Müdür sunumu için **3 ana CSV** öne çıkar:

| CSV | Sütun sayısı | Amacı |
|---|---|---|
| **`restaurants.csv`** | 9 | Sistemdeki restoran listesini ve her platformdaki müşteri sayısını tutar |
| **`data_entry_district.csv`** | 262 | Bir ilçenin tüm performans verisini (analytics + metrics + heatmap + yorum analizi) tek satırda tutar |
| **`data_entry_neighborhood.csv`** | 263 | Aynısının mahalle versiyonu — sadece `neighborhood` sütunu eklenir |

> Diğer 2 CSV: `case_studies.csv` (20 sütun, başarı hikayeleri) ve `loyalty.csv` (27 sütun, sadakat sayfası içeriği). Saha ekibinden ziyade pazarlama/ürün ekibi kullanır.

---

## 2. Genel kurallar (tüm CSV'lerde geçerli)

| Kural | Açıklama |
|---|---|
| 📄 **Dosya formatı** | UTF-8 kodlu CSV |
| 📅 **Tarih** | `YYYY-MM-DD` (örn. `2026-05-01`) |
| ✅ **Boolean** | `true` veya `false` (küçük harf) |
| 🔢 **Ondalık ayraç** | Nokta (`.`). Virgül **kullanılmaz**. |
| 🚫 **Binlik ayraç** | Yok. `1247` doğru, `1.247` veya `1,247` yanlış. |
| ⬜ **Boş hücre** | Kabul edilir. Default değer atanır (genellikle 0 veya boş metin). |
| 🚫 **Hücrede liste yok** | Her hücre **tek** yazı veya rakam. JSON, pipe-delimited, virgüllü liste yok. |
| 🔑 **id sütunu** | Boş = yeni kayıt oluştur. Dolu = mevcut kaydı güncelle. |

---

## 3. `restaurants.csv` — Restoran listesi (9 sütun)

### Amaç
Sistemdeki restoranları toplu olarak ekle/güncelle. Her satır = bir restoran.

### Sütunlar

| # | Sütun | Tip | Zorunlu? | Min/Max | Örnek | Açıklama |
|---|---|---|---|---|---|---|
| 1 | `id` | int | ❌ | — | `42` veya boş | Boş = yeni kayıt; dolu = güncellenecek mevcut kayıt |
| 2 | `name` | string(200) | ✅ | — | `Ali Usta Kebap` | Restoran adı |
| 3 | `district_id` | string(50) | ✅ | — | `34-fatih` | Sistemdeki ilçe ID'si (Districts sayfasından) |
| 4 | `neighborhood_id` | int | ❌ | — | `127` veya boş | Mahalle ID; verirsen ilçeyle uyumlu olmalı |
| 5 | `category_id` | int | ✅ | — | `3` | Kategori ID (Categories sayfasından) |
| 6 | `is_active` | boolean | ❌ (default true) | true/false | `true` | Aktif restoran public'te görünür; pasif yalnızca admin'de |
| 7 | `yemeksepeti_customers` | int | ❌ (default 0) | ≥ 0 | `1240` | Yemeksepeti'ndeki müşteri sayısı |
| 8 | `trendyol_customers` | int | ❌ (default 0) | ≥ 0 | `860` | Trendyol Go'daki müşteri sayısı |
| 9 | `getir_customers` | int | ❌ (default 0) | ≥ 0 | `420` | Getir'deki müşteri sayısı |

### Örnek satırlar

```csv
id,name,district_id,neighborhood_id,category_id,is_active,yemeksepeti_customers,trendyol_customers,getir_customers
,Ali Usta Kebap,34-fatih,,3,true,1240,860,420
,Pizza Roma,34-besiktas,,5,true,980,1100,510
,Burger House,34-kadikoy,,7,false,0,0,0
```

> Bu örnek **`sunum/restaurants.csv`** dosyasında hazır mevcut.

---

## 4. `data_entry_district.csv` — İlçe verisi (262 sütun)

### Amaç
Bir ilçe × kategori × dönem birleşimi için **tüm performans verilerini** tek satırda topla. Her satır = bir kapsam.

### Sütun bölümleri (10 grup)

| Grup | Sütun sayısı | İçerik |
|---|---|---|
| **A. Scope (kapsam)** | 4 | district_id, category, period_start, period_end |
| **B. Analytics** | 27 | 3 platform × 9 alan (müşteri, bütçe, kampanya oranları, satış tahminleri) |
| **C. Skaler metric** | 13 | İptal/iade oranı, performans skoru, sepet/menü/ciro, kurye ücreti, olumsuz yorum |
| **D. İptal sebepleri** | 5 | 5 sabit sebep (sadece yüzdeler) |
| **E. İade sebepleri** | 4 | 4 sabit sebep (sadece yüzdeler) |
| **F. Puan dağılımı** | 10 | Her yıldız için % ve adet (5/4/3/2/1) |
| **G. Kurye karşılaştırma** | 8 | Restoran kuryesi (rc_*) + kendi kuryen (oc_*) |
| **H. Platform olumsuz yorum** | 3 | Her platform için olumsuz yorum % |
| **I. Şikayet kelimeleri** | 20 | 10 slot × (text + weight) |
| **J. Saatlik yoğunluk** | 168 | 7 gün × 24 saat |
| **TOPLAM** | **262** | |

### A. Scope (4 sütun)

| Sütun | Tip | Zorunlu? | Örnek | Açıklama |
|---|---|---|---|---|
| `district_id` | string(50) | ✅ | `34-fatih` | İlçe ID |
| `category` | int veya boş | ❌ | (boş) veya `3` | Boş = tüm kategoriler ortalaması; dolu = sadece o kategori |
| `period_start` | date | ✅ | `2026-05-01` | Verinin geçerli olduğu ay başı |
| `period_end` | date veya boş | ❌ | (boş) | Boş bırak — otomatik +1 ay olarak hesaplanır |

### B. Analytics (27 sütun)

Her platform için 9 alan. **3 platform** = Yemeksepeti, Trendyol, Getir.

Sütun adı şablonu: `<alan>_<platform>`

| Alan | Tip | Min/Max | Örnek | Açıklama |
|---|---|---|---|---|
| `customers_yemeksepeti` | int | ≥ 0 | `2273` | İlçedeki o platformun müşteri sayısı |
| `ad_budget_yemeksepeti` | float | ≥ 0 | `43157` | Aylık reklam bütçesi (₺) |
| `campaign_rate_yemeksepeti` | float | 0–100 | `30.0` | Kampanya katılım % |
| `coupon_rate_yemeksepeti` | float | 0–100 | `36.1` | Kupon katılım % |
| `flash_rate_yemeksepeti` | float | 0–100 | `29.4` | Flash katılım % |
| `joker_rate_yemeksepeti` | float | 0–100 | `47.8` | Joker katılım % |
| `daily_forecast_yemeksepeti` | float | ≥ 0 | `11747` | Günlük satış tahmini (₺) |
| `monthly_forecast_yemeksepeti` | float | ≥ 0 | `357884` | Aylık satış tahmini (₺) |
| `yearly_forecast_yemeksepeti` | float | ≥ 0 | `7507349` | Yıllık satış tahmini (₺) |

→ Aynı 9 alan `_trendyol` ve `_getir` ile tekrar eder. Toplam **27 sütun**.

### C. Skaler metric (13 sütun)

| Sütun | Tip | Min/Max | Örnek | Açıklama |
|---|---|---|---|---|
| `cancel_rate` | float | 0–100 | `17.7` | İptal oranı % |
| `return_rate` | float | 0–100 | `11.7` | İade oranı % |
| `area_performance_score` | float | 0–100 | `86.2` | İlçe performans skoru |
| `area_rating` | float | 0–5 | `4.03` | İlçe ortalama puanı |
| `highest_rating` | float | 0–5 | `4.59` | İlçedeki en yüksek puan |
| `lowest_rating` | float | 0–5 | `3.73` | İlçedeki en düşük puan |
| `avg_basket` | float | ≥ 0 | `130` | Ort. sepet tutarı (₺) |
| `avg_menu_price` | float | ≥ 0 | `226` | Ort. menü fiyatı (₺) |
| `avg_monthly_revenue` | float | ≥ 0 | `496232` | Ort. aylık ciro (₺) |
| `courier_fee` | float | ≥ 0 | `22` | Kurye ücreti (₺) |
| `negative_comment_total` | int | ≥ 0 | `2206` | Toplam olumsuz yorum sayısı |
| `negative_comment_rate` | float | 0–100 | `22.9` | Olumsuz yorum oranı % |
| `negative_avg_rating` | float | 0–5 | `2.42` | Olumsuz yorumların ortalama puanı |

### D. İptal sebepleri (5 sabit sütun)

Sadece yüzdeyi gir; etiket ve renk sistemde sabittir.

| Sütun | Etiket (sabit) | Örnek % |
|---|---|---|
| `cancel_pct_uzun_bekleme` | "Uzun bekleme" | `4.5` |
| `cancel_pct_yanlis_urun` | "Yanlış ürün" | `3.2` |
| `cancel_pct_lezzet` | "Lezzet sorunu" | `2.1` |
| `cancel_pct_urun_stokta_yok` | "Ürün stokta yok" | `1.5` |
| `cancel_pct_diger` | "Diğer" | `0.8` |

### E. İade sebepleri (4 sabit sütun)

| Sütun | Etiket (sabit) | Örnek % |
|---|---|---|
| `return_pct_eksik_malzeme` | "Eksik malzeme" | `2.5` |
| `return_pct_soguk_geldi` | "Soğuk geldi" | `12.8` |
| `return_pct_yanlis_siparis` | "Yanlış sipariş" | `1.2` |
| `return_pct_ambalaj` | "Ambalaj sorunu" | `3.5` |

### F. Puan dağılımı (10 sütun)

Her yıldız için iki sütun: yüzde ve adet.

| Sütun | Tip | Örnek |
|---|---|---|
| `rating_5_pct` / `rating_5_count` | float / int | `16.8` / `1034` |
| `rating_4_pct` / `rating_4_count` | float / int | `42.3` / `2600` |
| `rating_3_pct` / `rating_3_count` | float / int | `22.0` / `1352` |
| `rating_2_pct` / `rating_2_count` | float / int | `12.0` / `737` |
| `rating_1_pct` / `rating_1_count` | float / int | `6.9` / `424` |

### G. Kurye karşılaştırması (8 sütun)

İki kurye türü: `rc_` (restoran kuryesi) ve `oc_` (kendi kuryen).

| Sütun | Tip | Örnek | Açıklama |
|---|---|---|---|
| `rc_fee` | float | `22` | Restoran kuryesi ücreti (₺) |
| `rc_avg_cost` | float | `34.79` | Restoran kuryesi ort. maliyet (₺) |
| `rc_monthly_revenue` | float | `5114` | Restoran kuryesi aylık ciro (₺) |
| `rc_churn_label` | enum | `YÜKSEK` | Vazgeçme oranı: `DÜŞÜK` / `ORTA` / `YÜKSEK` / boş |
| `oc_fee` | float | `0` | Kendi kuryen ücreti |
| `oc_avg_cost` | float | `33.27` | Kendi kuryen ort. maliyet |
| `oc_monthly_revenue` | float | `1060128` | Kendi kuryen aylık ciro |
| `oc_churn_label` | enum | `DÜŞÜK` | |

### H. Platform olumsuz yorum (3 sütun)

Her platform için olumsuz yorum yüzdesi.

| Sütun | Tip | Örnek |
|---|---|---|
| `neg_pct_yemeksepeti` | float (0–100) | `31.9` |
| `neg_pct_trendyol` | float (0–100) | `28.5` |
| `neg_pct_getir` | float (0–100) | `39.6` |

### I. Şikayet kelimeleri (20 sütun)

10 slot. Her slot için kelime ve ağırlık.

| Sütun | Tip | Örnek |
|---|---|---|
| `word_1_text` / `word_1_weight` | string(50) / int | `Geç` / `15` |
| `word_2_text` / `word_2_weight` | | `Soğuk` / `12` |
| `word_3_text` / `word_3_weight` | | `Az` / `9` |
| ... (10. slota kadar) | | |
| `word_10_text` / `word_10_weight` | | (boş) / `0` |

> 10'dan fazla şikayet kelimesi varsa, en önemli 10'u seç. Slot boş kalırsa atlanır.

### J. Saatlik yoğunluk (168 sütun)

7 gün × 24 saat = 168 hücre. Her hücre 0-100 arası yoğunluk değeri.

Sütun adı şablonu: `heat_<gün>_<saat>`

| Gün kısaltması | Türkçe karşılığı |
|---|---|
| `mon` | Pazartesi |
| `tue` | Salı |
| `wed` | Çarşamba |
| `thu` | Perşembe |
| `fri` | Cuma |
| `sat` | Cumartesi |
| `sun` | Pazar |

Saatler `00`'dan `23`'e kadar.

Örnek:
- `heat_mon_00` = Pazartesi 00:00 yoğunluğu
- `heat_sun_23` = Pazar 23:00 yoğunluğu

> **Önemli:** Bu 168 sütunu elle doldurmak yerine admin'in **Veri Girişi → Kart 9 (Heatmap Editor)** tıklamalı grid'i kullanılması önerilir. Doldurulmazsa hepsi 0 kabul edilir.

### Tam örnek satır

`sunum/data_entry_district.csv` dosyasında **Fatih ilçesi için tam dolu** bir örnek satır mevcut. Müdür sunumunda bu dosya yer almalıdır.

---

## 5. `data_entry_neighborhood.csv` — Mahalle verisi (263 sütun)

İlçe CSV'siyle **birebir aynı**. Tek fark: **`neighborhood`** sütunu (mahalle adı).

### Scope farkı (5 sütun)

| Sütun | Tip | Zorunlu? | Örnek |
|---|---|---|---|
| `district_id` | string(50) | ✅ | `34-fatih` |
| `neighborhood` | string | ✅ | `Aksaray` |
| `category` | int veya boş | ❌ | (boş) |
| `period_start` | date | ✅ | `2026-05-01` |
| `period_end` | date veya boş | ❌ | (boş) |

> `neighborhood`, ilçe içindeki **mahalle adı** olarak verilir (id değil). Sistem `district_id + neighborhood` eşleşmesinden mahalleyi bulur.

Geri kalan 258 sütun ilçe CSV'sindekiyle birebir aynı (analytics + metrics + ...).

Örnek `sunum/data_entry_neighborhood.csv` dosyasında **Fatih > Aksaray** için tam dolu bir satır mevcut.

---

## 6. Veri yükleme akışı

### Excel'de açıp düzenleme

1. Şablon CSV'yi Excel veya Google Sheets'te aç
2. UTF-8 encoding seç (Türkçe karakterler için)
3. Tarihleri "Metin" sütunu olarak işaretle (yoksa Excel format değiştirir)
4. Verileri doldur — boş bırakabileceğin alanları boş bırak
5. "Farklı Kaydet" → "CSV UTF-8 (Comma delimited)" seç

### Sisteme yükleme

1. Admin paneline gir: http://localhost:5181 (canlıda farklı adres)
2. İlgili sayfaya git (Restaurants veya Veri Girişi)
3. Sağ üstte **"📁 CSV İçe Aktar"** butonuna tıkla
4. Hazırladığın CSV'yi seç
5. Sistem sonucu gösterir:
   - `created: N` — yeni eklenen kayıt sayısı
   - `updated: N` — güncellenen kayıt sayısı
   - `skipped: N` — hatalı satırlar (sayı + hata mesajı)

### Hata senaryoları

| Hata | Sebep | Çözüm |
|---|---|---|
| `district_id 'X' bulunamadı` | İlçe ID sistemde yok | Districts sayfasından doğru ID al |
| `category geçersiz` | Kategori ID yanlış | Categories sayfasından kontrol et |
| `period_start geçersiz/boş` | Tarih formatı yanlış | `YYYY-MM-DD` formatına çevir |
| `Eksik sütunlar boş kabul edildi: …` | Şablonu eski sürüm kullanıyorsun | Yeni şablonu indir |
| `neighborhood 'X' bulunamadı` | Mahalle adı tutmuyor | Districts sayfasında doğru yazılışı bul |

---

## 7. Müdür sunum paketi içeriği (bu klasörde)

`opencard/sunum/` klasöründe:

| Dosya | Açıklama |
|---|---|
| **`CSV_KILAVUZU.md`** (bu dosya) | Tüm sütunların ne anlama geldiğinin detaylı tablosu |
| **`restaurants.csv`** | 3 satır örnek restoran listesi |
| **`data_entry_district.csv`** | Fatih ilçesi için tam dolu örnek (262 sütun, 1 satır) |
| **`data_entry_neighborhood.csv`** | Fatih > Aksaray için tam dolu örnek (263 sütun, 1 satır) |

### Müdür sunumunda anlatılacak ana noktalar

1. **5 CSV, her biri sade ve düz** — Excel'de açılır, JSON yok, liste yok
2. **Her sütun saf bir yazı veya rakam** — saha ekibi rahatça dolduracaktır
3. **Tek satırda tüm ilçe/mahalle verisi** — analytics + metrics + heatmap + yorum analizi
4. **Sabit listeler** (cancel/return sebepleri, platformlar, yıldız dağılımı) **prefix'li sütunlara** açıldı — şema değişmez
5. **Değişken-uzunluk veriler** (şikayet kelimeleri, feature card) **slot mimarisi** ile çözüldü — 10 slot şikayet, 6 slot feature card
6. **Görseller** CSV'de değil, admin formundan upload edilir
7. **Geriye dönük uyum yok** — eski JSON formatlı dosyalar atılır, yeni şablon kullanılır
8. **CSV tolerantı** — eksik sütun veya boş hücre hatadır değil uyarıdır; sistem makul default'lar atar
9. **Üretim scripti** (`scripts/build_example_csvs.py`) — örnek dosyaları programatik üretir; sabit etiket/slot değişirse tek komutla yenilenir

---

## 8. Sık sorulan sorular

### S: 262 sütun çok korkutucu görünüyor. Hepsini doldurmak zorunda mıyım?

**H:** Hayır. Zorunlu olan sadece 2 sütun: `district_id` ve `period_start`. Diğer 260 sütun **default 0** ile kabul edilir. Sadece girdin olanları doldur.

### S: 168 sütun heatmap'i nasıl dolduracağız?

**H:** Genelde admin'in Veri Girişi → Kart 9 (Heatmap Editor) tıklamalı grid'ini kullan. CSV'de doldurulmazsa hepsi 0 olur — sonra admin'den düzeltebilirsin.

### S: Yeni bir platform eklersek (örn. Migros Hemen)?

**H:** Şu an sistem **3 sabit platform** kabul ediyor: Yemeksepeti, Trendyol, Getir. Yeni platform eklenirse şema versiyonu artırılır ve yeni sütunlar eklenir.

### S: Şikayet kelimeleri 10'dan fazla geliyor

**H:** En önemli 10'unu seç. Daha fazla istiyorsan ileride child CSV (ayrı dosya) çözümü eklenebilir; şu an 10 slot.

### S: Excel CSV'yi açınca Türkçe karakterler bozuluyor

**H:** Excel'de aç → "Veri" sekmesi → "Metinden Veri Al" → encoding "UTF-8" seç. Veya Google Sheets'te aç (otomatik UTF-8 algılar).

### S: Aynı satırı tekrar yüklersem ne olur?

**H:** Sistem `id` ile eşleştirir (restaurants) veya `scope + period` ile (data_entry). Mevcut kayıt **güncellenir**. Yanlışlıkla yeni kayıt oluşturmaz.

### S: Bir restoranı silmek istiyorum

**H:** İki yol:
- **Soft delete**: `is_active=false` ile güncelle (verisi kalır, public'te gözükmez)
- **Hard delete**: Admin'den manuel sil — bu CSV ile yapılmaz

---

## 9. Teknik destek

- **Backend ekibi**: Hata mesajlarının ekran görüntüsünü gönder
- **Veri ekibi**: Şablonu yeniden indir, başlıkları karşılaştır
- **Görsel yükleme**: Admin paneli içinden, her kayıt için tek tek

---

**Not:** Bu doküman ve örnek CSV'ler `opencard/sunum/` klasöründedir. Şablonlar `examples/` klasörüyle birebir aynıdır — `python scripts/build_example_csvs.py` komutu ile yeniden üretilebilir.
