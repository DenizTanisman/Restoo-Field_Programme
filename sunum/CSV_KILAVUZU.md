# Opencard — Örnek CSV Paketi

Erhan Bey merhaba,

İstediğiniz örnek CSV dosyalarını bu klasörün içine hazır olarak koydum. Aşağıda hangi dosyanın ne işe yaradığını, kendi verilerinizi nasıl gireceğinizi ve sisteme nasıl yükleyeceğinizi anlattım.

---

## 1. Bu klasördeki örnek dosyalar

Aynı klasörde (`opencard/sunum/`) üç hazır CSV var:

| Dosya | Ne için? |
|---|---|
| **`restaurants.csv`** | Restoran listesi — her restoranın adı, ilçesi ve platform müşteri sayıları |
| **`data_entry_district.csv`** | İlçe bazlı tüm performans verisi (analytics + metrics + heatmap + yorum analizi) |
| **`data_entry_neighborhood.csv`** | Aynısının mahalle versiyonu (tek fark: bir de mahalle adı sütunu var) |

Üç dosya da Excel veya Google Sheets'te açılır. İçinde örnek olarak doldurulmuş satırlar var; siz aynı yapıyı kullanarak kendi verinizi girebilirsiniz.

> **Not:** Hücrelerin hiçbirinde JSON, liste veya karışık ifade yok. Her hücre **tek bir yazı veya rakam.** Excel'de açıp düzenlemek son derece rahat.

---

## 2. Dosyaları doldururken dikkat edilecekler

Tüm dosyalar için geçerli kurallar:

| Kural | Doğru kullanım |
|---|---|
| **Dosya formatı** | UTF-8 kodlu CSV (Excel'de "Farklı Kaydet → CSV UTF-8") |
| **Tarih** | `2026-05-01` formatı (yıl-ay-gün) |
| **Ondalık** | Nokta kullanın: `4.5` ✅ (virgül kullanmayın: `4,5` ❌) |
| **Binlik ayraç** | Yok: `1247` ✅ (`1.247` veya `1,247` ❌) |
| **Boş hücre** | Sorun değil — sistem 0 veya boş kabul eder |
| **Evet/Hayır** | `true` veya `false` (küçük harf) |
| **`id` sütunu** | Boş bırakırsanız yeni kayıt oluşur, dolu olursa mevcut kayıt güncellenir |

---

## 3. Dosyaların kısa açıklaması

### `restaurants.csv`
Sisteme yeni restoran eklemek veya mevcut restoranların müşteri sayılarını güncellemek için. Her satır bir restoran.

Doldurmanız gereken alanlar: restoran adı, ilçe, kategori, üç platformdaki müşteri sayısı.

### `data_entry_district.csv`
Bir ilçenin tüm aylık performansını tek satıra yazar. Örnek dosyada **Fatih ilçesi** için tam dolu bir satır var — aynı kalıpla diğer ilçeler için satır ekleyebilirsiniz.

İçinde olanlar:
- Hangi ilçe, hangi kategori, hangi ay (zorunlu alanlar)
- 3 platform için müşteri sayısı, reklam bütçesi, kampanya oranları, satış tahminleri
- İptal/iade oranları, ortalama puan, sepet tutarı, kurye ücreti
- İptal ve iade sebepleri (yüzde olarak)
- Yıldız dağılımı (5/4/3/2/1)
- Restoran kuryesi vs. kendi kuryeniz karşılaştırması
- Şikayet kelimeleri
- 7 gün × 24 saat yoğunluk haritası

> Zorunlu olan sadece **2 alan** var: `district_id` ve `period_start`. Diğer her şey boş bırakılabilir — sistem default 0 atar.

### `data_entry_neighborhood.csv`
Yukarıdakinin birebir aynısı, sadece bir tane fazladan **`neighborhood`** (mahalle adı) sütunu var. Mahalle bazlı veri girmek istediğinizde bunu kullanın. Örnek dosyada **Fatih > Aksaray** için tam dolu bir satır var.

---

## 4. Sisteme nasıl yükleyeceksiniz

### Adım 1 — Admin paneline giriş
Tarayıcıdan açın: **<http://localhost:5181>** (canlıya geçince adres değişir, size ayrıca verilir)

| Alan | Değer |
|---|---|
| E-posta | `admin@opencard.com` |
| Şifre | `opencard123` |

### Adım 2 — İlgili sayfaya gidin

| Yüklemek istediğiniz dosya | Hangi sayfa? |
|---|---|
| `restaurants.csv` | Sol menü → **Restaurants** |
| `data_entry_district.csv` | Sol menü → **Veri Girişi** |
| `data_entry_neighborhood.csv` | Sol menü → **Veri Girişi** |

### Adım 3 — CSV yükle
Sağ üstte **"📁 CSV İçe Aktar"** butonu var. Tıklayın → dosyayı seçin.

### Adım 4 — Sonucu görün
Sistem size şu bilgileri verir:
- **Eklenen:** kaç yeni kayıt oluşturuldu
- **Güncellenen:** kaç mevcut kayıt güncellendi
- **Atlanan:** hatalı satır varsa kaç tane (hata sebebiyle birlikte)

---

## 5. Sık karşılaşılan durumlar

| Durum | Ne yapmalı? |
|---|---|
| "district_id bulunamadı" | İlçe ID'sini Districts sayfasından kontrol edin (örn. `34-fatih`) |
| "Kategori geçersiz" | Categories sayfasından doğru kategori ID'sini alın |
| "Tarih formatı yanlış" | `2026-05-01` şeklinde yazın (yıl-ay-gün) |
| Excel'de Türkçe karakter bozuluyor | "Veri → Metinden Veri Al" → encoding **UTF-8** seçin. Veya Google Sheets'te açın. |
| Aynı satırı tekrar yüklersem? | Sistem akıllı — mevcut kaydı **günceller**, çift kayıt oluşturmaz |
| Bir restoranı silmek istersem? | `is_active` sütununu `false` yapın — public'te görünmez ama verisi korunur |

---

## 6. Görseller hakkında

CSV dosyalarında **görsel veya URL yoktur**. Restoran/kampanya görsellerini admin panelinden, her kayıt için tek tek yüklersiniz. CSV sadece veri içindir.

---

## 7. Yardım

Herhangi bir hata mesajı aldığınızda veya bir sütunun ne anlama geldiğinden emin olmadığınızda lütfen ekran görüntüsüyle birlikte bana iletin — aynı gün dönüş yapıyorum.

Kolay gelsin,
**Opencard ekibi**
