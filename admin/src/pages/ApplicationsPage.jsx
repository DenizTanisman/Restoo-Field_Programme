import { useEffect, useState } from "react";
import { applicationsApi } from "../api/applications";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import { CsvExportButton } from "../components/ui/CsvButtons";
import { useToast } from "../components/ui/Toast";

const STATUS_OPTIONS = ["pending", "reviewed", "accepted", "rejected"];
const STATUS_LABELS = {
  pending: "Bekliyor",
  reviewed: "İnceleniyor",
  accepted: "Kabul",
  rejected: "Red",
};

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  city: "",
  district: "",
  vehicle: "",
  message: "",
};

export default function ApplicationsPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [list, setList] = useState({ total: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null); // null = closed, {} = create, {id, ...} = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      setList(await applicationsApi.list(params));
    } catch (e) {
      toast.push(e.message, "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [statusFilter, page]);

  const updateStatus = async (id, status) => {
    try {
      await applicationsApi.updateStatus(id, status);
      toast.push("Durum güncellendi", "success");
      load();
      if (detail?.id === id) setDetail({ ...detail, status });
    } catch (e) {
      toast.push(e.message, "error");
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing({});
  };

  const openEdit = (row) => {
    setForm({
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      email: row.email || "",
      phone: row.phone || "",
      city: row.city || "",
      district: row.district || "",
      vehicle: row.vehicle || "",
      message: row.message || "",
    });
    setEditing(row);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        city: form.city || null,
        district: form.district || null,
        vehicle: form.vehicle || null,
        message: form.message || null,
      };
      if (editing?.id) {
        await applicationsApi.update(editing.id, payload);
        toast.push("Başvuru güncellendi", "success");
      } else {
        await applicationsApi.create(payload);
        toast.push("Başvuru eklendi", "success");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id) => {
    if (!confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) return;
    try {
      await applicationsApi.remove(id);
      toast.push("Başvuru silindi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(list.total / limit));

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="card-title">Başvurular</h2>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Yeni başvuru</button>
            <CsvExportButton onExport={applicationsApi.exportCsv} filename="applications.csv" />
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <select
            className="select select-bordered select-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tüm durumlar</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>

        {loading ? <span className="loading loading-spinner" /> : (
          <DataTable
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Ad Soyad", render: (r) => `${r.first_name} ${r.last_name}` },
              { key: "email", label: "E-posta" },
              { key: "phone", label: "Telefon" },
              { key: "vehicle", label: "Araç" },
              {
                key: "status",
                label: "Durum",
                render: (r) => (
                  <select
                    className="select select-bordered select-xs"
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                ),
              },
              {
                key: "created_at",
                label: "Tarih",
                render: (r) => new Date(r.created_at).toLocaleString("tr-TR"),
              },
              {
                key: "actions",
                label: "İşlem",
                render: (r) => (
                  <div className="flex gap-1">
                    <button className="btn btn-xs" onClick={() => setDetail(r)}>Detay</button>
                    <button className="btn btn-xs btn-ghost" onClick={() => openEdit(r)}>Düzenle</button>
                    <button className="btn btn-xs btn-error btn-ghost" onClick={() => removeRow(r.id)}>Sil</button>
                  </div>
                ),
              },
            ]}
            data={list.data}
            emptyText="Başvuru yok"
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

      <FormModal
        open={!!editing}
        title={editing?.id ? `Başvuru #${editing.id} düzenle` : "Yeni başvuru ekle"}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={submitForm} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text">Ad *</span>
              <input className="input input-bordered input-sm" required value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </label>
            <label className="form-control">
              <span className="label-text">Soyad *</span>
              <input className="input input-bordered input-sm" required value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </label>
            <label className="form-control">
              <span className="label-text">E-posta *</span>
              <input type="email" className="input input-bordered input-sm" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="form-control">
              <span className="label-text">Telefon *</span>
              <input className="input input-bordered input-sm" required value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="form-control">
              <span className="label-text">Şehir</span>
              <input className="input input-bordered input-sm" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label className="form-control">
              <span className="label-text">İlçe</span>
              <input className="input input-bordered input-sm" value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })} />
            </label>
            <label className="form-control col-span-2">
              <span className="label-text">Araç</span>
              <input className="input input-bordered input-sm" value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })} />
            </label>
            <label className="form-control col-span-2">
              <span className="label-text">Mesaj</span>
              <textarea className="textarea textarea-bordered textarea-sm" rows={3} value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>Vazgeç</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? "Kaydediliyor…" : (editing?.id ? "Güncelle" : "Ekle")}
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal open={!!detail} title={detail ? `Başvuru #${detail.id}` : ""} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-2 text-sm">
            <div><b>Ad:</b> {detail.first_name} {detail.last_name}</div>
            <div><b>E-posta:</b> {detail.email}</div>
            <div><b>Telefon:</b> {detail.phone}</div>
            <div><b>Şehir/İlçe:</b> {detail.city || "—"} / {detail.district || "—"}</div>
            <div><b>Araç:</b> {detail.vehicle || "—"}</div>
            <div><b>Mesaj:</b> <p className="whitespace-pre-wrap mt-1 bg-base-200 p-2 rounded">{detail.message || "—"}</p></div>
            <div><b>Tarih:</b> {new Date(detail.created_at).toLocaleString("tr-TR")}</div>
            <div className="form-control mt-3">
              <label className="label"><span className="label-text">Durum</span></label>
              <select
                className="select select-bordered select-sm"
                value={detail.status}
                onChange={(e) => updateStatus(detail.id, e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
