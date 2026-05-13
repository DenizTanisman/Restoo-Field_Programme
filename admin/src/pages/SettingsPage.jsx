import { useEffect, useState } from "react";
import { metricsApi } from "../api/analytics";
import { useToast } from "../components/ui/Toast";

const FIELDS = [
  { key: "loyalty_active_firms", label: "Aktif Firma", placeholder: "ör: 340+" },
  { key: "loyalty_churn_reduction", label: "Ortalama Churn Azalması", placeholder: "ör: %38" },
  { key: "loyalty_avg_roi", label: "Ortalama ROI", placeholder: "ör: 2.6x" },
  { key: "loyalty_payback_period", label: "Geri Ödeme Süresi", placeholder: "ör: 90 Gün" },
];

export default function SettingsPage() {
  const toast = useToast();
  const [values, setValues] = useState({
    loyalty_active_firms: "",
    loyalty_churn_reduction: "",
    loyalty_avg_roi: "",
    loyalty_payback_period: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metricsApi.siteSettings.get()
      .then((data) => setValues(data))
      .catch((e) => toast.push(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await metricsApi.siteSettings.upsert(values);
      toast.push("Kaydedildi", "success");
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  if (loading) return <p className="opacity-60">Yükleniyor…</p>;

  return (
    <form onSubmit={save} className="space-y-4 max-w-2xl">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="font-semibold mb-1">Sadakat Programı Stat'ları</h3>
          <p className="text-sm opacity-60 mb-4">Ana sayfada Sadakat bölümünde gösterilen 4 büyük rakam.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="form-control">
                <label className="label label-text-sm">{f.label}</label>
                <input
                  className="input input-bordered input-sm"
                  placeholder={f.placeholder}
                  value={values[f.key] || ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button type="submit" className="btn btn-primary">Kaydet</button>
    </form>
  );
}
