import { useEffect, useState } from "react";
import { platformsApi } from "../api/platforms";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

const EMPTY = { name: "", color_hex: "", logo_url: "", is_active: true };

export default function PlatformsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await platformsApi.list());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (r) => {
    setForm({ name: r.name, color_hex: r.color_hex || "", logo_url: r.logo_url || "", is_active: r.is_active ?? true });
    setEditing(r.id);
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, color_hex: form.color_hex || null, logo_url: form.logo_url || null };
    try {
      if (editing === "new") {
        await platformsApi.create(payload);
        toast.push("Platform eklendi", "success");
      } else {
        await platformsApi.update(editing, payload);
        toast.push("Platform güncellendi", "success");
      }
      close();
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const remove = async () => {
    try {
      await platformsApi.remove(confirmId);
      toast.push("Platform silindi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">Platformlar</h2>
          <button className="btn btn-sm btn-primary" onClick={openNew}>+ Yeni Platform</button>
        </div>
        {loading ? <span className="loading loading-spinner" /> : (
          <DataTable
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Ad" },
              {
                key: "color_hex",
                label: "Renk",
                render: (r) =>
                  r.color_hex ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-4 rounded" style={{ background: r.color_hex }} />
                      {r.color_hex}
                    </span>
                  ) : "—",
              },
              { key: "logo_url", label: "Logo URL", render: (r) => r.logo_url || "—" },
              {
                key: "actions",
                label: "İşlem",
                render: (r) => (
                  <div className="flex gap-2">
                    <button className="btn btn-xs" onClick={() => openEdit(r)}>Düzenle</button>
                    <button className="btn btn-xs btn-error" onClick={() => setConfirmId(r.id)}>Sil</button>
                  </div>
                ),
              },
            ]}
            data={rows}
          />
        )}
      </div>

      <FormModal open={editing !== null} title={editing === "new" ? "Yeni Platform" : "Platform Düzenle"} onClose={close}>
        <form onSubmit={save} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Ad</span></label>
            <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Renk (#RRGGBB)</span></label>
            <input className="input input-bordered" value={form.color_hex} onChange={(e) => setForm({ ...form, color_hex: e.target.value })} placeholder="#FF6000" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Logo URL</span></label>
            <input className="input input-bordered" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
          </div>
          <label className="label cursor-pointer">
            <span className="label-text">Aktif</span>
            <input type="checkbox" className="toggle toggle-primary" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          </label>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={close}>İptal</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        message="Bu platformu silmek istediğine emin misin?"
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
