# Test Planı — Tester 2: Frontend Halka Açık Dashboard & UX

> **Bu dokümanın sahibi:** Tester 2
> **Diğer test alanları farklı kişilere atanmıştır:**
> - Admin Panel & CSV testleri → **Tester 1** ([01_admin_panel_tester.md](./01_admin_panel_tester.md))
> - Backend API & Entegrasyon testleri → **Tester 3** ([03_backend_api_tester.md](./03_backend_api_tester.md))
>
> Admin tarafında veri girişiyle ilgili bir sorun gördüğünde **Tester 1**'e, API yanıt kodu/şeması ile ilgili bir sorun gördüğünde **Tester 3**'e bildir.

---

## 0. Sorumluluk alanı

Bu test planı **halka açık frontend uygulamasının** (http://localhost:5173) görünüşünü, kullanıcı etkileşimlerini, veri görselleştirmelerini, responsive davranışını ve UX detaylarını kapsar. Login gerektirmez.

**Test edilecek sayfalar/bileşenler:**
- HomePage (`/`)
- IstanbulMap, SearchBar, SideBarDistricts, SideBarCategories
- PlatformDonutCard, BudgetAnalyticsCard, SalesForecastCard
- RestaurantCard (arama sonucu)
- RestaurantOperationalCard (cancel + return)
- GeneralPerformanceScore, CustomerRatingCompare
- Kıyaslama paneli (özet kartları + heatmap + VS kartları + İş Modeli + İndirim/Kupon barları)
- CommentAnalist (metrikler + platform + rating + word cloud + district ranking)
- RestaurantCaseStudy (Başarı Hikayeleri)
- LoyaltyPage (Sadakat sayfası)
- ApplyPage (`/apply`)
- NotFoundPage (`/randompath123`)

---

## 1. Ön koşullar

| # | Adım |
|---|------|
| 1.1 | Backend (8003) + admin (5174) + frontend (5173) ayakta |
| 1.2 | Sentetik veri yüklü (`scripts/generate_synthetic.py` çalışmış) |
| 1.3 | Tarayıcılar: **Chrome 120+**, **Safari 17+**, **Firefox 121+**, **Mobile Safari iOS 17+** (responsive için) |
| 1.4 | Ekran çözünürlüğü: 1440×900 birincil; 1920×1080 ve 360×800 (mobil) ikincil |
| 1.5 | DevTools Network sekmesi açık — API isteklerini izleyebilmek için |
| 1.6 | DevTools Console açık — uncaught exception / 4xx-5xx response için |

---

## 2. Test çıktı formatı

Her case için:

```
[T2-XXX] Başlık
Öncelik: Kritik | Yüksek | Orta | Düşük
Durum:   ✅ ❌ ⛔ ➖

Tarayıcı(lar): Chrome 120 / Safari 17 / iOS 17
Çözünürlük:    1440×900

Adımlar:
  1. ...
Beklenen: ...
Gerçek:   ...
Screenshot: (varsa)
Console:    (varsa hata/warning)
```

Sonuçlar `test_plans/results/02_frontend_<tarih>.md` altında biriktirilir.

---

## 3. Test kapsamı haritası

| Modül | Test sayısı |
|---|---|
| İlk yükleme & layout | 8 |
| İstanbul Map etkileşimleri | 14 |
| SearchBar | 8 |
| Sidebar İlçeler & Mahalleler | 12 |
| Sidebar Kategoriler | 6 |
| Platform Donut & Budget & Forecast kartları | 12 |
| Operational Cards (cancel/return) | 8 |
| Performance & Rating gauge | 6 |
| Kıyaslama paneli | 16 |
| CommentAnalist | 14 |
| Case Studies | 8 |
| LoyaltyPage | 6 |
| ApplyPage | 10 |
| Responsive & Mobil | 8 |
| Cross-browser | 6 |
| Accessibility | 6 |
| **Toplam** | **148** |

---

## 4. İlk yükleme & layout (T2-001 → T2-008)

### T2-001 — Sayfa açılır, layout shift yok
**Öncelik:** Kritik
**Adımlar:** `http://localhost:5173` git, Lighthouse CLS metriği bak.
**Beklenen:** CLS < 0.1, layout shift gözle görülmüyor.

### T2-002 — Navbar görünür, link'ler çalışır
**Öncelik:** Yüksek
**Adımlar:** Navbar'daki tüm bağlantılara tıkla.
**Beklenen:** Anasayfa logo'su `/`'a götürür, Apply linki `/apply`'a, vs.

### T2-003 — İlk yüklemede hiç ilçe seçili değil
**Öncelik:** Kritik
**Beklenen:** Harita boş (renksiz/varsayılan), sidebar'da seçim yok, analytics kartları **boş ama görünür** (0/%0 değerlerle).

### T2-004 — 6 analytics kartı her zaman görünür (yeni davranış)
**Öncelik:** Kritik
**Beklenen:** İlçe seçilmemişken bile şu kartlar görünür: PlatformDonutCard, BudgetAnalyticsCard, SalesForecastCard, OperationalCancel, OperationalReturn, GeneralPerformanceScore. Hepsi 0/%0 değerli grafik gösterir (gri donut, %0 bar vs.). **Hiçbiri gizlenmemeli.**

### T2-005 — Kıyaslama paneli + Yorum Analizi her zaman görünür
**Öncelik:** Kritik
**Beklenen:** İlçe seçilmemiş olsa bile bu iki büyük panel render edilir (içleri boş/0 olur).

### T2-006 — Başarı Hikayeleri bölümü render edilir
**Öncelik:** Yüksek
**Beklenen:** Numaralı butonlar (1, 2, 3 vs.) görünür, varsayılan 1. hikaye gösterilir. Önce/Sonra başlıkları + görsel + metrikler.

### T2-007 — LoyaltyPage section render edilir
**Öncelik:** Yüksek
**Beklenen:** Hero görsel + başlık + 4 stat (340+, %38, 2.6x, 90 Gün gibi — admin Settings ile ne girildiyse) + 4 feature kartı.

### T2-008 — Footer / sayfa sonu
**Öncelik:** Orta
**Beklenen:** Eğer varsa düzgün render, link'ler çalışır.

---

## 5. İstanbul Map (T2-009 → T2-022)

### T2-009 — Tüm 39 ilçe görünür
**Öncelik:** Kritik
**Adımlar:** Haritayı yakınlaştır, ilçe sayısını manuel say veya DOM'da SVG path sayısını gör.
**Beklenen:** 39 ilçe için SVG path'i render olur.

### T2-010 — Avrupa/Anadolu renk kodlaması
**Öncelik:** Yüksek
**Beklenen:** İki yaka farklı renk tonlarında, side="avrupa" ve side="anadolu" değerleri yansır.

### T2-011 — İlçe üzerine hover
**Öncelik:** Yüksek
**Adımlar:** Kadıköy üzerine fareyi getir.
**Beklenen:** Highlight (renk değişimi), tooltip ile ilçe adı, cursor pointer.

### T2-012 — İlçe tıklama: analytics kartları doldurulur
**Öncelik:** Kritik
**Adımlar:** Kadıköy'e tıkla.
**Beklenen:**
- DevTools Network: `GET /analytics/district?district_id=34-kadıköy` çağrısı 200 dönmüş
- PlatformDonutCard: 3 platform müşteri sayısı (toplam ~1500-3000)
- BudgetAnalyticsCard: dolu reklam bütçesi banner'ı + 4 oran barı
- SalesForecastCard: günlük/aylık/yıllık tahmin
- OperationalCancel: %X oran + sebep listesi (5 sebep)
- OperationalReturn: %X oran + sebep listesi (4 sebep)
- GeneralPerformanceScore: İlçe skoru 60-90 arası
- Kıyaslama paneli: 4 özet kartı + heatmap + İş Modeli + ratings

### T2-013 — Seçili ilçenin görsel feedback'i
**Öncelik:** Yüksek
**Beklenen:** Seçili ilçe haritada farklı renkte (bordered/highlighted).

### T2-014 — Aynı ilçeye tekrar tıklama (deselect)
**Öncelik:** Yüksek
**Adımlar:** Kadıköy seçili → tekrar tıkla.
**Beklenen:** İlçe seçimi kalkar, analytics kartları boşa döner (0/%0).

### T2-015 — Farklı ilçeye geçiş
**Öncelik:** Kritik
**Adımlar:** Kadıköy → Beşiktaş'a tıkla.
**Beklenen:** Eski seçim kalkar, yeni analytics yüklenir, ekran kayar veya kartlar güncellenir.

### T2-016 — Veri olmayan ilçe (yeni eklenmiş, analytics yok)
**Öncelik:** Yüksek
**Ön koşul:** Tester 1'in T1-070'te eklediği "Test İlçe" için analytics yok.
**Beklenen:** Tıklanırsa SVG path yoksa zaten görünmez; eğer path varsa kartlar boş gösterir.

### T2-017 — Map zoom/pan
**Öncelik:** Düşük
**Beklenen:** Eğer destekleniyorsa kayganca; desteklenmiyorsa harita sabit kalır.

### T2-018 — Mobil ekran üzerinde tıklama
**Öncelik:** Yüksek
**Beklenen:** Touch event ile ilçe seçilebilir.

### T2-019 — Harita boyutlandırılması
**Öncelik:** Orta
**Beklenen:** Pencere genişliğine göre harita ölçeklenir, taşma yok.

### T2-020 — Harita yüklenme hatası
**Öncelik:** Orta
**Adımlar:** mapData.js'i bozuk yap (örn. boş array). Sayfayı yeniden yükle.
**Beklenen:** Boş harita render edilir veya placeholder gösterilir, JS hatası ile sayfa çökmez.

### T2-021 — Performans: 39 ilçe için render süresi
**Öncelik:** Orta
**Beklenen:** İlk yüklemede harita < 200 ms içinde render olur.

### T2-022 — Erişilebilirlik: harita klavye ile gezilebilir mi?
**Öncelik:** Düşük
**Beklenen:** İdeal: Tab ile ilçeler arasında gezme + Enter ile seçme. Yoksa not et.

---

## 6. SearchBar (T2-023 → T2-030)

### T2-023 — Arama input'una yazma
**Öncelik:** Yüksek
**Adımlar:** "Burger" yaz.
**Beklenen:** DevTools'da debounce sonrası `GET /restaurants/search?q=Burger`, sonuç gelir.

### T2-024 — Sonuçlar RestaurantCard'da gösterilir
**Öncelik:** Kritik
**Beklenen:** Eşleşen restoranlar fade-in animasyonu ile listelenir, her birinde 3 platform ikonu + isim + ilçe.

### T2-025 — Bulunan restoran ilçesi otomatik seçilir
**Öncelik:** Yüksek
**Beklenen:** İlk sonuç hangi ilçedeyse haritada o ilçe seçili olur ve analytics kartları yüklenir.

### T2-026 — Boş arama sonucu
**Öncelik:** Yüksek
**Adımlar:** "xyzqwerty1234" yaz.
**Beklenen:** "Sonuç bulunamadı" mesajı veya boş liste, kart yok.

### T2-027 — Arama temizleme
**Öncelik:** Yüksek
**Adımlar:** Aramayı sil.
**Beklenen:** Tüm seçimler resetlenir, kartlar boşa döner, harita seçilmiş ilçe kalkar.

### T2-028 — Türkçe karakter araması
**Öncelik:** Orta
**Adımlar:** "Köfteci" yaz.
**Beklenen:** Türkçe karakterler doğru encode edilir, sonuçlar gelir.

### T2-029 — Çok hızlı arama (debounce)
**Öncelik:** Orta
**Beklenen:** Her tuş vuruşunda API çağrısı YAPILMAZ; en az 200-300 ms debounce.

### T2-030 — Çok uzun arama metni
**Öncelik:** Düşük
**Adımlar:** 200 karakter yaz.
**Beklenen:** Backend kabul eder veya client-side max length uygulanır.

---

## 7. Sidebar — İlçe ve Mahalleler (T2-031 → T2-042)

### T2-031 — İlçe listesi alfabetik / mantıklı sırada
**Öncelik:** Yüksek
**Beklenen:** Tüm 39 ilçe görünür.

### T2-032 — İlçe seçimi
**Öncelik:** Kritik
**Adımlar:** Sidebar'dan "Üsküdar" tıkla.
**Beklenen:** Haritada da seçim senkronize, analytics kartları yüklenir.

### T2-033 — İlçeye tıklama mahalleleri açar
**Öncelik:** Kritik
**Beklenen:** Mahalleler accordion açılır, ilçenin altında mahalleler listelenir.

### T2-034 — İlk mahalle seçimi (veri var)
**Öncelik:** Kritik
**Ön koşul:** Sentetik veri yüklü — her ilçenin ilk mahallesi dolu.
**Adımlar:** Fatih → Aksaray tıkla.
**Beklenen:**
- `GET /analytics/neighborhood?neighborhood_id=429` çağrısı
- Analytics kartları mahalle verisiyle güncellenir (Fatih verilerinden farklı)
- **"Veri yok" uyarı banner'ı GÖSTERİLMEZ**

### T2-035 — İkinci mahalle seçimi (veri yok)
**Öncelik:** Kritik
**Adımlar:** Fatih → ikinci mahalle (örn. Akşemsettin) tıkla.
**Beklenen:**
- API çağrısı yapılır, boş response gelir
- **Sarı uyarı banner'ı görünür:** "'Akşemsettin' mahallesi hakkında veri girişi olmamıştır. Admin panelinden bu mahalle için Metrics ve Analytics girişi yapın."
- "Kapat" butonu ile banner kapatılabilir
- Analytics kartları 0/%0 değerlerle görünür

### T2-036 — Mahalle değiştirme
**Öncelik:** Yüksek
**Adımlar:** Aksaray → Akşemsettin (veri yok) → tekrar Aksaray
**Beklenen:** Banner sadece veri yokken çıkar, dolu mahalle seçilince kaybolur.

### T2-037 — Mahalle deselect (mahalle id'yi temizleme)
**Öncelik:** Yüksek
**Adımlar:** Seçili mahalleyi tekrar tıkla (veya başka bir UI ile temizle).
**Beklenen:** Mahalle seçimi kalkar, ilçe seçimi devam eder, banner kapanır.

### T2-038 — Farklı ilçeye geçiş mahalle dropdown'unu sıfırlar
**Öncelik:** Yüksek
**Adımlar:** Kadıköy → mahalle seç → Beşiktaş'a geç.
**Beklenen:** Mahalle seçimi sıfırlanır, banner kapanır.

### T2-039 — Sidebar scroll
**Öncelik:** Orta
**Beklenen:** 39 ilçe + alt mahalleler için sidebar scroll edilir, fixed header.

### T2-040 — Mahalle adı uzunsa kesilme
**Öncelik:** Düşük
**Beklenen:** Uzun mahalle adları ellipsis (…) ile kesilir veya tooltip ile tam adı gösterir.

### T2-041 — Mahalle sayısı çok olan ilçe (örn. Çekmeköy)
**Öncelik:** Orta
**Beklenen:** Accordion açılırken performans sorunu yok.

### T2-042 — Mobil sidebar
**Öncelik:** Yüksek
**Beklenen:** Mobilde sidebar drawer olarak açılır veya gizlenir, harita üstünde butonla tetiklenir.

---

## 8. Sidebar — Kategoriler (T2-043 → T2-048)

### T2-043 — 18 kategori listelenir
**Öncelik:** Yüksek
**Beklenen:** Her birinin yanında emoji.

### T2-044 — Kategori seçimi analytics'i filtreler
**Öncelik:** Kritik
**Adımlar:** İlçe seçili durumda "Pizza" kategorisini tıkla.
**Beklenen:** `GET /analytics/district?district_id=...&category_id=2` çağrısı, kartlar filtrelenmiş veriyle dolar.

### T2-045 — Kategori deselect
**Öncelik:** Yüksek
**Beklenen:** Kategori seçimi kalkar, tüm kategoriler aggregate verisi gelir.

### T2-046 — Kategori seçimi ilçe değişiminde korunur
**Öncelik:** Orta
**Beklenen:** Kategori seçili kalır, sadece district_id değişir.

### T2-047 — Categories veriyle ilgili boş durum
**Öncelik:** Düşük
**Beklenen:** Eğer DB'de kategori yoksa sidebar boş ama hata vermez.

### T2-048 — Yeni kategori (Tester 1 eklediyse)
**Öncelik:** Orta
**Beklenen:** Frontend reload sonrası yeni kategori görünür.

---

## 9. PlatformDonutCard / Budget / Forecast (T2-049 → T2-060)

### T2-049 — Boş durum: gri donut + 0 müşteri
**Öncelik:** Kritik
**Beklenen:** İlçe seçilmemişken donut gri tonlarda, ortada "0 Toplam", legend'da 3 platform 0/0%.

### T2-050 — Dolu durum: 3 platform renkli
**Öncelik:** Kritik
**Beklenen:** Kadıköy seçili → Trendyol kırmızı, Getir mor, Yemeksepeti pembe tonlarında. Legend'da müşteri sayısı + yüzde.

### T2-051 — Hover tooltip
**Öncelik:** Yüksek
**Beklenen:** Donut slice'lara hover → "Platform adı: N müşteri".

### T2-052 — Label %5'ten küçük slice gizli
**Öncelik:** Düşük
**Beklenen:** Çok küçük slice'larda yüzde etiketi yazılmaz.

### T2-053 — BudgetAnalyticsCard: bütçe banner'ı
**Öncelik:** Yüksek
**Beklenen:** "Ortalama Reklam Bütçesi: X ₺" gradient mor banner.

### T2-054 — Radial bar chart
**Öncelik:** Yüksek
**Beklenen:** 4 oran (campaign/coupon/flash/joker) radial bar olarak görselleştirilir.

### T2-055 — Liste barları yatay
**Öncelik:** Orta
**Beklenen:** Her oran için renkli yatay bar + yüzde.

### T2-056 — Boş bütçe: 0 ₺ banner + 0% barlar
**Öncelik:** Kritik
**Beklenen:** İlçe seçilmemişken gizlenmez, sadece 0 değerleriyle görünür.

### T2-057 — SalesForecastCard: 3 sekme
**Öncelik:** Yüksek
**Beklenen:** Günlük/Aylık/Yıllık tabları, her birinde 3 platform için bar chart.

### T2-058 — Sekme geçişi
**Öncelik:** Orta
**Beklenen:** Sekme değişiminde sadece veri güncellenir, yeni API çağrısı yapılmaz.

### T2-059 — Para birimi formatı
**Öncelik:** Orta
**Beklenen:** Tüm tutarlar Türkçe locale (1.234.567 ₺) formatında.

### T2-060 — Toplam hesaplama
**Öncelik:** Orta
**Beklenen:** Forecast kartında 3 platformun toplamı doğru hesaplanmış.

---

## 10. Operasyonel Kartlar — Cancel/Return (T2-061 → T2-068)

### T2-061 — Cancel kartı dolu render
**Öncelik:** Kritik
**Beklenen:** Conic gradient donut + ortada %X + sebep listesi (renkli kutular + yüzde).

### T2-062 — Return kartı simetrik düzen
**Öncelik:** Yüksek
**Beklenen:** Return kartında donut sağda, legend solda (cancel'in tersi).

### T2-063 — Boş durum: gri donut
**Öncelik:** Kritik
**Beklenen:** Sebep yoksa "Sebep verisi yok — admin panelinden ekle" mesajı + gri donut.

### T2-064 — Sebep yüzdesi 0
**Öncelik:** Orta
**Beklenen:** %0 sebepler gri renkte render.

### T2-065 — Çok uzun sebep adı
**Öncelik:** Düşük
**Beklenen:** Ellipsis ile kesilir.

### T2-066 — Renkler admin'den ne yazıldıysa o
**Öncelik:** Orta
**Beklenen:** Tester 1 admin'de #FF00FF gibi renk yazmışsa frontend o rengi yansıtır.

### T2-067 — Toplam %100 değil
**Öncelik:** Düşük
**Beklenen:** Sebepler toplam 100'e eşit olmasa bile orantılı renderlanır (yumuşak validasyon).

### T2-068 — Card boyutu fixed grid'de tutarlı
**Öncelik:** Orta
**Beklenen:** 2 kart yan yana aynı yükseklikte.

---

## 11. Performance Score & Rating (T2-069 → T2-074)

### T2-069 — GeneralPerformanceScore: Senin Skorun = "?"
**Öncelik:** Yüksek
**Beklenen:** Şu an için frontend tarafında myScore=null olduğundan iki gauge'dan biri "?", diğeri ilçe ortalaması (admin'den girilmiş).

### T2-070 — Doughnut chart oran doğru
**Öncelik:** Yüksek
**Beklenen:** Değer/100 oranında dolu, kalan gri.

### T2-071 — Boş veri: her iki gauge "?"
**Öncelik:** Kritik
**Beklenen:** İlçe seçilmemişken iki tarafta da "?" görünür.

### T2-072 — CustomerRatingCompare (Kıyaslama içinde): yarım daire gauge
**Öncelik:** Yüksek
**Beklenen:** 0-5 arası, gauge'un dolu kısmı oranla, ortada sayı (4.5 gibi).

### T2-073 — Renk: kırmızı/yeşil yarışma
**Öncelik:** Orta
**Beklenen:** Senin Puanın kırmızı, İlçe yeşil.

### T2-074 — Format: ondalık 1 basamak
**Öncelik:** Düşük
**Beklenen:** "4.5" değil "4.50" değil "4.5" görünür.

---

## 12. Kıyaslama Paneli (T2-075 → T2-090)

### T2-075 — 4 özet kartı (Sepet/Puan/Ciro/Kurye)
**Öncelik:** Kritik
**Beklenen:** Her biri renkli sol kenarlı kart, başlık + sayı + alt yazı.

### T2-076 — Para formatı tutarlı
**Öncelik:** Yüksek
**Beklenen:** "80 ₺", "1.000.000 ₺", "1M ₺" gibi binler ayraçlı.

### T2-077 — SalesHourHeatmap (İlçe)
**Öncelik:** Kritik
**Beklenen:** 7 satır (Pzt-Paz) × 24 sütun heatmap, kırmızı tonları, değer/100 oranında alpha. Hover ile "Pzt 12:00 — 85".

### T2-078 — SalesHourHeatmap (Restoran)
**Öncelik:** Yüksek
**Beklenen:** Mavi tonları, veri yoksa tüm hücreler boş slate-100.

### T2-079 — Heatmap boş durumu: "?" YOK
**Öncelik:** Kritik
**Beklenen:** Veri null olduğunda hücreler boş slate-100, eskiden olan "?" karakteri görünmüyor.

### T2-080 — VS kartları (Sepet / Menü)
**Öncelik:** Yüksek
**Beklenen:** Senin Ortalaman "?" (null), İlçe Ortalaması admin'den gelen değer.

### T2-081 — Puan kıyaslaması bölümü
**Öncelik:** Yüksek
**Beklenen:** Büyük yuvarlak içinde ilçe puanı + alt sırada Senin/İlçe/En Yüksek/En Düşük 4 kart.

### T2-082 — 5 aksiyon önerisi listesi
**Öncelik:** Orta
**Beklenen:** Her biri numaralı, sabit metin (admin'den değil, static).

### T2-083 — İndirim & Kupon barları
**Öncelik:** Yüksek
**Beklenen:** 3 yatay yeşil bar (İndirim/Joker/Kupon), yüzde admin'in budget verisinden geliyor.

### T2-084 — Bar barı %0 olduğunda
**Öncelik:** Orta
**Beklenen:** Boş bar görünür ama text okunabilir.

### T2-085 — İş Modeli kartı: 2 yan yana
**Öncelik:** Kritik
**Beklenen:** "RESTORAN KURYESİ" (kırmızı border) + "SENİN KURYEN" (yeşil border), her birinde 4 metrik kutusu (Kurye Ücreti, Ort. Maliyet, Aylık Ciro, Vazgeçme).

### T2-086 — İş Modeli verisi admin'den geliyor
**Öncelik:** Kritik
**Ön koşul:** Tester 1 T1-052'de değerleri girmiş.
**Beklenen:** Restoran tarafı fee=20, avg_cost=35.10, monthly_revenue=5000, vazgeçme=YÜKSEK. Senin tarafı 0/32.40/1M/DÜŞÜK.

### T2-087 — İş Modeli boş durum
**Öncelik:** Yüksek
**Beklenen:** Tüm değerler 0 ₺ veya "—" gösterir, kart gizlenmez.

### T2-088 — CustomerRatingCompare içeride
**Öncelik:** Yüksek
**Beklenen:** Yarım daire gauge'lar (T2-072 ile aynı).

### T2-089 — Mobil ekran: kartlar dikey
**Öncelik:** Yüksek
**Beklenen:** xl breakpoint altında tek sütun.

### T2-090 — Tüm panel scroll sırasında dengeli
**Öncelik:** Orta
**Beklenen:** Layout shift yok, sticky element yoksa rahat scroll.

---

## 13. CommentAnalist (T2-091 → T2-104)

### T2-091 — Başlık + 1 Ay etiketi
**Öncelik:** Yüksek
**Beklenen:** "Olumsuz Yorumlar Analiz Paneli (1 Ay)".

### T2-092 — İlçe/Mahalle dropdown'ları
**Öncelik:** Yüksek
**Beklenen:** İki dropdown, mahalle disabled (ilçe seçilmeden), seçim yapınca state senkronize.

### T2-093 — 3 metrik kartı
**Öncelik:** Kritik
**Beklenen:** Toplam Olumsuz Yorum + Olumsuz Yorum Oranı (%) + Ortalama Puan. Her biri renkli ikon ile.

### T2-094 — Boş veri: 0 / %0 / 0.0
**Öncelik:** Kritik
**Beklenen:** İlçe seçilmemişken 3 metrik 0/%0/0.0, kartlar gizlenmez.

### T2-095 — Platform Bazlı Olumsuz Yorum Dağılımı
**Öncelik:** Yüksek
**Beklenen:** 3 platform için yatay bar + yüzde. Boş durumda "Veri yok — admin panelinden ekle".

### T2-096 — Puan Dağılımı (5 yıldız)
**Öncelik:** Yüksek
**Beklenen:** 5 satır (5 → 1 yıldız), yıldızlar yanyana ★, bar uzunluğu yüzdeye göre.

### T2-097 — Word Cloud renkler ve boyutlar
**Öncelik:** Yüksek
**Beklenen:** Kelimeler farklı renklerde, weight değerine göre font-size ölçeklenmiş (12-32px).

### T2-098 — Word Cloud boş
**Öncelik:** Orta
**Beklenen:** "Kelime yok — admin panelinden ekle".

### T2-099 — İlçe Bazlı Olumsuz Yorum tablosu (geri getirildi)
**Öncelik:** Kritik
**Beklenen:** Word cloud'un yanında ilçe ranking listesi. Sentetik veri ile 39 satır, oran yüksekten düşüğe sıralı, her satırda: İlçe adı + bar (%X) + Yorum sayısı + Risk etiketi (Yüksek/Orta/İyi).

### T2-100 — Risk etiket renkleri
**Öncelik:** Orta
**Beklenen:** Yüksek Risk = kırmızı, Orta = turuncu, İyi = yeşil.

### T2-101 — Yan yana grid (xl ekranda)
**Öncelik:** Orta
**Beklenen:** Word cloud sol, district ranking sağ.

### T2-102 — Ranking çok uzunsa scroll
**Öncelik:** Düşük
**Beklenen:** 39 ilçeli liste max-height + overflow-y-auto.

### T2-103 — Mahalle seçildiğinde rate güncellenir
**Öncelik:** Yüksek
**Beklenen:** Mahalleye geçince 3 metrik kartı mahalle değerlerini gösterir; district ranking ise her zaman ilçe bazlı kalır.

### T2-104 — API başarısızlığı
**Öncelik:** Orta
**Adımlar:** Backend'i durdur, sayfayı yenile.
**Beklenen:** "API hatası" mesajı veya boş state, sayfa çökmez.

---

## 14. Başarı Hikayeleri / Case Studies (T2-105 → T2-112)

### T2-105 — Bölüm başlığı
**Öncelik:** Yüksek
**Beklenen:** "Başarı Hikayeleri" başlığı, alt yazı.

### T2-106 — Numara butonları
**Öncelik:** Yüksek
**Beklenen:** Aktif hikayeler kadar (3 senaryoda) numaralı butonlar (1, 2, 3). Seçili olan mavi, diğerleri kırmızı border.

### T2-107 — Hikaye geçişi
**Öncelik:** Yüksek
**Adımlar:** 2 → 3 → 1 tıkla.
**Beklenen:** Her tıklamada hikaye animasyonsuz/animasyonlu değişir.

### T2-108 — Görseller render edilir
**Öncelik:** Kritik
**Beklenen:** before_image ve after_image gerçek fotoğraf olarak görünür (Tester 1'in upload ettiği media URL'leri).

### T2-109 — Görsel yoksa placeholder
**Öncelik:** Orta
**Beklenen:** "Görsel yok" yer tutucu.

### T2-110 — Önce/Sonra metrikleri
**Öncelik:** Yüksek
**Beklenen:** Daily order + avg basket + complaints listesi (kırmızı kart) vs improvements listesi (yeşil kart).

### T2-111 — Hiç hikaye yoksa
**Öncelik:** Yüksek
**Adımlar:** Tester 1 tüm hikayeleri pasifleştirsin.
**Beklenen:** "Henüz başarı hikayesi eklenmemiş." mesajı.

### T2-112 — Loading state
**Öncelik:** Orta
**Beklenen:** API gelene kadar spinner.

---

## 15. LoyaltyPage / Sadakat Sayfası (T2-113 → T2-118)

### T2-113 — Hero bölümü
**Öncelik:** Yüksek
**Beklenen:** Arka plan görseli + başlık + buton.

### T2-114 — "Nasıl Çalışır?" buton scroll
**Öncelik:** Orta
**Beklenen:** Tıklayınca "#neler-sunuyoruz" id'li bölüme smooth scroll.

### T2-115 — 4 stat kartı admin'den geliyor
**Öncelik:** Kritik
**Ön koşul:** Tester 1 Settings'te değerleri girmiş.
**Beklenen:** "340+ Aktif Firma", "%38 Churn Azalması", "2.6x ROI", "90 Gün Geri Ödeme" değerleri görünür.

### T2-116 — Stat değeri boş ise "—"
**Öncelik:** Yüksek
**Adımlar:** Tester 1 bir alanı boşalt.
**Beklenen:** Frontend "—" gösterir.

### T2-117 — 4 feature kartı
**Öncelik:** Orta
**Beklenen:** Performans Karşılaştırmaları, Tahmin ve Öneriler, Genel Sadakat Metrikleri, Segmentasyon Analizleri — hepsi görsellerle.

### T2-118 — Mobilde feature kartları dikey
**Öncelik:** Orta

---

## 16. ApplyPage (T2-119 → T2-128)

### T2-119 — Sayfa yüklenir
**Öncelik:** Kritik
**Adımlar:** `/apply` git.
**Beklenen:** Kurye başvuru formu görünür.

### T2-120 — Form alanları
**Öncelik:** Yüksek
**Beklenen:** Ad, soyad, email, telefon, şehir, ilçe, araç tipi, mesaj.

### T2-121 — Required alanlar
**Öncelik:** Kritik
**Adımlar:** Tüm zorunlu alanları boş bırakıp submit.
**Beklenen:** Frontend validasyonu hatalı alanları işaretler.

### T2-122 — Geçersiz email
**Öncelik:** Yüksek
**Adımlar:** "abc" yaz email'e.
**Beklenen:** "Geçerli bir email girin" hatası.

### T2-123 — Telefon formatı
**Öncelik:** Orta
**Beklenen:** +90 prefix veya boşluksuz 10 hane vs.

### T2-124 — Başarılı submit
**Öncelik:** Kritik
**Adımlar:** Tüm alanları geçerli doldur → submit.
**Beklenen:** `POST /applications` 201 dönüş, success mesajı, form sıfırlanır veya "teşekkürler" sayfasına yönlendirilir.

### T2-125 — Başvuru admin tarafında görünür
**Öncelik:** Kritik
**Beklenen:** Tester 1 ile birlikte: yeni başvuru admin paneli `/applications` listesinde görünür.

### T2-126 — API hatası
**Öncelik:** Orta
**Adımlar:** Backend durdur, submit et.
**Beklenen:** Açıklayıcı hata mesajı, form verisi kaybolmaz.

### T2-127 — Çok uzun mesaj
**Öncelik:** Düşük
**Beklenen:** Backend kabul eder veya client-side max length.

### T2-128 — SQL injection / XSS denemesi
**Öncelik:** Yüksek
**Adımlar:** Mesaj alanına `<script>alert(1)</script>` yaz.
**Beklenen:** Backend sanitize eder veya admin tarafında escape'li gösterir, alert tetiklenmez. (Tester 3 ile koordine.)

---

## 17. Responsive & Mobil (T2-129 → T2-136)

### T2-129 — 1920×1080 (Full HD)
**Öncelik:** Yüksek
**Beklenen:** Tüm bileşenler ortalanmış, max-width ile sınırlı.

### T2-130 — 1440×900 (MacBook)
**Öncelik:** Kritik
**Beklenen:** Default tasarım hedefi.

### T2-131 — 1024×768 (Tablet portrait)
**Öncelik:** Yüksek
**Beklenen:** Grid 2 sütuna düşer, sidebar daralır.

### T2-132 — 768×1024 (iPad)
**Öncelik:** Orta

### T2-133 — 414×896 (iPhone 11)
**Öncelik:** Yüksek
**Beklenen:** Tek sütun, sidebar drawer, harita ölçeklenir.

### T2-134 — 360×800 (Android small)
**Öncelik:** Orta
**Beklenen:** Yatay kaydırma yok, tıklanabilir alanlar ≥44×44 px.

### T2-135 — Landscape mobile
**Öncelik:** Düşük

### T2-136 — Yazı tipi yüksek DPI'da net
**Öncelik:** Düşük
**Beklenen:** Retina ekranda blur yok.

---

## 18. Cross-browser (T2-137 → T2-142)

### T2-137 — Chrome 120+
**Öncelik:** Kritik
### T2-138 — Safari 17+
**Öncelik:** Kritik
**Beklenen:** Konik gradient (RestaurantOperationalCard donut) düzgün renderlanır.
### T2-139 — Firefox 121+
**Öncelik:** Yüksek
### T2-140 — Edge 120+
**Öncelik:** Orta
### T2-141 — Mobil Safari iOS 17
**Öncelik:** Yüksek
### T2-142 — Chrome Android
**Öncelik:** Orta

Her tarayıcıda smoke test: T2-001 → T2-012 + T2-049 → T2-068 + T2-105 → T2-112.

---

## 19. Accessibility (T2-143 → T2-148)

### T2-143 — Klavye navigasyonu
**Öncelik:** Yüksek
**Beklenen:** Tab ile tüm tıklanabilir öğelere ulaşılır, focus ring görünür.

### T2-144 — Screen reader (VoiceOver / NVDA)
**Öncelik:** Yüksek
**Beklenen:** Tüm görsellerin alt text'i var, başlık hiyerarşisi (h1→h2→h3) doğru.

### T2-145 — Renk kontrastı
**Öncelik:** Yüksek
**Beklenen:** WCAG AA seviyesinde (4.5:1) — Lighthouse audit ile doğrulanabilir.

### T2-146 — Form etiketleri
**Öncelik:** Yüksek
**Beklenen:** Her input'a `<label>` veya `aria-label`.

### T2-147 — Hareket azaltma
**Öncelik:** Düşük
**Beklenen:** `prefers-reduced-motion` ile animasyonlar azalır.

### T2-148 — Açılır banner aria-live
**Öncelik:** Orta
**Beklenen:** "Veri yok" uyarı banner'ı screen reader tarafından okunur (aria-live="polite").

---

## 20. Bug raporlama formatı

Tester 1 ile aynı format. Ekstra olarak frontend için:
- **Tarayıcı versiyon:** ekrana yazılı tut
- **DevTools Console error/warning:** her bug için al
- **Network request status:** ilgili API çağrısı varsa method + URL + status

---

## 21. Test kapsamı dışında kalan ve diğer kişilere yönlendirilmesi gereken durumlar

| Senaryo | Sahibi |
|---|---|
| Admin panelde veri girişi/CSV import sorunları | **Tester 1** |
| API endpoint'i 500 dönüyor, headers eksik, response şeması yanlış | **Tester 3** |
| Database'de duplicate kayıt, FK violation | **Tester 3** |
| Auth token süresi politikası | **Tester 3** |
| Admin'deki form doğru kaydetti ama frontend'e yansımıyor → Önce **Tester 3** (API), sonra **Tester 1** (admin) ile koordine |

---

**Tahmini test süresi:** 3-4 iş günü (148 case, 3-6 dakika/case).
**Çıktı dosyası:** `test_plans/results/02_frontend_<YYYY-MM-DD>.md`.
