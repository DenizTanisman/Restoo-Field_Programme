import React from "react";
import SalesHourHeatmap from "./SalesHourHeatmap";
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

const fmtTL = (v) => `${(Number(v) || 0).toLocaleString("tr-TR")} ₺`;
const fmtRating = (v) => (Number(v) || 0).toFixed(1);

export default function Kiyaslama({ districtName, neighborhoodName, metrics, budget }) {
  const subtitle = neighborhoodName
    ? `${districtName} · ${neighborhoodName} kıyaslaması`
    : districtName
      ? `${districtName} ilçesindeki restoranlar ile kıyaslama`
      : "İlçe veya mahalle seçilmedi";

  const m = metrics || {};
  const heatmap = Array.isArray(m.hourly_heatmap) && m.hourly_heatmap.length === 7 ? m.hourly_heatmap : null;

  return (
    <div className="font-sans">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-slate-900 text-center">
            Restoran Kıyaslama Paneli
          </h1>
        </div>

        <main className="p-5 space-y-5 bg-gray-50">
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
            <div className="rounded-xl border-l-4 border-red-500 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500">ORTALAMA SEPET TUTARI</h4>
              <h2 className="mt-2 text-3xl font-bold text-red-500">{fmtTL(m.avg_basket)}</h2>
              <p className="mt-1 text-sm text-slate-500">İlçe Ort: {fmtTL(m.avg_basket)}</p>
            </div>

            <div className="rounded-xl border-l-4 border-blue-500 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500">ORTALAMA PUAN</h4>
              <h2 className="mt-2 text-3xl font-bold text-blue-500">{fmtRating(m.area_rating)}</h2>
              <p className="mt-1 text-sm text-slate-500">İlçe Ort: {fmtRating(m.area_rating)}</p>
            </div>

            <div className="rounded-xl border-l-4 border-green-500 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500">ORTALAMA AYLIK CİRO</h4>
              <h2 className="mt-2 text-3xl font-bold text-green-500">{fmtTL(m.avg_monthly_revenue)}</h2>
              <p className="mt-1 text-sm text-slate-500">Rakip Ort: {fmtTL(m.avg_monthly_revenue)}</p>
            </div>

            <div className="rounded-xl border-l-4 border-yellow-500 bg-white p-6 shadow-sm">
              <h4 className="text-xs font-semibold text-slate-500">KURYE ÜCRETİ</h4>
              <h2 className="mt-2 text-3xl font-bold text-yellow-500">{fmtTL(m.courier_fee)}</h2>
              <p className="mt-1 text-sm text-slate-500">İlçe Ort: {fmtTL(m.courier_fee)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <SalesHourHeatmap
              title="Satış Saatleri Yoğunluğu (İlçe)"
              subtitle="Haftalık ortalama saatlik yoğunluk"
              data={heatmap}
              colorRgb="239, 68, 68"
            />
            <SalesHourHeatmap
              title="Satış Saatleri Yoğunluğu (Restoran)"
              subtitle="Senin haftalık saatlik yoğunluğun"
              data={null}
              colorRgb="59, 130, 246"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <VsCompareCard
              icon="🛒"
              title="Ortalama Sepet Tutarı"
              subtitle={subtitle}
              myValue={null}
              areaValue={fmtTL(m.avg_basket)}
              footerLabel="Sipariş Başına"
            />
            <VsCompareCard
              icon="⚖️"
              title="Ortalama Menü Fiyatı"
              subtitle="Senin ortalaman vs ilçe ortalaması"
              myValue={null}
              areaValue={fmtTL(m.avg_menu_price)}
              footerLabel="Menü Başına"
            />
          </div>

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
                  <h1 className="text-5xl font-bold">{fmtRating(m.area_rating)}</h1>
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
                    <strong className="text-xl text-slate-900">{fmtRating(m.area_rating)} ⭐</strong>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-green-100 p-4 text-center">
                    <span className="text-xs font-semibold text-slate-600">En Yüksek</span>
                    <strong className="text-xl text-slate-900">{fmtRating(m.highest_rating)} ⭐</strong>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg bg-yellow-100 p-4 text-center">
                    <span className="text-xs font-semibold text-slate-600">En Düşük</span>
                    <strong className="text-xl text-slate-900">{fmtRating(m.lowest_rating)} ⭐</strong>
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

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <CustomerRatingCompare myRating={null} areaRating={Number(m.area_rating) || 0} />

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start gap-4">
                <span className="text-2xl">🎫</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">İndirim & Kupon Kullanım Oranları</h3>
                  <p className="text-sm text-slate-400">Joker, kupon ve indirim kıyaslaması</p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <DiscountBar label="İndirim Oranı" percent={Number(budget?.campaignRate) || 0} hint="İlçe Ortalaması" />
                <DiscountBar label="Joker Kullanımı" percent={Number(budget?.jokerRate) || 0} hint="İlçe Ortalaması" />
                <DiscountBar label="Kupon Kullanımı" percent={Number(budget?.couponRate) || 0} hint="İlçe Ortalaması" />
              </div>
            </div>
          </div>

          <CourierComparisonBlock comparison={m.courier_comparison} />
        </main>
      </div>
    </div>
  );
}

function CourierComparisonBlock({ comparison }) {
  const c = comparison || {};
  const r = c.restaurant_courier || {};
  const o = c.own_courier || {};
  return (
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
        <CourierSide accent="red" title="RESTORAN KURYESİ" data={r} />
        <CourierSide accent="green" title="SENİN KURYEN" data={o} />
      </div>
    </div>
  );
}

function CourierSide({ accent, title, data }) {
  const ring = accent === "red" ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50";
  const text = accent === "red" ? "text-red-600" : "text-green-600";
  const dot = accent === "red" ? "bg-red-500" : "bg-green-600";
  const cell = accent === "red" ? "bg-red-100 border-red-200" : "bg-green-100 border-green-200";
  return (
    <div className={`flex-1 rounded-xl border-2 ${ring} p-6`}>
      <h4 className={`mb-3 flex items-center gap-2 text-2xl font-extrabold uppercase tracking-wide ${text}`}>
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`}></span>
        {title}
      </h4>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <div className={`rounded-lg p-3 text-center border ${cell}`}>
          <span className="text-[10px] font-bold uppercase text-slate-500">KURYE ÜCRETİ</span>
          <h2 className={`mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold ${text} whitespace-nowrap`}>{fmtTL(data.fee)}</h2>
        </div>
        <div className={`rounded-lg p-3 text-center border ${cell}`}>
          <span className="text-[10px] font-bold uppercase text-slate-500">ORT. MALİYET</span>
          <h2 className={`mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold ${text} whitespace-nowrap`}>{fmtTL(data.avg_cost)}</h2>
        </div>
        <div className={`rounded-lg p-3 text-center border ${cell}`}>
          <span className="text-[10px] font-bold uppercase text-slate-500">AYLIK CİRO</span>
          <h2 className={`mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold ${text} whitespace-nowrap`}>{fmtTL(data.monthly_revenue)}</h2>
        </div>
        <div className={`rounded-lg p-3 text-center border ${cell}`}>
          <span className="text-[10px] font-bold uppercase text-slate-500">VAZGEÇME</span>
          <h2 className={`mt-1 text-lg lg:text-xl 2xl:text-2xl font-extrabold ${text} whitespace-nowrap`}>{data.churn_label || "—"}</h2>
        </div>
      </div>
    </div>
  );
}

function DiscountBar({ label, percent, hint }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="flex items-center gap-4">
      <span className="w-32 text-sm font-semibold text-slate-600">{label}</span>
      <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full items-center rounded-full bg-green-500 pl-3 text-xs font-semibold text-white" style={{ width: `${p}%` }}>
          {hint}: %{p.toFixed(0)}
        </div>
      </div>
    </div>
  );
}
