// İlçe/mahalle düzeyinde "kurye karşılaştırması" — restoran kuryesi vs kendi kuryen.
// JSON yapısı:
//   { restaurant_courier: {fee, avg_cost, monthly_revenue, churn_label},
//     own_courier:        {fee, avg_cost, monthly_revenue, churn_label} }

const EMPTY = {
  restaurant_courier: { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "" },
  own_courier: { fee: 0, avg_cost: 0, monthly_revenue: 0, churn_label: "" },
};

const CHURN_OPTIONS = ["", "DÜŞÜK", "ORTA", "YÜKSEK"];

function ensureShape(v) {
  if (!v || typeof v !== "object") return { ...EMPTY };
  return {
    restaurant_courier: { ...EMPTY.restaurant_courier, ...(v.restaurant_courier || {}) },
    own_courier: { ...EMPTY.own_courier, ...(v.own_courier || {}) },
  };
}

export default function CourierComparisonEditor({ value, onChange }) {
  const data = ensureShape(value);
  const upd = (key, field, val) => {
    onChange?.({ ...data, [key]: { ...data[key], [field]: val } });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { key: "restaurant_courier", title: "Restoran kuryesi", note: "Platformun (3. parti) sağladığı kurye" },
        { key: "own_courier", title: "Kendi kuryeniz", note: "Restoranın/bölgenin kendi anlaştığı kurye" },
      ].map(({ key, title, note }) => {
        const c = data[key];
        return (
          <div key={key} className="border border-base-300 rounded p-3">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs opacity-60 mb-3">{note}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex flex-col gap-1">
                <span className="opacity-70">Sabit ücret</span>
                <input
                  type="number" min="0" step="0.01"
                  className="input input-bordered input-sm"
                  value={c.fee ?? 0}
                  onChange={(e) => upd(key, "fee", Number(e.target.value) || 0)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="opacity-70">Ort. sipariş başına maliyet</span>
                <input
                  type="number" min="0" step="0.01"
                  className="input input-bordered input-sm"
                  value={c.avg_cost ?? 0}
                  onChange={(e) => upd(key, "avg_cost", Number(e.target.value) || 0)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="opacity-70">Aylık ciro</span>
                <input
                  type="number" min="0"
                  className="input input-bordered input-sm"
                  value={c.monthly_revenue ?? 0}
                  onChange={(e) => upd(key, "monthly_revenue", Number(e.target.value) || 0)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="opacity-70">Churn (müşteri kaybı) etiketi</span>
                <select
                  className="select select-bordered select-sm"
                  value={c.churn_label || ""}
                  onChange={(e) => upd(key, "churn_label", e.target.value)}
                >
                  {CHURN_OPTIONS.map((o) => <option key={o} value={o}>{o || "—"}</option>)}
                </select>
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
