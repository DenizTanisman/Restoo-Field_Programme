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

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
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
