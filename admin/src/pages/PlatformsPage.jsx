import { useEffect, useState } from "react";
import { platformsApi } from "../api/platforms";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

const EMPTY = { name: "", color_hex: "#000000", logo_url: "", is_active: true };
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

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
    const name = form.name.trim();
    const color = form.color_hex.trim().toUpperCase();
    const logo = form.logo_url.trim();
    if (!name) {
      toast.push("Ad boş olamaz", "error");
      return;
    }
    if (!HEX_RE.test(color)) {
      toast.push("Renk değeri #RRGGBB formatında olmalıdır", "error");
      return;
    }
    if (!logo) {
      toast.push("Logo URL boş olamaz", "error");
      return;
    }
    const payload = { name, color_hex: color, logo_url: logo, is_active: form.is_active };
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
        <form onSubmit={save} className="space-y-5">
          <div className="form-control flex flex-col gap-2">
            <label className="label-text font-medium">Ad *</label>
            <input
              className="input input-bordered"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={(e) => setForm({ ...form, name: e.target.value.trim() })}
              required
              maxLength={100}
            />
            <span className="text-xs text-base-content/60">Baş/son boşluklar otomatik temizlenir. Aynı isim (büyük/küçük harf farketmez) iki kez girilemez.</span>
          </div>
          <div className="form-control flex flex-col gap-2">
            <label className="label-text font-medium">Renk *</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="w-12 h-10 rounded border border-base-300 cursor-pointer"
                value={HEX_RE.test(form.color_hex) ? form.color_hex : "#000000"}
                onChange={(e) => setForm({ ...form, color_hex: e.target.value.toUpperCase() })}
              />
              <input
                className="input input-bordered flex-1"
                value={form.color_hex}
                onChange={(e) => setForm({ ...form, color_hex: e.target.value })}
                onBlur={(e) => setForm({ ...form, color_hex: e.target.value.trim().toUpperCase() })}
                pattern="^#[0-9A-Fa-f]{6}$"
                title="Renk değeri #RRGGBB formatında olmalıdır"
                maxLength={7}
                placeholder="#FF6000"
                required
              />
            </div>
            <span className="text-xs text-base-content/60">Renk değeri <code>#RRGGBB</code> formatında olmalıdır (örn. #FF6000).</span>
          </div>
          <div className="form-control flex flex-col gap-2">
            <label className="label-text font-medium">Logo URL *</label>
            <input
              type="url"
              className="input input-bordered"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              onBlur={(e) => setForm({ ...form, logo_url: e.target.value.trim() })}
              placeholder="https://..."
              required
            />
          </div>
          <label className="flex items-center justify-between cursor-pointer pt-1">
            <span className="label-text font-medium">Aktif</span>
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
