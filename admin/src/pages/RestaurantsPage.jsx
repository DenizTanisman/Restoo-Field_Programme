import { useEffect, useState } from "react";
import { restaurantsApi } from "../api/restaurants";
import { categoriesApi } from "../api/categories";
import { districtsApi } from "../api/districts";
import { platformsApi } from "../api/platforms";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { CsvExportButton, CsvImportButton } from "../components/ui/CsvButtons";
import { useToast } from "../components/ui/Toast";
import HeatmapEditor from "../components/ui/HeatmapEditor";
import CourierComparisonEditor from "../components/ui/CourierComparisonEditor";

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
  // JSON alanlar — string olarak tutulur, submit'te parse edilir
  cancel_reasons_json: "[]",
  return_reasons_json: "[]",
  hourly_heatmap: EMPTY_HEATMAP,             // object — HeatmapEditor kullanıyor
  platform_negative_distribution_json: "[]",
  rating_distribution_json: "[]",
  negative_word_cloud_json: "[]",
  courier_comparison: EMPTY_COURIER,         // object — CourierComparisonEditor kullanıyor
};

const EMPTY = {
  name: "", district_id: "", neighborhood_id: "", category_id: "", is_active: true,
  platforms: [],
  metrics: { ...EMPTY_METRICS },
  // analytics: platform_id -> { ad_budget, rates..., forecasts... }
  analytics_by_platform: {},
};

export default function RestaurantsPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [list, setList] = useState({ total: 0, data: [] });
  const [loading, setLoading] = useState(true);

  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]); // form için mahalleler (form.district_id'ye bağlı)
  const [neighLoading, setNeighLoading] = useState(false);
  const [dataPresence, setDataPresence] = useState(null); // { district: {...}, neighborhood: {...} }

  const [editing, setEditing] = useState(null);
  const [openingEdit, setOpeningEdit] = useState(false); // double-click guard
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null); // soft delete (Pasifleştir)
  const [hardConfirm, setHardConfirm] = useState(null); // { id, name } hard delete (Sil)

  const load = async () => {
    setLoading(true);
    try {
      const res = await restaurantsApi.list({
        page,
        limit,
        search: search || undefined,
        district_id: districtFilter || undefined,
        category_id: categoryFilter || undefined,
      });
      setList(res);
    } catch (e) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  useEffect(() => {
    (async () => {
      try {
        const [d, c, p] = await Promise.all([
          districtsApi.list(),
          categoriesApi.list(),
          platformsApi.list(),
        ]);
        setDistricts(d);
        setCategories(c);
        setPlatforms(p);
      } catch (e) {
        toast.push(e.message, "error");
      }
    })();
  }, []);

  const applyFilters = (e) => { e?.preventDefault(); setPage(1); load(); };

  const openNew = () => { setForm(EMPTY); setNeighborhoods([]); setEditing("new"); };
  const openEdit = async (r) => {
    if (openingEdit) return;       // double-click guard: aynı anda iki fetch atma
    setOpeningEdit(true);
    // Detay endpoint'inden metrics + analytics dahil hepsini çek
    let detail;
    try {
      detail = await restaurantsApi.getDetail(r.id);
    } catch (err) {
      toast.push(err.message, "error");
      setOpeningEdit(false);
      return;
    }
    const m = detail.metrics;
    const analyticsByPlatform = {};
    (detail.analytics || []).forEach((a) => { analyticsByPlatform[a.platform_id] = a; });
    setForm({
      name: detail.name,
      district_id: detail.district_id,
      neighborhood_id: detail.neighborhood_id ?? "",
      category_id: detail.category_id ?? "",
      is_active: detail.is_active ?? true,
      platforms: (detail.platforms || []).map((p) => ({
        platform_id: platforms.find((pl) => pl.name === p.name)?.id,
        customers: p.customers,
      })).filter((p) => p.platform_id),
      metrics: m ? {
        cancel_rate: m.cancel_rate || 0,
        return_rate: m.return_rate || 0,
        area_performance_score: m.area_performance_score || 0,
        area_rating: m.area_rating || 0,
        highest_rating: m.highest_rating || 0,
        lowest_rating: m.lowest_rating || 0,
        avg_basket: m.avg_basket || 0,
        avg_menu_price: m.avg_menu_price || 0,
        avg_monthly_revenue: m.avg_monthly_revenue || 0,
        courier_fee: m.courier_fee || 0,
        negative_comment_total: m.negative_comment_total || 0,
        negative_comment_rate: m.negative_comment_rate || 0,
        negative_avg_rating: m.negative_avg_rating || 0,
        cancel_reasons_json: JSON.stringify(m.cancel_reasons || [], null, 2),
        return_reasons_json: JSON.stringify(m.return_reasons || [], null, 2),
        hourly_heatmap: Array.isArray(m.hourly_heatmap) && m.hourly_heatmap.length === 7 ? m.hourly_heatmap : EMPTY_HEATMAP,
        platform_negative_distribution_json: JSON.stringify(m.platform_negative_distribution || [], null, 2),
        rating_distribution_json: JSON.stringify(m.rating_distribution || [], null, 2),
        negative_word_cloud_json: JSON.stringify(m.negative_word_cloud || [], null, 2),
        courier_comparison: m.courier_comparison && typeof m.courier_comparison === "object" ? { ...EMPTY_COURIER, ...m.courier_comparison } : EMPTY_COURIER,
      } : { ...EMPTY_METRICS },
      analytics_by_platform: analyticsByPlatform,
    });
    setEditing(r.id);
    setOpeningEdit(false);
  };
  const close = () => setEditing(null);

  // Form içinde district değiştikçe mahalleler dinamik yüklensin
  useEffect(() => {
    if (editing === null || !form.district_id) {
      setNeighborhoods([]);
      return;
    }
    let alive = true;
    setNeighLoading(true);
    districtsApi
      .listNeighborhoods(form.district_id)
      .then((data) => { if (alive) setNeighborhoods(data); })
      .catch(() => { if (alive) setNeighborhoods([]); })
      .finally(() => { if (alive) setNeighLoading(false); });
    return () => { alive = false; };
  }, [form.district_id, editing]);

  // Form değiştikçe data-presence kontrolü (district + opsiyonel neighborhood + category)
  useEffect(() => {
    if (editing === null || !form.district_id || !form.category_id) {
      setDataPresence(null);
      return;
    }
    let alive = true;
    restaurantsApi
      .dataPresence({
        district_id: form.district_id,
        neighborhood_id: form.neighborhood_id || undefined,
        category_id: form.category_id,
      })
      .then((res) => { if (alive) setDataPresence(res); })
      .catch(() => { if (alive) setDataPresence(null); });
    return () => { alive = false; };
  }, [form.district_id, form.neighborhood_id, form.category_id, editing]);

  const togglePlatform = (platformId, checked) => {
    setForm((f) => {
      if (checked) {
        return { ...f, platforms: [...f.platforms, { platform_id: platformId, customers: 0 }] };
      }
      return { ...f, platforms: f.platforms.filter((p) => p.platform_id !== platformId) };
    });
  };

  const setPlatformCustomers = (platformId, raw) => {
    // Sadece rakam kabul et + baştaki sıfırları temizle (tek "0" hariç)
    const digits = String(raw).replace(/\D/g, "");
    const cleaned = digits.replace(/^0+(?=\d)/, "");
    const num = cleaned === "" ? 0 : parseInt(cleaned, 10);
    setForm((f) => ({
      ...f,
      platforms: f.platforms.map((p) =>
        p.platform_id === platformId ? { ...p, customers: num } : p
      ),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      // Metrics payload — formdaki değerler her zaman gönderilir.
      // Hepsi 0/boşsa cascade endpoint zaten _is_set ile boş sayar ve fallback'e düşer.
      let metricsPayload;
      try {
        const m = form.metrics;
        metricsPayload = {
          cancel_rate: Number(m.cancel_rate) || 0,
          return_rate: Number(m.return_rate) || 0,
          cancel_reasons: JSON.parse(m.cancel_reasons_json || "[]"),
          return_reasons: JSON.parse(m.return_reasons_json || "[]"),
          area_performance_score: Number(m.area_performance_score) || 0,
          area_rating: Number(m.area_rating) || 0,
          highest_rating: Number(m.highest_rating) || 0,
          lowest_rating: Number(m.lowest_rating) || 0,
          avg_basket: Number(m.avg_basket) || 0,
          avg_menu_price: Number(m.avg_menu_price) || 0,
          avg_monthly_revenue: Number(m.avg_monthly_revenue) || 0,
          courier_fee: Number(m.courier_fee) || 0,
          hourly_heatmap: Array.isArray(m.hourly_heatmap) ? m.hourly_heatmap : EMPTY_HEATMAP,
          negative_comment_total: parseInt(m.negative_comment_total, 10) || 0,
          negative_comment_rate: Number(m.negative_comment_rate) || 0,
          negative_avg_rating: Number(m.negative_avg_rating) || 0,
          platform_negative_distribution: JSON.parse(m.platform_negative_distribution_json || "[]"),
          rating_distribution: JSON.parse(m.rating_distribution_json || "[]"),
          negative_word_cloud: JSON.parse(m.negative_word_cloud_json || "[]"),
          courier_comparison: m.courier_comparison && typeof m.courier_comparison === "object" ? m.courier_comparison : EMPTY_COURIER,
        };
      } catch (err) {
        toast.push("Metrik JSON alanlarında geçersiz format: " + err.message, "error");
        return;
      }
      // Analytics payload — sadece kullanıcının seçtiği platformlar için gönderilir
      // (eğer hepsi 0 ise yine de gönderilir; cascade endpoint boş kabul edip fallback'e düşer)
      const analyticsPayload = form.platforms.map((pl) => {
        const a = form.analytics_by_platform[pl.platform_id] || {};
        return {
          platform_id: pl.platform_id,
          ad_budget: Number(a.ad_budget) || 0,
          campaign_rate: Number(a.campaign_rate) || 0,
          coupon_rate: Number(a.coupon_rate) || 0,
          flash_rate: Number(a.flash_rate) || 0,
          joker_rate: Number(a.joker_rate) || 0,
          daily_forecast: Number(a.daily_forecast) || 0,
          monthly_forecast: Number(a.monthly_forecast) || 0,
          yearly_forecast: Number(a.yearly_forecast) || 0,
        };
      });

      const payload = {
        name: form.name,
        district_id: form.district_id,
        neighborhood_id: form.neighborhood_id ? parseInt(form.neighborhood_id, 10) : null,
        category_id: parseInt(form.category_id, 10),
        is_active: form.is_active,
        platforms: form.platforms,
        metrics: metricsPayload,
        analytics: analyticsPayload,
      };
      if (editing === "new") {
        await restaurantsApi.create(payload);
        toast.push("Restoran eklendi", "success");
      } else {
        await restaurantsApi.update(editing, payload);
        toast.push("Restoran güncellendi", "success");
      }
      close();
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const remove = async () => {
    try {
      await restaurantsApi.remove(confirmId);
      toast.push("Restoran pasifleştirildi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setConfirmId(null);
    }
  };

  const hardRemove = async () => {
    if (!hardConfirm) return;
    try {
      await restaurantsApi.hardRemove(hardConfirm.id);
      toast.push("Restoran kalıcı olarak silindi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setHardConfirm(null);
    }
  };

  // Pasif → Aktif: hafif PATCH (diğer alanlara dokunmaz)
  const reactivate = async (id) => {
    try {
      await restaurantsApi.setActive(id, true);
      toast.push("Restoran aktifleştirildi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(list.total / limit));

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="flex justify-between items-center mb-2">
            <h2 className="card-title">Restoranlar</h2>
            <div className="flex gap-2">
              <CsvImportButton onImport={restaurantsApi.importCsv} />
              <CsvExportButton onExport={restaurantsApi.exportCsv} filename="restaurants.csv" />
              <button className="btn btn-sm btn-primary" onClick={openNew}>+ Yeni Restoran</button>
            </div>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2" onSubmit={applyFilters}>
            <div>
              <label className="label label-text">Arama</label>
              <input className="input input-bordered input-sm w-full" placeholder="Restoran adı" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="label label-text">İlçe</label>
              <select className="select select-bordered select-sm w-full" value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>
                <option value="">Tümü</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label label-text">Kategori</label>
              <select className="select select-bordered select-sm w-full" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">Tümü</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn btn-sm btn-primary">Filtrele</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          {loading ? <span className="loading loading-spinner" /> : (
            <DataTable
              columns={[
                { key: "id", label: "ID" },
                { key: "name", label: "Ad" },
                { key: "district_name", label: "İlçe" },
                {
                  key: "neighborhood_name",
                  label: "Mahalle",
                  render: (r) => r.neighborhood_name || "—",
                },
                {
                  key: "category",
                  label: "Kategori",
                  render: (r) => `${r.category_emoji} ${r.category_label}`,
                },
                {
                  key: "platforms",
                  label: "Platform",
                  render: (r) => r.platforms.length,
                },
                {
                  key: "is_active",
                  label: "Durum",
                  render: (r) => (
                    <span className={`badge badge-sm ${r.is_active ? "badge-success badge-soft" : "badge-ghost"}`}>
                      {r.is_active ? "Aktif" : "Pasif"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "İşlem",
                  render: (r) => (
                    <div className="flex gap-1">
                      <button className="btn btn-xs btn-soft" onClick={() => openEdit(r)} disabled={openingEdit}>
                        {openingEdit ? "…" : "Düzenle"}
                      </button>
                      {r.is_active ? (
                        <button className="btn btn-xs btn-warning btn-soft" onClick={() => setConfirmId(r.id)}>Pasifleştir</button>
                      ) : (
                        <button className="btn btn-xs btn-success btn-soft" onClick={() => reactivate(r.id)}>Aktifleştir</button>
                      )}
                      <button className="btn btn-xs btn-error btn-soft" onClick={() => setHardConfirm({ id: r.id, name: r.name })}>Sil</button>
                    </div>
                  ),
                },
              ]}
              data={list.data}
              emptyText="Henüz restoran yok"
            />
          )}
          <div className="flex justify-between items-center mt-3 text-sm">
            <span>Toplam {list.total} kayıt · Sayfa {page} / {totalPages}</span>
            <div className="join">
              <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
              <button className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          </div>
        </div>
      </div>

      <FormModal open={editing !== null} title={editing === "new" ? "Yeni Restoran" : "Restoran Düzenle"} onClose={close} size="lg">
        <form onSubmit={save} className="space-y-3">
          {dataPresence && form.district_id && form.category_id && (() => {
            const districtMissing = !dataPresence.district.any;
            const neighborhoodSelected = !!form.neighborhood_id;
            const neighborhoodMissing = neighborhoodSelected && !dataPresence.neighborhood.any;
            // Hangi durumda mesaj gösterilecek
            if (!districtMissing && !neighborhoodMissing) return null;
            let msg = "";
            if (districtMissing && neighborhoodMissing) {
              msg = "Bu restoranın bulunduğu ilçe VE mahalle için Analytics/Metrics kaydı yok. Ana sayfa boş görünecek.";
            } else if (districtMissing) {
              msg = "Bu restoranın bulunduğu ilçe için Analytics/Metrics kaydı yok. (Mahalleye veri girersen oradan beslenir.)";
            } else if (neighborhoodMissing) {
              msg = "Bu mahalle için kayıt yok ama ilçenin var — fallback ile ilçe verisi gösterilecek.";
            }
            const severity = districtMissing ? "warning" : "info";
            return (
              <div className={`alert alert-${severity} text-sm`}>
                <span>{msg} Veri girişi için: Admin → <code>Analytics</code> / <code>Metrics</code>.</span>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">Ad</span></label>
              <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">İlçe</span></label>
              <select
                className="select select-bordered"
                value={form.district_id}
                onChange={(e) => setForm({ ...form, district_id: e.target.value, neighborhood_id: "" })}
                required
              >
                <option value="">Seç...</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Mahalle</span>
                {neighLoading && <span className="text-xs opacity-60">yükleniyor…</span>}
              </label>
              <select
                className="select select-bordered"
                value={form.neighborhood_id}
                onChange={(e) => setForm({ ...form, neighborhood_id: e.target.value })}
                disabled={!form.district_id || neighLoading}
              >
                <option value="">— Mahallesiz —</option>
                {neighborhoods.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Kategori</span></label>
              <select className="select select-bordered" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Seç...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <label className="label cursor-pointer">
              <span className="label-text">Aktif</span>
              <input type="checkbox" className="toggle toggle-primary" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            </label>
          </div>

          <div>
            <label className="label"><span className="label-text">Platformlar (Müşteri Dağılımı)</span></label>
            <div className="space-y-2">
              {platforms.map((p) => {
                const selected = form.platforms.find((x) => x.platform_id === p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={!!selected}
                      onChange={(e) => togglePlatform(p.id, e.target.checked)}
                    />
                    <span className="w-32">{p.name}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="input input-bordered input-sm w-32"
                      disabled={!selected}
                      placeholder="Müşteri"
                      value={selected ? String(selected.customers) : ""}
                      onChange={(e) => setPlatformCustomers(p.id, e.target.value)}
                    />
                  </div>
                );
              })}
              {platforms.length === 0 && <p className="text-sm opacity-60">Önce platform ekleyin</p>}
            </div>
          </div>

          {/* === Restoran-bazlı Analytics Override (per platform: budget + forecast) === */}
          <div className="collapse collapse-arrow collapse-open border border-base-300">
            <div className="collapse-title text-sm font-medium">
              Kampanya & Katılım + Tahmini Satış (per platform) — restoran özel
            </div>
            <div className="collapse-content">
              <p className="text-xs opacity-60 mb-3">
                Bu bölüm <b>opsiyonel</b>. Doldurursan ana sayfa restoranı için bu değerler gösterilir; boş bırakırsan mahalle/ilçe verisinden cascade ile çekilir.
              </p>
              {form.platforms.length === 0 && <p className="text-xs opacity-60">Önce yukarıdan platform seç.</p>}
              {form.platforms.map((pl) => {
                const platform = platforms.find((pp) => pp.id === pl.platform_id);
                const a = form.analytics_by_platform[pl.platform_id] || {};
                const upd = (k, v) => setForm((f) => ({
                  ...f,
                  analytics_by_platform: { ...f.analytics_by_platform, [pl.platform_id]: { ...(f.analytics_by_platform[pl.platform_id] || {}), [k]: v } },
                }));
                return (
                  <div key={pl.platform_id} className="border-t border-base-300 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                    <h4 className="font-medium text-sm mb-2">{platform?.name || `Platform ${pl.platform_id}`}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <label className="flex flex-col gap-1"><span>Reklam Bütçesi</span><input type="number" min="0" className="input input-bordered input-xs" value={a.ad_budget ?? 0} onChange={(e) => upd("ad_budget", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Kampanya Katılım %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={a.campaign_rate ?? 0} onChange={(e) => upd("campaign_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Kupon Katılım %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={a.coupon_rate ?? 0} onChange={(e) => upd("coupon_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Flash Katılım %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={a.flash_rate ?? 0} onChange={(e) => upd("flash_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Joker Katılım %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={a.joker_rate ?? 0} onChange={(e) => upd("joker_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Günlük tahmini</span><input type="number" min="0" className="input input-bordered input-xs" value={a.daily_forecast ?? 0} onChange={(e) => upd("daily_forecast", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Aylık tahmini</span><input type="number" min="0" className="input input-bordered input-xs" value={a.monthly_forecast ?? 0} onChange={(e) => upd("monthly_forecast", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Yıllık tahmini</span><input type="number" min="0" className="input input-bordered input-xs" value={a.yearly_forecast ?? 0} onChange={(e) => upd("yearly_forecast", e.target.value)} /></label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* === Restoran-bazlı Metrics Override === */}
          <div className="collapse collapse-arrow collapse-open border border-base-300">
            <div className="collapse-title text-sm font-medium">
              Restoran Metrikleri — İptal/İade, Puan, Yorum, Saat Yoğunluğu, Kurye
            </div>
            <div className="collapse-content space-y-3">
              <p className="text-xs opacity-60">
                Bu bölüm <b>opsiyonel</b>. Doldurursan ana sayfada restoran için bu değerler gösterilir; boş bırakırsan mahalle/ilçe metriklerinden cascade ile çekilir.
              </p>
              {(() => {
                const m = form.metrics;
                const updM = (k, v) => setForm((f) => ({ ...f, metrics: { ...f.metrics, [k]: v } }));
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <label className="flex flex-col gap-1"><span>İptal oranı %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={m.cancel_rate} onChange={(e) => updM("cancel_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>İade oranı %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={m.return_rate} onChange={(e) => updM("return_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Performans skoru</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={m.area_performance_score} onChange={(e) => updM("area_performance_score", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Senin puanın</span><input type="number" min="0" max="5" step="0.1" className="input input-bordered input-xs" value={m.area_rating} onChange={(e) => updM("area_rating", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>En yüksek puan</span><input type="number" min="0" max="5" step="0.1" className="input input-bordered input-xs" value={m.highest_rating} onChange={(e) => updM("highest_rating", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>En düşük puan</span><input type="number" min="0" max="5" step="0.1" className="input input-bordered input-xs" value={m.lowest_rating} onChange={(e) => updM("lowest_rating", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Ort. sepet</span><input type="number" min="0" className="input input-bordered input-xs" value={m.avg_basket} onChange={(e) => updM("avg_basket", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Ort. menü fiyatı</span><input type="number" min="0" className="input input-bordered input-xs" value={m.avg_menu_price} onChange={(e) => updM("avg_menu_price", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Aylık ciro</span><input type="number" min="0" className="input input-bordered input-xs" value={m.avg_monthly_revenue} onChange={(e) => updM("avg_monthly_revenue", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Kurye ücreti</span><input type="number" min="0" className="input input-bordered input-xs" value={m.courier_fee} onChange={(e) => updM("courier_fee", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Olumsuz yorum adedi</span><input type="number" min="0" className="input input-bordered input-xs" value={m.negative_comment_total} onChange={(e) => updM("negative_comment_total", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Olumsuz yorum %</span><input type="number" min="0" max="100" step="0.1" className="input input-bordered input-xs" value={m.negative_comment_rate} onChange={(e) => updM("negative_comment_rate", e.target.value)} /></label>
                      <label className="flex flex-col gap-1"><span>Olumsuz ort. puan</span><input type="number" min="0" max="5" step="0.1" className="input input-bordered input-xs" value={m.negative_avg_rating} onChange={(e) => updM("negative_avg_rating", e.target.value)} /></label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-2">
                      <label className="flex flex-col gap-1">
                        <span>İptal sebepleri (JSON)</span>
                        <textarea className="textarea textarea-bordered textarea-xs font-mono" rows={3} value={m.cancel_reasons_json} onChange={(e) => updM("cancel_reasons_json", e.target.value)} placeholder='[{"label":"Geç","percent":60,"color":"#EE4444"}]' />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>İade sebepleri (JSON)</span>
                        <textarea className="textarea textarea-bordered textarea-xs font-mono" rows={3} value={m.return_reasons_json} onChange={(e) => updM("return_reasons_json", e.target.value)} placeholder='[{"label":"Soğuk","percent":50,"color":"#EE4444"}]' />
                      </label>
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium">Satış saatleri yoğunluğu (Restoran)</span>
                          <span className="badge badge-warning badge-xs">⚠ KVKK</span>
                        </div>
                        <HeatmapEditor
                          value={m.hourly_heatmap}
                          onChange={(matrix) => updM("hourly_heatmap", matrix)}
                          note="Restoran-bazlı saat yoğunluğu kişisel veri sayılabilir (KVKK). Tercihen ilçe/mahalle düzeyinde Veri Girişi sayfasından girin; bu alan boş kalırsa cascade ile oradan beslenir."
                        />
                      </div>
                      <label className="flex flex-col gap-1">
                        <span>Platform olumsuz yorum dağılımı (JSON)</span>
                        <textarea className="textarea textarea-bordered textarea-xs font-mono" rows={3} value={m.platform_negative_distribution_json} onChange={(e) => updM("platform_negative_distribution_json", e.target.value)} placeholder='[{"platform_id":1,"percent":42}]' />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>Puan dağılımı (JSON)</span>
                        <textarea className="textarea textarea-bordered textarea-xs font-mono" rows={3} value={m.rating_distribution_json} onChange={(e) => updM("rating_distribution_json", e.target.value)} placeholder='[{"stars":5,"percent":25,"count":500}]' />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>Şikayet kelime bulutu (JSON)</span>
                        <textarea className="textarea textarea-bordered textarea-xs font-mono" rows={3} value={m.negative_word_cloud_json} onChange={(e) => updM("negative_word_cloud_json", e.target.value)} placeholder='[{"text":"Soğuk","weight":5}]' />
                      </label>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-medium mb-2">Senin Kuryen — restoran kuryesi vs kendi kuryen</div>
                      <CourierComparisonEditor
                        value={m.courier_comparison}
                        onChange={(v) => updM("courier_comparison", v)}
                      />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={close}>İptal</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        message="Bu restoranı pasifleştirmek istediğine emin misin? (Geri alınabilir — kayıt korunur, sadece is_active=false yapılır.)"
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmDialog
        open={hardConfirm !== null}
        title="Kalıcı silme — geri alınamaz!"
        message={
          hardConfirm
            ? `"${hardConfirm.name}" restoranını VERİTABANINDAN SİLECEKSİN. Tüm platform bağlantıları da silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musun?`
            : ""
        }
        confirmText="Evet, kalıcı sil"
        onConfirm={hardRemove}
        onCancel={() => setHardConfirm(null)}
      />
    </div>
  );
}
