import { useEffect, useState } from "react";
import { districtsApi } from "../api/districts";
import DataTable from "../components/ui/DataTable";
import FormModal from "../components/ui/FormModal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

const EMPTY = { id: "", name: "", side: "avrupa", svg_path: "", is_active: true };

export default function DistrictsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);

  const [expanded, setExpanded] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [neighLoading, setNeighLoading] = useState(false);
  const [newNeigh, setNewNeigh] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setRows(await districtsApi.list());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing("new"); };
  const openEdit = (r) => {
    setForm({ id: r.id, name: r.name, side: r.side, svg_path: r.svg_path || "", is_active: r.is_active ?? true });
    setEditing(r.id);
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing === "new") {
        await districtsApi.create(form);
        toast.push("İlçe eklendi", "success");
      } else {
        const { id, ...rest } = form;
        await districtsApi.update(editing, rest);
        toast.push("İlçe güncellendi", "success");
      }
      close();
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const remove = async () => {
    try {
      await districtsApi.remove(confirmId);
      toast.push("İlçe silindi", "success");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setConfirmId(null);
    }
  };

  const expand = (districtId) => {
    if (expanded === districtId) {
      setExpanded(null);
      setNeighborhoods([]);
      return;
    }
    setExpanded(districtId);
    setNeighborhoods([]);
  };

  // Açılan ilçenin mahallelerini fetch et
  useEffect(() => {
    if (!expanded) return;
    let alive = true;
    setNeighLoading(true);
    districtsApi
      .listNeighborhoods(expanded)
      .then((data) => {
        if (alive) setNeighborhoods(data);
      })
      .catch((err) => {
        if (alive) toast.push(err.message, "error");
      })
      .finally(() => {
        if (alive) setNeighLoading(false);
      });
    return () => { alive = false; };
  }, [expanded]);

  const addNeighborhood = async () => {
    if (!newNeigh.trim()) return;
    try {
      await districtsApi.createNeighborhood(expanded, { name: newNeigh.trim(), is_active: true });
      setNewNeigh("");
      setNeighborhoods(await districtsApi.listNeighborhoods(expanded));
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const removeNeighborhood = async (id) => {
    try {
      await districtsApi.removeNeighborhood(id);
      setNeighborhoods(await districtsApi.listNeighborhoods(expanded));
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">İlçeler</h2>
          <button className="btn btn-sm btn-primary" onClick={openNew}>+ Yeni İlçe</button>
        </div>
        {loading ? <span className="loading loading-spinner" /> : (
          <DataTable
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Ad" },
              { key: "side", label: "Yaka" },
              {
                key: "neighborhoods",
                label: "Mahalleler",
                render: (r) => (
                  <button className="btn btn-xs btn-ghost" onClick={() => expand(r.id)}>
                    {expanded === r.id ? "Kapat" : "Göster"}
                  </button>
                ),
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

        {expanded && (
          <div className="mt-4 p-4 bg-base-200 rounded">
            <h3 className="font-semibold mb-2">{expanded} — Mahalleler</h3>
            <div className="flex gap-2 mb-3">
              <input
                className="input input-bordered input-sm flex-1"
                placeholder="Yeni mahalle adı"
                value={newNeigh}
                onChange={(e) => setNewNeigh(e.target.value)}
              />
              <button className="btn btn-sm btn-primary" onClick={addNeighborhood}>Ekle</button>
            </div>
            <div className="text-xs opacity-60 mb-2">
              {neighLoading
                ? "Yükleniyor…"
                : `${neighborhoods.length} mahalle`}
            </div>
            <div className="flex flex-wrap gap-2">
              {!neighLoading && neighborhoods.length === 0 && (
                <span className="opacity-60 text-sm">Mahalle yok</span>
              )}
              {neighborhoods.map((n) => (
                <span key={n.id} className="badge badge-outline gap-2">
                  {n.name}
                  <button onClick={() => removeNeighborhood(n.id)} className="opacity-60 hover:opacity-100">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <FormModal open={editing !== null} title={editing === "new" ? "Yeni İlçe" : "İlçe Düzenle"} onClose={close}>
        <form onSubmit={save} className="space-y-3">
          {editing === "new" && (
            <div className="form-control">
              <label className="label"><span className="label-text">ID (örn. 34-beykoz)</span></label>
              <input className="input input-bordered" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} required />
            </div>
          )}
          <div className="form-control">
            <label className="label"><span className="label-text">Ad</span></label>
            <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Yaka</span></label>
            <select className="select select-bordered" value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}>
              <option value="avrupa">Avrupa</option>
              <option value="anadolu">Anadolu</option>
              <option value="adalar">Adalar</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">SVG Path (opsiyonel)</span></label>
            <textarea className="textarea textarea-bordered text-xs" rows={3} value={form.svg_path} onChange={(e) => setForm({ ...form, svg_path: e.target.value })} />
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
        message="Bu ilçeyi silmek istediğine emin misin?"
        onConfirm={remove}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
