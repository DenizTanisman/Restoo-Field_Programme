const stats = [
  { value: "340+", label: "Aktif Firma" },
  { value: "%38", label: "Ortalama Churn Azalması" },
  { value: "2.6x", label: "Ortalama ROI" },
  { value: "90 Gün", label: "Ortalama Geri Ödeme Süresi" },
];

export default function SadakatPage() {
  return (
    <div className="bg-base-100 rounded-3xl overflow-hidden">

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-12 text-center">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="h-full w-full scale-105 object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-base-100/70 via-base-100/55 to-base-200/70" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="relative z-10 rounded-3xl bg-base-100/20 px-4 py-10 sm:px-8">
            <span className="badge badge-primary badge-outline mb-4 text-xs font-semibold tracking-widest uppercase">
              Sadakat Programı
            </span>
            <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
              Müşterini koru,<br />
              <span className="text-primary">gelirini büyüt.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base font-medium text-base-content/60 sm:text-lg">
              Yemeksepeti, Uber Eats ve Getir gibi platformlardaki müşterilerinizi segmentlere ayırın,
              risk altındakileri tespit edin, doğru kampanyayla geri kazanın.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                className="btn btn-primary btn-lg w-full sm:w-auto"
                onClick={() =>
                  document
                    .getElementById("neler-sunuyoruz")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                Nasıl Çalışır?
              </button>
            </div>
          </div>
        </div>
        
      </section>

      {/* STATS */}
      <section className="py-10 bg-base-200">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-primary">{s.value}</div>
              <div className="text-sm text-base-content/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="neler-sunuyoruz" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-2">Neler Sunuyoruz?</h2>
          <p className="text-base-content/50">Her özellik, somut bir kazanımla geliyor.</p>
        </div>

       <div className="card lg:card-side bg-base-100 shadow-sm">
  <figure className="w-full shrink-0 overflow-hidden lg:w-[38%]">
    <img
      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
      alt="Performans karşılaştırma grafikleri"
      className="h-60 w-full object-cover saturate-75 contrast-110 brightness-95 sm:h-64" />
  </figure>
  <div className="card-body">
    <h2 className="card-title">Performans Karşılaştırmaları</h2>
    <p>Dönemsel karşılaştırmalar sunarak bu ay/hafta ile geçen ay/hafta arasındaki sadakat metriklerini kıyaslamanıza olanak sağlıyoruz.
Platform bazlı analiz sunarak Yemeksepeti, Getir ve Uber Eats üzerinden gelen siparişlerin sadakat farklılıklarını görmenize katkı sağlıyoruz.
Trend grafikleri sunarak sadakat metriklerinin zaman içindeki değişimini takip etmenize yardımcı oluyoruz.</p>
    <div className="card-actions justify-end">
    </div>
  </div>
</div>

<div className="card lg:card-side bg-base-100 shadow-sm">
  <div className="card-body">
    <h2 className="card-title">Tahmin ve Öneriler</h2>
    <p>Gelecek dönem tahminleri sunarak mevcut trendlere göre gelecek ay beklenen sadakat metriklerini öngörmenize katkı sağlıyoruz.
Aksiyon önerileri sunarak sadakat artırmak için uygulanabilecek genel stratejileri belirlemenize yardımcı oluyoruz.
Benchmark karşılaştırmaları sunarak sektör ortalamalarıyla (varsa) performansınızı kıyaslamanıza olanak sağlıyoruz.</p>
    <div className="card-actions justify-end">
    </div>
  </div>
  <figure className="w-full shrink-0 overflow-hidden lg:w-[38%]">
    <img
      src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
      alt="Tahmin ve öneri analizi"
      className="h-60 w-full object-cover saturate-75 contrast-110 brightness-95 sm:h-64" />
  </figure>
</div>

<div className="card lg:card-side bg-base-100 shadow-sm">
  <figure className="w-full shrink-0 overflow-hidden lg:w-[38%]">
    <img
      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
      alt="Sadakat metrikleri raporu"
      className="h-60 w-full object-cover saturate-75 contrast-110 brightness-95 sm:h-64" />
  </figure>
  <div className="card-body">
    <h2 className="card-title">Genel Sadakat Metrikleri
</h2>
    <p>Tekrar sipariş oranı sunarak tüm müşterilerin yüzde kaçının tekrar sipariş verdiğini görmenize katkı sağlıyoruz.
Ortalama sipariş sıklığı sunarak müşterilerin ortalama kaç günde bir sipariş verdiğini anlamanıza yardımcı oluyoruz.
Müşteri segmentasyonu dağılımı sunarak toplam müşterilerin yüzde kaçının sadık, yeni veya kaybedilen kategorisinde olduğunu görmenize olanak sağlıyoruz.
Ortalama müşteri yaşam süresi sunarak müşterilerin ortalama kaç gün/ay aktif kaldığını ölçmenize katkı sağlıyoruz.
</p>
    <div className="card-actions justify-end">
    </div>
  </div>
</div>

<div className="card lg:card-side bg-base-100 shadow-sm">
  <div className="card-body">
    <h2 className="card-title">Segmentasyon Analizleri
</h2>
    <p>Müşteri segmentlerinin dağılımı sunarak sadık, yeni, yüksek değerli ve kayıp riski taşıyan müşterilerin yüzdelerini görmenize katkı sağlıyoruz.
Segment bazlı ortalama değerler sunarak her segmentin ortalama sipariş sıklığı, sepet değeri ve yaşam süresini anlamanıza yardımcı oluyoruz.
Segment geçişleri sunarak müşterilerin segmentler arası hareketlerini (örn: yeni müşteriden sadık müşteriye geçiş oranı) takip etmenize olanak sağlıyoruz.</p>
    <div className="card-actions justify-end">
    </div>
  </div>
  <figure className="w-full shrink-0 overflow-hidden lg:w-[38%]">
    <img
      src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80"
      alt="Müşteri segmentasyon analizi"
      className="h-60 w-full object-cover saturate-75 contrast-110 brightness-95 sm:h-64" />
  </figure>
</div>




      </section>

    </div>
  );
}