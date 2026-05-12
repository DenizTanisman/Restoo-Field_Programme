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

export default function ApplicationsPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [list, setList] = useState({ total: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

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

  const totalPages = Math.max(1, Math.ceil(list.total / limit));

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="card-title">Başvurular</h2>
          <div className="flex gap-2">
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
                  <button className="btn btn-xs" onClick={() => setDetail(r)}>Detay</button>
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
