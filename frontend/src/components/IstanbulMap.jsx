import { useState } from "react";
import { districts } from "../data/mapData";

const COLORS = {
  default: { avrupa: "#34699A", anadolu: "#59AC77", adalar: "#F2C078" },
  selected: { avrupa: "#0f3659", anadolu: "#3A6F43", adalar: "#FE5D26" },
};

export default function IstanbulMap({ onDistrictClick, selectedDistrict }) {
  return (
    <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <g>
        {districts.map((district) => {
          const isSelected = selectedDistrict === district.id;
          const fill = isSelected
            ? COLORS.selected[district.side]
            : COLORS.default[district.side];

          return (
            <path
              key={district.id}
              id={district.id}
              d={district.d}
              fill={fill}
              stroke="white"
              strokeWidth="0.8"
              style={{ cursor: "pointer", transition: "fill 0.15s" }}
              onClick={() =>
                onDistrictClick(district.id, district.name, district.side)
              }
              onMouseEnter={(e) => {
                if (!isSelected) e.target.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = "1";
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
