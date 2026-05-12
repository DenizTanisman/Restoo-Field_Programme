import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const METRICS = [
  { key: "adBudget",       label: "Ort. Reklam Bütçesi",  unit: "₺",  color: "#6366f1", icon: "📢" },
  { key: "campaignRate",   label: "Kampanya Katılımı",     unit: "%",  color: "#f59e0b", icon: "🎯" },
  { key: "couponRate",     label: "Kupon Katılımı",        unit: "%",  color: "#10b981", icon: "🎟️" },
  { key: "flashRate",      label: "Flash Katılımı",        unit: "%",  color: "#ef4444", icon: "⚡" },
  { key: "jokerRate",      label: "Joker Katılımı",        unit: "%",  color: "#8b5cf6", icon: "🃏" },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-semibold text-gray-800">{d.label}</p>
      <p className="text-gray-600">
        {d.value.toLocaleString("tr-TR")}{d.unit}
      </p>
    </div>
  );
};

/**
 * BudgetAnalyticsCard
 *
 * Props:
 *   districtName  — string
 *   data          — {
 *     adBudget:     number  (TL)
 *     campaignRate: number  (0-100)
 *     couponRate:   number  (0-100)
 *     flashRate:    number  (0-100)
 *     jokerRate:    number  (0-100)
 *   }
 *   loading       — bool
 *   error         — string
 */
export default function BudgetAnalyticsCard({
  districtName,
  categoryLabel,
  data = {},
  loading = false,
  error = null,
}) {
  const radialData = METRICS.filter((m) => m.key !== "adBudget").map((m) => ({
    ...m,
    value: data[m.key] ?? 0,
  }));

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        {/* Başlık */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Kampanya & Katılım Analizleri
          </h3>
          {districtName && (
            <p className="text-sm text-gray-500">
              {districtName}{categoryLabel ? ` · ${categoryLabel}` : ""}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {!loading && error && (
          <div className="flex justify-center items-center h-48 text-sm text-error">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Reklam bütçesi banner */}
            <div
              className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)" }}
            >
              <div>
                <p className="text-white/80 text-xs font-medium">Ortalama Reklam Bütçesi</p>
                <p className="text-white text-2xl font-bold">
                  {(data.adBudget ?? 0).toLocaleString("tr-TR")} ₺
                </p>
              </div>
              <span className="text-4xl">📢</span>
            </div>

            {/* Radial chart */}
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={80}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    minAngle={5}
                    background
                    clockWise
                    dataKey="value"
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Liste */}
            <ul className="space-y-2 mt-1">
              {METRICS.filter((m) => m.key !== "adBudget").map((m) => {
                const val = data[m.key] ?? 0;
                return (
                  <li key={m.key} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{m.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-700 font-medium">{m.label}</span>
                        <span className="font-semibold" style={{ color: m.color }}>
                          {val}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${val}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
