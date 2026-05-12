import { useEffect, useState } from "react";
import { categoriesApi } from "../api/categories";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

const EMPTY = { name: "", emoji: "", sort_order: 0, is_active: true };

export default function CategoriesPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await categoriesApi.list());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (r) => {
    setForm({ name: r.name, emoji: r.emoji, sort_order: r.sort_order, is_active: r.is_active ?? true });
    setEditing(r.id);
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === "new") {
        await categoriesApi.create(form);
        toast.push("Kategori eklendi", "success");
      } else {
        await categoriesApi.update(editing, form);
        toast.push("Kategori güncellendi", "success");
      }
      close();
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const remove = async () => {
    try {
      await categoriesApi.remove(confirmId);
      toast.push("Kategori silindi", "success");
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
          <h2 className="card-title">Kategoriler</h2>
          <button className="btn btn-sm btn-primary" onClick={openNew}>+ Yeni Kategori</button>
        </div>
        {loading ? (
          <span className="loading loading-spinner" />
        ) : (
          <DataTable
            columns={[
              { key: "id", label: "ID" },
              { key: "emoji", label: "Emoji" },
              { key: "name", label: "Ad" },
              { key: "sort_order", label: "Sıra" },
              {
                key: "is_active",
                label: "Aktif",
                render: (r) => (r.is_active ?? true) ? "✓" : "—",
              },
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

      <FormModal open={editing !== null} title={editing === "new" ? "Yeni Kategori" : "Kategori Düzenle"} onClose={close}>
        <form onSubmit={save} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Ad</span></label>
            <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Emoji</span></label>
            <input className="input input-bordered" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Sıra</span></label>
            <input type="number" className="input input-bordered" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })} />
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
        message="Bu kategoriyi silmek istediğine emin misin?"
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
