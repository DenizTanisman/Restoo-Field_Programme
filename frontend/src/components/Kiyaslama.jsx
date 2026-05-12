import React from "react";
import SalesHourHeatmap, { SAMPLE_DISTRICT_DATA } from "./SalesHourHeatmap";
import CustomerRatingCompare from "./CustomerRatingCompare";

function VsCompareCard({ icon, title, subtitle, myValue, areaValue, areaLabel = "İLÇE ORTALAMASI", footerLabel = "Menü Başına" }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm h-full">
      <div className="mb-6 flex items-start gap-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-around gap-4">
        <div className="text-center">
          <p className="mb-2 text-xs font-bold text-slate-500">SENİN ORTALAMAN</p>
          <h2 className="text-5xl font-bold text-red-500">
            {myValue ?? "?"}
          </h2>
          <span className="text-xs italic text-slate-400">{footerLabel}</span>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
          VS
        </div>

        <div className="text-center">
          <p className="mb-2 text-xs font-bold text-slate-500">{areaLabel}</p>
          <h2 className="text-5xl font-bold text-blue-500">{areaValue}</h2>
          <span className="text-xs italic text-slate-400">{footerLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function Kiyaslama({ districtName, neighborhoodName }) {
  const scope = neighborhoodName || districtName || "—";
  const subtitle = neighborhoodName
    ? `${districtName} · ${neighborhoodName} kıyaslaması`
    : districtName
      ? `${districtName} ilçesindeki restoranlar ile kıyaslama`
      : "İlçe veya mahalle seçilmedi";

  return (
    <div className="font-sans">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-slate-900 text-center">
            Restoran Kıyaslama Paneli
          </h1>
        </div>

      <main className="p-5 space-y-5 bg-gray-50">
        {/* ÖZET KARTLARI */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
          <div className="rounded-xl border-l-4 border-red-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">ORTALAMA SEPET TUTARI</h4>
            <h2 className="mt-2 text-3xl font-bold text-red-500">80 ₺</h2>
            <p className="mt-1 text-sm text-slate-500">İlçe Ort: 80 ₺</p>
          </div>

          <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">ORTALAMA PUAN</h4>
            <h2 className="mt-2 text-3xl font-bold text-blue-500">4.5</h2>
            <p className="mt-1 text-sm text-slate-500">İlçe Ort: 4.5</p>
          </div>

          <div className="rounded-xl border-l-4 border-green-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">ORTALAMA AYLIK CİRO</h4>
            <h2 className="mt-2 text-3xl font-bold text-green-500">1M ₺</h2>
            <p className="mt-1 text-sm text-slate-500">Rakip Ort: 1M ₺</p>
          </div>

          <div className="rounded-xl border-l-4 border-yellow-500 bg-white p-6 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500">KURYE ÜCRETİ</h4>
            <h2 className="mt-2 text-3xl font-bold text-yellow-500">20 ₺</h2>
            <p className="mt-1 text-sm text-slate-500">İlçe Ort: 20 ₺</p>
          </div>
        </div>

        {/* SATIŞ SAATLERİ HEATMAP — en üstte */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <SalesHourHeatmap
            title="Satış Saatleri Yoğunluğu (İlçe)"
            subtitle="Haftalık ortalama saatlik yoğunluk"
            data={SAMPLE_DISTRICT_DATA}
            colorRgb="239, 68, 68"
          />
          <SalesHourHeatmap
            title="Satış Saatleri Yoğunluğu (Restoran)"
            subtitle="Senin haftalık saatlik yoğunluğun"
            data={null}
            colorRgb="59, 130, 246"
          />
        </div>

        {/* DETAY: SEPET + MENÜ — aynı hizada VS düzeni */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <VsCompareCard
            icon="🛒"
            title="Ortalama Sepet Tutarı"
            subtitle={subtitle}
            myValue={null}
            areaValue="120 ₺"
            footerLabel="Sipariş Başına"
          />
          <VsCompareCard
            icon="⚖️"
            title="Ortalama Menü Fiyatı"
            subtitle="Senin ortalaman vs ilçe ortalaması"
            myValue={null}
            areaValue="139 ₺"
            footerLabel="Menü Başına"
          />
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

              <p className="text-sm font-semibold text-slate-500">İlçe Ortalaması</p>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-lg bg-pink-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">Senin Puanın</span>
                  <strong className="text-xl text-slate-900">? ⭐</strong>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-sky-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">İlçe Ortalaması</span>
                  <strong className="text-xl text-slate-900">4.1 ⭐</strong>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-green-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">En Yüksek</span>
                  <strong className="text-xl text-slate-900">4.8 ⭐</strong>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-yellow-100 p-4 text-center">
                  <span className="text-xs font-semibold text-slate-600">En Düşük</span>
                  <strong className="text-xl text-slate-900">4.8 ⭐</strong>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm font-bold text-slate-900">
                  🎯 Puanı Yükseltmek İçin Aksiyonlar
                </div>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">1</span>
                    <span>
                      <strong className="text-slate-900">Sipariş sonrası anket gönderin</strong> -
                      Müşteri memnuniyetini ölçün, kötü deneyimleri erkenden tespit edin.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">2</span>
                    <span>
                      <strong className="text-slate-900">Yorum yapan müşterilere kupon verin</strong> -
                      Olumlu yorum sayısını artırarak ortalamayı yükseltin.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">3</span>
                    <span>
                      <strong className="text-slate-900">Paketleme kalitesini artırın</strong> -
                      Sıcak/Soğuk ayrımı yapın, sunum kalitesini yükseltin.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">4</span>
                    <span>
                      <strong className="text-slate-900">Teslimat süresini kısaltın</strong> -
                      Hızlı teslimat müşteri memnuniyetini doğrudan etkiler.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">5</span>
                    <span>
                      <strong className="text-slate-900">Olumsuz yorumlara hızlı yanıt verin</strong> -
                      Profesyonel yaklaşım güven inşa eder.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ALT İKİLİ */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <CustomerRatingCompare myRating={null} areaRating={4.2} />

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-start gap-4">
              <span className="text-2xl">🎫</span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">İndirim & Kupon Kullanım Oranları</h3>
                <p className="text-sm text-slate-400">Joker, kupon ve indirim kıyaslaması</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm font-semibold text-slate-600">İndirim Oranı</span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-[45%] items-center rounded-full bg-green-500 pl-3 text-xs font-semibold text-white">
                    İlçe Ortalaması: %45
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm font-semibold text-slate-600">Joker Kullanımı</span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-[60%] items-center rounded-full bg-green-500 pl-3 text-xs font-semibold text-white">
                    Senin Ortalaman %60
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32 text-sm font-semibold text-slate-600">Kupon Kullanımı</span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="flex h-full w-[30%] items-center rounded-full bg-green-500 px-2 text-[10px] font-semibold text-white whitespace-nowrap overflow-hidden">
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
              <p className="text-sm text-slate-400">Restoranın kendi kuryesi vs Senin özel kurye modelin</p>
            </div>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row">
            <div className="flex-1 rounded-xl border-2 border-red-300 bg-red-50 p-6">
              <h4 className="mb-3 flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide text-red-600">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                RESTORAN KURYESİ
              </h4>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Restoran kurye maliyetini doğrudan müşteriye yansıtıyor. Bu durum güvenli bir liman
                gibi görünse de, ek ücretler müşteride vazgeçme eğilimi yaratıyor ve ciroyu sınırlı tutuyor.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <div className="rounded-lg bg-red-100 p-3 text-center border border-red-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">KURYE ÜCRETİ</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-red-600 whitespace-nowrap">20&nbsp;₺</h2>
                </div>
                <div className="rounded-lg bg-red-100 p-3 text-center border border-red-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">ORT. MALİYET</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-red-600 whitespace-nowrap">35,10&nbsp;₺</h2>
                </div>
                <div className="rounded-lg bg-red-100 p-3 text-center border border-red-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Aylık Ciro</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-red-600 whitespace-nowrap">5000&nbsp;₺</h2>
                </div>
                <div className="rounded-lg bg-red-100 p-3 text-center border border-red-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">VAZGEÇME</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-red-600 whitespace-nowrap">YÜKSEK</h2>
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-xl border-2 border-green-300 bg-green-50 p-6">
              <h4 className="mb-3 flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide text-green-600">
                <span className="h-2.5 w-2.5 rounded-full bg-green-600"></span>
                SENİN KURYEN
              </h4>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Kurye operasyonunu sen üstleniyorsun ve müşteriye ücretsiz sunuyorsun. Birim kâr düşse de,
                "ücretsiz gönderim" algısı satış hacmini 2 katına çıkararak toplam ciroda rekor artış sağlıyor.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                <div className="rounded-lg bg-green-100 p-3 text-center border border-green-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">KURYE ÜCRETİ</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-green-600 whitespace-nowrap">0&nbsp;₺</h2>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-center border border-green-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">ORT. MALİYET</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-green-600 whitespace-nowrap">32,40&nbsp;₺</h2>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-center border border-green-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">AYLIK CİRO</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-green-600 whitespace-nowrap">1M&nbsp;₺</h2>
                </div>
                <div className="rounded-lg bg-green-100 p-3 text-center border border-green-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">VAZGEÇME</span>
                  <h2 className="mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold text-green-600 whitespace-nowrap">DÜŞÜK</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
