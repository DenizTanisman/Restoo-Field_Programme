import React from "react";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * SalesHourHeatmap
 * Props:
 *   title — string
 *   subtitle — string (opsiyonel)
 *   data — number[7][24] (0-100). null/undefined → "?" hücreleri
 *   colorRgb — "239, 68, 68" gibi RGB string (alpha varyasyonu için)
 */
export default function SalesHourHeatmap({ title, subtitle, data, colorRgb = "239, 68, 68" }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm h-full">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Saat başlıkları */}
          <div className="flex items-center mb-1">
            <div className="w-9 shrink-0" />
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-[9px] text-slate-400 text-center min-w-[18px]">
                {h % 6 === 0 ? `${h}` : ""}
              </div>
            ))}
          </div>

          {/* Günler */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-0.5 my-0.5">
              <div className="w-9 shrink-0 text-[11px] text-slate-500 font-medium">{day}</div>
              {HOURS.map((hour) => {
                const value = data?.[dayIdx]?.[hour];
                if (value === null || value === undefined) {
                  return (
                    <div
                      key={hour}
                      className="flex-1 min-w-[18px] h-6 bg-slate-100 rounded-sm flex items-center justify-center text-[9px] text-slate-300"
                    >
                      ?
                    </div>
                  );
                }
                const alpha = Math.max(0.05, Math.min(1, value / 100));
                return (
                  <div
                    key={hour}
                    className="flex-1 min-w-[18px] h-6 rounded-sm"
                    style={{ background: `rgba(${colorRgb}, ${alpha.toFixed(2)})` }}
                    title={`${day} ${hour}:00 — ${value}`}
                  />
                );
              })}
            </div>
          ))}

          {/* Alt etiketler */}
          <div className="flex justify-between mt-2 pl-10 text-[10px] text-slate-400">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// İlçe ortalaması için deterministik tipik teslimat paterni (öğle + akşam pikleri, hafta sonu boost)
export const SAMPLE_DISTRICT_DATA = Array.from({ length: 7 }, (_, dayIdx) =>
  Array.from({ length: 24 }, (_, hour) => {
    let v = 0;
    if (hour >= 11 && hour <= 14) v = 70 + 12 * Math.sin(hour);
    else if (hour >= 18 && hour <= 22) v = 80 + 10 * Math.sin(hour);
    else if (hour >= 8 && hour <= 23) v = 25 + 10 * Math.sin(hour + dayIdx);
    else v = 5 + 3 * Math.sin(hour + dayIdx);
    if (dayIdx >= 5) v *= 1.15; // hafta sonu
    return Math.max(0, Math.min(100, Math.round(v)));
  })
);
