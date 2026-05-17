import { useState, useRef } from "react";
import { districts } from "../data/mapData";

const COLORS = {
  default: { avrupa: "#34699A", anadolu: "#59AC77", adalar: "#F2C078" },
  selected: { avrupa: "#0f3659", anadolu: "#3A6F43", adalar: "#FE5D26" },
};

const SIDE_LABEL = {
  avrupa: "Avrupa Yakası",
  anadolu: "Anadolu Yakası",
  adalar: "Adalar",
};

function pathBBox(d, padding = 6) {
  const nums = [];
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  let m;
  while ((m = regex.exec(d)) !== null) nums.push(parseFloat(m[0]));
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
}

function DistrictPath({ district, isSelected, onDistrictClick, onHover }) {
  const fill = isSelected
    ? COLORS.selected[district.side]
    : COLORS.default[district.side];

  return (
    <g
      onClick={() => onDistrictClick(district.id, district.name, district.side)}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.opacity = "0.75";
        onHover(district, e);
      }}
      onMouseMove={(e) => onHover(district, e)}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        onHover(null, e);
      }}
    >
      <path
        d={district.d}
        fill={fill}
        stroke="white"
        strokeWidth="0.8"
        style={{ transition: "fill 0.15s" }}
      />
    </g>
  );
}

export default function IstanbulMap({ onDistrictClick, selectedDistrict }) {
  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  const handleHover = (district, e) => {
    if (!district) {
      setTooltip(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({
      name: district.name,
      side: district.side,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const selectedObj = districts.find((d) => d.id === selectedDistrict);
  const selectedName = selectedObj?.name;
  const selectedFill = selectedObj
    ? COLORS.selected[selectedObj.side]
    : null;

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div className="absolute top-3 right-4 z-10 pointer-events-none flex items-center gap-3 bg-base-100/80 backdrop-blur px-4 py-2 rounded-lg shadow-md">
        {selectedObj && (
          <svg
            viewBox={pathBBox(selectedObj.d)}
            width="40"
            height="32"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible" }}
          >
            <path d={selectedObj.d} fill={selectedFill} stroke="white" strokeWidth="0.8" />
          </svg>
        )}
        <span className="text-xl font-bold text-base-content">
          İstanbul{selectedName ? ` / ${selectedName}` : ""}
        </span>
      </div>
      <svg
        viewBox="0 65 305 170"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <g>
          {districts.map((district) => (
            <DistrictPath
              key={district.id}
              district={district}
              isSelected={selectedDistrict === district.id}
              onDistrictClick={onDistrictClick}
              onHover={handleHover}
            />
          ))}
        </g>
      </svg>

      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 14,
            top: tooltip.y - 36,
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "rgba(15,22,36,0.92)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "5px 11px",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
              {tooltip.name}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                marginLeft: 7,
              }}
            >
              {SIDE_LABEL[tooltip.side]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
