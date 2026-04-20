import React, { useState } from "react";
import "./Kiyaslama.css";

export default function Kiyaslama() {
  const [seciliIlce, setSeciliIlce] = useState("Avcılar");

  const istanbulIlceleri = [
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", 
  "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", 
  "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", 
  "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", 
  "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", 
  "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", 
  "Ümraniye", "Üsküdar", "Zeytinburnu"
];

  return (
    <div className="kiyaslama-wrapper">
      {/* 1. BÖLÜM: KOYU RENKLİ ÜST BİLGİ ÇUBUĞU */}
      <header className="kiyaslama-header">
        <div className="header-sol">
          <h1>Restoran Kıyaslama Paneli</h1>
          <p>{seciliIlce} İlçesi - Detaylı Performans Analizi</p>
        </div>
        <div className="header-sag">
          {/* DİNAMİK İLÇE SEÇİCİ (DROPDOWN) */}
          <select
            className="ilce-secici"
            value={seciliIlce}
            onChange={(e) => setSeciliIlce(e.target.value)}
          >
            {istanbulIlceleri.map((ilce) => (
              <option key={ilce} value={ilce}>
                {ilce}, İstanbul
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* ANA İÇERİK ALANI */}
      <main className="kiyaslama-content">
        {/* 2. BÖLÜM: 4'LÜ ÖZET KARTLARI */}
        <div className="ozet-kartlari-satiri">
          <div className="ozet-kart kirmizi-cizgi">
            <h4>MİN. SEPET TUTARI</h4>
            <h2>80 ₺</h2>
            <p>İlçe Ort: 120 ₺</p>
          </div>
          <div className="ozet-kart mavi-cizgi">
            <h4>ORTALAMA PUAN</h4>
            <h2>4.5</h2>
            <p>İlçe Ort: 4.1</p>
          </div>
          <div className="ozet-kart yesil-cizgi">
            <h4>AYLIK CİRO</h4>
            <h2>1M ₺</h2>
            <p>Rakip Ort: 500K ₺</p>
          </div>
          <div className="ozet-kart sari-cizgi">
            <h4>KARGO ÜCRETİ</h4>
            <h2>0 ₺</h2>
            <p>İlçe Ort: 20 ₺</p>
          </div>
        </div>

        {/* 3. BÖLÜM: DETAY VE KIYASLAMA KARTLARI */}
        <div className="detay-kartlari-izgarasi">
          <div className="detay-kart">
            <div className="kart-baslik">
              🛒
              <div>
                <h3>Minimum Sepet Tutarı</h3>
                <p>İlçedeki döner restoranları ile kıyaslama</p>
              </div>
            </div>
            <div className="bar-alani">
              <span className="mavi-yazi">İlçe Ortalaması</span>
              <div className="progress-bar-container">
                <div className="progress-bar mavi-bar" style={{ width: "60%" }}>
                  120 ₺
                </div>
              </div>
              <span className="siyah-yazi">150 ₺</span>
            </div>
          </div>

          <div className="detay-kart">
            <div className="kart-baslik">
              📉
              <div>
                <h3>Minimum Menü Fiyatı</h3>
                <p>{seciliIlce} ilçesi restoranları ile kıyaslama</p>
              </div>
            </div>
            <div className="bar-alani">
              <span className="mavi-yazi">İlçe Ortalaması</span>
              <div className="progress-bar-container">
                <div
                  className="progress-bar mavi-bar"
                  style={{ width: "80%" }}
                ></div>
              </div>
              <span className="mavi-yazi">58 ₺</span>
            </div>
          </div>

          <div className="detay-kart">
            <div className="kart-baslik">
              📈
              <div>
                <h3>Maximum Menü Fiyatı</h3>
                <p>İlçedeki döner restoranları ile kıyaslama</p>
              </div>
            </div>
            <div className="bar-alani">
              <span className="mor-yazi">İlçe Ortalaması</span>
              <div className="progress-bar-container">
                <div className="progress-bar mor-bar" style={{ width: "70%" }}>
                  120 ₺
                </div>
              </div>
              <span className="siyah-yazi">130 ₺</span>
            </div>
          </div>

          <div className="detay-kart vs-kart">
            <div className="kart-baslik">
              ⚖️
              <div>
                <h3>Ortalama Menü Fiyatı</h3>
                <p>Senin ortalaman vs ilçe ortalaması</p>
              </div>
            </div>
            <div className="vs-alani">
              <div className="vs-sol">
                <p>SENİN ORTALAMAN</p>
                <h2 className="kirmizi-soru">?</h2>
                <span>Menü Başına</span>
              </div>
              <div className="vs-daire">VS</div>
              <div className="vs-sag">
                <p>İLÇE ORTALAMASI</p>
                <h2 className="mavi-rakam">139 ₺</h2>
                <span>Menü Başına</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. BÖLÜM: PUAN KIYASLAMASI VE AKSİYON ÖNERİLERİ */}
        <div className="detay-kart tam-genislik puan-aksiyon-container">
          <div className="puan-sol">
            <div className="kart-baslik">
              ⭐
              <div>
                <h3>Puan Kıyaslaması & Aksiyon Önerileri</h3>
                <p>Puanını yükseltmek için alınabilecek aksiyonlar</p>
              </div>
            </div>
            <div className="buyuk-puan-daire">
              <h1>4.1</h1>
            </div>
            <p className="ilce-ort-yazi">İlçe Ortalaması</p>
          </div>
          <div className="puan-sag">
            <div className="mini-puan-kartlari">
              <div className="mini-kart pembe-bg">
                <span>Senin Puanın</span>
                <strong>? ⭐</strong>
              </div>
              <div className="mini-kart mavi-bg">
                <span>İlçe Ortalaması</span>
                <strong>4.1 ⭐</strong>
              </div>
              <div className="mini-kart yesil-bg">
                <span>En Yüksek</span>
                <strong>4.8 ⭐</strong>
              </div>
              <div className="mini-kart sari-bg">
                <span>En Düşük</span>
                <strong>4.8 ⭐</strong>
              </div>
            </div>
            <div className="aksiyon-listesi">
              <div className="aksiyon-baslik">
                🎯 Puanı Yükseltmek İçin Aksiyonlar
              </div>
              <ul>
                <li>
                  <span className="madde-no yesil-no">1</span>{" "}
                  <strong>Sipariş sonrası anket gönderin</strong> - Müşteri
                  memnuniyetini ölçün, kötü deneyimleri erkenden tespit edin.
                </li>
                <li>
                  <span className="madde-no mavi-no">2</span>{" "}
                  <strong>Yorum yapan müşterilere kupon verin</strong> - Olumlu
                  yorum sayısını artırarak ortalamayı yükseltin.
                </li>
                <li>
                  <span className="madde-no mor-no">3</span>{" "}
                  <strong>Paketleme kalitesini artırın</strong> - Sıcak/Soğuk
                  ayrımı yapın, sunum kalitesini yükseltin.
                </li>
                <li>
                  <span className="madde-no sari-no">4</span>{" "}
                  <strong>Teslimat süresini kısaltın</strong> - Hızlı teslimat
                  müşteri memnuniyetini doğrudan etkiler.
                </li>
                <li>
                  <span className="madde-no kirmizi-no">5</span>{" "}
                  <strong>Olumsuz yorumlara hızlı yanıt verin</strong> -
                  Profesyonel yaklaşım güven inşa eder.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5. BÖLÜM: ALT İKİLİ KARTLAR (Kurye ve İndirim) */}
        <div className="alt-ikili-izgara">
          <div className="detay-kart">
            <div className="kart-baslik">
              🚚
              <div>
                <h3>Kurye Modeli Karşılaştırması</h3>
                <p>Kendin Kuryen vs. Platform Kuryesi ve İlçe Ortalaması</p>
              </div>
            </div>
            <div className="kurye-kutu-container">
              <div className="kurye-kutu avantajli">
                <p>KENDİN KURYEN (AVANTAJLI)</p>
                <h2>32,40 TL</h2>
                <span>ORTALAMA MALİYET</span>
                <span className="vurgu-yesil">%8 DAHA FAZLA KAZANDIRIR</span>
              </div>
              <div className="kurye-kutu diger">
                <p>PLATFORM KURYESİ (DİĞER)</p>
                <h2>35,10 TL</h2>
                <span>ORTALAMA MALİYET</span>
                <span className="vurgu-kirmizi">DAHA AZ KAZANDIRIR</span>
              </div>
            </div>
          </div>

          <div className="detay-kart">
            <div className="kart-baslik">
              🎫
              <div>
                <h3>İndirim & Kupon Kullanım Oranları</h3>
                <p>Joker, kupon ve indirim kıyaslaması</p>
              </div>
            </div>
            <div className="kupon-liste">
              <div className="kupon-satir">
                <span className="kupon-etiket">İndirim Oranı</span>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar kirmizi-bar"
                    style={{ width: "15%" }}
                  >
                    İlçe Ortalaması: %45
                  </div>
                </div>
              </div>
              <div className="kupon-satir">
                <span className="kupon-etiket">Joker Kullanımı</span>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar kirmizi-bar"
                    style={{ width: "60%" }}
                  >
                    Senin Ortalaman %60
                  </div>
                </div>
              </div>
              <div className="kupon-satir">
                <span className="kupon-etiket">Kupon Kullanımı</span>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar kirmizi-bar"
                    style={{ width: "25%" }}
                  >
                    İlçe Ortalaması: %25
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. BÖLÜM: İŞ MODELİ STRATEJİSİ */}
        <div className="detay-kart tam-genislik is-modeli-container">
          <div className="kart-baslik">
            🎯
            <div>
              <h3>İş Modeli Karşılaştırması: Kurye Stratejisi</h3>
              <p>Kurye ücretini müşteriye yansıtma vs ücretsiz kurye modeli</p>
            </div>
          </div>

          <div className="is-modeli-kutu-grubu">
            <div className="is-modeli-kutu rakip-model">
              <div className="model-baslik kirmizi-nokta">RAKİP MODELİ</div>
              <h4>Kurye Ücreti Müşteriye Yansıtılıyor</h4>
              <p>
                Kurye maliyeti müşteriye yansıtıyor. Bu durum güvenli bir liman
                gibi görünse de, müşteride vazgeçme eğilimi yaratıyor ve ciroyu
                sınırlı tutuyor.
              </p>
              <div className="istatistik-grubu">
                <div className="istatistik-kutu">
                  <span>KURYE ÜCRETİ</span>
                  <h2>20 ₺</h2>
                </div>
                <div className="istatistik-kutu">
                  <span>Aylık Ciro</span>
                  <h2>5000 ₺</h2>
                </div>
                <div className="istatistik-kutu">
                  <span>VAZGEÇME</span>
                  <h2>YÜKSEK</h2>
                </div>
              </div>
            </div>

            <div className="is-modeli-kutu senin-model">
              <div className="model-baslik yesil-nokta">SENİN MODELİN</div>
              <h4>Kurye Ücreti Ücretsiz</h4>
              <p>
                Kurye maliyetini şirket olarak sen karşılıyorsun. Kâr marjı
                düşse de, satış hacmi 2 katına çıkarak toplam ciroda büyük artış
                sağlıyor.
              </p>
              <div className="istatistik-grubu">
                <div className="istatistik-kutu">
                  <span>KURYE ÜCRETİ</span>
                  <h2>0 ₺</h2>
                </div>
                <div className="istatistik-kutu">
                  <span>AYLIK CİRO</span>
                  <h2>1M ₺</h2>
                </div>
                <div className="istatistik-kutu">
                  <span>VAZGEÇME</span>
                  <h2>DÜŞÜK</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
