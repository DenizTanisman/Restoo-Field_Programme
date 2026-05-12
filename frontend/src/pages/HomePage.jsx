import React, { useState, useEffect, useCallback } from "react";
import IstanbulMap from "../components/IstanbulMap";
import { districts } from "../data/mapData";
import SearchBar from "../components/SearchBar";
import PlatformDonutCard from "../components/PlatformDonutCard";
import BudgetAnalyticsCard from "../components/BudgetAnalyticsCard";
import SalesForecastCard from "../components/SalesForecastCard";
import RestaurantCard from "../components/RestourantCard";
import SideBarDistricts from "../components/SideBarDistricts";
import SideBarCategories from "../components/SideBarCategories";
import Kiyaslama from "../components/Kiyaslama";
import RestaurantCaseStudy from "../components/RestaurantCaseStudy";
import LoyaltyPage from "../components/LoyaltyPage";
import RestaurantOperationalCard from "../components/RestaurantOperationalCard";
import GeneralPerformanceScore from "../components/GeneralPerformanceScore";
import CommentAnalist from "../components/CommentAnalist";
import { api } from "../api/client";

export default function HomePage() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [restaurants, setRestaurants] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoodInfo, setNeighborhoodInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);

  const fetchDistrictAnalytics = useCallback(async (districtId, districtName, districtSide, categoryId) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await api.getDistrictAnalytics(districtId, categoryId);
      setSelectedInfo({
        id: districtId,
        name: districtName,
        side: districtSide,
        platforms: data.platforms,
        budget: data.budget,
        forecast: data.forecast,
      });
    } catch (err) {
      setAnalyticsError(err.message);
      setSelectedInfo({ id: districtId, name: districtName, side: districtSide, platforms: [], budget: {}, forecast: {} });
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchNeighborhoodAnalytics = useCallback(async (neighborhoodId, neighborhoodName, categoryId) => {
    setNeighborhoodLoading(true);
    try {
      const data = await api.getNeighborhoodAnalytics(neighborhoodId, categoryId);
      setNeighborhoodInfo({
        name: neighborhoodName,
        platforms: data.platforms,
        budget: data.budget,
        forecast: data.forecast,
      });
    } catch {
      setNeighborhoodInfo({ name: neighborhoodName, platforms: [], budget: {}, forecast: {} });
    } finally {
      setNeighborhoodLoading(false);
    }
  }, []);

  const handleDistrictClick = (id, name, side) => {
    setRestaurants(null);
    setSearchQuery("");
    if (selectedDistrict === id) {
      setSelectedDistrict(null);
      setSelectedInfo(null);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
    } else {
      setSelectedDistrict(id);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      fetchDistrictAnalytics(id, name, side, selectedCategory?.id ?? null);
    }
  };

  const handleNeighborhoodSelect = (neighborhoodId, neighborhoodName, districtId, districtName, districtSide) => {
    if (!neighborhoodId) {
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      return;
    }
    // Eğer mahalle başka ilçeden seçildiyse, ilçeyi de senkronize et
    if (districtId && districtId !== selectedDistrict) {
      setSelectedDistrict(districtId);
      fetchDistrictAnalytics(districtId, districtName, districtSide, selectedCategory?.id ?? null);
    }
    setSelectedNeighborhood(neighborhoodId);
    fetchNeighborhoodAnalytics(neighborhoodId, neighborhoodName, selectedCategory?.id ?? null);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (selectedInfo) {
      fetchDistrictAnalytics(selectedInfo.id, selectedInfo.name, selectedInfo.side, cat?.id ?? null);
    }
    if (selectedNeighborhood) {
      fetchNeighborhoodAnalytics(selectedNeighborhood, neighborhoodInfo?.name, cat?.id ?? null);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query) {
      setRestaurants(null);
      setSelectedInfo(null);
      setSelectedDistrict(null);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      setSelectedCategory(null);
      return;
    }
    try {
      const results = await api.searchRestaurants(query);
      setRestaurants(results);
      if (results.length > 0) {
        const first = results[0];
        const district = districts.find((d) => d.id === first.district_id);
        setSelectedDistrict(first.district_id);
        setSelectedNeighborhood(null);
        setNeighborhoodInfo(null);
        if (district) {
          fetchDistrictAnalytics(district.id, district.name, district.side, null);
        }
      }
    } catch {
      setRestaurants([]);
    }
  };

  const activeAnalytics = selectedNeighborhood && neighborhoodInfo
    ? { name: neighborhoodInfo.name, categoryLabel: selectedCategory?.label, ...neighborhoodInfo }
    : selectedInfo
      ? { name: selectedInfo.name, categoryLabel: selectedCategory?.label, ...selectedInfo }
      : null;


  return (
    <div className="font-sans">
      <section className="min-h-screen flex mb-15">
        <SideBarDistricts
          setDistrict={({ id, name, side }) => handleDistrictClick(id, name, side)}
          selectedDistrictId={selectedDistrict}
          selectedNeighborhoodId={selectedNeighborhood}
          onNeighborhoodSelect={handleNeighborhoodSelect}
        />

        <div className="flex-1 px-6 py-4">
          <div>
            <SearchBar onSearch={handleSearch} value={searchQuery} onChange={setSearchQuery} className="w-full" />
          </div>

          <div className="w-full mt-1 max-w-7xl mx-auto">
            <IstanbulMap
              selectedDistrict={selectedDistrict}
              onDistrictClick={handleDistrictClick}
            />
          </div>

          <RestaurantCard restaurants={restaurants} />

          {selectedInfo && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4">
              {/* 1 */}
              <div className="h-full md:order-1 xl:order-1">
                <PlatformDonutCard
                  districtName={activeAnalytics.name}
                  categoryLabel={activeAnalytics.categoryLabel}
                  platforms={activeAnalytics.platforms}
                  loading={analyticsLoading}
                  error={analyticsError}
                />
              </div>
              {/* 2 */}
              <div className="h-full md:order-2 xl:order-2">
                <BudgetAnalyticsCard
                  districtName={activeAnalytics.name}
                  categoryLabel={activeAnalytics.categoryLabel}
                  data={activeAnalytics.budget}
                  loading={analyticsLoading}
                  error={analyticsError}
                />
              </div>
              {/* 3 */}
              <div className="h-full md:order-3 xl:order-3">
                <SalesForecastCard
                  districtName={activeAnalytics.name}
                  categoryLabel={activeAnalytics.categoryLabel}
                  forecast={activeAnalytics.forecast}
                  loading={analyticsLoading}
                  error={analyticsError}
                />
              </div>
              {/* 4 — 2-col modunda 5. konum, 3-col'da 4. konum */}
              <div className="h-full md:order-5 xl:order-4">
                <RestaurantOperationalCard type="cancel" />
              </div>
              {/* 5 — 2-col modunda 6. konum, 3-col'da 5. konum */}
              <div className="h-full md:order-6 xl:order-5">
                <RestaurantOperationalCard type="return" />
              </div>
              {/* 6 — 2-col modunda 4. konum (3 ile yan yana), 3-col'da 6. konum */}
              <div className="h-full md:order-4 xl:order-6">
                <GeneralPerformanceScore myScore={null} areaScore={78} />
              </div>
            </div>
          )}

          <div className="border-t-2 border-dashed border-slate-300 my-10" />

          <div>
            <Kiyaslama
              districtName={selectedInfo?.name}
              neighborhoodName={neighborhoodInfo?.name}
            />
          </div>

          <div className="border-t-2 border-dashed border-slate-300 my-10" />

          <div>
            <CommentAnalist
              districtId={selectedDistrict}
              neighborhoodId={selectedNeighborhood}
              neighborhoodName={neighborhoodInfo?.name}
            />
          </div>
        </div>
        <SideBarCategories onCategorySelect={handleCategorySelect} />
      </section>

      <section className="mb-15 px-4 md:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <RestaurantCaseStudy />
          <LoyaltyPage />
        </div>
      </section>
    </div>
  );
}
