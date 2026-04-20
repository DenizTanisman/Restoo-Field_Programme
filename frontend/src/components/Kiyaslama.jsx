import React, { useState } from "react";

export default function Kiyaslama() {
  const [seciliIlce, setSeciliIlce] = useState("Avcılar");

  const ISTANBUL_ILCELERI = [
    "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler",
   "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü",
   "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt",
   "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane",
   "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer",
    "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla",
   "Ümraniye", "Üsküdar", "Zeytinburnu"
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* HEADER */}
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Restoran Kıyaslama Paneli
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {seciliIlce} İlçesi - Detaylı Performans Analizi
          </p>
        </div>

        <div className="flex gap-4">
          <select
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 outline-none transition hover:border-blue-500 hover:bg-slate-50"
            value={seciliIlce}
            onChange={(e) => setSeciliIlce(e.target.value)}
          >
            {ISTANBUL_ILCELERI.map((ilce) => (
              <option key={ilce} value={ilce}>
                {ilce}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-6 pb-10 md:px-10">
        {/* ÖZET KARTLARI */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border-l-4 border-red-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">
              MİN. SEPET TUTARI
            </h4>
            <h2 className="mt-2 text-3xl font-bold text-red-500">80 ₺</h2>
            <p className="mt-1 text-sm text-slate-500">İlçe Ort: 120 ₺</p>
          </div>

          <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">
              ORTALAMA PUAN
            </h4>
            <h2 className="mt-2 text-3xl font-bold text-blue-500">4.5</h2>
            <p className="mt-1 text-sm text-slate-500">İlçe Ort: 4.1</p>
          </div>

          <div className="rounded-xl border-l-4 border-green-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">AYLIK CİRO</h4>
            <h2 className="mt-2 text-3xl font-bold text-green-500">1M ₺</h2>
            <p className="mt-1 text-sm text-slate-500">Rakip Ort: 500K ₺</p>
          </div>

          <div className="rounded-xl border-l-4 border-yellow-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">
              KARGO ÜCRETİ
            </h4>
            <h2 className="mt-2 text-3xl font-bold text-yellow-500">0 ₺</h2>
            <p className="mt-1 text-sm text-slate-500">İlçe Ort: 20 ₺</p>
          </div>
        </div>

        {/* DETAY KARTLARI */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <span className="text-2xl">🛒</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Minimum Sepet Tutarı
                </h3>
                <p className="text-sm text-slate-400">
                  İlçedeki döner restoranları ile kıyaslama
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-blue-400">
                İlçe Ortalaması
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full w-[60%] items-center justify-end rounded-full bg-blue-400 pr-3 text-xs font-bold text-white">
                  120 ₺
                </div>
              </div>
              <span className="text-base font-bold text-slate-900">150 ₺</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <span className="text-2xl">📉</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Minimum Menü Fiyatı
                </h3>
                <p className="text-sm text-slate-400">
                  {seciliIlce} ilçesi restoranları ile kıyaslama
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-blue-400">
                İlçe Ortalaması
              </span>
              <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[80%] rounded-full bg-blue-400"></div>
              </div>
              <span className="text-sm font-semibold text-blue-400">58 ₺</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Maximum Menü Fiyatı
                </h3>
                <p className="text-sm text-slate-400">
                  İlçedeki döner restoranları ile kıyaslama
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-purple-400">
                İlçe Ortalaması
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full w-[70%] items-center justify-end rounded-full bg-purple-400 pr-3 text-xs font-bold text-white">
                  120 ₺
                </div>
              </div>
              <span className="text-base font-bold text-slate-900">130 ₺</span>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start gap-4">
              <span className="text-2xl">⚖️</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Ortalama Menü Fiyatı
                </h3>
                <p className="text-sm text-slate-400">
                  Senin ortalaman vs ilçe ortalaması
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-around gap-4">
              <div className="text-center">
                <p className="mb-2 text-xs font-bold text-slate-500">
                  SENİN ORTALAMAN
                </p>
                <h2 className="text-5xl font-bold text-red-500">?</h2>
                <span className="text-xs italic text-slate-400">Menü Başına</span>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                VS
              </div>

              <div className="text-center">
                <p className="mb-2 text-xs font-bold text-slate-500">
                  İLÇE ORTALAMASI
                </p>
                <h2 className="text-5xl font-bold text-blue-500">139 ₺</h2>
                <span className="text-xs italic text-slate-400">Menü Başına</span>
              </div>
            </div>
          </div>
        </div>

        {/* PUAN & AKSİYON */}
        <div className="mt-5 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-8 xl:flex-row">
            <div className="flex min-w-[250px] flex-col items-center">
              <div className="mb-4 flex w-full items-start gap-4">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Puan Kıyaslaması & Aksiyon Önerileri
                  </h3>
                  <p className="text-sm text-slate-400">
                    Puanını yükseltmek için alınabilecek aksiyonlar
                  </p>
                </div>
              </div>

              <div className="my-4 flex h-32 w-32 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-200">
                <h1 className="text-5xl font-bold">4.1</h1>
              </div>

              <p className="text-sm font-semibold text-slate-500">
                İlçe Ortalaması
              </p>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-lg bg-pink-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">
                    Senin Puanın
                  </span>
                  <strong className="text-xl text-slate-900">? ⭐</strong>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg bg-sky-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">
                    İlçe Ortalaması
                  </span>
                  <strong className="text-xl text-slate-900">4.1 ⭐</strong>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg bg-green-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">
                    En Yüksek
                  </span>
                  <strong className="text-xl text-slate-900">4.8 ⭐</strong>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg bg-yellow-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">
                    En Düşük
                  </span>
                  <strong className="text-xl text-slate-900">4.8 ⭐</strong>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm font-bold text-slate-900">
                  🎯 Puanı Yükseltmek İçin Aksiyonlar
                </div>

                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                      1
                    </span>
                    <span>
                      <strong className="text-slate-900">
                        Sipariş sonrası anket gönderin
                      </strong>{" "}
                      - Müşteri memnuniyetini ölçün, kötü deneyimleri erkenden
                      tespit edin.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                      2
                    </span>
                    <span>
                      <strong className="text-slate-900">
                        Yorum yapan müşterilere kupon verin
                      </strong>{" "}
                      - Olumlu yorum sayısını artırarak ortalamayı yükseltin.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                      3
                    </span>
                    <span>
                      <strong className="text-slate-900">
                        Paketleme kalitesini artırın
                      </strong>{" "}
                      - Sıcak/Soğuk ayrımı yapın, sunum kalitesini yükseltin.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                      4
                    </span>
                    <span>
                      <strong className="text-slate-900">
                        Teslimat süresini kısaltın
                      </strong>{" "}
                      - Hızlı teslimat müşteri memnuniyetini doğrudan etkiler.
                    </span>
                  </li>

                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      5
                    </span>
                    <span>
                      <strong className="text-slate-900">
                        Olumsuz yorumlara hızlı yanıt verin
                      </strong>{" "}
                      - Profesyonel yaklaşım güven inşa eder.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ALT İKİLİ */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-4">
              <span className="text-2xl">🚚</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Kurye Modeli Karşılaştırması
                </h3>
                <p className="text-sm text-slate-400">
                  Kendin Kuryen vs. Platform Kuryesi ve İlçe Ortalaması
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-4 md:flex-row">
              <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-5 text-center">
                <p className="text-xs font-semibold text-slate-600">
                  KENDİN KURYEN (AVANTAJLI)
                </p>
                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  32,40 TL
                </h2>
                <span className="mt-1 block text-[11px] font-bold text-slate-500">
                  ORTALAMA MALİYET
                </span>
                <span className="mt-2 block text-xs font-bold text-green-600">
                  %8 DAHA FAZLA KAZANDIRIR
                </span>
              </div>

              <div className="flex-1 rounded-lg border border-red-200 bg-red-50 p-5 text-center">
                <p className="text-xs font-semibold text-slate-600">
                  PLATFORM KURYESİ (DİĞER)
                </p>
                <h2 className="mt-2 text-3xl font-bold text-red-500">
                  35,10 TL
                </h2>
                <span className="mt-1 block text-[11px] font-bold text-slate-500">
                  ORTALAMA MALİYET
                </span>
                <span className="mt-2 block text-xs font-bold text-red-500">
                  DAHA AZ KAZANDIRIR
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-4">
              <span className="text-2xl">🎫</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  İndirim & Kupon Kullanım Oranları
                </h3>
                <p className="text-sm text-slate-400">
                  Joker, kupon ve indirim kıyaslaması
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm font-semibold text-slate-600">
                  İndirim Oranı
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-[45%] items-center rounded-full bg-red-500 pl-3 text-xs font-semibold text-slate-900">
                    İlçe Ortalaması: %45
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-32 text-sm font-semibold text-slate-600">
                  Joker Kullanımı
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-[60%] items-center rounded-full bg-red-500 pl-3 text-xs font-semibold text-slate-900">
                    Senin Ortalaman %60
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-32 text-sm font-semibold text-slate-600">
                  Kupon Kullanımı
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-[30%] items-center rounded-full bg-red-500 px-2 text-[10px] font-semibold  whitespace-nowrap overflow-hidden">
                     İlçe Ortalaması: %25
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İŞ MODELİ */}
        <div className="mt-5 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                İş Modeli Karşılaştırması: Kurye Stratejisi
              </h3>
              <p className="text-sm text-slate-400">
                Kurye ücretini müşteriye yansıtma vs ücretsiz kurye modeli
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="flex-1 rounded-xl border-2 border-red-300 bg-red-50 p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-red-500">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                RAKİP MODELİ
              </div>

              <h4 className="text-2xl font-bold text-red-600">
                Kurye Ücreti Müşteriye Yansıtılıyor
              </h4>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Kurye maliyeti müşteriye yansıtıyor. Bu durum güvenli bir liman
                gibi görünse de, müşteride vazgeçme eğilimi yaratıyor ve ciroyu
                sınırlı tutuyor.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-red-100 p-4 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    KURYE ÜCRETİ
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold text-red-600">
                    20 ₺
                  </h2>
                </div>

                <div className="rounded-lg bg-red-100 p-4 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    Aylık Ciro
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold text-red-600">
                    5000 ₺
                  </h2>
                </div>

                <div className="rounded-lg bg-red-100 p-4 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    VAZGEÇME
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold text-red-600">
                    YÜKSEK
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-xl border-2 border-green-300 bg-green-50 p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-green-600">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600"></span>
                SENİN MODELİN
              </div>

              <h4 className="text-2xl font-bold text-green-600">
                Kurye Ücreti Ücretsiz
              </h4>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Kurye maliyetini şirket olarak sen karşılıyorsun. Kâr marjı
                düşse de, satış hacmi 2 katına çıkarak toplam ciroda büyük artış
                sağlıyor.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-green-100 p-4 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    KURYE ÜCRETİ
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold text-green-600">
                    0 ₺
                  </h2>
                </div>

                <div className="rounded-lg bg-green-100 p-4 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    AYLIK CİRO
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold text-green-600">
                    1M ₺
                  </h2>
                </div>

                <div className="rounded-lg bg-green-100 p-4 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">
                    VAZGEÇME
                  </span>
                  <h2 className="mt-2 text-3xl font-extrabold text-green-600">
                    DÜŞÜK
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}