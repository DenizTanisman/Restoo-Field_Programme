import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const PERIODS = [
  { key: "daily",   label: "Günlük" },
  { key: "monthly", label: "Aylık"  },
  { key: "yearly",  label: "Yıllık" },
];

const PLATFORM_COLORS = {
  "Uber Eats Trendyol Go": "#FF6000",
  "Getir":         "#5C3EBC",
  "Yemeksepeti":   "#CC0000",
};

function resolveColor(name) {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("uber") || n.includes("trendyol")) return "#FF6000";
  if (n.includes("getir"))    return "#5C3EBC";
  if (n.includes("yemek"))    return "#CC0000";
  return "#94a3b8";
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-semibold text-gray-800 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.value.toLocaleString("tr-TR")} ₺
        </p>
      ))}
    </div>
  );
};

/**
 * SalesForecastCard
 *
 * Props:
 *   districtName  — string
 *   forecast      — {
 *     daily:   [{ platform: string, amount: number }, ...]
 *     monthly: [{ platform: string, amount: number }, ...]
 *     yearly:  [{ platform: string, amount: number }, ...]
 *   }
 *   loading  — bool
 *   error    — string
 */
export default function SalesForecastCard({
  districtName,
  categoryLabel,
  forecast = {},
  loading = false,
  error = null,
}) {
  const [period, setPeriod] = useState("daily");

  const rawData = forecast[period] ?? [];

  // Bar chart için her platform ayrı çubuk
  const chartData = rawData.map((item) => ({
    name: item.platform,
    amount: item.amount,
    color: resolveColor(item.platform),
  }));

  const total = rawData.reduce((s, i) => s + (i.amount ?? 0), 0);

  const periodSuffix = { daily: "/ gün", monthly: "/ ay", yearly: "/ yıl" };

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        {/* Başlık */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Tahmini Satış Verisi
          </h3>
          {districtName && (
            <p className="text-sm text-gray-500">
              {districtName}{categoryLabel ? ` · ${categoryLabel}` : ""}
            </p>
          )}
        </div>

        {/* Period seçici */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.key
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.label}
            </button>
          ))}
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
            {/* Toplam banner */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium">Toplam Tahmini Satış</p>
                <p className="text-white text-2xl font-bold">
                  {total.toLocaleString("tr-TR")} ₺
                </p>
              </div>
              <p className="text-white/70 text-sm">{periodSuffix[period]}</p>
            </div>

            {/* Bar chart */}
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Platform özet satırları */}
            <ul className="mt-3 space-y-2">
              {chartData.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {item.amount.toLocaleString("tr-TR")} ₺
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
