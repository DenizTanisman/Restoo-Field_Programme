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

const UberEatsIcon = () => (
  <img src="/logos/ubereats.png" alt="Uber Eats" className="w-12 h-12 object-contain" />
);

const GetirIcon = () => (
  <img src="/logos/getir.png" alt="Getir" className="w-12 h-12 object-contain" />
);

const YemeksepIcon = () => (
  <img src="/logos/yemeksepeti.png" alt="Yemeksepeti" className="w-12 h-12 object-contain" />
);

const PLATFORM_ICONS = [<UberEatsIcon />, <GetirIcon />, <YemeksepIcon />];

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

export default function DistrictCard({
  selectedInfo,
  selectedPath,
  onClose,
  restaurants,
}) {
  if (!selectedInfo) return null;

  const viewBox = selectedPath ? computeViewBox(selectedPath.d) : "0 0 100 100";

  return (
    <div className="card bg-base-100 shadow-md animate-[fadeIn_0.25s_ease] mb-6 text-base-content">
      <div className="card-body">
        {/* İlçe adı + mini harita */}
        <div className="flex items-center justify-center gap-8 mb-5">
          <div className="text-center">
            <h2 className="text-4xl font-semibold text-base-content">
              {selectedInfo.name}
            </h2>
            <p className="text-sm text-base-content/60 mt-1">
              {sideLabel(selectedInfo.side)}
            </p>
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

        {/* Platform satırları */}
        <div className="flex flex-wrap gap-4 mt-6">
          {selectedInfo.platforms.map((platform, i) => (
            <div
              key={platform.name}
              className="bg-base-200  rounded-xl p-4 
              flex flex-col items-center justify-center text-center shadow-sm
              w-full sm:w-[48%] md:w-[32%]"
            >
              <div className="flex items-center gap-2">
                <div className="mb-2">{PLATFORM_ICONS[i]}</div>

                <h3 className="text-lg font-semibold text-base-content mb-2">
                  {platform.name}
                </h3>
              </div>

              <div className="bg-blue-100 text-base-content text-sm px-4 py-1 rounded-md mb-4">
                {platform.customers} Kullanıcı
              </div>

              <div className="bg-blue-100 text-base-content text-sm px-4 py-1 rounded-md">
                {platform.restaurants} Restoran
              </div>
            </div>
          ))}
          <div className="w-full  border-base-300 text-xs text-base-content/70">
            <span className="font-medium text-base-content">
              Kullanıcı/Restoran Oranı:
            </span>
            <span className="ml-1 text-base-content font-semibold">
              144.7x
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
