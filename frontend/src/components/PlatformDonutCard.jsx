import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PLATFORMS = [
  { key: "ubereats", label: "Uber Eats Trendyol Go", color: "#FF6000" },
  { key: "getir",    label: "Getir",     color: "#5C3EBC" },
  { key: "yemeksepeti", label: "Yemeksepeti", color: "#CC0000" },
];

// platform.name alanını renkle eşleştir
function resolveColor(name) {
  const n = name?.toLowerCase() ?? "";
  if (n.includes("uber") || n.includes("trendyol")) return "#FF6000";
  if (n.includes("getir"))    return "#5C3EBC";
  if (n.includes("yemek"))    return "#CC0000";
  return "#94a3b8";
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-gray-600">{value.toLocaleString("tr-TR")} müşteri</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/**
 * PlatformDonutCard
 *
 * Props:
 *   districtName  — string  (ilçe adı)
 *   platforms     — array   [{ name: string, customers: number }, ...]
 *                   Backend'den gelen veri bu formatta bekleniyor.
 *   loading       — bool    (backend isteği sürüyor mu)
 *   error         — string  (hata mesajı, varsa)
 */
export default function PlatformDonutCard({ districtName, categoryLabel, platforms = [], loading = false, error = null }) {
  const total = platforms.reduce((sum, p) => sum + (p.customers ?? 0), 0);

  const data = platforms.map((p) => ({
    name: p.name,
    value: p.customers ?? 0,
    color: resolveColor(p.name),
  }));

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        {/* Başlık */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Platform Müşteri Dağılımı</h3>
          {districtName && (
            <p className="text-sm text-gray-500">
              {districtName}{categoryLabel ? ` · ${categoryLabel}` : ""}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex justify-center items-center h-48 text-sm text-error">
            {error}
          </div>
        )}

        {/* Chart */}
        {!loading && !error && total > 0 && (
          <>
            <div className="relative" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Ortadaki toplam */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800">{total.toLocaleString("tr-TR")}</span>
                <span className="text-xs text-gray-500">Toplam</span>
              </div>
            </div>

            {/* Legend listesi */}
            <ul className="mt-3 space-y-2">
              {data.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">
                      {item.value.toLocaleString("tr-TR")}
                    </span>
                    <span className="text-gray-400 w-10 text-right">
                      {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Veri yok */}
        {!loading && !error && total === 0 && (
          <div className="flex justify-center items-center h-48 text-sm text-gray-400">
            Veri bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
