import { useEffect, useState } from "react";
import { analyticsApi } from "../../api/analytics";
import { districtsApi } from "../../api/districts";
import { categoriesApi } from "../../api/categories";
import { platformsApi } from "../../api/platforms";
import { useToast } from "../ui/Toast";
import { CsvExportButton, CsvImportButton } from "../ui/CsvButtons";

export default function CompetitorAnalyticsTab() {
  const toast = useToast();
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);

  const [districtId, setDistrictId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [periodDate, setPeriodDate] = useState(new Date().toISOString().slice(0, 7) + "-01");

  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const [d, c, p] = await Promise.all([
        districtsApi.list(), categoriesApi.list(), platformsApi.list(),
      ]);
      setDistricts(d); setCategories(c); setPlatforms(p);
    })();
  }, []);

  useEffect(() => {
    if (platforms.length && rows.length === 0) {
      setRows(platforms.map((p) => ({
        platform_id: p.id, name: p.name,
        min_basket: 0, avg_rating: 0, monthly_revenue: 0,
        delivery_type: "platform", discount_rate: 0, coupon_rate: 0,
      })));
    }
  }, [platforms, rows.length]);

  const fetchExisting = async () => {
    if (!districtId) return;
    try {
      const data = await analyticsApi.competitors.list({ district_id: districtId, period_date: periodDate });
      const filtered = data.filter((r) => categoryId ? r.category_id == categoryId : r.category_id == null);
      const byPlatform = new Map(filtered.map((r) => [r.platform_id, r]));
      setRows(platforms.map((p) => {
        const e = byPlatform.get(p.id);
        return {
          platform_id: p.id, name: p.name,
          min_basket: e?.min_basket ?? 0,
          avg_rating: e?.avg_rating ?? 0,
          monthly_revenue: e?.monthly_revenue ?? 0,
          delivery_type: e?.delivery_type ?? "platform",
          discount_rate: e?.discount_rate ?? 0,
          coupon_rate: e?.coupon_rate ?? 0,
        };
      }));
    } catch (e) {
      toast.push(e.message, "error");
    }
  };

  const setField = (pid, field, value) => {
    setRows((rs) => rs.map((r) => r.platform_id === pid ? { ...r, [field]: value } : r));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!districtId) { toast.push("İlçe seçmelisin", "warning"); return; }
    try {
      const payload = {
        district_id: districtId,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        period_date: periodDate,
        competitors: rows.map((r) => ({
          platform_id: r.platform_id,
          min_basket: parseFloat(r.min_basket || "0"),
          avg_rating: parseFloat(r.avg_rating || "0"),
          monthly_revenue: parseFloat(r.monthly_revenue || "0"),
          delivery_type: r.delivery_type,
          discount_rate: parseFloat(r.discount_rate || "0"),
          coupon_rate: parseFloat(r.coupon_rate || "0"),
        })),
      };
      const res = await analyticsApi.competitors.upsert(payload);
      toast.push(`Kaydedildi (${res.records_affected} kayıt)`, "success");
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Rakip Analiz</h3>
            <div className="flex gap-2">
              <CsvImportButton onImport={analyticsApi.competitors.importCsv} />
              <CsvExportButton onExport={analyticsApi.competitors.exportCsv} filename="competitors.csv" />
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
                <option value="">Tümü</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Dönem</span></label>
              <input type="date" className="input input-bordered" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button className="btn btn-sm btn-ghost" onClick={fetchExisting} disabled={!districtId}>Mevcut yükle</button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={save}>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Min. Sepet (₺)</th>
                    <th>Puan</th>
                    <th>Aylık Ciro (₺)</th>
                    <th>Teslimat</th>
                    <th>İndirim (%)</th>
                    <th>Kupon (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.platform_id}>
                      <td>{r.name}</td>
                      <td><input type="number" step="0.01" className="input input-bordered input-xs w-24" value={r.min_basket} onChange={(e) => setField(r.platform_id, "min_basket", e.target.value)} /></td>
                      <td><input type="number" step="0.01" className="input input-bordered input-xs w-20" value={r.avg_rating} onChange={(e) => setField(r.platform_id, "avg_rating", e.target.value)} /></td>
                      <td><input type="number" step="0.01" className="input input-bordered input-xs w-28" value={r.monthly_revenue} onChange={(e) => setField(r.platform_id, "monthly_revenue", e.target.value)} /></td>
                      <td>
                        <select className="select select-bordered select-xs" value={r.delivery_type} onChange={(e) => setField(r.platform_id, "delivery_type", e.target.value)}>
                          <option value="platform">Platform</option>
                          <option value="own">Kendi</option>
                        </select>
                      </td>
                      <td><input type="number" step="0.01" className="input input-bordered input-xs w-20" value={r.discount_rate} onChange={(e) => setField(r.platform_id, "discount_rate", e.target.value)} /></td>
                      <td><input type="number" step="0.01" className="input input-bordered input-xs w-20" value={r.coupon_rate} onChange={(e) => setField(r.platform_id, "coupon_rate", e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="submit" className="btn btn-primary mt-3 w-fit">Kaydet</button>
          </div>
        </div>
      </form>
    </div>
  );
}
