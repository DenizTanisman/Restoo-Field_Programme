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
    <div className="bg-base-100 border border-base-300 rounded-lg px-3 py-2 shadow text-sm">
      <p className="font-semibold text-base-content">{name}</p>
      <p className="text-base-content/70">{value.toLocaleString("tr-TR")} müşteri</p>
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
const FALLBACK_DATA = PLATFORMS.map((p) => ({ name: p.label, value: 1, color: "#e2e8f0" }));

export default function PlatformDonutCard({ districtName, categoryLabel, platforms = [], loading = false, error = null }) {
  const total = platforms.reduce((sum, p) => sum + (p.customers ?? 0), 0);

  const realData = platforms.map((p) => ({
    name: p.name,
    value: p.customers ?? 0,
    color: resolveColor(p.name),
  }));
  const data = total > 0 ? realData : FALLBACK_DATA;
  const displayList = total > 0 ? realData : PLATFORMS.map((p) => ({ name: p.label, value: 0, color: resolveColor(p.label) }));

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        {/* Başlık */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-base-content">Platform Müşteri Dağılımı</h3>
          {districtName && (
            <p className="text-sm text-base-content/60">
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

        {/* Chart — her zaman görünür; veri yokken boş gri donut */}
        {!loading && !error && (
          <>
            <div className="relative select-none" style={{ height: 220 }}>
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
                    label={total > 0 ? renderCustomLabel : undefined}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {total > 0 && <Tooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-base-content">{total.toLocaleString("tr-TR")}</span>
                <span className="text-xs text-base-content/60">Toplam</span>
              </div>
            </div>

            {/* Her platform için iki istatistik kutusu: aktif müşteri + restoran sayısı */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {displayList.map((item) => {
                // Restoran sayısı: backend platforms[].restaurants alanından (varsa)
                const matched = platforms.find((p) => p.name === item.name);
                const restaurantCount = matched?.restaurants ?? 0;
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={item.name} className="flex flex-col">
                    <div className="flex items-center gap-1 mb-1 min-h-[20px]">
                      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] font-medium text-base-content truncate" title={item.name}>{item.name}</span>
                    </div>
                    <div className="rounded-lg p-2 mb-1.5 text-center" style={{ backgroundColor: item.color + "1A" /* %10 opacity */ }}>
                      <p className="text-[10px] text-base-content/60 mb-0.5">Aktif müşteri</p>
                      <p className="text-base font-bold" style={{ color: item.color }}>{item.value.toLocaleString("tr-TR")}</p>
                      <p className="text-[10px] text-base-content/50 mt-0.5">%{percent}</p>
                    </div>
                    <div className="rounded-lg p-2 text-center bg-base-200 border border-base-300">
                      <p className="text-[10px] text-base-content/60 mb-0.5">Restoran</p>
                      <p className="text-base font-bold text-base-content">{restaurantCount.toLocaleString("tr-TR")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
