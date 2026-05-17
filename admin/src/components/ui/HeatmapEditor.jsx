import { useMemo, Fragment } from "react";

// 7 gün × 24 saat heatmap editor.
// Her hücre 5 seviyeli (0, 25, 50, 75, 100). Tıkla → bir sonraki seviyeye geçer.
// value: number[7][24] matrix
// onChange(matrix): yeni matris

const LEVELS = [0, 25, 50, 75, 100];
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function levelColor(v) {
  if (v >= 80) return "#dc2626"; // red-600
  if (v >= 60) return "#ea580c"; // orange-600
  if (v >= 40) return "#eab308"; // yellow-500
  if (v >= 20) return "#60a5fa"; // blue-400
  return "#f3f4f6"; // gray-100
}

function nextLevel(v) {
  // En yakın seviyeye snap et, sonra bir sonraki
  const idx = LEVELS.indexOf(Math.round(v / 25) * 25);
  return LEVELS[((idx < 0 ? 0 : idx) + 1) % LEVELS.length];
}

function normalize(value) {
  if (!Array.isArray(value) || value.length !== 7) {
    return Array.from({ length: 7 }, () => Array(24).fill(0));
  }
  return value.map((row) => (Array.isArray(row) && row.length === 24 ? row.map((n) => Number(n) || 0) : Array(24).fill(0)));
}

export default function HeatmapEditor({ value, onChange, disabled = false, note = null }) {
  const grid = useMemo(() => normalize(value), [value]);

  const handleClick = (day, hour) => {
    if (disabled) return;
    const next = grid.map((row, di) => row.map((v, hi) => (di === day && hi === hour ? nextLevel(v) : v)));
    onChange?.(next);
  };

  const handleResetRow = (day) => {
    if (disabled) return;
    const next = grid.map((row, di) => (di === day ? row.map(() => 0) : row));
    onChange?.(next);
  };

  const handleFillRow = (day, level) => {
    if (disabled) return;
    const next = grid.map((row, di) => (di === day ? row.map(() => level) : row));
    onChange?.(next);
  };

  return (
    <div className="text-xs">
      {note && <p className="text-xs opacity-70 mb-2">{note}</p>}
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: "3rem repeat(24, minmax(1.25rem, 1fr)) auto" }}
      >
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={`h-${h}`} className="text-center text-[10px] opacity-50">{h}</div>
        ))}
        <div className="pl-2 text-[10px] opacity-50">satır işlem</div>
        {grid.map((row, di) => (
          <Fragment key={di}>
            <div className="text-right pr-2 opacity-70 self-center">{DAYS[di]}</div>
            {row.map((v, hi) => (
              <button
                key={hi}
                type="button"
                disabled={disabled}
                className="h-6 border border-base-200 hover:ring-1 ring-primary transition-all"
                style={{ backgroundColor: levelColor(v) }}
                onClick={() => handleClick(di, hi)}
                title={`${DAYS[di]} ${String(hi).padStart(2, "0")}:00 — yoğunluk ${v}`}
              />
            ))}
            <div className="pl-2 flex gap-1 items-center self-center">
              <button type="button" className="btn btn-xs btn-ghost" title="Satırı sıfırla" onClick={() => handleResetRow(di)}>×</button>
              <button type="button" className="btn btn-xs btn-ghost" title="Bütün satırı doldur (100)" onClick={() => handleFillRow(di, 100)}>■</button>
            </div>
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center mt-2 opacity-80">
        <span className="opacity-60">Tıklayarak yoğunluğu artır:</span>
        {LEVELS.map((lv) => (
          <span key={lv} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 border border-base-300" style={{ backgroundColor: levelColor(lv) }} />
            <span>{lv}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
