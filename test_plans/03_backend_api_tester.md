# Test Planı — Tester 3: Backend API & Sistem Entegrasyonu

> **Bu dokümanın sahibi:** Tester 3
> **Diğer test alanları farklı kişilere atanmıştır:**
> - Admin Panel UI & CSV testleri → **Tester 1** ([01_admin_panel_tester.md](./01_admin_panel_tester.md))
> - Frontend Public HomePage & UX testleri → **Tester 2** ([02_frontend_homepage_tester.md](./02_frontend_homepage_tester.md))
>
> UI'daki bir bug'ın kaynağının frontend mi backend mi olduğundan emin değilsen, API katmanından başla; sorun API'da ise sende kalsın, UI render'ında ise Tester 1/2'ye devret.

---

## 0. Sorumluluk alanı

Bu test planı **backend API katmanını** (FastAPI, http://localhost:8003), veritabanı tutarlılığını, dosya depolama bütünlüğünü, performansı ve sistemler-arası entegrasyonu kapsar. Test araçları: `curl`, `httpie`, **Postman**, **pytest**, **sqlite3** CLI.

**Test edilecek katmanlar:**
- FastAPI route'ları (`/`, `/admin/*`)
- JWT auth & dependency injection
- Pydantic schema validation
- SQLAlchemy ORM & DB constraint'ler
- CSV parsing (pandas)
- Local file storage (media)
- Cross-system flow (admin → DB → public)

---

## 1. Ön koşullar

| # | Adım |
|---|------|
| 1.1 | Backend ayakta: `curl http://localhost:8003/health` 200 |
| 1.2 | Postman collection hazır (varsa kullan; yoksa curl tabanlı script ile) |
| 1.3 | `sqlite3` cli erişimi: `sqlite3 backend/opencard_dev.db` |
| 1.4 | Test verisi yüklü |
| 1.5 | API docs (Swagger): http://localhost:8003/docs |
| 1.6 | DB backup: testler öncesi `cp opencard_dev.db opencard_dev.backup.db` |
| 1.7 | Python venv aktif (pytest çalıştırmak için) |

---

## 2. Test çıktı formatı

```
[T3-XXX] Başlık
Öncelik: Kritik | Yüksek | Orta | Düşük
Durum:   ✅ ❌ ⛔ ➖

Method + URL: GET /districts
Headers:      Authorization: Bearer <token>
Payload:      {...}

Beklenen:
  Status: 200
  Body:   {...}
  DB:     ... satır eklendi/güncellendi

Gerçek:
  Status: ...
  Body:   ...
  DB:     ...

Bulgu: ...
```

Sonuçlar `test_plans/results/03_backend_<tarih>.md` altında biriktirilir.

---

## 3. Test kapsamı haritası

| Modül | Test sayısı |
|---|---|
| Health & Smoke | 4 |
| Auth & JWT | 10 |
| Public — Districts | 6 |
| Public — Categories | 4 |
| Public — Restaurants | 8 |
| Public — Analytics | 14 |
| Public — Case Studies | 6 |
| Public — Applications | 6 |
| Admin — Authorization | 8 |
| Admin — Restaurants CRUD + CSV | 14 |
| Admin — Analytics CRUD + CSV | 16 |
| Admin — Metrics CRUD + CSV | 14 |
| Admin — Categories/Platforms/Districts | 12 |
| Admin — Case Studies + image upload | 10 |
| Admin — Applications | 6 |
| Admin — Site Settings | 4 |
| DB Integrity | 10 |
| Performance | 6 |
| Security | 8 |
| Error Handling | 8 |
| Cross-system Integration | 6 |
| **Toplam** | **180** |

---

## 4. Health & Smoke (T3-001 → T3-004)

### T3-001 — Health endpoint
```
GET /health
```
**Beklenen:** 200, `{"status":"working","project":"Opencard API"}`. Response time < 50 ms.

### T3-002 — Backend yeniden başlatma sonrası ilk request
**Adımlar:** Backend'i restart et, hemen request at.
**Beklenen:** 500 yok, cold start < 2 sn.

### T3-003 — OpenAPI schema erişimi
```
GET /openapi.json
```
**Beklenen:** 200, geçerli JSON, tüm endpoint'ler tanımlı.

### T3-004 — Swagger UI
**Beklenen:** http://localhost:8003/docs render olur, tüm endpoint'ler test edilebilir.

---

## 5. Auth & JWT (T3-005 → T3-014)

### T3-005 — Login: doğru kimlik
```
POST /auth/login
{"email":"admin@opencard.com","password":"opencard123"}
```
**Beklenen:** 200, `{"access_token":"...","token_type":"bearer"}`. Token JWT yapısı (3 parça base64).

### T3-006 — Login: yanlış şifre
**Beklenen:** 401 (veya 400), açıklayıcı detail.

### T3-007 — Login: olmayan email
**Beklenen:** 401, generic mesaj (bilgi sızdırma riski yok).

### T3-008 — Login: SQL injection denemesi
```
POST /auth/login
{"email":"' OR '1'='1","password":"anything"}
```
**Beklenen:** 401, hata yok, log temiz.

### T3-009 — Token decode et
**Adımlar:** Aldığın token'ı jwt.io'da decode et.
**Beklenen:** Payload'da `sub` (admin email), `exp` (60 dakika sonrası).

### T3-010 — Korumalı endpoint: token yok
```
GET /admin/restaurants
```
**Beklenen:** 401 Not authenticated.

### T3-011 — Geçersiz token
```
Authorization: Bearer invalid.token.here
```
**Beklenen:** 401.

### T3-012 — Süresi dolmuş token
**Adımlar:** ACCESS_TOKEN_EXPIRE_MINUTES'i geçici 1 dakikaya çek, 90 sn bekle.
**Beklenen:** 401.

### T3-013 — Yanlış imza
**Adımlar:** Token'ın son segmentini değiştir.
**Beklenen:** 401.

### T3-014 — Token formatı: Bearer prefix yok
```
Authorization: <token without bearer>
```
**Beklenen:** 401.

---

## 6. Public — Districts (T3-015 → T3-020)

### T3-015 — Tüm ilçeler
```
GET /districts
```
**Beklenen:** 200, liste 39 öğe, her birinde id/name/side/svg_path.

### T3-016 — Tek ilçe
```
GET /districts/34-kadıköy
```
**Beklenen:** 200, ilçe objesi.

### T3-017 — Olmayan ilçe
```
GET /districts/34-yokoyer
```
**Beklenen:** 404.

### T3-018 — Türkçe karakter URL encoding
```
GET /districts/34-kad%C4%B1k%C3%B6y
```
**Beklenen:** 200.

### T3-019 — Mahalle listesi
```
GET /districts/34-kadıköy/neighborhoods
```
**Beklenen:** 200, liste ≥ 15 mahalle (Kadıköy için), her birinde id/name.

### T3-020 — Olmayan ilçenin mahalleleri
**Beklenen:** 404 veya boş liste (davranış dokümante).

---

## 7. Public — Categories (T3-021 → T3-024)

### T3-021 — Liste
```
GET /categories
```
**Beklenen:** 200, 18 öğe, sort_order'a göre sıralı.

### T3-022 — Sadece aktif kategoriler
**Beklenen:** is_active=false olanlar dönmemeli (eğer pasifleştirildiyse).

### T3-023 — Response şema
**Beklenen:** id, name, emoji, sort_order.

### T3-024 — Performans
**Beklenen:** Response time < 100 ms.

---

## 8. Public — Restaurants (T3-025 → T3-032)

### T3-025 — Restaurants list
```
GET /restaurants
```
**Beklenen:** 200, 195+ kayıt.

### T3-026 — Restaurant arama
```
GET /restaurants/search?q=Burger
```
**Beklenen:** 200, name'inde "Burger" geçenler.

### T3-027 — Boş arama
```
GET /restaurants/search?q=
```
**Beklenen:** 200 boş liste veya 400 (davranış belirli).

### T3-028 — Çok uzun arama
```
GET /restaurants/search?q=<500 char>
```
**Beklenen:** Backend kabul eder veya 400.

### T3-029 — Türkçe arama
```
GET /restaurants/search?q=K%C3%B6fteci
```
**Beklenen:** 200, doğru sonuçlar.

### T3-030 — is_active=false olan
**Beklenen:** Search'te dönmemeli.

### T3-031 — Restaurant response içeriği
**Beklenen:** id, name, districtName (denormalize?), category, platforms array.

### T3-032 — Çoklu eşleşme: alfabetik mi yoksa benzerlik mi
**Beklenen:** Sıralama davranışı dokümante.

---

## 9. Public — Analytics (T3-033 → T3-046)

### T3-033 — District analytics: dolu ilçe
```
GET /analytics/district?district_id=34-kadıköy
```
**Beklenen:** 200, response şu alanları içerir:
- district_id, district_name, category_id (null)
- platforms (3 öğe)
- budget (5 alan: adBudget, campaignRate, couponRate, flashRate, jokerRate)
- forecast (3 sekme: daily/monthly/yearly, her biri 3 platform)
- **metrics** (20+ alan, JSON'lar dahil)

### T3-034 — District analytics: kategori filtresi
```
GET /analytics/district?district_id=34-kadıköy&category_id=2
```
**Beklenen:** Sadece pizza kategorisi verisi.

### T3-035 — District: olmayan ilçe
**Beklenen:** 404.

### T3-036 — District: olmayan kategori
**Beklenen:** 200 boş veri veya 404 (davranış dokümante).

### T3-037 — Metrics içeriği: cancel_reasons JSON
**Beklenen:** Array of `{label, color, percent}`.

### T3-038 — Metrics içeriği: hourly_heatmap
**Beklenen:** 7×24 number array veya boş [].

### T3-039 — Metrics içeriği: courier_comparison
**Beklenen:** `{restaurant_courier: {...}, own_courier: {...}}` object.

### T3-040 — Neighborhood analytics: dolu mahalle
```
GET /analytics/neighborhood?neighborhood_id=429
```
**Beklenen:** 200, aynı yapı.

### T3-041 — Neighborhood: veri yok
```
GET /analytics/neighborhood?neighborhood_id=430
```
**Beklenen:** 200, metrics tamamen 0/empty (cancel_rate=0, hourly_heatmap=[]). Bu, frontend'in "Veri yok" uyarısını tetiklemesini sağlar.

### T3-042 — Cross-district comments
```
GET /analytics/comments/by-district
```
**Beklenen:** 200, array of `{district_id, district_name, percent, count, risk}`. Risk: "Yüksek Risk" / "Orta" / "İyi".

### T3-043 — Comments by district: kategori filtresi
```
GET /analytics/comments/by-district?category_id=2
```
**Beklenen:** Sadece pizza verisi olan ilçeler.

### T3-044 — Site settings
```
GET /analytics/site-settings
```
**Beklenen:** 200, 4 string alan.

### T3-045 — Site settings: ilk kez (DB'de kayıt yok)
**Adımlar:** `DELETE FROM site_settings;` sonra GET.
**Beklenen:** 200, 4 alan boş string.

### T3-046 — Analytics response performans
**Beklenen:** Tek ilçe analytics < 200 ms.

---

## 10. Public — Case Studies (T3-047 → T3-052)

### T3-047 — Aktif hikayeler
```
GET /case-studies
```
**Beklenen:** 200, sadece is_active=true, sort_order'a göre.

### T3-048 — Response yapısı
**Beklenen:** id, title, before:{image, dailyOrder, avgBasket, complaints[]}, after:{...}.

### T3-049 — image URL absolute
**Beklenen:** `http://localhost:8003/media/case-studies/...` ile başlar.

### T3-050 — Görsel erişimi
**Adımlar:** Response'tan gelen image URL'i tarayıcıda aç.
**Beklenen:** 200, gerçek JPG dönüş.

### T3-051 — Boş liste
**Adımlar:** Tüm hikayeleri pasifleştir.
**Beklenen:** 200, [].

### T3-052 — Pasif hikaye dönmez
**Beklenen:** is_active=false olanlar response'da yok.

---

## 11. Public — Applications POST (T3-053 → T3-058)

### T3-053 — Geçerli başvuru
```
POST /applications
{"first_name":"Test","last_name":"User","email":"t@e.com","phone":"+905001112233","city":"İstanbul","district":"Kadıköy","vehicle":"motor","message":"test"}
```
**Beklenen:** 201, dönen application objesi, status="pending", id otomatik.

### T3-054 — Eksik zorunlu alan
```
POST /applications {"first_name":"x"}
```
**Beklenen:** 422 validation error.

### T3-055 — Geçersiz email
```
POST /applications {... "email": "not-an-email" ...}
```
**Beklenen:** 422 (Pydantic EmailStr).

### T3-056 — Çok uzun message
**Beklenen:** Backend kabul eder veya 422 (max length).

### T3-057 — SQL injection
```
"first_name": "Robert'; DROP TABLE applications;--"
```
**Beklenen:** 201, kayıt eklenir, DB intakt.

### T3-058 — XSS payload kabul
```
"message": "<script>alert(1)</script>"
```
**Beklenen:** 201, DB'de raw string olarak saklanır. (Admin tarafında render'da escape edilmeli — bu Tester 1'in işi.)

---

## 12. Admin — Authorization (T3-059 → T3-066)

### T3-059 — /admin/* endpoint'i token yokken
```
GET /admin/restaurants
```
**Beklenen:** 401.

### T3-060 — Geçerli token
**Beklenen:** 200.

### T3-061 — Admin user pasif olsaymış
**Adımlar:** DB'de `UPDATE admin_users SET is_active=0;`, token al, request gönder.
**Beklenen:** İdeal: 403. (Eğer is_active check yoksa not et — security risk.)

### T3-062 — Method not allowed
```
PUT /admin/categories  (POST endpoint'ine PUT)
```
**Beklenen:** 405.

### T3-063 — CORS preflight
```
OPTIONS /admin/restaurants
Origin: http://localhost:5174
```
**Beklenen:** 200, Access-Control-Allow-* header'ları doğru.

### T3-064 — Origin reddedildiği durum
```
OPTIONS /admin/restaurants
Origin: http://evil.com
```
**Beklenen:** CORS reddedildi.

### T3-065 — Aynı anda 10 paralel istek
**Beklenen:** Hepsi başarılı, race condition yok.

### T3-066 — Token rate limit
**Adımlar:** 1 sn içinde 100 istek.
**Beklenen:** İdeal: 429 Rate Limited. (Yoksa not et.)

---

## 13. Admin — Restaurants (T3-067 → T3-080)

### T3-067 — GET liste
**Beklenen:** 200, tüm restoranlar (is_active=false dahil).

### T3-068 — Pagination
```
GET /admin/restaurants?page=2&page_size=20
```
**Beklenen:** 200, items + total + page + page_size.

### T3-069 — Filtre: district_id + search
**Beklenen:** AND mantığı.

### T3-070 — POST yeni restoran
```
POST /admin/restaurants {name, district_id, category_id, platforms:[{platform_id, customers}]}
```
**Beklenen:** 201.

### T3-071 — POST: aynı isim + ilçe (constraint?)
**Beklenen:** Eğer UniqueConstraint yoksa duplicate kabul edilir. Doküman.

### T3-072 — POST: geçersiz district_id
**Beklenen:** 400.

### T3-073 — PUT update
**Beklenen:** 200, alanlar değişir.

### T3-074 — DELETE / pasifleştirme
**Beklenen:** Restoran is_active=false olur veya silinir (davranış doküman).

### T3-075 — CSV export
```
GET /admin/restaurants/csv
```
**Beklenen:** 200, content-type text/csv, Content-Disposition attachment, doğru kolonlar.

### T3-076 — CSV import: 195 satır
**Beklenen:** `{created, updated, errors}` döner.

### T3-077 — CSV import: eksik kolon
**Beklenen:** 400, "Eksik sütun: platforms".

### T3-078 — CSV import: bozuk JSON satır
**Beklenen:** O satır errors[] içinde, diğerleri yine import edilir.

### T3-079 — CSV import: çok büyük dosya (10k satır)
**Adımlar:** 10000 satırlık CSV hazırla.
**Beklenen:** Backend bellek/zamanaşımı dengeli, 60 sn altında işlem.

### T3-080 — Concurrent import (aynı dosya 2 paralel)
**Beklenen:** Race yok, idempotent.

---

## 14. Admin — Analytics (T3-081 → T3-096)

### T3-081 — GET district analytics list
**Beklenen:** 200.

### T3-082 — POST upsert: yeni dönem
**Beklenen:** 200, records_affected=3 (3 platform).

### T3-083 — POST upsert: aynı dönem (update)
**Beklenen:** Mevcut kayıt update edilir, duplicate yok.

### T3-084 — POST: geçersiz platform_id
**Beklenen:** 400.

### T3-085 — POST: aynı request'te aynı platform 2 kez
**Beklenen:** İkincisi ilkin üzerine yazar veya hata döner.

### T3-086 — Numeric overflow
**Adımlar:** customers=9999999999.
**Beklenen:** 422 veya overflow kontrolü.

### T3-087 — Negative customers
**Beklenen:** 422 (Pydantic ge=0).

### T3-088 — Period_date format
**Adımlar:** "2026/05/01" gönder.
**Beklenen:** 422.

### T3-089 — CSV export district
**Beklenen:** 117 satır + header.

### T3-090 — CSV import district 117 satır
**Beklenen:** Hepsi işleme alınır.

### T3-091 — Neighborhood analytics: aynı testler
**Beklenen:** District ile aynı davranışlar.

### T3-092 — Competitors: aynı testler
**Beklenen:** Aynı yapı; ek olarak delivery_type "platform"/"own" enum.

### T3-093 — Competitor: platform_id NULL
**Beklenen:** Kabul edilir.

### T3-094 — Competitor: avg_rating > 5
**Beklenen:** 422 veya clamp (davranış doküman).

### T3-095 — UniqueConstraint: postgresql_nulls_not_distinct davranışı
**Adımlar:** SQLite'da NULL category_id ile 2 farklı satır eklemeyi dene.
**Beklenen:** SQLite default davranışı (NULL'lar distinct sayılır, duplicate kabul edilir) — backend uygulama katmanında upsert mantığı bunu yakalamalı.

### T3-096 — Period parametresi olmayan CSV
**Beklenen:** 400.

---

## 15. Admin — Metrics (T3-097 → T3-110)

### T3-097 — POST district metrics
**Beklenen:** 200.

### T3-098 — POST: tüm JSON alanları boş
**Beklenen:** Kabul edilir, JSON kolonlar NULL/[] olarak yazılır.

### T3-099 — JSON alan invalid type
**Adımlar:** hourly_heatmap'e string gönder.
**Beklenen:** 422.

### T3-100 — Heatmap: 7×24 olmayan boyut
**Adımlar:** 5×24 array gönder.
**Beklenen:** Şu an kabul ediyor mu? Frontend etkilenir — doküman.

### T3-101 — Word cloud: 100+ kelime
**Beklenen:** Backend kabul, frontend performans (Tester 2 ile not edilmeli).

### T3-102 — Courier comparison upsert
**Beklenen:** 200, public endpoint'te yansır.

### T3-103 — CSV export metrics
**Beklenen:** JSON kolonlar tek hücrede JSON string olarak.

### T3-104 — CSV import metrics
**Beklenen:** JSON parse başarılı, kolonlar doğru yazılır.

### T3-105 — CSV: JSON kolonda bozuk veri
**Beklenen:** 400 ile satır numarası.

### T3-106 — CSV roundtrip (export → import)
**Beklenen:** Data kaybı yok, "0 created, 39 updated".

### T3-107 — Neighborhood metrics: aynı testler
**Beklenen:** District ile birebir.

### T3-108 — Site settings POST
**Beklenen:** Tek satırlı (id=1) upsert davranışı.

### T3-109 — Site settings: id=2 manuel insert
**Adımlar:** `INSERT INTO site_settings (id, ...) VALUES (2, ...);`
**Beklenen:** Backend her zaman id=1'i okur, id=2 yok sayılır.

### T3-110 — JSON encoding Türkçe karakter
**Beklenen:** `ensure_ascii=False` ile düzgün UTF-8.

---

## 16. Admin — Categories/Platforms/Districts (T3-111 → T3-122)

### T3-111 — Category POST
### T3-112 — Category PUT
### T3-113 — Category DELETE (FK varken)
**Beklenen:** 409 veya cascade (doküman).

### T3-114 — Platform POST: color_hex regex
**Beklenen:** `^#[0-9A-Fa-f]{6}$` validation.

### T3-115 — Platform unique name
**Beklenen:** Duplicate engellenir.

### T3-116 — Platform DELETE cascade restaurant_platforms
**Beklenen:** FK CASCADE veya SET NULL.

### T3-117 — District POST: id formatı
**Beklenen:** ID kullanıcı tarafından belirlenir.

### T3-118 — District duplicate id
**Beklenen:** 409.

### T3-119 — Neighborhood POST
### T3-120 — Neighborhood: olmayan district
**Beklenen:** 400.

### T3-121 — Neighborhood DELETE cascade
**Beklenen:** İlgili neighborhood_analytics ve neighborhood_metrics nasıl?

### T3-122 — Big batch: 1000 mahalle ekleme
**Beklenen:** Performans kabul edilebilir.

---

## 17. Admin — Case Studies + File upload (T3-123 → T3-132)

### T3-123 — POST multipart with image
```
POST /admin/case-studies
Form: title, district_id, category_id, ..., before_image=<file>, after_image=<file>
```
**Beklenen:** 201, before_image_url dolu (relative veya absolute).

### T3-124 — POST without image
**Beklenen:** 201, image_url null.

### T3-125 — Large image (12MB)
**Beklenen:** 413 veya kabul edilir.

### T3-126 — Wrong MIME (PDF)
**Beklenen:** 400 veya yine kabul (storage_service davranışına bağlı).

### T3-127 — Image file persistence
**Adımlar:** Upload sonrası `ls backend/media/case-studies/`.
**Beklenen:** UUID isimli .jpg dosyaları görünür.

### T3-128 — Image silme
**Adımlar:** Case study'i sil, media klasörünü kontrol et.
**Beklenen:** Görsel dosyası kalır mı yoksa temizlenir mi? Doküman.

### T3-129 — Reorder PATCH
```
PATCH /admin/case-studies/reorder
[{id: 1, sort_order: 2}, {id: 2, sort_order: 1}]
```
**Beklenen:** 200, public response'ta yeni sıra.

### T3-130 — JSON list field encode/decode
**Beklenen:** before_complaints `|` ile saklanır, response'ta array.

### T3-131 — Case study: invalid district
**Beklenen:** 400.

### T3-132 — CSV export only (import yok)
**Beklenen:** GET /admin/case-studies/csv 200, ama POST endpoint yok.

---

## 18. Admin — Applications (T3-133 → T3-138)

### T3-133 — GET list paginated
### T3-134 — PATCH status: valid transition
**Adımlar:** pending → reviewed → accepted
**Beklenen:** Her transition 200.

### T3-135 — PATCH status: invalid value
**Adımlar:** status = "deleted"
**Beklenen:** 422 (enum/validation).

### T3-136 — CSV export
**Beklenen:** 200, header doğru.

### T3-137 — Application silme yok
**Beklenen:** DELETE endpoint mevcut olmamalı (intentional).

### T3-138 — Created_at ordering
**Beklenen:** En son başvuru en üstte.

---

## 19. DB Integrity (T3-139 → T3-148)

### T3-139 — UniqueConstraint district_analytics
**Adımlar:** Aynı (district_id, category_id, platform_id, period_date) ile 2 satır eklemeye çalış.
**Beklenen:** İkincisi IntegrityError, backend 409 dönmeli.

### T3-140 — FK violation: restaurant.district_id olmayan
**Adımlar:** DB'ye direkt insert.
**Beklenen:** IntegrityError.

### T3-141 — Cascade delete: district silindiğinde
**Beklenen:** İlgili restaurants/analytics/metrics nasıl davranır?

### T3-142 — Null'lara NOT NULL constraint
**Beklenen:** Restaurant.name=NULL girilemez.

### T3-143 — DB transaction rollback
**Adımlar:** CSV import sırasında 5. satırda hata.
**Beklenen:** İlk 4 satır da rollback yapılır mı yoksa atomic mi?

### T3-144 — Connection pool exhaustion
**Adımlar:** 100 paralel istek.
**Beklenen:** Pool yönetiliyor, deadlock yok.

### T3-145 — JSON sütun query
```sql
SELECT cancel_reasons FROM district_metrics WHERE district_id='34-kadıköy';
```
**Beklenen:** JSON parse edilebilir.

### T3-146 — Numeric precision
**Beklenen:** Numeric(5,2) için 12.34 doğru, 123.456 reddedilir veya yuvarlanır.

### T3-147 — Date format DB'de
**Beklenen:** ISO 8601 (YYYY-MM-DD).

### T3-148 — Timestamps auto-update
**Adımlar:** Update et, updated_at değişti mi?
**Beklenen:** server_default=now(), onupdate=now() çalışıyor.

---

## 20. Performance (T3-149 → T3-154)

### T3-149 — `/analytics/district` response time
**Beklenen:** P95 < 200 ms.

### T3-150 — `/admin/restaurants` 1000 satır
**Beklenen:** P95 < 500 ms.

### T3-151 — `/analytics/comments/by-district` (cross-aggregate)
**Beklenen:** P95 < 300 ms (39 ilçe loop).

### T3-152 — CSV export 117 satır
**Beklenen:** < 1 sn.

### T3-153 — CSV import 195 satır
**Beklenen:** < 5 sn.

### T3-154 — Concurrent 50 read
**Beklenen:** All 200, no degradation.

---

## 21. Security (T3-155 → T3-162)

### T3-155 — SQL injection: query param
```
GET /restaurants/search?q=' OR '1'='1
```
**Beklenen:** Backend güvenli (SQLAlchemy parametrize), 200 boş sonuç.

### T3-156 — SQL injection: path param
```
GET /districts/' OR '1'='1
```
**Beklenen:** 404.

### T3-157 — XSS in CSV
**Adımlar:** name'e `<script>alert(1)</script>` import et.
**Beklenen:** DB'de raw saklanır, API response'ta da raw döner (frontend escape etmeli).

### T3-158 — Path traversal: media file
```
GET /media/../app/config.py
```
**Beklenen:** 404, traversal engellenmiş.

### T3-159 — Sensitive data in response
**Beklenen:** Admin password hash hiçbir endpoint'te dönmez.

### T3-160 — JWT secret in code
**Beklenen:** SECRET_KEY .env'den okunuyor, repo'da raw secret yok.

### T3-161 — CORS misconfiguration
**Beklenen:** ALLOWED_ORIGINS sadece beklenen domain'leri içerir.

### T3-162 — Mass assignment
**Adımlar:** POST /admin/restaurants {"name": "x", "is_active": true, "id": 999, "created_at": "1900-01-01"}
**Beklenen:** id ve created_at silah hizmeti tarafında reddedilir.

---

## 22. Error Handling (T3-163 → T3-170)

### T3-163 — 404 endpoint
```
GET /nonexistent
```
**Beklenen:** 404 standard FastAPI mesajı.

### T3-164 — Malformed JSON
**Beklenen:** 422.

### T3-165 — Content-Type yanlış
**Adımlar:** POST text/plain.
**Beklenen:** 422.

### T3-166 — DB down
**Adımlar:** SQLite dosyasını geçici sil/lock.
**Beklenen:** 500, hata mesajı sızdırmaz.

### T3-167 — Beklenmedik exception
**Beklenen:** Global exception handler, log'a yazar, kullanıcıya generic mesaj.

### T3-168 — Timeout
**Adımlar:** Slow query simüle et.
**Beklenen:** İdeal: 30 sn sonra timeout. (Yoksa not et.)

### T3-169 — Validation error detail
**Beklenen:** 422 response'unda loc/msg/type yapısı.

### T3-170 — UTF-8 decode hatası
**Adımlar:** Geçersiz UTF-8 byte gönder.
**Beklenen:** 422.

---

## 23. Cross-system Integration (T3-171 → T3-176)

### T3-171 — Admin upsert → public yansır
**Adımlar:**
1. Admin'den metrics POST (cancel_rate=99)
2. Public GET /analytics/district
**Beklenen:** metrics.cancel_rate=99.

### T3-172 — Case study image upload → public render
**Adımlar:**
1. Admin'de hikaye + image yükle
2. Public /case-studies'te image URL'i tıkla
**Beklenen:** 200, görsel görünür.

### T3-173 — Application submit → admin liste
**Adımlar:**
1. Public POST /applications
2. Admin GET /admin/applications
**Beklenen:** Yeni başvuru en üstte, status=pending.

### T3-174 — Restaurant CSV import → search
**Adımlar:**
1. Import et
2. Public search
**Beklenen:** Yeni restoranlar aranabilir.

### T3-175 — Settings update → LoyaltyPage
**Adımlar:**
1. Admin Settings POST
2. Public GET /analytics/site-settings
**Beklenen:** Yeni değerler.

### T3-176 — Mahalle silindi → metrics ne olur?
**Adımlar:** Bir mahalleyi sil, ilgili metrics satırı?
**Beklenen:** Cascade veya orphan record (davranış doküman).

---

## 24. Regression suite (her release öncesi)

Aşağıdaki testler **her commit / her release** için minimum koşulur:

- T3-001, T3-005, T3-015, T3-021, T3-025, T3-033, T3-047, T3-053
- T3-059, T3-067, T3-082, T3-097, T3-123, T3-139, T3-149, T3-155, T3-171

Bunlar smoke + kritik path. CI'da otomatik koşacak şekilde pytest ile yazılması önerilir.

---

## 25. Test araçları & yardımcı script'ler

### Hızlı login
```bash
TOKEN=$(curl -s -X POST http://localhost:8003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opencard.com","password":"opencard123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```

### Authorized GET
```bash
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8003/admin/restaurants | head -c 500
```

### CSV upload
```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -F "file=@synthetic_csves/restaurants.csv" \
  http://localhost:8003/admin/restaurants/csv
```

### DB check
```bash
sqlite3 backend/opencard_dev.db "SELECT COUNT(*) FROM restaurants;"
```

---

## 26. Bug raporlama formatı

```markdown
**Test ID:** T3-XXX
**Severity:** Critical / High / Medium / Low
**Component:** API / DB / Auth / Storage
**Method + URL:**
**Payload:**
**Expected:**
**Actual:**
**Status code:**
**Response body:**
**Backend log:** (relevant lines)
**Reproducible:** Yes / Sometimes / No
**Affected version:** commit hash
```

---

## 27. Test kapsamı dışında kalan ve diğer kişilere yönlendirilmesi gereken durumlar

| Senaryo | Sahibi |
|---|---|
| API doğru veri dönüyor ama frontend yanlış göstereriyor | **Tester 2** |
| Admin formu doğru data göndermiyor (UI bug) | **Tester 1** |
| Admin'de bir buton çalışmıyor | **Tester 1** |
| Frontend layout bozuk | **Tester 2** |
| Tarayıcı uyumluluğu | **Tester 2** |

---

**Tahmini test süresi:** 5-7 iş günü (180 case, ortalama 6-10 dakika).
**Çıktı dosyası:** `test_plans/results/03_backend_<YYYY-MM-DD>.md`.
**Otomatizasyon hedefi:** Regression suite (madde 24) pytest ile kodlanır, CI'a entegre edilir.
