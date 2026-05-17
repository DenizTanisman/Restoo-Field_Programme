import { useEffect, useState } from "react";
import { api } from "../api/client";
import { districts as MAP_DISTRICTS } from "../data/mapData";

const SORTED_DISTRICTS = [...MAP_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name, "tr"));

const FALLBACK_PLATFORM_BG = {
  "Yemeksepeti": "bg-pink-500",
  "Getir": "bg-purple-700",
  "Uber Eats": "bg-orange-500",
  "Trendyol Yemek": "bg-orange-500",
};

const RATING_COLORS = {
  5: "bg-green-500",
  4: "bg-emerald-400",
  3: "bg-amber-400",
  2: "bg-orange-500",
  1: "bg-red-500",
};

const WORD_COLORS = ["text-red-500", "text-red-700", "text-purple-600", "text-orange-500", "text-base-content", "text-base-content/70", "text-amber-500"];

function ThumbDownIcon({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#FEE2E2" />
      <path
        d="M30 12H34C35.1 12 36 12.9 36 14V24C36 25.1 35.1 26 34 26H30M30 12L24 38C22.9 38 22 37.1 22 36V30H15C13.3 30 12 28.7 12 27C12 26.6 12.08 26.22 12.22 25.86L16 17C16.48 15.8 17.66 12 19 12H30Z"
        stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendDownIcon({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#EDE9FE" />
      <polyline points="10,16 18,28 26,20 38,32" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="30,32 38,32 38,24" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarOutlineIcon({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#FEF3C7" />
      <path d="M24 10L27.6 19.4L38 19.5L30.1 25.5L32.9 35L24 29.5L15.1 35L17.9 25.5L10 19.5L20.4 19.4Z" stroke="#F59E0B" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ Icon, label, value, valueClass }) {
  return (
    <div className="bg-base-100 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-base-300">
      <Icon className="w-12 h-12 shrink-0" />
      <div>
        <p className="text-xs text-base-content/50 mb-0.5">{label}</p>
        <p className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function PlatformChart({ rows }) {
  return (
    <div className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-300">
      <h2 className="text-xs font-bold text-base-content/70 mb-4">
        Platform Bazlı Olumsuz Yorum Dağılımı
      </h2>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-xs italic text-base-content/50">Veri yok — admin panelinden ekle</p>}
        {rows.map((p, idx) => {
          const pct = Math.max(0, Math.min(100, Number(p.percent) || 0));
          const barColor = p.color_hex || null;
          return (
            <div key={`${p.label}-${idx}`} className="flex items-center gap-3">
              {p.logo_url ? (
                <img
                  src={p.logo_url}
                  alt={p.label || ""}
                  className="w-8 h-8 rounded-full object-cover bg-base-100 shrink-0 border border-base-300"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-base-300 shrink-0 flex items-center justify-center text-[10px] font-bold text-base-content/70">
                  {(p.label || "?").slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="flex-1 bg-base-200 rounded-md h-8 overflow-hidden">
                <div
                  className={barColor ? "h-full rounded-md flex items-center pl-3" : `${FALLBACK_PLATFORM_BG[p.label] || "bg-slate-400"} h-full rounded-md flex items-center pl-3`}
                  style={{ width: `${pct}%`, ...(barColor ? { backgroundColor: barColor } : {}) }}
                >
                  <span className="text-white text-xs font-semibold truncate">{p.label || "—"}</span>
                </div>
              </div>
              <span className="text-[10px] text-base-content/60 w-10 text-right shrink-0">%{pct.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 w-[72px] justify-end shrink-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-xs ${i < count ? "text-amber-400" : "text-gray-200"}`}>★</span>
      ))}
    </div>
  );
}

function RatingChart({ rows }) {
  return (
    <div className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-300">
      <h2 className="text-xs font-bold text-base-content/70 mb-4">Puan Dağılımı</h2>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const pct = Math.max(0, Math.min(100, Number(r.percent) || 0));
          return (
            <div key={r.stars} className="flex items-center gap-2">
              <Stars count={r.stars} />
              <div className="flex-1 bg-base-200 rounded h-6 overflow-hidden">
                <div className={`${RATING_COLORS[r.stars] || "bg-slate-400"} h-full rounded flex items-center pl-2`} style={{ width: `${pct}%` }}>
                  <span className="text-black text-[10px] font-bold">%{pct.toFixed(0)}</span>
                </div>
              </div>
              <span className="text-[10px] text-base-content/50 w-28 text-right shrink-0">
                {(Number(r.count) || 0).toLocaleString("tr-TR")} Değerlendirme
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function riskBadge(risk) {
  if (risk === "Yüksek Risk") return "bg-red-100 text-red-700";
  if (risk === "Orta") return "bg-orange-100 text-orange-600";
  return "bg-green-100 text-green-700";
}

function riskBar(risk) {
  if (risk === "Yüksek Risk") return "bg-red-500";
  if (risk === "Orta") return "bg-amber-400";
  return "bg-green-500";
}

function DistrictRanking({ rows }) {
  return (
    <div className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-300">
      <h2 className="text-xs font-bold text-base-content/70 mb-4">İlçe Bazlı Olumsuz Yorum Oranı</h2>
      {rows.length === 0 && <p className="text-xs italic text-base-content/50">Henüz veri yok — admin panelinden metric ekle</p>}
      <div className="space-y-2">
        {rows.map((d) => {
          const pct = Math.max(0, Math.min(100, Number(d.percent) || 0));
          return (
            <div key={d.district_id} className="flex items-center gap-2">
              <span className="text-[10px] text-base-content/60 w-24 shrink-0 truncate">{d.district_name}</span>
              <div className="flex-1 bg-base-200 rounded h-5 overflow-hidden">
                <div className={`${riskBar(d.risk)} h-full rounded flex items-center pl-2`} style={{ width: `${pct}%` }}>
                  <span className="text-[9px] text-white font-bold">%{pct.toFixed(0)}</span>
                </div>
              </div>
              <span className="text-[9px] text-base-content/50 w-16 text-right shrink-0">
                {(Number(d.count) || 0).toLocaleString("tr-TR")} Yorum
              </span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${riskBadge(d.risk)}`}>
                {d.risk}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WordCloud({ words }) {
  return (
    <div className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-300">
      <h2 className="text-xs font-bold text-base-content/70 mb-4">En Çok Geçen Şikayet Kelimeleri</h2>
      {words.length === 0 && <p className="text-xs italic text-base-content/50">Kelime yok — admin panelinden ekle</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
        {words.map((w, idx) => {
          const weight = Math.max(0.5, Math.min(5, Number(w.weight) || 1));
          const size = Math.round(12 + weight * 4);
          const color = WORD_COLORS[idx % WORD_COLORS.length];
          return (
            <span key={`${w.text}-${idx}`} className={`font-bold cursor-default select-none leading-tight ${color}`} style={{ fontSize: `${size}px` }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const RATING_DEFAULTS = [
  { stars: 5, percent: 0, count: 0 },
  { stars: 4, percent: 0, count: 0 },
  { stars: 3, percent: 0, count: 0 },
  { stars: 2, percent: 0, count: 0 },
  { stars: 1, percent: 0, count: 0 },
];

export default function CommentAnalist({ districtId, neighborhoodId, neighborhoodName, metrics }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState(districtId || "");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(neighborhoodId || "");
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [districtRanking, setDistrictRanking] = useState([]);
  const [platformsList, setPlatformsList] = useState([]); // {id, name, logo_url, color_hex}

  useEffect(() => {
    let alive = true;
    api.getPlatforms()
      .then((data) => { if (alive) setPlatformsList(data); })
      .catch(() => alive && setPlatformsList([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    api.getCommentsByDistrict()
      .then((data) => { if (alive) setDistrictRanking(data); })
      .catch(() => alive && setDistrictRanking([]));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (districtId) setSelectedDistrictId(districtId);
  }, [districtId]);
  useEffect(() => {
    if (neighborhoodId) setSelectedNeighborhoodId(neighborhoodId);
  }, [neighborhoodId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setNeighborhoods([]);
      return;
    }
    let alive = true;
    api
      .getDistrictNeighborhoods(selectedDistrictId)
      .then((data) => { if (alive) setNeighborhoods(data); })
      .catch(() => alive && setNeighborhoods([]));
    return () => { alive = false; };
  }, [selectedDistrictId]);

  const handleDistrictChange = (e) => {
    setSelectedDistrictId(e.target.value);
    setSelectedNeighborhoodId("");
  };

  const m = metrics || {};
  const total = Number(m.negative_comment_total) || 0;
  const rate = Number(m.negative_comment_rate) || 0;
  const avgRating = Number(m.negative_avg_rating) || 0;
  const platformRows = Array.isArray(m.platform_negative_distribution) ? m.platform_negative_distribution : [];
  const ratingRows = Array.isArray(m.rating_distribution) && m.rating_distribution.length > 0
    ? RATING_DEFAULTS.map((d) => m.rating_distribution.find((r) => r.stars === d.stars) || d)
    : RATING_DEFAULTS;
  const words = Array.isArray(m.negative_word_cloud) ? m.negative_word_cloud : [];

  // Platform rows için label/logo resolution — admin'de id giriliyor, biz logo + name görmek istiyoruz
  const platformsById = Object.fromEntries(platformsList.map((p) => [p.id, p]));
  const platformDisplayRows = platformRows.map((row) => {
    const meta = platformsById[row.platform_id] || {};
    return {
      label: meta.name || row.name || row.label || `Platform ${row.platform_id ?? ""}`,
      logo_url: meta.logo_url || null,
      color_hex: meta.color_hex || null,
      percent: row.percent,
    };
  });

  return (
    <div className="font-sans">
      <div className="bg-base-100 rounded-3xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-base-300">
          <h1 className="text-2xl font-bold text-base-content text-center mb-4">
            Olumsuz Yorumlar Analiz Paneli (1 Ay)
          </h1>
          <div className="flex flex-wrap gap-2 justify-center">
            <select
              value={selectedDistrictId}
              onChange={handleDistrictChange}
              className="text-sm border border-base-300 rounded-lg px-3 py-1.5 bg-base-100 text-base-content outline-none cursor-pointer"
            >
              <option value="">İlçe seç</option>
              {SORTED_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select
              value={selectedNeighborhoodId}
              onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
              disabled={!selectedDistrictId}
              className="text-sm border border-base-300 rounded-lg px-3 py-1.5 bg-base-100 text-base-content outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Tüm mahalleler</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-base-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <MetricCard Icon={ThumbDownIcon}  label="Toplam Olumsuz Yorum" value={total.toLocaleString("tr-TR")} valueClass="text-red-500" />
            <MetricCard Icon={TrendDownIcon}  label="Olumsuz Yorum Oranı"  value={`%${rate.toFixed(0)}`} valueClass="text-orange-500" />
            <MetricCard Icon={StarOutlineIcon} label="Ortalama Puan"       value={avgRating.toFixed(1)} valueClass="text-amber-500" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <PlatformChart rows={platformDisplayRows} />
            <RatingChart rows={ratingRows} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <WordCloud words={words} />
            <DistrictRanking rows={districtRanking} />
          </div>
        </div>
      </div>
    </div>
  );
}
