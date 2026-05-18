import React from "react";

const TITLES = {
  cancel: { title: "İPTAL SEBEPLERİ", centerLabel: "Toplam İptal" },
  return: { title: "İADE SEBEPLERİ", centerLabel: "Toplam İade" },
};

function makeConicGradient(items) {
  const total = items.reduce((s, i) => s + (Number(i.percent) || 0), 0);
  if (total <= 0) {
    return "conic-gradient(#e5e7eb 0% 100%)";
  }
  let acc = 0;
  const stops = items.map((it) => {
    const start = (acc / total) * 100;
    acc += Number(it.percent) || 0;
    const end = (acc / total) * 100;
    return `${it.color || "#cbd5e1"} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function RestaurantOperationalCard({ type, totalRate, reasons }) {
  const cfg = TITLES[type];
  if (!cfg) return null;

  const items = Array.isArray(reasons) ? reasons : [];
  const rate = Number(totalRate) || 0;

  const Chart = (
    <div className="shrink-0 flex items-center justify-center">
      <div
        className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-inner"
        style={{ background: makeConicGradient(items) }}
      >
        <div className="absolute w-[72%] h-[72%] bg-base-100 rounded-full flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl font-extrabold text-base-content">%{rate.toFixed(rate < 10 ? 1 : 0)}</span>
          <span className="text-[10px] text-base-content/50 font-bold uppercase tracking-tighter">
            {cfg.centerLabel}
          </span>
        </div>
      </div>
    </div>
  );

  const Legend = (
    <div className="w-full max-w-xs flex flex-col gap-2.5">
      {items.length === 0 && (
        <p className="text-xs text-base-content/50 italic text-center">Sebep verisi yok — admin panelinden ekle</p>
      )}
      {items.map((item, idx) => (
        <div key={`${item.label}-${idx}`} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
              style={{ background: item.color || "#cbd5e1" }}
            />
            <span className="text-base-content/80 font-semibold text-xs truncate">{item.label || "—"}</span>
          </div>
          <span className="text-base-content font-bold text-sm font-mono shrink-0">%{Number(item.percent) || 0}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        <h3 className="text-xs font-bold text-base-content/60 mb-4 uppercase tracking-wider text-center">
          {cfg.title}
        </h3>
        <div className="flex flex-col items-center gap-5">
          {Chart}
          {Legend}
        </div>
      </div>
    </div>
  );
}
