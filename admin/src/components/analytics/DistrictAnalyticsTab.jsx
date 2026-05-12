import { useEffect, useState } from "react";
import { analyticsApi } from "../../api/analytics";
import { districtsApi } from "../../api/districts";
import { categoriesApi } from "../../api/categories";
import { platformsApi } from "../../api/platforms";
import { useToast } from "../ui/Toast";
import { CsvExportButton, CsvImportButton } from "../ui/CsvButtons";

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyBudget = { ad_budget: 0, campaign_rate: 0, coupon_rate: 0, flash_rate: 0, joker_rate: 0 };

export default function DistrictAnalyticsTab() {
  const toast = useToast();
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  const [districtId, setDistrictId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [periodDate, setPeriodDate] = useState(todayISO().slice(0, 7) + "-01");

  const [platformRows, setPlatformRows] = useState([]);
  const [budget, setBudget] = useState(emptyBudget);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, c, p] = await Promise.all([
        districtsApi.list(),
        categoriesApi.list(),
        platformsApi.list(),
      ]);
      setDistricts(d);
      setCategories(c);
      setPlatforms(p);
    })();
  }, []);

  useEffect(() => {
    if (platforms.length && platformRows.length === 0) {
      setPlatformRows(
        platforms.map((p) => ({
          platform_id: p.id,
          name: p.name,
          color_hex: p.color_hex,
          customers: 0,
          daily_forecast: 0,
          monthly_forecast: 0,
          yearly_forecast: 0,
        }))
      );
    }
  }, [platforms, platformRows.length]);

  const fetchExisting = async () => {
    if (!districtId || !periodDate) return;
    setLoading(true);
    try {
      const rows = await analyticsApi.district.list({ district_id: districtId, period_date: periodDate });
      const byPlatform = new Map(rows.filter((r) => (categoryId ? r.category_id == categoryId : r.category_id == null)).map((r) => [r.platform_id, r]));
      if (byPlatform.size === 0) {
        setPlatformRows(platforms.map((p) => ({
          platform_id: p.id,
          name: p.name,
          color_hex: p.color_hex,
          customers: 0,
          daily_forecast: 0,
          monthly_forecast: 0,
          yearly_forecast: 0,
        })));
        setBudget(emptyBudget);
        return;
      }
      const first = [...byPlatform.values()][0];
      setBudget({
        ad_budget: first.ad_budget,
        campaign_rate: first.campaign_rate,
        coupon_rate: first.coupon_rate,
        flash_rate: first.flash_rate,
        joker_rate: first.joker_rate,
      });
      setPlatformRows(platforms.map((p) => {
        const existing = byPlatform.get(p.id);
        return {
          platform_id: p.id,
          name: p.name,
          color_hex: p.color_hex,
          customers: existing?.customers ?? 0,
          daily_forecast: existing?.daily_forecast ?? 0,
          monthly_forecast: existing?.monthly_forecast ?? 0,
          yearly_forecast: existing?.yearly_forecast ?? 0,
        };
      }));
    } catch (e) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!districtId) {
      toast.push("İlçe seçmelisin", "warning");
      return;
    }
    try {
      const payload = {
        district_id: districtId,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        period_date: periodDate,
        platform_analytics: platformRows.map(({ platform_id, customers, daily_forecast, monthly_forecast, yearly_forecast }) => ({
          platform_id,
          customers: parseInt(customers || "0", 10),
          daily_forecast: parseFloat(daily_forecast || "0"),
          monthly_forecast: parseFloat(monthly_forecast || "0"),
          yearly_forecast: parseFloat(yearly_forecast || "0"),
        })),
        budget: {
          ad_budget: parseFloat(budget.ad_budget || "0"),
          campaign_rate: parseFloat(budget.campaign_rate || "0"),
          coupon_rate: parseFloat(budget.coupon_rate || "0"),
          flash_rate: parseFloat(budget.flash_rate || "0"),
          joker_rate: parseFloat(budget.joker_rate || "0"),
        },
      };
      const res = await analyticsApi.district.upsert(payload);
      toast.push(`Kaydedildi (${res.records_affected} kayıt)`, "success");
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const setPlatformField = (platformId, field, value) => {
    setPlatformRows((rows) => rows.map((r) => r.platform_id === platformId ? { ...r, [field]: value } : r));
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">İlçe Analitik</h3>
            <div className="flex gap-2">
              <CsvImportButton onImport={analyticsApi.district.importCsv} />
              <CsvExportButton onExport={analyticsApi.district.exportCsv} filename="district_analytics.csv" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">İlçe</span></label>
              <select className="select select-bordered" value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                <option value="">Seçin</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Kategori</span></label>
              <select className="select select-bordered" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Tüm kategoriler</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Dönem (Ay başı)</span></label>
              <input type="date" className="input input-bordered" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button className="btn btn-sm btn-ghost" onClick={fetchExisting} disabled={loading}>Mevcut veriyi yükle</button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {platformRows.map((p) => (
            <div key={p.platform_id} className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: p.color_hex || "#888" }} />
                  <h4 className="font-semibold">{p.name}</h4>
                </div>
                <div className="form-control">
                  <label className="label label-text-sm">Müşteri sayısı</label>
                  <input type="number" className="input input-bordered input-sm" value={p.customers} onChange={(e) => setPlatformField(p.platform_id, "customers", e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label label-text-sm">Günlük tahmin (₺)</label>
                  <input type="number" step="0.01" className="input input-bordered input-sm" value={p.daily_forecast} onChange={(e) => setPlatformField(p.platform_id, "daily_forecast", e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label label-text-sm">Aylık tahmin (₺)</label>
                  <input type="number" step="0.01" className="input input-bordered input-sm" value={p.monthly_forecast} onChange={(e) => setPlatformField(p.platform_id, "monthly_forecast", e.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label label-text-sm">Yıllık tahmin (₺)</label>
                  <input type="number" step="0.01" className="input input-bordered input-sm" value={p.yearly_forecast} onChange={(e) => setPlatformField(p.platform_id, "yearly_forecast", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          {platformRows.length === 0 && <p className="opacity-60">Önce platform ekleyin</p>}
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h4 className="font-semibold mb-2">Bütçe & Kampanya</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="form-control">
                <label className="label label-text-sm">Reklam Bütçesi (₺)</label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={budget.ad_budget} onChange={(e) => setBudget({ ...budget, ad_budget: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label label-text-sm">Kampanya Katılım (%)</label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={budget.campaign_rate} onChange={(e) => setBudget({ ...budget, campaign_rate: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label label-text-sm">Kupon Oranı (%)</label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={budget.coupon_rate} onChange={(e) => setBudget({ ...budget, coupon_rate: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label label-text-sm">Flash İndirim (%)</label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={budget.flash_rate} onChange={(e) => setBudget({ ...budget, flash_rate: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label label-text-sm">Joker Oranı (%)</label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={budget.joker_rate} onChange={(e) => setBudget({ ...budget, joker_rate: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary">Kaydet</button>
      </form>
    </div>
  );
}
