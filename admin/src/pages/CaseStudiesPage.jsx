import { useEffect, useState } from "react";
import { caseStudiesApi } from "../api/caseStudies";
import { districtsApi } from "../api/districts";
import { categoriesApi } from "../api/categories";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import TagInput from "../components/ui/TagInput";
import { CsvExportButton, CsvImportButton } from "../components/ui/CsvButtons";
import { useToast } from "../components/ui/Toast";

const EMPTY = {
  title: "",
  district_id: "",
  category_id: "",
  sort_order: 0,
  is_active: true,
  before_daily_order: "",
  before_avg_basket: "",
  before_complaints: [],
  after_daily_order: "",
  after_avg_basket: "",
  after_improvements: [],
  before_image: null,
  after_image: null,
};

export default function CaseStudiesPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); 

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [hardConfirm, setHardConfirm] = useState(null); // { id, title }

  const load = async () => {
    setLoading(true);
    try {
      setRows(await caseStudiesApi.list());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      const [d, c] = await Promise.all([districtsApi.list(), categoriesApi.list()]);
      setDistricts(d);
      setCategories(c);
    })();
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (r) => {
    setForm({
      title: r.title,
      district_id: r.district_id || "",
      category_id: r.category_id || "",
      sort_order: r.sort_order,
      is_active: r.is_active,
      before_daily_order: r.before_daily_order || "",
      before_avg_basket: r.before_avg_basket || "",
      before_complaints: r.before_complaints || [],
      after_daily_order: r.after_daily_order || "",
      after_avg_basket: r.after_avg_basket || "",
      after_improvements: r.after_improvements || [],
      before_image: null,
      after_image: null,
      _existing: r,
    });
    setEditing(r.id);
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(form.sort_order) || form.sort_order < 0) {
      toast.push("Sıra negatif olamaz, 0 veya pozitif bir tam sayı girin", "error");
      return;
    }
    const payload = {
      title: form.title,
      district_id: form.district_id || "",
      category_id: form.category_id || "",
      sort_order: form.sort_order,
      is_active: form.is_active,
      before_daily_order: form.before_daily_order,
      before_avg_basket: form.before_avg_basket,
      before_complaints: form.before_complaints,
      after_daily_order: form.after_daily_order,
      after_avg_basket: form.after_avg_basket,
      after_improvements: form.after_improvements,
      before_image: form.before_image,
      after_image: form.after_image,
    };
    try {
      if (editing === "new") {
        await caseStudiesApi.create(payload);
        toast.push("Başarı hikayesi eklendi", "success");
      } else {
        await caseStudiesApi.update(editing, payload);
        toast.push("Başarı hikayesi güncellendi", "success");
      }
      close();
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const remove = async () => {
    try {
      await caseStudiesApi.remove(confirmId);
      toast.push("Başarı hikayesi pasifleştirildi", "success");
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
      await caseStudiesApi.hardRemove(hardConfirm.id);
      toast.push("Hikaye ve görselleri kalıcı olarak silindi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setHardConfirm(null);
    }
  };

  const toggleActive = async (row) => {
    try {
      await caseStudiesApi.setActive(row.id, !row.is_active);
      toast.push(row.is_active ? "Hikaye pasifleştirildi" : "Hikaye aktifleştirildi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const move = async (id, direction) => {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const j = direction === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= rows.length) return;
    const a = rows[idx];
    const b = rows[j];
    try {
      await caseStudiesApi.reorder([
        { id: a.id, sort_order: b.sort_order },
        { id: b.id, sort_order: a.sort_order },
      ]);
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="card-title">Başarı Hikayeleri</h2>
          <div className="flex gap-2">
            <CsvImportButton
              onImport={async (file) => {
                try {
                  const res = await caseStudiesApi.importCsv(file);
                  toast.push(`CSV: ${res.created} yeni, ${res.updated} güncellendi`, "success");
                  await load();
                } catch (e) {
                  toast.push(e.message, "error");
                }
              }}
            />
            <CsvExportButton onExport={caseStudiesApi.exportCsv} filename="case_studies.csv" />
            <button className="btn btn-sm btn-primary" onClick={openNew}>+ Yeni Hikaye</button>
          </div>
        </div>

        {loading ? <span className="loading loading-spinner" /> : (
          <DataTable
            columns={[
              { key: "sort_order", label: "Sıra" },
              { key: "id", label: "ID" },
              { key: "title", label: "Başlık" },
              {
                  key: "before_image_url",
                  label: "Öncesi",
                  render: (r) => r.before_image_url
                    ? <img src={r.before_image_url} alt="" className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightbox(r.before_image_url)} />
                    : "—",
                },
                {
                  key: "after_image_url",
                  label: "Sonrası",
                  render: (r) => r.after_image_url
                    ? <img src={r.after_image_url} alt="" className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightbox(r.after_image_url)} />
                    : "—",
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
                    <button className="btn btn-xs btn-soft" onClick={() => move(r.id, "up")}>↑</button>
                    <button className="btn btn-xs btn-soft" onClick={() => move(r.id, "down")}>↓</button>
                    <button className="btn btn-xs btn-soft" onClick={() => openEdit(r)}>Düzenle</button>
                    {r.is_active ? (
                      <button className="btn btn-xs btn-warning btn-soft" onClick={() => setConfirmId(r.id)}>Pasifleştir</button>
                    ) : (
                      <button className="btn btn-xs btn-success btn-soft" onClick={() => toggleActive(r)}>Aktifleştir</button>
                    )}
                    <button className="btn btn-xs btn-error btn-soft" onClick={() => setHardConfirm({ id: r.id, title: r.title })}>Sil</button>
                  </div>
                ),
              },
            ]}
            data={rows}
            emptyText="Henüz başarı hikayesi yok"
          />
        )}
      </div>

      <FormModal open={editing !== null} title={editing === "new" ? "Yeni Başarı Hikayesi" : "Başarı Hikayesini Düzenle"} onClose={close} size="xl">
        <form onSubmit={save} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-control flex flex-col gap-2 md:col-span-2">
              <label className="label-text font-medium">Başlık *</label>
              <input className="input input-bordered" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-control flex flex-col gap-2">
              <label className="label-text font-medium">İlçe</label>
              <select className="select select-bordered" value={form.district_id} onChange={(e) => setForm({ ...form, district_id: e.target.value })}>
                <option value="">—</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-control flex flex-col gap-2">
              <label className="label-text font-medium">Kategori</label>
              <select className="select select-bordered" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
            <div className="form-control flex flex-col gap-2">
              <label className="label-text font-medium">Sıra</label>
              <input
                type="number"
                min="0"
                step="1"
                className="input input-bordered"
                value={form.sort_order}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  const next = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
                  setForm({ ...form, sort_order: next });
                }}
              />
              <span className="text-xs text-base-content/60">0 veya pozitif bir tam sayı olmalı.</span>
            </div>
            <label className="flex items-center justify-between cursor-pointer pt-6">
              <span className="label-text font-medium">Aktif</span>
              <input type="checkbox" className="toggle toggle-primary" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <fieldset className="p-5 border border-base-300 rounded space-y-4">
              <legend className="font-semibold px-1">Öncesi</legend>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Görsel</label>
                <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm" onChange={(e) => setForm({ ...form, before_image: e.target.files?.[0] || null })} />
                {form._existing?.before_image_url && !form.before_image && (
                  <img src={form._existing.before_image_url} alt="" className="w-32 h-32 object-cover rounded mt-2" />
                )}
              </div>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Günlük sipariş</label>
                <input className="input input-bordered input-sm" placeholder="8-12 adet" value={form.before_daily_order} onChange={(e) => setForm({ ...form, before_daily_order: e.target.value })} />
              </div>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Ortalama sepet</label>
                <input className="input input-bordered input-sm" placeholder="120" value={form.before_avg_basket} onChange={(e) => setForm({ ...form, before_avg_basket: e.target.value })} />
              </div>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Şikayetler</label>
                <TagInput value={form.before_complaints} onChange={(v) => setForm({ ...form, before_complaints: v })} placeholder="Şikayet ekle" />
              </div>
            </fieldset>

            <fieldset className="p-5 border border-base-300 rounded space-y-4">
              <legend className="font-semibold px-1">Sonrası</legend>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Görsel</label>
                <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm" onChange={(e) => setForm({ ...form, after_image: e.target.files?.[0] || null })} />
                {form._existing?.after_image_url && !form.after_image && (
                  <img src={form._existing.after_image_url} alt="" className="w-32 h-32 object-cover rounded mt-2" />
                )}
              </div>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Günlük sipariş</label>
                <input className="input input-bordered input-sm" placeholder="35-50 adet" value={form.after_daily_order} onChange={(e) => setForm({ ...form, after_daily_order: e.target.value })} />
              </div>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">Ortalama sepet</label>
                <input className="input input-bordered input-sm" placeholder="165" value={form.after_avg_basket} onChange={(e) => setForm({ ...form, after_avg_basket: e.target.value })} />
              </div>
              <div className="form-control flex flex-col gap-2">
                <label className="label-text font-medium">İyileştirmeler</label>
                <TagInput value={form.after_improvements} onChange={(v) => setForm({ ...form, after_improvements: v })} placeholder="İyileştirme ekle" />
              </div>
            </fieldset>
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={close}>İptal</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        message="Bu başarı hikayesini pasifleştirmek istediğine emin misin? (Geri alınabilir — kayıt korunur, sadece is_active=false yapılır.)"
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />

      <ConfirmDialog
        open={hardConfirm !== null}
        title="Kalıcı silme — geri alınamaz!"
        message={
          hardConfirm
            ? `"${hardConfirm.title}" hikayesini ve yüklediğin Öncesi/Sonrası görsellerini VERİTABANINDAN SİLECEKSİN. Bu işlem geri alınamaz. Devam etmek istiyor musun?`
            : ""
        }
        confirmText="Evet, kalıcı sil"
        onConfirm={hardRemove}
        onCancel={() => setHardConfirm(null)}
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-3 -right-3 btn btn-sm btn-circle btn-neutral z-10"
              onClick={() => setLightbox(null)}
            >
              ✕
            </button>
            <img
              src={lightbox}
              alt=""
              className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
