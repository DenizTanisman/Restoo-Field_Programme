import { useEffect, useState } from "react";
import { api } from "../api/client";
import { districts as MAP_DISTRICTS } from "../data/mapData";




const PLATFORMS = [
  { id: "Y", label: "Yemeksepeti", logo: "/logos/yemeksepeti.png", bg: "bg-pink-500",   pct: 85 },
  { id: "G", label: "Getir",       logo: "/logos/getir.png",       bg: "bg-purple-700", pct: 60 },
  { id: "U", label: "Uber Eats Trendyol Go", logo: "/logos/ubereats.png", bg: "bg-orange-500", pct: 42 },
];

const RATINGS = [
  { stars: 5, pct: 10, count: "500",   bg: "bg-green-500"   },
  { stars: 4, pct: 10, count: "500",   bg: "bg-emerald-400" },
  { stars: 3, pct: 15, count: "750",   bg: "bg-amber-400"   },
  { stars: 2, pct: 25, count: "1.250", bg: "bg-orange-500"  },
  { stars: 1, pct: 40, count: "2.000", bg: "bg-red-500"     },
];

const WORDS = [
  { text: "Soğuk",           tw: "text-3xl text-red-500"    },
  { text: "Kötü",            tw: "text-2xl text-red-700"    },
  { text: "bayat",           tw: "text-xl  text-purple-600" },
  { text: "geç",             tw: "text-xl  text-orange-500" },
  { text: "uzun bekleme",    tw: "text-lg  text-gray-800"   },
  { text: "bozuk kargo",     tw: "text-xl  text-red-700"    },
  { text: "pahalı",          tw: "text-lg  text-red-500"    },
  { text: "iade",            tw: "text-base text-gray-600"  },
  { text: "gecikmeli",       tw: "text-lg  text-gray-800"   },
  { text: "eksik",           tw: "text-sm  text-gray-400"   },
  { text: "yetersiz",        tw: "text-sm  text-gray-500"   },
  { text: "berbat",          tw: "text-xs  text-gray-300"   },
  { text: "rezalet",         tw: "text-xs  text-gray-400"   },
  { text: "hayal kırıklığı", tw: "text-base text-gray-500"  },
  { text: "ilgisiz",         tw: "text-xl  text-red-500"    },
  { text: "kirli",           tw: "text-xs  text-gray-300"   },
  { text: "tatsız",          tw: "text-lg  text-purple-600" },
  { text: "yanlış",          tw: "text-sm  text-gray-400"   },
];

const DISTRICTS = [
  { name: "Bağcılar",      pct: 34, count: "218", bar: "bg-red-500",    badge: "bg-red-100 text-red-700",       risk: "Yüksek Risk" },
  { name: "Esenler",       pct: 31, count: "174", bar: "bg-red-500",    badge: "bg-red-100 text-red-700",       risk: "Yüksek Risk" },
  { name: "Bayrampaşa",    pct: 29, count: "143", bar: "bg-orange-500", badge: "bg-red-100 text-red-700",       risk: "Yüksek Risk" },
  { name: "Gaziosmanpaşa", pct: 27, count: "131", bar: "bg-orange-400", badge: "bg-orange-100 text-orange-600", risk: "Orta"        },
  { name: "Sultangazi",    pct: 26, count: "120", bar: "bg-amber-400",  badge: "bg-orange-100 text-orange-600", risk: "Orta"        },
  { name: "Üsküdar",       pct: 23, count: "108", bar: "bg-amber-400",  badge: "bg-orange-100 text-orange-600", risk: "Orta"        },
  { name: "Kadıköy",       pct: 19, count: "92",  bar: "bg-yellow-400", badge: "bg-green-100 text-green-700",   risk: "İyi"         },
  { name: "Beşiktaş",      pct: 16, count: "74",  bar: "bg-green-400",  badge: "bg-green-100 text-green-700",   risk: "İyi"         },
  { name: "Bakırköy",      pct: 14, count: "61",  bar: "bg-green-500",  badge: "bg-green-100 text-green-700",   risk: "İyi"         },
  { name: "Sarıyer",       pct: 12, count: "48",  bar: "bg-green-600",  badge: "bg-green-100 text-green-700",   risk: "İyi"         },
];

const SORTED_DISTRICTS = [...MAP_DISTRICTS].sort((a, b) => a.name.localeCompare(b.name, "tr"));



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
      <polyline
        points="10,16 18,28 26,20 38,32"
        stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <polyline
        points="30,32 38,32 38,24"
        stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function StarOutlineIcon({ className = "w-10 h-10" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#FEF3C7" />
      <path
        d="M24 10L27.6 19.4L38 19.5L30.1 25.5L32.9 35L24 29.5L15.1 35L17.9 25.5L10 19.5L20.4 19.4Z"
        stroke="#F59E0B" strokeWidth="2.2" strokeLinejoin="round"
      />
    </svg>
  );
}



function MetricCard({ Icon, label, value, valueClass }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-gray-100">
      <Icon className="w-12 h-12 shrink-0" />
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className={`text-3xl font-bold tracking-tight ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function PlatformChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-xs font-bold text-gray-600 mb-4">
        Platform Bazlı Olumsuz Yorum Dağılımı
      </h2>
      <div className="space-y-3">
        {PLATFORMS.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            <img src={p.logo} alt={p.label} className="w-8 h-8 rounded-full object-cover shrink-0 bg-white" />
            <div className="flex-1 bg-gray-100 rounded-md h-8 overflow-hidden">
              <div
                className={`${p.bg} h-full rounded-md flex items-center pl-3`}
                style={{ width: `${p.pct}%` }}
              >
                <span className="text-white text-xs font-semibold truncate">{p.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 pl-11">
        {["%0", "%30", "%60", "%90", "%100"].map((l) => (
          <span key={l} className="text-[9px] text-gray-400">{l}</span>
        ))}
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

function RatingChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-xs font-bold text-gray-600 mb-4">Puan Dağılımı</h2>
      <div className="space-y-2.5">
        {RATINGS.map((r) => (
          <div key={r.stars} className="flex items-center gap-2">
            <Stars count={r.stars} />
            <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
              <div
                className={`${r.bg} h-full rounded flex items-center pl-2`}
                style={{ width: `${r.pct}%` }}
              >
                <span className="text-black text-[10px] font-bold">%{r.pct}</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 w-28 text-right shrink-0">
              {r.count} Değerlendirme
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordCloud() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-xs font-bold text-gray-600 mb-4">
        En Çok Geçen Şikayet Kelimeleri
      </h2>
      <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
        {WORDS.map((w) => (
          <span
            key={w.text}
            className={`font-bold cursor-default select-none leading-tight hover:opacity-70 transition-opacity ${w.tw}`}
          >
            {w.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function DistrictChart() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h2 className="text-xs font-bold text-gray-600 mb-4">
        İlçe Bazlı Olumsuz Yorum Oranı
      </h2>
      <div className="space-y-2">
        {DISTRICTS.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-24 shrink-0 truncate">{d.name}</span>
            <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
              <div
                className={`${d.bar} h-full rounded flex items-center pl-2`}
                style={{ width: `${d.pct}%` }}
              >
                <span className="text-[9px] text-white font-bold">%{d.pct}</span>
              </div>
            </div>
            <span className="text-[9px] text-gray-400 w-16 text-right shrink-0">
              {d.count} Yorum
            </span>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${d.badge}`}>
              {d.risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}



export default function OlumsuzYorumlarPaneli({ districtId, neighborhoodId, neighborhoodName }) {
  const [selectedDistrictId, setSelectedDistrictId] = useState(districtId || "");
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(neighborhoodId || "");
  const [neighborhoods, setNeighborhoods] = useState([]);

  // Ana sayfadan gelen prop değişirse senkronize et
  useEffect(() => {
    if (districtId) setSelectedDistrictId(districtId);
  }, [districtId]);
  useEffect(() => {
    if (neighborhoodId) setSelectedNeighborhoodId(neighborhoodId);
  }, [neighborhoodId]);

  // İlçe seçilince mahalleleri çek
  useEffect(() => {
    if (!selectedDistrictId) {
      setNeighborhoods([]);
      return;
    }
    let alive = true;
    api
      .getDistrictNeighborhoods(selectedDistrictId)
      .then((data) => {
        if (alive) setNeighborhoods(data);
      })
      .catch(() => alive && setNeighborhoods([]));
    return () => { alive = false; };
  }, [selectedDistrictId]);

  const handleDistrictChange = (e) => {
    setSelectedDistrictId(e.target.value);
    setSelectedNeighborhoodId(""); // ilçe değişince mahalle sıfırla
  };

  return (
    <div className="font-sans">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">
            Olumsuz Yorumlar Analiz Paneli (1 Ay)
          </h1>
          <div className="flex flex-wrap gap-2 justify-center">
            <select
              value={selectedDistrictId}
              onChange={handleDistrictChange}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none cursor-pointer"
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
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="">Tüm mahalleler</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-5 space-y-4 bg-gray-50">

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <MetricCard Icon={ThumbDownIcon}  label="Toplam Olumsuz Yorum" value="1,452" valueClass="text-red-500"    />
            <MetricCard Icon={TrendDownIcon}  label="Olumsuz Yorum Oranı"  value="%25"   valueClass="text-orange-500" />
            <MetricCard Icon={StarOutlineIcon} label="Ortalama Puan"        value="2.6"   valueClass="text-amber-500"  />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <PlatformChart />
            <RatingChart />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <WordCloud />
            <DistrictChart />
          </div>

        </div>
      </div>
    </div>
  );
}
