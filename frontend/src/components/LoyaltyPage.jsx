import { useEffect, useState } from "react";
import { api } from "../api/client";

// Tüm içerik admin panelden (Sadakat sayfası → site-settings) yönetilir.
// Boş kalan alanlar için fallback default'lar var.

const DEFAULTS = {
  loyalty_hero_bg_url: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1800&q=80",
  loyalty_hero_badge: "Sadakat Programı",
  loyalty_hero_title: "Müşterini koru,",
  loyalty_hero_title_accent: "gelirini büyüt.",
  loyalty_hero_subtitle: "Yemeksepeti, Uber Eats ve Getir gibi platformlardaki müşterilerinizi segmentlere ayırın, risk altındakileri tespit edin, doğru kampanyayla geri kazanın.",
  loyalty_hero_cta_text: "Nasıl Çalışır?",
  loyalty_stats_active_firms_label: "Aktif Firma",
  loyalty_stats_churn_label: "Ortalama Churn Azalması",
  loyalty_stats_roi_label: "Ortalama ROI",
  loyalty_stats_payback_label: "Ortalama Geri Ödeme Süresi",
  loyalty_features_title: "Neler Sunuyoruz?",
  loyalty_features_subtitle: "Her özellik, somut bir kazanımla geliyor.",
};

const get = (v, key) => (v[key] && String(v[key]).trim()) || DEFAULTS[key] || "";

export default function SadakatPage() {
  const [v, setV] = useState({});
  useEffect(() => {
    api.getSiteSettings().then((d) => setV(d || {})).catch(() => setV({}));
  }, []);

  const stats = [
    { value: v.loyalty_active_firms || "—", label: get(v, "loyalty_stats_active_firms_label") },
    { value: v.loyalty_churn_reduction || "—", label: get(v, "loyalty_stats_churn_label") },
    { value: v.loyalty_avg_roi || "—", label: get(v, "loyalty_stats_roi_label") },
    { value: v.loyalty_payback_period || "—", label: get(v, "loyalty_stats_payback_label") },
  ];

  const cards = Array.isArray(v.loyalty_feature_cards) ? v.loyalty_feature_cards : [];

  return (
    <div className="bg-base-100 rounded-3xl overflow-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-12 text-center">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={get(v, "loyalty_hero_bg_url")}
            alt=""
            className="h-full w-full scale-105 object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-base-100/70 via-base-100/55 to-base-200/70" />
        </div>
        <div className="relative mx-auto max-w-4xl">
          <div className="relative z-10 rounded-3xl bg-base-100/20 px-4 py-10 sm:px-8">
            <span className="badge badge-primary badge-outline mb-4 text-xs font-semibold tracking-widest uppercase">
              {get(v, "loyalty_hero_badge")}
            </span>
            <h1 className="mb-4 text-4xl font-black leading-tight sm:text-5xl">
              {get(v, "loyalty_hero_title")}<br />
              <span className="text-primary">{get(v, "loyalty_hero_title_accent")}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base font-medium text-base-content/60 sm:text-lg">
              {get(v, "loyalty_hero_subtitle")}
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
                {get(v, "loyalty_hero_cta_text")}
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
          <h2 className="text-3xl font-black mb-2">{get(v, "loyalty_features_title")}</h2>
          <p className="text-base-content/50">{get(v, "loyalty_features_subtitle")}</p>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm italic text-center text-base-content/50">
            Henüz özellik kartı eklenmemiş. Admin panel → Sadakat sayfasından ekleyebilirsin.
          </p>
        ) : (
          <div className="space-y-6">
            {cards.map((c, i) => {
              const imageLeft = i % 2 === 0; // alternating layout
              const img = (
                <figure className="w-full shrink-0 overflow-hidden lg:w-[38%]">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.title || ""}
                      className="h-60 w-full object-cover saturate-75 contrast-110 brightness-95 sm:h-64"
                    />
                  ) : (
                    <div className="h-60 w-full bg-base-200 flex items-center justify-center text-base-content/30 text-xs sm:h-64">
                      Görsel yok
                    </div>
                  )}
                </figure>
              );
              const body = (
                <div className="card-body">
                  <h2 className="card-title">{c.title || "Başlıksız"}</h2>
                  <p className="whitespace-pre-line">{c.text || ""}</p>
                </div>
              );
              return (
                <div key={i} className="card lg:card-side bg-base-100 shadow-sm">
                  {imageLeft ? <>{img}{body}</> : <>{body}{img}</>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
