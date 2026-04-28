// HomePage.jsx
import React, { useState } from "react";
import IstanbulMap from "../components/IstanbulMap";
import { districts } from "../data/mapData";
import SearchBar from "../components/SearchBar";
import DistrictCard from "../components/DistrictCard";
import PlatformDonutCard from "../components/PlatformDonutCard";
import BudgetAnalyticsCard from "../components/BudgetAnalyticsCard";
import SalesForecastCard from "../components/SalesForecastCard";
import NeighborhoodCard from "../components/NeighborhoodCard";
import { restourants } from "../data/mock/restourantData";
import RestaurantCard from "../components/RestourantCard";
import SideBarDistricts from "../components/SideBarDistricts";
import SideBarCategories from "../components/SideBarCategories";
import Kiyaslama from "../components/Kiyaslama";
import RestaurantCaseStudy from "../components/RestaurantCaseStudy";
import LoyaltyPage from "../components/LoyaltyPage";
import ComparisonDashboard from "../components/ComparisonDashboard";

// Kategori seçilince seed üretir, aynı isim+kategori çifti hep aynı sayıyı verir
function seededRand(seed, min, max) {
  const x = Math.sin(seed + 1) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Platform mock data
const getMockData = (districtName, categoryLabel = "") => {
  const base = hashStr(districtName + categoryLabel);
  // kategori varsa değerleri biraz ölçekle (simüle edilmiş filtre etkisi)
  const scale = categoryLabel ? 0.4 : 1;
  const r = (i, min, max) => Math.floor(seededRand(base + i, min, max) * scale + min * (1 - scale));

  return {
    platforms: [
      { name: "Trendyol Go",  customers: r(1, 50, 250) },
      { name: "Getir",        customers: r(2, 50, 250) },
      { name: "Yemeksepeti",  customers: r(3, 50, 250) },
    ],
    budget: {
      adBudget:     r(4, 2000, 10000),
      campaignRate: r(5, 30, 80),
      couponRate:   r(6, 20, 60),
      flashRate:    r(7, 15, 50),
      jokerRate:    r(8, 10, 35),
    },
    forecast: {
      daily: [
        { platform: "Trendyol Go",  amount: r(9,  1000, 6000) },
        { platform: "Getir",        amount: r(10, 1000, 6000) },
        { platform: "Yemeksepeti",  amount: r(11, 1000, 6000) },
      ],
      monthly: [
        { platform: "Trendyol Go",  amount: r(12, 30000, 180000) },
        { platform: "Getir",        amount: r(13, 30000, 180000) },
        { platform: "Yemeksepeti",  amount: r(14, 30000, 180000) },
      ],
      yearly: [
        { platform: "Trendyol Go",  amount: r(15, 500000, 2500000) },
        { platform: "Getir",        amount: r(16, 500000, 2500000) },
        { platform: "Yemeksepeti",  amount: r(17, 500000, 2500000) },
      ],
    },
  };
};

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
  const [restourant, setRestourant] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoodInfo, setNeighborhoodInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDistrictClick = (id, name, side) => {
    setRestourant(null);
    setSearchQuery("");
    if (selectedDistrict === id) {
      setSelectedDistrict(null);
      setSelectedInfo(null);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
    } else {
      setSelectedDistrict(id);
      setSelectedInfo({ id, name, side, ...getMockData(name, selectedCategory?.label ?? "") });
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
    }
  };

  const handleNeighborhoodSelect = (neighborhoodName) => {
    if (!neighborhoodName) {
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
    } else {
      setSelectedNeighborhood(neighborhoodName);
      setNeighborhoodInfo(getMockData(neighborhoodName, selectedCategory?.label ?? ""));
    }
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    // Seçili ilçe varsa analizleri yeniden hesapla
    if (selectedInfo) {
      setSelectedInfo((prev) => ({
        ...prev,
        ...getMockData(prev.name, cat?.label ?? ""),
      }));
    }
    if (selectedNeighborhood) {
      setNeighborhoodInfo(getMockData(selectedNeighborhood, cat?.label ?? ""));
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setRestourant(null);
      setSelectedInfo(null);
      setSelectedDistrict(null);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      setSelectedCategory(null);
    } else {
      const filtered = restourants.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()),
      );
      setRestourant(filtered);
      if (filtered.length > 0) {
        // Auto-select category based on restaurant type
        const restaurantCategory = filtered[0].category ?? null;
        setSelectedCategory(restaurantCategory);

        const district = districts.find((d) => d.id === filtered[0].district);
        setSelectedDistrict(filtered[0].district);
        setSelectedNeighborhood(null);
        setNeighborhoodInfo(null);

        if (district) {
          setSelectedInfo({
            id: district.id,
            name: district.name,
            side: district.side,
            ...getMockData(district.name, restaurantCategory?.label ?? ""),
          });
        }
      }
    }
  };

  // Active analytics data: neighborhood-level when selected, otherwise district-level
  const activeAnalytics = selectedNeighborhood && neighborhoodInfo
    ? { name: selectedNeighborhood, categoryLabel: selectedCategory?.label, ...neighborhoodInfo }
    : selectedInfo
      ? { name: selectedInfo.name, categoryLabel: selectedCategory?.label, ...selectedInfo }
      : null;

  const selectedPath = districts.find((d) => d.id === selectedDistrict);

  return (
    
    <div className="font-sans">
      <section className="min-h-screen flex mb-15">
      <SideBarDistricts
        setDistrict={({ id, name, side }) =>
          handleDistrictClick(id, name, side)
        }
      />

      {/* İçerik */}
      <div className="flex-1 px-6 py-4">
        {/* Search Bar */}
        <div>
          <SearchBar onSearch={handleSearch} value={searchQuery} onChange={setSearchQuery} className="w-full" />
        </div>

        {/* Harita */}
        <div className="w-full mt-1 max-w-7xl mx-auto">
          <IstanbulMap
            selectedDistrict={selectedDistrict}
            onDistrictClick={handleDistrictClick}
          />
        </div>
        <DistrictCard
          selectedInfo={selectedInfo}
          selectedPath={selectedPath}
          selectedCategory={selectedCategory}
          selectedNeighborhood={selectedNeighborhood}
          neighborhoodInfo={neighborhoodInfo}
          className="mt-8"
        />
        <RestaurantCard restaurants={restourant} />
        {selectedInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            <PlatformDonutCard
              districtName={activeAnalytics.name}
              categoryLabel={activeAnalytics.categoryLabel}
              platforms={activeAnalytics.platforms}
            />
            <BudgetAnalyticsCard
              districtName={activeAnalytics.name}
              categoryLabel={activeAnalytics.categoryLabel}
              data={activeAnalytics.budget}
            />
            <SalesForecastCard
              districtName={activeAnalytics.name}
              categoryLabel={activeAnalytics.categoryLabel}
              forecast={activeAnalytics.forecast}
            />
            <NeighborhoodCard
              districtId={selectedInfo.id}
              districtName={selectedInfo.name}
              onSelect={handleNeighborhoodSelect}
            />
          </div>
        )}
      </div>
      <SideBarCategories onCategorySelect={handleCategorySelect} />
      </section>

  <section className="min-h-screen mb-15">
      <Kiyaslama />
  </section>

  <section className="min-h-screen mb-15">
      <RestaurantCaseStudy />
  </section>

<section className="min-h-screen mb-15">
      <LoyaltyPage />
  </section>

<section className="min-h-screen mb-15">
      <ComparisonDashboard />
  </section>
</div>
  );
}
