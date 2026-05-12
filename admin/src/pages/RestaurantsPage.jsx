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

const EMPTY = { name: "", district_id: "", category_id: "", is_active: true, platforms: [] };

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

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);

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

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (r) => {
    setForm({
      name: r.name,
      district_id: r.district_id,
      category_id: categories.find((c) => c.name === r.category_label)?.id ?? "",
      is_active: true, // GET response doesn't include is_active; assume editing means keep active
      platforms: r.platforms.map((p) => ({
        platform_id: platforms.find((pl) => pl.name === p.name)?.id,
        customers: p.customers,
      })).filter((p) => p.platform_id),
    });
    setEditing(r.id);
  };
  const close = () => setEditing(null);

  const togglePlatform = (platformId, checked) => {
    setForm((f) => {
      if (checked) {
        return { ...f, platforms: [...f.platforms, { platform_id: platformId, customers: 0 }] };
      }
      return { ...f, platforms: f.platforms.filter((p) => p.platform_id !== platformId) };
    });
  };

  const setPlatformCustomers = (platformId, customers) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.map((p) =>
        p.platform_id === platformId ? { ...p, customers: parseInt(customers || "0", 10) } : p
      ),
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        district_id: form.district_id,
        category_id: parseInt(form.category_id, 10),
        is_active: form.is_active,
        platforms: form.platforms,
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
                  key: "actions",
                  label: "İşlem",
                  render: (r) => (
                    <div className="flex gap-2">
                      <button className="btn btn-xs" onClick={() => openEdit(r)}>Düzenle</button>
                      <button className="btn btn-xs btn-error" onClick={() => setConfirmId(r.id)}>Pasifleştir</button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label"><span className="label-text">Ad</span></label>
              <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">İlçe</span></label>
              <select className="select select-bordered" value={form.district_id} onChange={(e) => setForm({ ...form, district_id: e.target.value })} required>
                <option value="">Seç...</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            <label className="label"><span className="label-text">Platformlar</span></label>
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
                      type="number"
                      min={0}
                      className="input input-bordered input-sm w-32"
                      disabled={!selected}
                      placeholder="Müşteri"
                      value={selected?.customers ?? ""}
                      onChange={(e) => setPlatformCustomers(p.id, e.target.value)}
                    />
                  </div>
                );
              })}
              {platforms.length === 0 && <p className="text-sm opacity-60">Önce platform ekleyin</p>}
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
        message="Bu restoranı pasifleştirmek istediğine emin misin?"
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
