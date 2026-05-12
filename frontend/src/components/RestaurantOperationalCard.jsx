import React from "react";

const CONFIG = {
  cancel: {
    title: "İPTAL SEBEPLERİ",
    centerValue: "%12",
    centerLabel: "Toplam İptal",
    chartOnLeft: true,
    items: [
      { label: "Uzun bekleme", color: "#EE4444", percent: 45 },
      { label: "Yanlış ürün", color: "#A65EEA", percent: 25 },
      { label: "Lezzet", color: "#22CCEE", percent: 15 },
      { label: "Ürün stokta yok", color: "#66DD22", percent: 10 },
      { label: "Diğer", color: "#F99F1B", percent: 5 },
    ],
  },
  return: {
    title: "İADE SEBEPLERİ",
    centerValue: "%8",
    centerLabel: "Toplam İade",
    chartOnLeft: false,
    items: [
      { label: "Eksik Malzeme", color: "#EE4444", percent: 48 },
      { label: "Soğuk Geldi", color: "#A65EEA", percent: 34 },
      { label: "Yanlış Sipariş", color: "#22CCEE", percent: 18 },
      { label: "Ambalaj", color: "#F99F1B", percent: 12 },
    ],
  },
};

function makeConicGradient(items) {
  let total = items.reduce((s, i) => s + i.percent, 0);
  // Normalize 0-100
  let acc = 0;
  const stops = items.map((it) => {
    const start = (acc / total) * 100;
    acc += it.percent;
    const end = (acc / total) * 100;
    return `${it.color} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export default function RestaurantOperationalCard({ type }) {
  const config = CONFIG[type];
  if (!config) return null;

  const Chart = (
    <div className="shrink-0 flex items-center justify-center">
      <div
        className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-inner"
        style={{ background: makeConicGradient(config.items) }}
      >
        <div className="absolute w-[72%] h-[72%] bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
          <span className="text-3xl font-extrabold text-gray-800">{config.centerValue}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
            {config.centerLabel}
          </span>
        </div>
      </div>
    </div>
  );

  const Legend = (
    <div className="flex-1 flex flex-col justify-center gap-3 min-w-0">
      {config.items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-4 h-4 rounded-md shrink-0 shadow-sm"
              style={{ background: item.color }}
            />
            <span className="text-gray-600 font-semibold text-sm truncate">{item.label}</span>
          </div>
          <span className="text-gray-900 font-bold text-lg font-mono shrink-0">%{item.percent}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
          {config.title}
        </h3>
        <div className={`flex flex-col items-center gap-6 2xl:items-center 2xl:gap-8 ${config.chartOnLeft ? "2xl:flex-row" : "2xl:flex-row-reverse"}`}>
          {Chart}
          {Legend}
        </div>
      </div>
    </div>
  );
}
