import { useEffect, useState } from "react";
import { analyticsApi, metricsApi } from "../api/analytics";
import { districtsApi } from "../api/districts";
import { categoriesApi } from "../api/categories";
import { platformsApi } from "../api/platforms";
import { API_URL } from "../api/client";
import { useToast } from "../components/ui/Toast";
import HeatmapEditor from "../components/ui/HeatmapEditor";
import CourierComparisonEditor from "../components/ui/CourierComparisonEditor";

// Public dashboard endpoint'inden customer dağılımını çek (restoranlardan summed)
async function fetchPublicCustomers({ scopeType, districtId, neighborhoodId, categoryId }) {
  const path = scopeType === "district"
    ? `/analytics/district?district_id=${encodeURIComponent(districtId)}`
    : `/analytics/neighborhood?neighborhood_id=${neighborhoodId}`;
  const cat = categoryId ? `&category_id=${categoryId}` : "";
  const res = await fetch(`${API_URL}${path}${cat}`);
  if (!res.ok) return {};
  const data = await res.json();
  const out = {};
  (data.platforms || []).forEach((p) => {
    out[p.name] = { customers: p.customers, restaurants: p.restaurants };
  });
  return out;
}

// Dashboard'daki kartlarla birebir eşleşen veri girişi sayfası.
// Kapsam (scope): İlçe veya Mahalle × Kategori × Dönem
// Bölümler kart sırasına uygun: Platform Müşteri (read-only, restoranlardan summed),
// Kampanya, Tahmini Satış, İptal, İade, Performans Skoru, Puan Kıyaslaması,
// Kıyaslama Metrikleri, Saatlik Yoğunluk, Senin Kuryen, Yorum Analizi.

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY_PLATFORM = { ad_budget: 0, campaign_rate: 0, coupon_rate: 0, flash_rate: 0, joker_rate: 0, daily_forecast: 0, monthly_forecast: 0, yearly_forecast: 0 };

const EMPTY_HEATMAP = Array.from({ length: 7 }, () => Array(24).fill(0));
const EMPTY_COURIER = {
  restaurant_courier: { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "" },
  own_courier: { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "" },
};

const EMPTY_METRICS = {
  cancel_rate: 0, return_rate: 0, area_performance_score: 0, area_rating: 0,
  highest_rating: 0, lowest_rating: 0, avg_basket: 0, avg_menu_price: 0,
  avg_monthly_revenue: 0, courier_fee: 0, negative_comment_total: 0,
  negative_comment_rate: 0, negative_avg_rating: 0,
  cancel_reasons_json: "[]",
  return_reasons_json: "[]",
  hourly_heatmap: EMPTY_HEATMAP,           // 7×24 matrix (object)
  platform_negative_distribution_json: "[]",
  rating_distribution_json: "[]",
  negative_word_cloud_json: "[]",
  courier_comparison: EMPTY_COURIER,       // {restaurant_courier, own_courier} (object)
};

export default function DataEntryPage() {
  const toast = useToast();

  // Scope
  const [scopeType, setScopeType] = useState("district"); // "district" | "neighborhood"
  const [districtId, setDistrictId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [categoryId, setCategoryId] = useState(""); // "" = tüm kategoriler (NULL)
  const [periodDate, setPeriodDate] = useState(today());

  // Reference data
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  // Form state
  const [perPlatform, setPerPlatform] = useState({}); // { platform_id: { ad_budget, rates..., forecasts... } }
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [restaurantCustomers, setRestaurantCustomers] = useState({}); // { platform_id: {customers, restaurants} } — read-only
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // İlk veri yükle
  useEffect(() => {
    (async () => {
      try {
        const [d, c, p] = await Promise.all([districtsApi.list(), categoriesApi.list(), platformsApi.list()]);
        setDistricts(d);
        setCategories(c);
        setPlatforms(p);
      } catch (err) {
        toast.push(err.message, "error");
      }
    })();
  }, []);

  // District değişince mahalleler
  useEffect(() => {
    if (!districtId) { setNeighborhoods([]); setNeighborhoodId(""); return; }
    let alive = true;
    districtsApi.listNeighborhoods(districtId)
      .then((data) => { if (alive) setNeighborhoods(data); })
      .catch(() => { if (alive) setNeighborhoods([]); });
    return () => { alive = false; };
  }, [districtId]);

  // Scope değişince formu sıfırla
  useEffect(() => {
    setPerPlatform(Object.fromEntries(platforms.map((p) => [p.id, { ...EMPTY_PLATFORM }])));
    setMetrics(EMPTY_METRICS);
    setRestaurantCustomers({});
  }, [scopeType, districtId, neighborhoodId, categoryId, platforms]);

  const scopeReady = scopeType === "district" ? !!districtId : !!districtId && !!neighborhoodId;

  // Mevcut veriyi getir
  const loadData = async () => {
    if (!scopeReady) { toast.push("Önce kapsam seç", "warning"); return; }
    setLoading(true);
    try {
      const cat = categoryId ? parseInt(categoryId, 10) : null;
      // Analytics — per platform satırları
      const analyticsList = scopeType === "district"
        ? await analyticsApi.district.list({ district_id: districtId, period_date: periodDate })
        : await analyticsApi.neighborhood.list({ neighborhood_id: neighborhoodId, period_date: periodDate });
      const filtered = analyticsList.filter((r) => (cat == null ? r.category_id == null : r.category_id === cat));
      const pp = Object.fromEntries(platforms.map((p) => [p.id, { ...EMPTY_PLATFORM }]));
      filtered.forEach((r) => {
        pp[r.platform_id] = {
          ad_budget: r.ad_budget ?? 0, campaign_rate: r.campaign_rate ?? 0,
          coupon_rate: r.coupon_rate ?? 0, flash_rate: r.flash_rate ?? 0, joker_rate: r.joker_rate ?? 0,
          daily_forecast: r.daily_forecast ?? 0, monthly_forecast: r.monthly_forecast ?? 0, yearly_forecast: r.yearly_forecast ?? 0,
        };
      });
      setPerPlatform(pp);

      // Metrics
      const metricsList = scopeType === "district"
        ? await metricsApi.district.list({ district_id: districtId, period_date: periodDate })
        : await metricsApi.neighborhood.list({ neighborhood_id: neighborhoodId, period_date: periodDate });
      const m = metricsList.find((r) => (cat == null ? r.category_id == null : r.category_id === cat));
      if (m) {
        setMetrics({
          cancel_rate: m.cancel_rate ?? 0,
          return_rate: m.return_rate ?? 0,
          area_performance_score: m.area_performance_score ?? 0,
          area_rating: m.area_rating ?? 0,
          highest_rating: m.highest_rating ?? 0,
          lowest_rating: m.lowest_rating ?? 0,
          avg_basket: m.avg_basket ?? 0,
          avg_menu_price: m.avg_menu_price ?? 0,
          avg_monthly_revenue: m.avg_monthly_revenue ?? 0,
          courier_fee: m.courier_fee ?? 0,
          negative_comment_total: m.negative_comment_total ?? 0,
          negative_comment_rate: m.negative_comment_rate ?? 0,
          negative_avg_rating: m.negative_avg_rating ?? 0,
          cancel_reasons_json: JSON.stringify(m.cancel_reasons || [], null, 2),
          return_reasons_json: JSON.stringify(m.return_reasons || [], null, 2),
          hourly_heatmap: Array.isArray(m.hourly_heatmap) && m.hourly_heatmap.length === 7
            ? m.hourly_heatmap
            : EMPTY_HEATMAP,
          platform_negative_distribution_json: JSON.stringify(m.platform_negative_distribution || [], null, 2),
          rating_distribution_json: JSON.stringify(m.rating_distribution || [], null, 2),
          negative_word_cloud_json: JSON.stringify(m.negative_word_cloud || [], null, 2),
          courier_comparison: m.courier_comparison && typeof m.courier_comparison === "object"
            ? { ...EMPTY_COURIER, ...m.courier_comparison }
            : EMPTY_COURIER,
        });
      } else {
        setMetrics(EMPTY_METRICS);
      }

      // Read-only: Platform Müşteri Dağılımı — public endpoint'ten al (restoranlardan summed)
      const publicCustomers = await fetchPublicCustomers({
        scopeType, districtId, neighborhoodId, categoryId,
      });
      // platform_id'ye map'le (platforms list'inden)
      const byPid = {};
      platforms.forEach((p) => {
        byPid[p.id] = publicCustomers[p.name] || { customers: 0, restaurants: 0 };
      });
      setRestaurantCustomers(byPid);

      const wasFound = filtered.length > 0 || !!m;
      toast.push(wasFound ? "Mevcut veri yüklendi" : "Bu kapsam için kayıt yok — boş başlıyorsun", "success");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Kaydet — Analytics + Metrics iki ayrı upsert
  const save = async () => {
    if (!scopeReady) { toast.push("Önce kapsam seç", "warning"); return; }
    setSaving(true);
    try {
      const cat = categoryId ? parseInt(categoryId, 10) : null;
      // Analytics payload — platforms × budget×forecast
      const platformAnalytics = platforms.map((p) => {
        const v = perPlatform[p.id] || EMPTY_PLATFORM;
        return {
          platform_id: p.id,
          customers: 0, // backend bunu yok sayar artık (customers restoranlardan)
          daily_forecast: Number(v.daily_forecast) || 0,
          monthly_forecast: Number(v.monthly_forecast) || 0,
          yearly_forecast: Number(v.yearly_forecast) || 0,
        };
      });
      // Budget: ortalama (UI'da tek değer giriyoruz, her platforma yayar)
      const budget = {
        ad_budget: Number(perPlatform[platforms[0]?.id]?.ad_budget) || 0,
        campaign_rate: Number(perPlatform[platforms[0]?.id]?.campaign_rate) || 0,
        coupon_rate: Number(perPlatform[platforms[0]?.id]?.coupon_rate) || 0,
        flash_rate: Number(perPlatform[platforms[0]?.id]?.flash_rate) || 0,
        joker_rate: Number(perPlatform[platforms[0]?.id]?.joker_rate) || 0,
      };
      const analyticsPayload = {
        ...(scopeType === "district"
          ? { district_id: districtId }
          : { neighborhood_id: parseInt(neighborhoodId, 10) }),
        category_id: cat,
        period_date: periodDate,
        platform_analytics: platformAnalytics,
        budget,
      };
      if (scopeType === "district") await analyticsApi.district.upsert(analyticsPayload);
      else await analyticsApi.neighborhood.upsert(analyticsPayload);

      // Metrics payload
      let metricsPayload;
      try {
        metricsPayload = {
          ...(scopeType === "district"
            ? { district_id: districtId }
            : { neighborhood_id: parseInt(neighborhoodId, 10) }),
          category_id: cat,
          period_date: periodDate,
          cancel_rate: Number(metrics.cancel_rate) || 0,
          return_rate: Number(metrics.return_rate) || 0,
          cancel_reasons: JSON.parse(metrics.cancel_reasons_json || "[]"),
          return_reasons: JSON.parse(metrics.return_reasons_json || "[]"),
          area_performance_score: Number(metrics.area_performance_score) || 0,
          area_rating: Number(metrics.area_rating) || 0,
          highest_rating: Number(metrics.highest_rating) || 0,
          lowest_rating: Number(metrics.lowest_rating) || 0,
          avg_basket: Number(metrics.avg_basket) || 0,
          avg_menu_price: Number(metrics.avg_menu_price) || 0,
          avg_monthly_revenue: Number(metrics.avg_monthly_revenue) || 0,
          courier_fee: Number(metrics.courier_fee) || 0,
          hourly_heatmap: metrics.hourly_heatmap || EMPTY_HEATMAP,
          negative_comment_total: parseInt(metrics.negative_comment_total, 10) || 0,
          negative_comment_rate: Number(metrics.negative_comment_rate) || 0,
          negative_avg_rating: Number(metrics.negative_avg_rating) || 0,
          platform_negative_distribution: JSON.parse(metrics.platform_negative_distribution_json || "[]"),
          rating_distribution: JSON.parse(metrics.rating_distribution_json || "[]"),
          negative_word_cloud: JSON.parse(metrics.negative_word_cloud_json || "[]"),
          courier_comparison: metrics.courier_comparison || EMPTY_COURIER,
        };
      } catch (err) {
        toast.push("Metrik JSON alanlarında format hatası: " + err.message, "error");
        setSaving(false);
        return;
      }
      if (scopeType === "district") await metricsApi.district.upsert(metricsPayload);
      else await metricsApi.neighborhood.upsert(metricsPayload);

      toast.push("Kaydedildi — ana sayfada görünecek", "success");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const updPlat = (pid, field, value) => {
    setPerPlatform((s) => ({ ...s, [pid]: { ...(s[pid] || EMPTY_PLATFORM), [field]: value } }));
  };
  const updMetric = (field, value) => setMetrics((s) => ({ ...s, [field]: value }));

  return (
    <div className="space-y-4 pb-24">
      <div className="card bg-base-100 shadow-sm sticky top-0 z-10">
        <div className="card-body py-4">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h2 className="card-title">Veri Girişi</h2>
              <p className="text-xs opacity-60">Ana sayfa kartlarıyla birebir aynı düzen — burada girdiğin her şey orada görünür.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm" onClick={loadData} disabled={loading || !scopeReady}>
                {loading ? "Yükleniyor…" : "↻ Mevcut veriyi getir"}
              </button>
              <button className="btn btn-sm btn-primary" onClick={save} disabled={saving || !scopeReady}>
                {saving ? "Kaydediliyor…" : "Hepsini Kaydet"}
              </button>
            </div>
          </div>

          {/* Scope selector */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs opacity-70">Kapsam</span>
              <select className="select select-bordered select-sm" value={scopeType} onChange={(e) => setScopeType(e.target.value)}>
                <option value="district">İlçe</option>
                <option value="neighborhood">Mahalle</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs opacity-70">İlçe</span>
              <select className="select select-bordered select-sm" value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                <option value="">Seç...</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            {scopeType === "neighborhood" && (
              <label className="flex flex-col gap-1">
                <span className="text-xs opacity-70">Mahalle</span>
                <select className="select select-bordered select-sm" value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)} disabled={!districtId}>
                  <option value="">Seç...</option>
                  {neighborhoods.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-xs opacity-70">Kategori (boş = tümü)</span>
              <select className="select select-bordered select-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Tümü</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs opacity-70">Dönem</span>
              <input type="date" className="input input-bordered input-sm" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
            </label>
          </div>
        </div>
      </div>

      {/* === Kart 1: Platform Müşteri Dağılımı (READ-ONLY) === */}
      <Section title="① Platform Müşteri Dağılımı">
        <p className="text-xs opacity-70 mb-2">
          Bu kart artık <b>restoranlardan otomatik</b> hesaplanır (toplam aktif müşteri / platform). Düzenlemek için ilgili
          restoranların admin sayfasındaki müşteri sayılarını güncelle.
        </p>
        <table className="table table-sm">
          <thead><tr><th>Platform</th><th>Toplam müşteri</th><th>Restoran sayısı</th></tr></thead>
          <tbody>
            {platforms.map((p) => {
              const info = restaurantCustomers[p.id] || { customers: "—", restaurants: "—" };
              return <tr key={p.id}><td>{p.name}</td><td>{info.customers}</td><td>{info.restaurants}</td></tr>;
            })}
          </tbody>
        </table>
        <p className="text-xs opacity-50 mt-1">İpucu: Kapsam seçip "Mevcut veriyi getir" deyince ana sayfayla aynı rakamı görürsün (public dashboard'dan).</p>
      </Section>

      {/* === Kart 2: Kampanya & Katılım Analizleri === */}
      <Section title="② Kampanya & Katılım Analizleri" subtitle="Reklam bütçesi + 4 katılım oranı (her platforma uygulanır)">
        {platforms.length === 0 ? <p className="text-xs opacity-60">Önce platform ekleyin.</p> : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <NumField label="Reklam Bütçesi (₺)" value={perPlatform[platforms[0]?.id]?.ad_budget ?? 0} onChange={(v) => platforms.forEach((p) => updPlat(p.id, "ad_budget", v))} />
            <NumField label="Kampanya Katılım %" value={perPlatform[platforms[0]?.id]?.campaign_rate ?? 0} onChange={(v) => platforms.forEach((p) => updPlat(p.id, "campaign_rate", v))} />
            <NumField label="Kupon Katılım %" value={perPlatform[platforms[0]?.id]?.coupon_rate ?? 0} onChange={(v) => platforms.forEach((p) => updPlat(p.id, "coupon_rate", v))} />
            <NumField label="Flash Katılım %" value={perPlatform[platforms[0]?.id]?.flash_rate ?? 0} onChange={(v) => platforms.forEach((p) => updPlat(p.id, "flash_rate", v))} />
            <NumField label="Joker Katılım %" value={perPlatform[platforms[0]?.id]?.joker_rate ?? 0} onChange={(v) => platforms.forEach((p) => updPlat(p.id, "joker_rate", v))} />
          </div>
        )}
      </Section>

      {/* === Kart 3: Tahmini Satış Verisi === */}
      <Section title="③ Tahmini Satış Verisi" subtitle="Her platform için günlük / aylık / yıllık tahmin (₺)">
        {platforms.map((p) => (
          <div key={p.id} className="border-t border-base-200 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
            <h4 className="text-sm font-medium mb-2">{p.name}</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <NumField label="Günlük (₺)" value={perPlatform[p.id]?.daily_forecast ?? 0} onChange={(v) => updPlat(p.id, "daily_forecast", v)} />
              <NumField label="Aylık (₺)" value={perPlatform[p.id]?.monthly_forecast ?? 0} onChange={(v) => updPlat(p.id, "monthly_forecast", v)} />
              <NumField label="Yıllık (₺)" value={perPlatform[p.id]?.yearly_forecast ?? 0} onChange={(v) => updPlat(p.id, "yearly_forecast", v)} />
            </div>
          </div>
        ))}
      </Section>

      {/* === Kart 4: İptal Sebepleri === */}
      <Section title="④ İPTAL SEBEPLERİ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NumField label="İptal oranı %" value={metrics.cancel_rate} onChange={(v) => updMetric("cancel_rate", v)} />
          <div className="md:col-span-2">
            <JsonField label='Sebep dağılımı (JSON)' placeholder='[{"label":"Geç","percent":60,"color":"#EE4444"}]' value={metrics.cancel_reasons_json} onChange={(v) => updMetric("cancel_reasons_json", v)} rows={3} />
          </div>
        </div>
      </Section>

      {/* === Kart 5: İade Sebepleri === */}
      <Section title="⑤ İADE SEBEPLERİ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NumField label="İade oranı %" value={metrics.return_rate} onChange={(v) => updMetric("return_rate", v)} />
          <div className="md:col-span-2">
            <JsonField label='Sebep dağılımı (JSON)' placeholder='[{"label":"Soğuk","percent":50,"color":"#A65EEA"}]' value={metrics.return_reasons_json} onChange={(v) => updMetric("return_reasons_json", v)} rows={3} />
          </div>
        </div>
      </Section>

      {/* === Kart 6: Genel Performans Skoru === */}
      <Section title="⑥ Genel Performans Skoru" subtitle="0-100 arasında bir skor">
        <NumField label="Performans skoru" min={0} max={100} value={metrics.area_performance_score} onChange={(v) => updMetric("area_performance_score", v)} />
      </Section>

      {/* === Kart 7: Puan Kıyaslaması === */}
      <Section title="⑦ Puan Kıyaslaması & Aksiyon Önerileri">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <NumField label="Senin puanın" min={0} max={5} step={0.1} value={metrics.area_rating} onChange={(v) => updMetric("area_rating", v)} />
          <NumField label="En yüksek puan" min={0} max={5} step={0.1} value={metrics.highest_rating} onChange={(v) => updMetric("highest_rating", v)} />
          <NumField label="En düşük puan" min={0} max={5} step={0.1} value={metrics.lowest_rating} onChange={(v) => updMetric("lowest_rating", v)} />
        </div>
      </Section>

      {/* === Kart 8: Kıyaslama Metrikleri === */}
      <Section title="⑧ Kıyaslama Metrikleri" subtitle="Sepet, menü fiyatı, ciro, kurye ücreti">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <NumField label="Ort. sepet (₺)" value={metrics.avg_basket} onChange={(v) => updMetric("avg_basket", v)} />
          <NumField label="Ort. menü fiyatı (₺)" value={metrics.avg_menu_price} onChange={(v) => updMetric("avg_menu_price", v)} />
          <NumField label="Aylık ciro (₺)" value={metrics.avg_monthly_revenue} onChange={(v) => updMetric("avg_monthly_revenue", v)} />
          <NumField label="Kurye ücreti (₺)" value={metrics.courier_fee} onChange={(v) => updMetric("courier_fee", v)} />
        </div>
      </Section>

      {/* === Kart 9: Satış Saatleri Yoğunluğu (İlçe/Bölge) === */}
      <Section
        title={`⑨ Satış Saatleri Yoğunluğu (${scopeType === "district" ? "İlçe" : "Mahalle"})`}
        subtitle="Tıklayarak her hücrenin yoğunluğunu artır — 0 → 25 → 50 → 75 → 100"
      >
        <HeatmapEditor
          value={metrics.hourly_heatmap}
          onChange={(matrix) => updMetric("hourly_heatmap", matrix)}
          note="Bu kart bölge bazlı agregat veri — KVKK riski yok. Restoran-bazlı heatmap kişisel veri içerdiği için ayrıca girilmesi önerilmez."
        />
      </Section>

      {/* === Kart 10: Bölge Kurye Karşılaştırması === */}
      <Section
        title={`⑩ Kurye Karşılaştırması (${scopeType === "district" ? "İlçe" : "Mahalle"})`}
        subtitle="Restoran kuryesi vs kendi kuryen — performans/maliyet karşılaştırması"
      >
        <CourierComparisonEditor
          value={metrics.courier_comparison}
          onChange={(v) => updMetric("courier_comparison", v)}
        />
      </Section>

      {/* === Kart 11: Yorum Analizi === */}
      <Section title="⑪ Yorum Analizi" subtitle="Olumsuz yorum toplam/oran + 3 dağılım">
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <NumField label="Olumsuz yorum adedi" value={metrics.negative_comment_total} onChange={(v) => updMetric("negative_comment_total", v)} />
          <NumField label="Olumsuz yorum %" min={0} max={100} step={0.1} value={metrics.negative_comment_rate} onChange={(v) => updMetric("negative_comment_rate", v)} />
          <NumField label="Olumsuz ort. puan" min={0} max={5} step={0.1} value={metrics.negative_avg_rating} onChange={(v) => updMetric("negative_avg_rating", v)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <JsonField label="Platform olumsuz yorum dağılımı" placeholder='[{"platform_id":1,"percent":42.9}]' rows={3} value={metrics.platform_negative_distribution_json} onChange={(v) => updMetric("platform_negative_distribution_json", v)} />
          <JsonField label="Puan dağılımı" placeholder='[{"stars":5,"percent":25,"count":500}]' rows={3} value={metrics.rating_distribution_json} onChange={(v) => updMetric("rating_distribution_json", v)} />
          <JsonField label="Şikayet kelime bulutu" placeholder='[{"text":"Soğuk","weight":5}]' rows={3} value={metrics.negative_word_cloud_json} onChange={(v) => updMetric("negative_word_cloud_json", v)} />
        </div>
      </Section>

      {/* Sticky bottom save */}
      <div className="fixed bottom-0 left-60 right-0 bg-base-100 border-t border-base-200 px-6 py-3 shadow-lg z-20">
        <div className="max-w-screen-xl mx-auto flex justify-between items-center">
          <div className="text-xs opacity-70">
            {scopeReady
              ? `${scopeType === "district" ? "İlçe" : "Mahalle"} kapsamında — ${categoryId ? "kategori filtresi var" : "tüm kategoriler"} — dönem: ${periodDate}`
              : "Kapsam seç (ilçe gerekli)"}
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving || !scopeReady}>
            {saving ? "Kaydediliyor…" : "Hepsini Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body py-4">
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-xs opacity-60 -mt-1 mb-2">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, min, max, step }) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs opacity-70">{label}</span>}
      <input
        type="number"
        className="input input-bordered input-sm"
        value={value ?? 0}
        min={min}
        max={max}
        step={step ?? "any"}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function JsonField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-xs opacity-70">{label}</span>}
      <textarea
        className="textarea textarea-bordered textarea-xs font-mono"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
