// HomePage.jsx
import React, { useState } from "react";
import IstanbulMap from "../components/IstanbulMap";
import { districts } from "../data/mapData";
import SearchBar from "../components/SearchBar";
import DistrictCard from "../components/DistrictCard";

// Platform mock data
const getMockData = (districtName) => ({
  platforms: [
    {
      name: "Trendyol Go",
      customers: Math.floor(Math.random() * 200 + 50),
    },
    {
      name: "Getir",
      customers: Math.floor(Math.random() * 200 + 50),
    },
    {
      name: "Yemeksepeti",
      customers: Math.floor(Math.random() * 200 + 50),
    },
  ],
});

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

export default function HomePage() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);

  const handleDistrictClick = (id, name, side) => {
    if (selectedDistrict === id) {
      setSelectedDistrict(null);
      setSelectedInfo(null);
    } else {
      setSelectedDistrict(id);
      setSelectedInfo({ id, name, side, ...getMockData(name) });
    }
  };

  const selectedPath = districts.find((d) => d.id === selectedDistrict);

  return (
    <div className="min-h-screen font-sans">
      {/* İçerik */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Harita */}
        <div className="flex justify-center mb-6">
          <div className="w-full">
            <IstanbulMap
              selectedDistrict={selectedDistrict}
              onDistrictClick={handleDistrictClick}
            />
          </div>
        </div>

        <DistrictCard selectedInfo={selectedInfo} selectedPath={selectedPath}/>
      </div>
    </div>
  );
}
