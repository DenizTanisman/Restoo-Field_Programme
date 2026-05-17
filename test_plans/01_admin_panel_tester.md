# Test Planı — Tester 1: Admin Panel & CSV Operasyonları

> **Bu dokümanın sahibi:** Tester 1
> **Diğer test alanları farklı kişilere atanmıştır:**
> - Frontend HomePage & UX testleri → **Tester 2** ([02_frontend_homepage_tester.md](./02_frontend_homepage_tester.md))
> - Backend API & Entegrasyon testleri → **Tester 3** ([03_backend_api_tester.md](./03_backend_api_tester.md))
>
> Kapsam dışı bir konu gördüğünde ilgili teste sorumlu kişiye yönlendir.

---

## 0. Sorumluluk alanı

Bu test planı **admin panelinin** (http://localhost:5174) tüm CRUD operasyonlarını, form validasyonlarını, CSV import/export davranışını ve dosya yükleme akışını kapsar. Tüm test case'leri admin oturumu açıkken gerçekleştirilecektir.

**Test edilecek admin sayfaları:**
- `/login`
- `/dashboard`
- `/restaurants`
- `/analytics` (İlçe / Mahalle / Rakip sekmeleri)
- `/metrics` (İlçe / Mahalle sekmeleri)
- `/categories`
- `/platforms`
- `/districts` (ilçe + mahalle)
- `/case-studies` (Başarı Hikayeleri)
- `/applications`
- `/settings`

---

## 1. Ön koşullar

| # | Adım |
|---|------|
| 1.1 | Backend ayakta: `curl http://localhost:8003/health` → `{"status":"working"}` |
| 1.2 | Admin dev server ayakta: `http://localhost:5174` 200 dönüyor |
| 1.3 | Default admin DB'de var (`scripts.seed_admin` çalıştırılmış) |
| 1.4 | Test verisi yüklü (`scripts/generate_synthetic.py` çalıştırılmış) — 195 restoran, 117 analytics, 39 metrics, 3 başarı hikayesi, 3 başvuru bekleniyor |
| 1.5 | Tarayıcı: **Chrome 120+** birincil, **Safari 17+** ve **Firefox 121+** ikincil hedef |
| 1.6 | Network throttling kapalı (varsayılan) |
| 1.7 | DevTools Console açık — uncaught exception olursa not edilecek |

---

## 2. Test çıktı formatı

Her test case için:

```
[T1-XXX] Başlık
Öncelik: Kritik | Yüksek | Orta | Düşük
Durum:   ✅ Geçti  ❌ Kaldı  ⛔ Bloklu  ➖ Atlandı

Adımlar:
  1. ...
  2. ...

Beklenen: ...
Gerçek:   ... (kalırsa screenshot + console log iliştir)
Bulgu:    Yoksa boş bırak; varsa GitHub issue link'i veya kısa hata açıklaması
```

Tüm sonuçlar `test_plans/results/01_admin_<tarih>.md` altında toplanır.

---

## 3. Test kapsamı haritası

| Modül | Test sayısı | Öncelik dağılımı |
|---|---|---|
| Auth & Session | 8 | 4 kritik, 4 yüksek |
| Dashboard | 4 | 2 yüksek, 2 orta |
| Restaurants | 12 | 4 kritik, 6 yüksek, 2 orta |
| Analytics (3 tab) | 18 | 6 kritik, 8 yüksek, 4 orta |
| Metrics | 14 | 5 kritik, 6 yüksek, 3 orta |
| Categories | 6 | 2 kritik, 4 orta |
| Platforms | 6 | 2 kritik, 4 orta |
| Districts | 8 | 3 kritik, 3 yüksek, 2 orta |
| Başarı Hikayeleri | 10 | 4 kritik, 4 yüksek, 2 orta |
| Applications | 6 | 2 kritik, 3 yüksek, 1 orta |
| Settings | 4 | 2 yüksek, 2 orta |
| Cross-cutting (a11y, perf) | 4 | 4 orta |
| **Toplam** | **100** | |

---

## 4. Auth & Session (T1-001 → T1-008)

### T1-001 — Geçerli kimlik bilgileri ile giriş
**Öncelik:** Kritik
**Ön koşul:** Logged-out
**Adımlar:**
1. `http://localhost:5174/login`'e git
2. Email: `admin@opencard.com`
3. Şifre: `opencard123`
4. "Giriş" butonu

**Beklenen:** `/dashboard`'a yönlendirilir, "Hoşgeldin" header'ı görünür, sidebar açılır.

### T1-002 — Yanlış şifre
**Öncelik:** Kritik
**Adımlar:**
1. Email doğru, şifre `wrongpass`
2. Submit

**Beklenen:** "Email veya şifre hatalı" toast/inline mesaj; URL `/login`'de kalır; localStorage'a token yazılmaz (DevTools → Application → Local Storage).

### T1-003 — Boş alan validasyonu
**Öncelik:** Yüksek
**Adımlar:**
1. Email boş, şifre dolu → Submit
2. Email dolu, şifre boş → Submit

**Beklenen:** Her iki durumda da form submit edilmez, ilgili input'a kırmızı border + hata mesajı.

### T1-004 — Token persistence (sayfa yenileme)
**Öncelik:** Kritik
**Adımlar:**
1. Giriş yap
2. Sayfayı F5 ile yenile
3. Doğrudan `http://localhost:5174/restaurants`'a git

**Beklenen:** Login sayfasına geri atılmaz, restaurants listesi yüklenir.

### T1-005 — Logout
**Öncelik:** Yüksek
**Adımlar:**
1. Header'daki "Çıkış" butonuna tıkla
2. Sonra doğrudan `http://localhost:5174/dashboard`'a git

**Beklenen:** `/login`'e yönlendirilir, localStorage'da token yok.

### T1-006 — Korumalı sayfa erişimi (token yokken)
**Öncelik:** Kritik
**Adımlar:**
1. Logged-out durumda doğrudan `http://localhost:5174/metrics`'e git

**Beklenen:** Login sayfasına yönlendirilir.

### T1-007 — Token süresi dolduğunda
**Öncelik:** Yüksek
**Adımlar:**
1. DevTools → Application → Local Storage → token değerini bozulmuş bir string ile değiştir
2. Herhangi bir admin sayfasını yenile

**Beklenen:** 401 alındığında otomatik logout veya kullanıcıya "Oturum süresi doldu" mesajı.

### T1-008 — Tarayıcı sekmesi senkronizasyonu
**Öncelik:** Orta
**Adımlar:**
1. Sekme A'da giriş yap
2. Sekme B aç, `http://localhost:5174/dashboard`'a git
3. Sekme A'da logout
4. Sekme B'de bir admin sayfasına geç

**Beklenen:** Sekme B de logout olmuş olmalı (veya en geç sonraki API çağrısında 401 dönüp logout).

---

## 5. Dashboard (T1-009 → T1-012)

### T1-009 — Tüm metric kartlarının dolu gelmesi
**Öncelik:** Yüksek
**Beklenen:** 7 kart görünür: Restoran, Toplam Başvuru, Bekleyen Başvuru, **Başarı Hikayesi** (eski adı "Case Study" değil), Kategori, Platform, İlçe. Her birinin sayısı sıfırdan büyük olmalı (test verisi yüklüyse).

### T1-010 — Sayım doğruluğu
**Öncelik:** Yüksek
**Beklenen:** "Restoran" sayısı `/admin/restaurants` listesindeki kayıt sayısı ile aynı. Aynı tutarlılık tüm kartlar için.

### T1-011 — Loading state
**Öncelik:** Orta
**Adımlar:** Network throttling "Slow 3G", sayfayı yeniden yükle.
**Beklenen:** Kartlar yüklenirken spinner/skeleton; rakamlar gelir gelmez yerine oturur, layout shift yok.

### T1-012 — Erişilebilirlik (etiket okuma)
**Öncelik:** Orta
**Adımlar:** VoiceOver/Narrator ile dashboard'u oku.
**Beklenen:** Her kartın hem ikon hem etiket hem de sayısı sesli okunabiliyor.

---

## 6. Restaurants (T1-013 → T1-024)

### T1-013 — Liste yüklenir
**Öncelik:** Kritik
**Beklenen:** `/restaurants` açılır, tablo 195+ satır gösterir (synthetic_csves verisi yüklüyse). Pagination çalışır.

### T1-014 — İlçe filtresi
**Öncelik:** Yüksek
**Adımlar:** Filtre dropdown'undan "Kadıköy" seç.
**Beklenen:** Sadece Kadıköy restoranları görünür. URL/state filtreyi yansıtır.

### T1-015 — Arama
**Öncelik:** Yüksek
**Adımlar:** "Burger" yaz arama kutusuna.
**Beklenen:** Adında "Burger" geçen restoranlar listelenir.

### T1-016 — Yeni restoran oluşturma — happy path
**Öncelik:** Kritik
**Adımlar:** "+ Yeni" → form doldur (Test Restoran 1, Beşiktaş, Burger, is_active=true), 3 platform için müşteri sayısı (örn. 50/40/60) → Kaydet.
**Beklenen:** Toast "eklendi", liste başına yeni satır, restaurant_platforms tablosunda 3 satır oluşur (T3'e doğrulatılabilir).

### T1-017 — Yeni restoran — eksik alan
**Öncelik:** Yüksek
**Adımlar:** Name boş bırak, kaydet.
**Beklenen:** Frontend validasyonu form'u submit etmez veya backend 422 dönerse hata mesajı yansır.

### T1-018 — Geçersiz district_id
**Öncelik:** Orta
**Adımlar:** DevTools üzerinden network request'i değiştir, district_id'ye `34-yokoyer` gönder.
**Beklenen:** 400 "district_id '34-yokoyer' bulunamadı", UI hata gösterir.

### T1-019 — Restoran düzenleme
**Öncelik:** Kritik
**Adımlar:** Listeden bir restoranı seç, düzenle, ismini "X Restoran (güncel)" yap, platform müşteri sayısını değiştir.
**Beklenen:** Toast "güncellendi", liste güncel ad ve değerleri yansıtır.

### T1-020 — is_active pasifleştirme
**Öncelik:** Yüksek
**Adımlar:** Bir restoranın `is_active` checkbox'ını kaldır, kaydet.
**Beklenen:** Listede pasif olarak görünür (gri ya da rozetle). Public `GET /restaurants/search`'de bu restoran çıkmaz (T3 ile birlikte doğrulanabilir).

### T1-021 — CSV export
**Öncelik:** Yüksek
**Adımlar:** "CSV Dışa Aktar" butonu.
**Beklenen:** `restaurants.csv` indirilir. İlk satır: `name,district_id,category_id,is_active,platforms`. UTF-8, Türkçe karakterler düzgün.

### T1-022 — CSV import — geçerli dosya
**Öncelik:** Kritik
**Adımlar:** [synthetic_csves/restaurants.csv](../synthetic_csves/restaurants.csv) dosyasını yükle.
**Beklenen:** Toast `0 eklendi, 195 güncellendi` (zaten yüklüyse) veya `195 eklendi, 0 güncellendi`. Hata yok.

### T1-023 — CSV import — eksik kolon
**Öncelik:** Yüksek
**Adımlar:** Bir CSV hazırla, `platforms` kolonunu sil. Yükle.
**Beklenen:** Toast "Eksik sütun: platforms". Hiçbir kayıt eklenmez (atomic davranış).

### T1-024 — CSV import — bozuk JSON
**Öncelik:** Orta
**Adımlar:** restaurants.csv'de bir satırdaki `platforms` sütununda `[{broken json}` gönder.
**Beklenen:** İlgili satır error listesinde döner, diğer satırlar import edilir.

---

## 7. Analytics — 3 sekme (T1-025 → T1-042)

### Genel kontroller (her sekme için tekrarlanır)

| Sekme | Endpoint | CSV |
|---|---|---|
| İlçe | `/admin/analytics/district` | `district_analytics.csv` |
| Mahalle | `/admin/analytics/neighborhood` | `neighborhood_analytics.csv` |
| Rakip | `/admin/analytics/competitors` | `competitors.csv` |

### T1-025 — İlçe Analytics: ilçe + kategori + dönem seçimi
**Öncelik:** Kritik
**Adımlar:** Kadıköy + tüm kategoriler + 2026-05-01 → "Mevcut veriyi yükle".
**Beklenen:** 3 platform kartı dolu gelir (Trendyol, Getir, Yemeksepeti), customers/forecast değerleri görünür. Bütçe & Kampanya formu dolu.

### T1-026 — İlçe Analytics: kayıt yok durumu
**Öncelik:** Yüksek
**Adımlar:** Kadıköy + 2030-12-31 → Yükle.
**Beklenen:** Form sıfırlanır, "Bu döneme ait kayıt yok" toast'ı gösterilir.

### T1-027 — İlçe Analytics: kaydet (yeni dönem)
**Öncelik:** Kritik
**Adımlar:** Yeni dönem 2026-06-01, müşteri ve bütçe değerleri gir, kaydet.
**Beklenen:** Toast "Kaydedildi (3 kayıt)". Yeniden yükleyince aynı değerler gelir.

### T1-028 — İlçe Analytics: aynı dönem üzerine kaydet (upsert)
**Öncelik:** Kritik
**Adımlar:** Aynı (district, category, platform, period) için değerleri değiştir, kaydet.
**Beklenen:** Yeni satır eklenmez, mevcut güncellenir. Duplicate yok (T3 ile DB'den doğrulanır).

### T1-029 — Geçersiz platform_id
**Öncelik:** Yüksek
**Adımlar:** DevTools ile platforms array'inde `platform_id: 999` gönder.
**Beklenen:** 400 "platform_id bulunamadı: [999]".

### T1-030 — Negatif customer sayısı
**Öncelik:** Orta
**Adımlar:** customers'a `-5` yaz, kaydet.
**Beklenen:** Pydantic `ge=0` validasyonu nedeniyle 422.

### T1-031 — İlçe CSV import (synthetic)
**Öncelik:** Kritik
**Adımlar:** [synthetic_csves/district_analytics.csv](../synthetic_csves/district_analytics.csv) yükle.
**Beklenen:** 117 created/updated. 39 ilçe × 3 platform.

### T1-032 — İlçe CSV export
**Öncelik:** Yüksek
**Beklenen:** İndirilen dosya 117+ satır, kolon başlıkları doğru.

### T1-033 — Mahalle Analytics — happy path
**Öncelik:** Kritik
**Adımlar:** Kadıköy seç → mahalle dropdown dolar → ilk mahalle seç, dönem ver, "Yükle".
**Beklenen:** Form dolu gelir.

### T1-034 — Mahalle dropdown ilçeden bağımsız değişim
**Öncelik:** Yüksek
**Adımlar:** Mahalle seç, sonra ilçeyi değiştir.
**Beklenen:** Mahalle dropdown sıfırlanır.

### T1-035 — Mahalle CSV import
**Öncelik:** Kritik
**Adımlar:** [synthetic_csves/neighborhood_analytics.csv](../synthetic_csves/neighborhood_analytics.csv) yükle.
**Beklenen:** 117 işlem (ilk mahalle × 3 platform × 39 ilçe).

### T1-036 — Mahalle CSV: var olmayan neighborhood_id
**Öncelik:** Yüksek
**Adımlar:** CSV'ye `neighborhood_id=99999` ekle, yükle.
**Beklenen:** "satır N: neighborhood_id '99999' bulunamadı". Diğer satırlar import edilir, hata listesine yazılır.

### T1-037 — Rakip sekmesi — yeni kayıt
**Öncelik:** Kritik
**Adımlar:** İlçe + kategori + tarih seç, en az 1 competitor row ekle (platform, min_basket, avg_rating, monthly_revenue, delivery_type=platform, discount/coupon), kaydet.

### T1-038 — Rakip: delivery_type değerleri
**Öncelik:** Orta
**Beklenen:** "platform" ve "own" dışındaki değerler kabul edilmemeli (veya açık enum davranışı).

### T1-039 — Rakip CSV import
**Öncelik:** Kritik
**Adımlar:** [synthetic_csves/competitors.csv](../synthetic_csves/competitors.csv) yükle.
**Beklenen:** 195 kayıt.

### T1-040 — Rakip: platform_id NULL
**Öncelik:** Orta
**Adımlar:** Bir competitor için platform_id boş bırak (genel rakip).
**Beklenen:** Kabul edilir, DB'de platform_id=NULL olarak yazılır.

### T1-041 — Floating point precision
**Öncelik:** Düşük
**Adımlar:** avg_rating'e 4.123456 yaz.
**Beklenen:** Numeric(3,2) → 4.12 olarak yuvarlanır veya 422 döner.

### T1-042 — Aynı anda 3 sekme arasında geçiş
**Öncelik:** Orta
**Beklenen:** Sekme değiştirildiğinde state kaybı olmaz, açtığın form veriyi tutar.

---

## 8. Metrics — yeni Metrikler sayfası (T1-043 → T1-056)

### T1-043 — İlçe metrics: tüm form alanları
**Öncelik:** Kritik
**Beklenen:** Şu kartlar görünür: Hedef seçimi, Operasyon (cancel/return + sebepler editor), Skor & Puan, Kıyaslama Metrikleri, Saatlik Heatmap (7×24 input), Yorum Analizi (3 metrik + platform/rating distribution editör + word cloud), **İş Modeli Kıyaslaması** (Restoran/Senin Kuryen 2 taraflı editör).

### T1-044 — İlçe metrics: mevcut veriyi yükle
**Öncelik:** Kritik
**Adımlar:** Kadıköy + tüm kategoriler + 2026-05-01 → "Mevcut veriyi yükle".
**Beklenen:** Tüm alanlar synthetic verisi ile dolu gelir (cancel_rate ~14, hourly_heatmap 7×24 dolu, word cloud 7 kelime).

### T1-045 — Sebep ekle/sil
**Öncelik:** Yüksek
**Adımlar:** Cancel reasons'a yeni sebep ekle, başkasını sil.
**Beklenen:** Liste güncellenir, kaydet → reload → değişiklik kalıcı.

### T1-046 — Heatmap matrix kaydet
**Öncelik:** Yüksek
**Adımlar:** Heatmap'te birkaç hücreyi değiştir, kaydet.
**Beklenen:** Reload sonrası aynı değerler. JSON olarak DB'de 7-satır 24-kolon yapısında.

### T1-047 — Heatmap: 0-100 dışı değer
**Öncelik:** Orta
**Adımlar:** Bir hücreye 150 yaz.
**Beklenen:** Frontend min/max ile sınırlamalı veya backend sessizce clamp yapmalı (dokümante edilmiş davranış).

### T1-048 — Word cloud editör
**Öncelik:** Yüksek
**Adımlar:** Kelime ekle (text + weight), kaydet, public frontend'de yazı boyutunun weight ile orantılı olduğunu doğrula (Tester 2'ye haber).

### T1-049 — Platform negative distribution
**Öncelik:** Orta
**Beklenen:** 3 platform için yüzde değerleri girilebilir, toplam 100'e eşit olmasa da kabul edilir (yumuşak validasyon).

### T1-050 — Rating distribution: 5 satır kilitli
**Öncelik:** Orta
**Beklenen:** Yıldız sayıları (1-5) form'da değiştirilemez, sadece percent/count.

### T1-051 — Mahalle metrics: ilçe→mahalle bağımlılığı
**Öncelik:** Yüksek
**Adımlar:** Mahalle sekmesinde önce ilçe seç, sonra mahalle dropdown'u dolacak.
**Beklenen:** İlçe seçilmeden mahalle disabled. İlçe değiştirilince mahalle sıfırlanır.

### T1-052 — İş Modeli editör
**Öncelik:** Kritik
**Adımlar:** "RESTORAN KURYESİ" tarafına fee=20, avg_cost=35.1, monthly_revenue=5000, churn_label=YÜKSEK; "SENİN KURYEN" tarafına fee=0, avg_cost=32.4, monthly_revenue=1000000, churn_label=DÜŞÜK gir. Kaydet.
**Beklenen:** Reload sonrası değerler korunur. Public frontend Kıyaslama → "İş Modeli Karşılaştırması" kartında bu değerler görünür (Tester 2'ye haber).

### T1-053 — İlçe metrics CSV import
**Öncelik:** Kritik
**Adımlar:** [synthetic_csves/district_metrics.csv](../synthetic_csves/district_metrics.csv) yükle.
**Beklenen:** 39 satır işleme alınır. JSON kolonları (cancel_reasons, hourly_heatmap, courier_comparison vs.) doğru parse edilir.

### T1-054 — Mahalle metrics CSV import
**Öncelik:** Kritik
**Adımlar:** [synthetic_csves/neighborhood_metrics.csv](../synthetic_csves/neighborhood_metrics.csv) yükle.

### T1-055 — CSV export → reimport roundtrip
**Öncelik:** Yüksek
**Adımlar:** Export → indirilen dosyayı reimport et.
**Beklenen:** "0 created, 39 updated". Veri kaybı yok.

### T1-056 — Bozuk JSON CSV içinde
**Öncelik:** Yüksek
**Adımlar:** hourly_heatmap kolonunda `[1,2,3` (kapatılmamış array) gönder.
**Beklenen:** Hatalı satır için açıklayıcı hata mesajı, diğer satırlar etkilenmez.

---

## 9. Categories (T1-057 → T1-062)

### T1-057 — Liste 18 kategori
**Öncelik:** Kritik
### T1-058 — Yeni kategori ekle
**Öncelik:** Kritik
**Adımlar:** Ad: "Test Kategori", emoji: 🧪, sort_order: 99 → kaydet
**Beklenen:** Listeye eklenir; public `/categories` endpoint'inde de görünür.

### T1-059 — Kategori düzenle
**Öncelik:** Orta
### T1-060 — Kategori sil
**Öncelik:** Orta
**Adımlar:** Bir kategoriyi sil.
**Beklenen:** İlgili restoranlar varsa engellenir veya cascade yapılır (davranış dokümante edilmeli).

### T1-061 — Emoji input
**Öncelik:** Düşük
**Beklenen:** Emoji uzunluk sınırı (5 char) ve özel karakterler kabul edilir.

### T1-062 — sort_order çakışması
**Öncelik:** Düşük
**Beklenen:** Aynı sort_order ile birden fazla kayıt olabilir; UI bunu yansıtır.

---

## 10. Platforms (T1-063 → T1-068)

### T1-063 — Liste 3 platform
**Öncelik:** Kritik
### T1-064 — Yeni platform ekle
**Öncelik:** Kritik
**Adımlar:** "Bolt Food", color_hex: `#34D186`, logo_url: blank → kaydet
**Beklenen:** Listeye eklenir.

### T1-065 — Renk hex validasyonu
**Öncelik:** Orta
**Adımlar:** color_hex: "kırmızı" → kaydet
**Beklenen:** Geçersiz hex hatası.

### T1-066 — Logo URL'i Restoran kartına yansır
**Öncelik:** Orta
**Beklenen:** Public frontend'de PlatformDonutCard'da yeni platform için doğru renk kullanılır.

### T1-067 — Platform sil
**Öncelik:** Orta
**Beklenen:** İlgili restaurant_platforms FK varsa silme reddedilir.

### T1-068 — is_active toggle
**Öncelik:** Yüksek
**Beklenen:** Pasif platform public endpoint'lerde gizlenir.

---

## 11. Districts & Neighborhoods (T1-069 → T1-076)

### T1-069 — İlçe listesi 39 kayıt
**Öncelik:** Kritik
### T1-070 — Yeni ilçe ekle
**Öncelik:** Kritik
**Adımlar:** id: "34-test", name: "Test İlçe", side: "anadolu", svg_path: ""
**Beklenen:** Listeye eklenir. **Not:** Yeni ilçe IstanbulMap'te görünmez (SVG path eklenmediği sürece) — Tester 2'ye not edilmeli.

### T1-071 — Aynı id ile ekleme
**Öncelik:** Orta
**Beklenen:** 409 / "Bu ilçe zaten var".

### T1-072 — İlçe için yeni mahalle ekle
**Öncelik:** Yüksek
**Adımlar:** Mevcut ilçe'ye yeni mahalle: "Test Mah."
**Beklenen:** Listeye eklenir; public `/districts/{id}/neighborhoods` dönüşünde görünür.

### T1-073 — İlçesi olan ilçeyi sil
**Öncelik:** Yüksek
**Beklenen:** Cascade silme veya engelleme — davranış dokümante.

### T1-074 — Mahalle düzenle
**Öncelik:** Orta
### T1-075 — Mahalle sil
**Öncelik:** Orta
### T1-076 — Türkçe karakter (ş, ç, ğ, ü, ö, ı) ile id
**Öncelik:** Orta
**Beklenen:** URL'de encode edilir, retrieval düzgün.

---

## 12. Başarı Hikayeleri (T1-077 → T1-086)

### T1-077 — Liste 3 hikaye
**Öncelik:** Kritik
### T1-078 — Yeni hikaye + before/after görseli
**Öncelik:** Kritik
**Adımlar:** Title, district, category, sort_order, before image upload (jpg ≤ 5MB), after image upload, before/after metric değerleri, complaints listesi, improvements listesi → kaydet.
**Beklenen:** Toast "Başarı hikayesi eklendi", listede yeni satır. Public `/case-studies` endpoint'inde görünür (Tester 2 ile birlikte HomePage'de görsel render kontrolü).

### T1-079 — Görsel olmadan kaydet
**Öncelik:** Yüksek
**Beklenen:** Kabul edilir, public'te placeholder gösterir.

### T1-080 — Çok büyük görsel (>10MB)
**Öncelik:** Orta
**Beklenen:** Upload reddedilir veya client-side validation.

### T1-081 — Yanlış MIME tipi (.exe yüklemek)
**Öncelik:** Kritik
**Beklenen:** Backend MIME check yapmalı, .exe upload edilemez.

### T1-082 — Reorder (sort_order)
**Öncelik:** Yüksek
**Adımlar:** Listede 2. hikayeyi 1. yap (↑ butonu).
**Beklenen:** Liste yeniden sıralanır; public'te de aynı sırada.

### T1-083 — Pasifleştir
**Öncelik:** Yüksek
**Beklenen:** is_active=false → public `/case-studies`'de görünmez.

### T1-084 — Düzenle ve metrik string'i değiştir
**Öncelik:** Orta
**Adımlar:** before_daily_order "8-12 adet" → "10-15 adet"
**Beklenen:** Anasayfada güncellenmiş değer görünür.

### T1-085 — Complaints/improvements: 0 öğe
**Öncelik:** Orta
**Beklenen:** Liste tamamen boş kabul edilir.

### T1-086 — CSV export
**Öncelik:** Yüksek
**Beklenen:** `basari_hikayeleri.csv` indirilir, `before_complaints`/`after_improvements` `|` ile ayrılı string olarak.

---

## 13. Applications (T1-087 → T1-092)

### T1-087 — Liste yüklenir
**Öncelik:** Kritik
**Beklenen:** En az 3 başvuru görünür.

### T1-088 — Status filtresi
**Öncelik:** Yüksek
**Adımlar:** "pending" → liste filtrelenir.

### T1-089 — Status güncelleme
**Öncelik:** Kritik
**Adımlar:** Bir başvurunun status'unu "accepted" yap.
**Beklenen:** updated_at değişir, toast "güncellendi". (T3'te DB'den doğrulanabilir.)

### T1-090 — Detay paneli
**Öncelik:** Yüksek
**Beklenen:** İsim, email, telefon, mesaj, oluşturulma tarihi okunabilir.

### T1-091 — CSV export
**Öncelik:** Yüksek
**Beklenen:** id, ad, soyad, email, telefon, şehir, ilçe, vehicle, message, status, created_at sütunlu CSV.

### T1-092 — Geçersiz status'a güncelleme
**Öncelik:** Orta
**Adımlar:** DevTools ile status: "xyz" gönder.
**Beklenen:** Backend reddeder (enum validasyonu).

---

## 14. Settings (T1-093 → T1-096)

### T1-093 — 4 alan görünür
**Öncelik:** Yüksek
**Beklenen:** loyalty_active_firms, loyalty_churn_reduction, loyalty_avg_roi, loyalty_payback_period.

### T1-094 — İlk kayıt (boş DB)
**Öncelik:** Yüksek
**Beklenen:** Backend tek-satır upsert yapar (id=1).

### T1-095 — Güncelleme
**Öncelik:** Yüksek
**Beklenen:** Reload sonrası değişiklik kalıcı.

### T1-096 — Public frontend yansıması
**Öncelik:** Yüksek
**Beklenen:** Anasayfa LoyaltyPage section'ında 4 stat'ın yeni değerleri görünür (Tester 2 ile birlikte).

---

## 15. Cross-cutting (T1-097 → T1-100)

### T1-097 — Sidebar navigasyonu
**Öncelik:** Yüksek
**Beklenen:** Tüm 9 link tıklanabilir, aktif sayfa highlight'lı, "Başarı Hikayeleri" yazıyor (eski "Case Studies" değil).

### T1-098 — Sayfalar arası state korunması
**Öncelik:** Orta
**Adımlar:** Restaurants → Analytics → Restaurants
**Beklenen:** Filtreler korunur veya en azından state belirgin (URL'de yansıyor).

### T1-099 — Toast davranışı
**Öncelik:** Orta
**Beklenen:** 3-5 sn sonra otomatik kapanır, üst üste binmez (stack), erişilebilir (aria-live).

### T1-100 — Boş bir DB ile davranış (smoke)
**Öncelik:** Orta
**Adımlar:** `rm opencard_dev.db`, init_local_db + seed_admin (sadece admin), generate_synthetic çalıştırmadan admin'e gir.
**Beklenen:** Tüm sayfalar 500 atmadan boş liste gösterir. Dashboard 0 sayısıyla yüklenir.

---

## 16. Bug raporlama formatı

Bulduğun her bug için yeni issue:

```markdown
**Test ID:** T1-XXX
**Başlık:** Kısa özet
**Severity:** Critical / Major / Minor / Cosmetic
**Reproduction:**
1. ...
2. ...

**Beklenen:** ...
**Gerçek:** ...
**Tarayıcı / OS:** Chrome 120 / macOS 15
**Console error:** ```...```
**Screenshot:** (varsa attach)
**İlgili dosya/satır:** (kod taraması yapabiliyorsan)
```

---

## 17. Test kapsamı dışında kalan ve diğer kişilere yönlendirilmesi gereken durumlar

| Senaryo | Sahibi |
|---|---|
| Admin'de oluşturulan verinin **public anasayfada** doğru render edilmesi | **Tester 2** |
| **API endpoint'lerinin** kendi başına HTTP davranışı (curl ile direkt çağrı, 401/422/500 detayları) | **Tester 3** |
| **DB constraint** ihlali sonrası rollback davranışı | **Tester 3** |
| Birden fazla concurrent kullanıcı (race condition) | **Tester 3** |
| Anasayfada harita üzerindeki görsel etkileşimler | **Tester 2** |
| ApplyPage form validasyonu (public) | **Tester 2** |

---

**Tahmini test süresi:** 2-3 iş günü (100 test case, ortalama 5-7 dakika/case).
**Çıktı dosyası:** `test_plans/results/01_admin_<YYYY-MM-DD>.md` formatında her gün sonunda commit.
