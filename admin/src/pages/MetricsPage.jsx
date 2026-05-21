import { useEffect, useState } from "react";
import { metricsApi, dataEntryApi } from "../api/analytics";
import { districtsApi } from "../api/districts";
import { categoriesApi } from "../api/categories";
import { platformsApi } from "../api/platforms";
import { useToast } from "../components/ui/Toast";
import { CsvExportButton, CsvImportButton } from "../components/ui/CsvButtons";

const todayMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const DEFAULT_CANCEL_REASONS = [
  { label: "Uzun bekleme", color: "#EE4444", percent: 0 },
  { label: "Yanlış ürün", color: "#A65EEA", percent: 0 },
  { label: "Lezzet", color: "#22CCEE", percent: 0 },
  { label: "Ürün stokta yok", color: "#66DD22", percent: 0 },
  { label: "Diğer", color: "#F99F1B", percent: 0 },
];

const DEFAULT_RETURN_REASONS = [
  { label: "Eksik Malzeme", color: "#EE4444", percent: 0 },
  { label: "Soğuk Geldi", color: "#A65EEA", percent: 0 },
  { label: "Yanlış Sipariş", color: "#22CCEE", percent: 0 },
  { label: "Ambalaj", color: "#F99F1B", percent: 0 },
];

const DEFAULT_RATING_DISTRIBUTION = [
  { stars: 5, percent: 0, count: 0 },
  { stars: 4, percent: 0, count: 0 },
  { stars: 3, percent: 0, count: 0 },
  { stars: 2, percent: 0, count: 0 },
  { stars: 1, percent: 0, count: 0 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const emptyHeatmap = () => Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));

const DEFAULT_COURIER_COMPARISON = {
  restaurant_courier: { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "YÜKSEK" },
  own_courier:        { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "DÜŞÜK" },
};

const initialMetrics = () => ({
  cancel_rate: 0,
  return_rate: 0,
  cancel_reasons: [...DEFAULT_CANCEL_REASONS],
  return_reasons: [...DEFAULT_RETURN_REASONS],
  area_performance_score: 0,
  area_rating: 0,
  highest_rating: 0,
  lowest_rating: 0,
  avg_basket: 0,
  avg_menu_price: 0,
  avg_monthly_revenue: 0,
  courier_fee: 0,
  hourly_heatmap: emptyHeatmap(),
  negative_comment_total: 0,
  negative_comment_rate: 0,
  negative_avg_rating: 0,
  platform_negative_distribution: [],
  rating_distribution: [...DEFAULT_RATING_DISTRIBUTION],
  negative_word_cloud: [],
  courier_comparison: { ...DEFAULT_COURIER_COMPARISON },
});

function ReasonsEditor({ value, onChange, title }) {
  const items = Array.isArray(value) ? value : [];
  const update = (idx, field, v) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: field === "percent" ? Number(v) : v } : it));
    onChange(next);
  };
  const add = () => onChange([...items, { label: "", color: "#888888", percent: 0 }]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-bold uppercase text-slate-500">{title}</h5>
        <button type="button" className="btn btn-xs btn-ghost" onClick={add}>+ Sebep ekle</button>
      </div>
      {items.length === 0 && <p className="text-xs opacity-50">Sebep eklenmedi</p>}
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <input
            className="input input-sm input-bordered col-span-5"
            placeholder="Sebep"
            value={it.label || ""}
            onChange={(e) => update(idx, "label", e.target.value)}
          />
          <input
            type="color"
            className="col-span-1 h-8 w-full"
            value={it.color || "#888888"}
            onChange={(e) => update(idx, "color", e.target.value)}
          />
          <input
            type="number"
            step="0.1"
            className="input input-sm input-bordered col-span-3"
            placeholder="%"
            value={it.percent ?? 0}
            onChange={(e) => update(idx, "percent", e.target.value)}
          />
          <button type="button" className="btn btn-xs btn-ghost text-error col-span-3" onClick={() => remove(idx)}>Sil</button>
        </div>
      ))}
    </div>
  );
}

function RatingDistributionEditor({ value, onChange }) {
  const items = Array.isArray(value) && value.length === 5 ? value : DEFAULT_RATING_DISTRIBUTION;
  const update = (stars, field, v) => {
    const next = items.map((it) => (it.stars === stars ? { ...it, [field]: Number(v) } : it));
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-bold uppercase text-slate-500">Puan Dağılımı</h5>
      {items.map((it) => (
        <div key={it.stars} className="grid grid-cols-12 gap-2 items-center">
          <span className="col-span-2 text-sm font-semibold">{"⭐".repeat(it.stars)}</span>
          <input
            type="number"
            step="0.1"
            className="input input-sm input-bordered col-span-4"
            placeholder="%"
            value={it.percent ?? 0}
            onChange={(e) => update(it.stars, "percent", e.target.value)}
          />
          <input
            type="number"
            className="input input-sm input-bordered col-span-6"
            placeholder="Adet"
            value={it.count ?? 0}
            onChange={(e) => update(it.stars, "count", e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

function PlatformDistributionEditor({ value, onChange, platforms }) {
  const items = Array.isArray(value) ? value : [];
  const upsert = (platform_id, percent) => {
    const next = [...items];
    const idx = next.findIndex((it) => it.platform_id === platform_id);
    if (idx >= 0) next[idx] = { platform_id, percent: Number(percent) };
    else next.push({ platform_id, percent: Number(percent) });
    onChange(next);
  };
  const get = (pid) => items.find((it) => it.platform_id === pid)?.percent ?? 0;
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-bold uppercase text-slate-500">Platform Bazlı Olumsuz Yorum Oranı</h5>
      {platforms.map((p) => (
        <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
          <span className="col-span-3 text-sm">{p.name}</span>
          <input
            type="number"
            step="0.1"
            className="input input-sm input-bordered col-span-3"
            placeholder="%"
            value={get(p.id)}
            onChange={(e) => upsert(p.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

function WordCloudEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const update = (idx, field, v) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: field === "weight" ? Number(v) : v } : it));
    onChange(next);
  };
  const add = () => onChange([...items, { text: "", weight: 1 }]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-bold uppercase text-slate-500">Şikayet Kelimeleri</h5>
        <button type="button" className="btn btn-xs btn-ghost" onClick={add}>+ Kelime ekle</button>
      </div>
      {items.length === 0 && <p className="text-xs opacity-50">Kelime eklenmedi</p>}
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <input
            className="input input-sm input-bordered col-span-7"
            placeholder="Kelime"
            value={it.text || ""}
            onChange={(e) => update(idx, "text", e.target.value)}
          />
          <input
            type="number"
            step="0.1"
            className="input input-sm input-bordered col-span-3"
            placeholder="Ağırlık 0-5"
            value={it.weight ?? 1}
            onChange={(e) => update(idx, "weight", e.target.value)}
          />
          <button type="button" className="btn btn-xs btn-ghost text-error col-span-2" onClick={() => remove(idx)}>Sil</button>
        </div>
      ))}
    </div>
  );
}

function HeatmapEditor({ value, onChange }) {
  const matrix = Array.isArray(value) && value.length === 7 ? value : emptyHeatmap();
  const setCell = (d, h, v) => {
    const next = matrix.map((row, i) => (i === d ? row.map((cell, j) => (j === h ? Number(v) : cell)) : row));
    onChange(next);
  };
  const fillZero = () => onChange(emptyHeatmap());
  return (
    <div className="space-y-2 overflow-x-auto">
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-bold uppercase text-slate-500">Saatlik Yoğunluk (0-100)</h5>
        <button type="button" className="btn btn-xs btn-ghost" onClick={fillZero}>Tümünü sıfırla</button>
      </div>
      <table className="text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="px-1"></th>
            {HOURS.map((h) => <th key={h} className="px-1 font-normal text-slate-400">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, di) => (
            <tr key={day}>
              <td className="px-1 font-semibold text-slate-500">{day}</td>
              {HOURS.map((h) => (
                <td key={h} className="p-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-9 h-6 text-center text-[10px] border border-slate-200"
                    value={matrix[di][h] ?? 0}
                    onChange={(e) => setCell(di, h, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CourierSideEditor({ title, accent, value, onChange }) {
  const v = value || { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "" };
  const update = (field, val) => onChange({ ...v, [field]: field === "churn_label" ? val : Number(val) });
  const ring = accent === "red" ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50";
  const text = accent === "red" ? "text-red-600" : "text-green-600";
  return (
    <div className={`rounded-xl border-2 ${ring} p-4`}>
      <h5 className={`text-sm font-extrabold uppercase mb-3 ${text}`}>{title}</h5>
      <div className="grid grid-cols-2 gap-2">
        <div className="form-control">
          <label className="label label-text-sm">Kurye Ücreti</label>
          <input type="number" step="0.01" className="input input-bordered input-sm" value={v.fee ?? 0} onChange={(e) => update("fee", e.target.value)} />
        </div>
        <div className="form-control">
          <label className="label label-text-sm">Ort. Maliyet</label>
          <input type="number" step="0.01" className="input input-bordered input-sm" value={v.avg_cost ?? 0} onChange={(e) => update("avg_cost", e.target.value)} />
        </div>
        <div className="form-control">
          <label className="label label-text-sm">Aylık Ciro</label>
          <input type="number" step="0.01" className="input input-bordered input-sm" value={v.monthly_revenue ?? 0} onChange={(e) => update("monthly_revenue", e.target.value)} />
        </div>
        <div className="form-control">
          <label className="label label-text-sm">Vazgeçme Etiketi</label>
          <input type="text" className="input input-bordered input-sm" placeholder="YÜKSEK / DÜŞÜK" value={v.churn_label || ""} onChange={(e) => update("churn_label", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, step = "0.01", suffix }) {
  return (
    <div className="form-control">
      <label className="label label-text-sm">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={step}
          className="input input-bordered input-sm w-full"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && <span className="absolute right-2 top-1.5 text-xs opacity-50">{suffix}</span>}
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const toast = useToast();
  const [scope, setScope] = useState("district");
  const [districts, setDistricts] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  const [districtId, setDistrictId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [periodDate, setPeriodDate] = useState(todayMonthStart());

  const [metrics, setMetrics] = useState(initialMetrics());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, c, p] = await Promise.all([districtsApi.list(), categoriesApi.list(), platformsApi.list()]);
      setDistricts(d);
      setCategories(c);
      setPlatforms(p);
    })();
  }, []);

  useEffect(() => {
    if (!districtId) {
      setNeighborhoods([]);
      return;
    }
    districtsApi.listNeighborhoods(districtId).then(setNeighborhoods).catch(() => setNeighborhoods([]));
  }, [districtId]);

  const fetchExisting = async () => {
    setLoading(true);
    try {
      const params = { period_date: periodDate };
      let rows;
      if (scope === "district") {
        if (!districtId) {
          toast.push("İlçe seçin", "warning");
          return;
        }
        rows = await metricsApi.district.list({ ...params, district_id: districtId });
      } else {
        if (!neighborhoodId) {
          toast.push("Mahalle seçin", "warning");
          return;
        }
        rows = await metricsApi.neighborhood.list({ ...params, neighborhood_id: neighborhoodId });
      }
      const match = rows.find((r) => (categoryId ? r.category_id == categoryId : r.category_id == null));
      if (!match) {
        setMetrics(initialMetrics());
        toast.push("Bu döneme ait kayıt yok — boş başladınız", "info");
        return;
      }
      setMetrics({
        cancel_rate: Number(match.cancel_rate || 0),
        return_rate: Number(match.return_rate || 0),
        cancel_reasons: match.cancel_reasons || [...DEFAULT_CANCEL_REASONS],
        return_reasons: match.return_reasons || [...DEFAULT_RETURN_REASONS],
        area_performance_score: Number(match.area_performance_score || 0),
        area_rating: Number(match.area_rating || 0),
        highest_rating: Number(match.highest_rating || 0),
        lowest_rating: Number(match.lowest_rating || 0),
        avg_basket: Number(match.avg_basket || 0),
        avg_menu_price: Number(match.avg_menu_price || 0),
        avg_monthly_revenue: Number(match.avg_monthly_revenue || 0),
        courier_fee: Number(match.courier_fee || 0),
        hourly_heatmap: match.hourly_heatmap?.length === 7 ? match.hourly_heatmap : emptyHeatmap(),
        negative_comment_total: Number(match.negative_comment_total || 0),
        negative_comment_rate: Number(match.negative_comment_rate || 0),
        negative_avg_rating: Number(match.negative_avg_rating || 0),
        platform_negative_distribution: match.platform_negative_distribution || [],
        rating_distribution: match.rating_distribution || [...DEFAULT_RATING_DISTRIBUTION],
        negative_word_cloud: match.negative_word_cloud || [],
        courier_comparison: match.courier_comparison && Object.keys(match.courier_comparison).length > 0
          ? {
              restaurant_courier: { ...DEFAULT_COURIER_COMPARISON.restaurant_courier, ...(match.courier_comparison.restaurant_courier || {}) },
              own_courier: { ...DEFAULT_COURIER_COMPARISON.own_courier, ...(match.courier_comparison.own_courier || {}) },
            }
          : { ...DEFAULT_COURIER_COMPARISON },
      });
    } catch (e) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const base = {
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        period_date: periodDate,
        ...metrics,
      };
      if (scope === "district") {
        if (!districtId) throw new Error("İlçe seçin");
        await metricsApi.district.upsert({ district_id: districtId, ...base });
      } else {
        if (!neighborhoodId) throw new Error("Mahalle seçin");
        await metricsApi.neighborhood.upsert({ neighborhood_id: parseInt(neighborhoodId, 10), ...base });
      }
      toast.push("Kaydedildi", "success");
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const m = metrics;
  const setM = (patch) => setMetrics((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-4">
      <div className="tabs tabs-boxed bg-base-100 inline-flex">
        <button className={`tab ${scope === "district" ? "tab-active" : ""}`} onClick={() => setScope("district")}>İlçe</button>
        <button className={`tab ${scope === "neighborhood" ? "tab-active" : ""}`} onClick={() => setScope("neighborhood")}>Mahalle</button>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Hedef seçimi</h3>
            <div className="flex gap-2">
              <CsvImportButton onImport={(file) => dataEntryApi.importCsv(scope, file)} />
              <CsvExportButton
                onExport={() => dataEntryApi.exportCsv(scope, districtId || undefined)}
                filename={`data_entry_${scope}.csv`}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">İlçe</span></label>
              <select className="select select-bordered select-sm" value={districtId} onChange={(e) => { setDistrictId(e.target.value); setNeighborhoodId(""); }}>
                <option value="">Seçin</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {scope === "neighborhood" && (
              <div className="form-control">
                <label className="label"><span className="label-text">Mahalle</span></label>
                <select className="select select-bordered select-sm" value={neighborhoodId} onChange={(e) => setNeighborhoodId(e.target.value)} disabled={!districtId}>
                  <option value="">Seçin</option>
                  {neighborhoods.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-control">
              <label className="label"><span className="label-text">Kategori</span></label>
              <select className="select select-bordered select-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Tüm kategoriler</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Dönem (Ay başı)</span></label>
              <input type="date" className="input input-bordered input-sm" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button className="btn btn-sm btn-ghost" onClick={fetchExisting} disabled={loading}>Mevcut veriyi yükle</button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-2">Operasyon — İptal & İade</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumberField label="İptal oranı" value={m.cancel_rate} onChange={(v) => setM({ cancel_rate: v })} suffix="%" />
              <NumberField label="İade oranı" value={m.return_rate} onChange={(v) => setM({ return_rate: v })} suffix="%" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
              <ReasonsEditor title="İptal Sebepleri" value={m.cancel_reasons} onChange={(v) => setM({ cancel_reasons: v })} />
              <ReasonsEditor title="İade Sebepleri" value={m.return_reasons} onChange={(v) => setM({ return_reasons: v })} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-2">Skor & Puan</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumberField label="İlçe Performans Skoru" value={m.area_performance_score} onChange={(v) => setM({ area_performance_score: v })} step="1" suffix="/100" />
              <NumberField label="İlçe Ortalama Puanı" value={m.area_rating} onChange={(v) => setM({ area_rating: v })} step="0.1" suffix="/5" />
              <NumberField label="En Yüksek Puan" value={m.highest_rating} onChange={(v) => setM({ highest_rating: v })} step="0.1" suffix="/5" />
              <NumberField label="En Düşük Puan" value={m.lowest_rating} onChange={(v) => setM({ lowest_rating: v })} step="0.1" suffix="/5" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-2">Kıyaslama Metrikleri</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumberField label="Ortalama Sepet" value={m.avg_basket} onChange={(v) => setM({ avg_basket: v })} />
              <NumberField label="Ortalama Menü Fiyatı" value={m.avg_menu_price} onChange={(v) => setM({ avg_menu_price: v })} />
              <NumberField label="Ortalama Aylık Ciro" value={m.avg_monthly_revenue} onChange={(v) => setM({ avg_monthly_revenue: v })} />
              <NumberField label="Kurye Ücreti" value={m.courier_fee} onChange={(v) => setM({ courier_fee: v })} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-2">Saatlik Yoğunluk Heatmap</h4>
            <HeatmapEditor value={m.hourly_heatmap} onChange={(v) => setM({ hourly_heatmap: v })} />
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-3">İş Modeli Kıyaslaması — Kurye Stratejisi</h4>
            <p className="text-xs opacity-60 mb-3">Restoranın kendi kuryesi vs senin özel kurye modelin.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CourierSideEditor
                title="RESTORAN KURYESİ"
                accent="red"
                value={m.courier_comparison?.restaurant_courier}
                onChange={(v) => setM({ courier_comparison: { ...m.courier_comparison, restaurant_courier: v } })}
              />
              <CourierSideEditor
                title="SENİN KURYEN"
                accent="green"
                value={m.courier_comparison?.own_courier}
                onChange={(v) => setM({ courier_comparison: { ...m.courier_comparison, own_courier: v } })}
              />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-2">Yorum Analizi</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberField label="Toplam Olumsuz Yorum" value={m.negative_comment_total} onChange={(v) => setM({ negative_comment_total: v })} step="1" />
              <NumberField label="Olumsuz Yorum Oranı" value={m.negative_comment_rate} onChange={(v) => setM({ negative_comment_rate: v })} suffix="%" />
              <NumberField label="Olumsuz Ortalama Puan" value={m.negative_avg_rating} onChange={(v) => setM({ negative_avg_rating: v })} step="0.1" suffix="/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <PlatformDistributionEditor value={m.platform_negative_distribution} onChange={(v) => setM({ platform_negative_distribution: v })} platforms={platforms} />
              <RatingDistributionEditor value={m.rating_distribution} onChange={(v) => setM({ rating_distribution: v })} />
            </div>
            <div className="mt-4">
              <WordCloudEditor value={m.negative_word_cloud} onChange={(v) => setM({ negative_word_cloud: v })} />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Kaydet</button>
      </form>
    </div>
  );
}
