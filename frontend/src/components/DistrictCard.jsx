import React from "react";

const sideLabel = (side) => {
  if (side === "avrupa") return "Avrupa Yakası";
  if (side === "anadolu") return "Anadolu Yakası";
  return "Adalar";
};

const sideFill = (side) => {
  if (side === "avrupa") return "#34699A";
  if (side === "anadolu") return "#59AC77";
  return "#F2C078";
};

const TrendyolIcon = () => (
  <svg width="50" height="70" viewBox="0 0 60 48" fill="none">
    <circle cx="27" cy="20" r="28" fill="#FF6000" />
    <text
      x="24"
      y="23"
      textAnchor="middle"
      fill="white"
      fontSize="15"
      fontWeight="bold"
    >
      TGo
    </text>
  </svg>
);

const GetirIcon = () => (
  <svg width="50" height="70" viewBox="0 0 60 48" fill="none">
    <circle cx="27" cy="20" r="28" fill="#5C3EBC" />
    <text
      x="24"
      y="23"
      textAnchor="middle"
      fill="#FFD603"
      fontSize="15"
      fontWeight="bold"
    >
      getir
    </text>
  </svg>
);

const YemeksepIcon = () => (
  <svg width="50" height="70" viewBox="0 0 60 48" fill="none">
    <circle cx="27" cy="20" r="28" fill="#CC0000" />
    <text
      x="24"
      y="23"
      textAnchor="middle"
      fill="white"
      fontSize="9"
      fontWeight="bold"
    >
      yemeksepeti
    </text>
  </svg>
);

const PLATFORM_ICONS = [<TrendyolIcon />, <GetirIcon />, <YemeksepIcon />];

/**
 * SVG path'inden bounding box hesaplar.
 * M, L, C, Q, A, Z komutlarından x/y koordinatlarını çeker.
 */
function getPathBBox(d) {
  const nums = [];
  // Tüm sayı çiftlerini yakala
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  let match;
  const allNums = [];
  while ((match = regex.exec(d)) !== null) {
    allNums.push(parseFloat(match[0]));
  }

  // Çift indexler x, tek indexler y olarak basitçe yaklaştır
  const xs = allNums.filter((_, i) => i % 2 === 0);
  const ys = allNums.filter((_, i) => i % 2 === 1);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return { minX, maxX, minY, maxY };
}

/**
 * Padding ekleyerek viewBox string'i döner.
 */
function computeViewBox(d, padding = 8) {
  const { minX, maxX, minY, maxY } = getPathBBox(d);
  const x = minX - padding;
  const y = minY - padding;
  const w = maxX - minX + padding * 2;
  const h = maxY - minY + padding * 2;
  return `${x} ${y} ${w} ${h}`;
}

function PlatformColumn({ title, platforms }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 truncate">
        {title}
      </p>
      <div className="flex flex-col gap-3">
        {platforms.map((platform, i) => (
          <div key={platform.name} className="flex items-center gap-3">
            {PLATFORM_ICONS[i]}
            <div>
              <span className="text-xl font-bold block leading-none">{platform.customers}</span>
              <span className="text-xs text-gray-500">Aktif Müşteri</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DistrictCard({ selectedInfo, selectedPath, selectedCategory, selectedNeighborhood, neighborhoodInfo }) {
  if (!selectedInfo) return null;

  const viewBox = selectedPath ? computeViewBox(selectedPath.d) : "0 0 100 100";
  const categoryLabel = selectedCategory?.label ?? null;

  const districtTitle = categoryLabel
    ? `${selectedInfo.name} · ${categoryLabel}`
    : `${selectedInfo.name} · Tüm Kategoriler`;

  const neighborhoodTitle = selectedNeighborhood
    ? categoryLabel
      ? `${selectedNeighborhood} · ${categoryLabel}`
      : `${selectedNeighborhood} · Tüm Kategoriler`
    : null;

  return (
    <div className="card bg-white shadow-md animate-[fadeIn_0.25s_ease] mb-6 text-gray-900">
      <div className="card-body">
        {/* Üst: ilçe adı + mini harita */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <h2 className="text-4xl font-semibold text-gray-900">{selectedInfo.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{sideLabel(selectedInfo.side)}</p>
            {categoryLabel && (
              <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
                {categoryLabel}
              </span>
            )}
          </div>
          {selectedPath && (
            <svg
              viewBox={viewBox}
              width="220"
              height="160"
              xmlns="http://www.w3.org/2000/svg"
              style={{ overflow: "visible" }}
            >
              <path
                d={selectedPath.d}
                fill={sideFill(selectedInfo.side)}
                stroke="white"
                strokeWidth="0.8"
              />
            </svg>
          )}
        </div>

        {/* Platform kolonları: ilçe + mahalle yan yana */}
        <div className="flex gap-6 divide-x divide-gray-100">
          <PlatformColumn title={districtTitle} platforms={selectedInfo.platforms} />
          <div className="pl-6 flex-1 min-w-0">
            {selectedNeighborhood && neighborhoodInfo ? (
              <PlatformColumn title={neighborhoodTitle} platforms={neighborhoodInfo.platforms} />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Mahalle Seçilmedi
                </p>
                {selectedInfo.platforms.map((_, i) => (
                  <div key={i} className="flex items-center gap-3 opacity-30">
                    {PLATFORM_ICONS[i]}
                    <div>
                      <span className="text-xl font-bold block leading-none">—</span>
                      <span className="text-xs text-gray-500">Aktif Müşteri</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
