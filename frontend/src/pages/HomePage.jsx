import React, { useState, useEffect, useCallback } from "react";
import IstanbulMap from "../components/IstanbulMap";
import { districts } from "../data/mapData";
import SearchBar from "../components/SearchBar";
import DistrictCard from "../components/DistrictCard";
import PlatformDonutCard from "../components/PlatformDonutCard";
import BudgetAnalyticsCard from "../components/BudgetAnalyticsCard";
import SalesForecastCard from "../components/SalesForecastCard";
import NeighborhoodCard from "../components/NeighborhoodCard";
import RestaurantCard from "../components/RestourantCard";
import SideBarDistricts from "../components/SideBarDistricts";
import SideBarCategories from "../components/SideBarCategories";
import Kiyaslama from "../components/Kiyaslama";
import RestaurantCaseStudy from "../components/RestaurantCaseStudy";
import LoyaltyPage from "../components/LoyaltyPage";
import ComparisonDashboard from "../components/ComparisonDashboard";
import RestaurantOperationalCard from "../components/RestaurantOperationalCard";
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

  const handleNeighborhoodSelect = (neighborhoodId, neighborhoodName) => {
    if (!neighborhoodId) {
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
    } else {
      setSelectedNeighborhood(neighborhoodId);
      fetchNeighborhoodAnalytics(neighborhoodId, neighborhoodName, selectedCategory?.id ?? null);
    }
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

  const selectedPath = districts.find((d) => d.id === selectedDistrict);

  return (
    <div className="font-sans">
      <section className="min-h-screen flex mb-15">
        <SideBarDistricts
          setDistrict={({ id, name, side }) => handleDistrictClick(id, name, side)}
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

          <DistrictCard
            selectedInfo={selectedInfo}
            selectedPath={selectedPath}
            className="mt-8"
            restaurants={restaurants}
          />
          <RestaurantCard restaurants={restaurants} />

          {selectedInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
              <PlatformDonutCard
                districtName={activeAnalytics.name}
                categoryLabel={activeAnalytics.categoryLabel}
                platforms={activeAnalytics.platforms}
                loading={analyticsLoading}
                error={analyticsError}
              />
              <BudgetAnalyticsCard
                districtName={activeAnalytics.name}
                categoryLabel={activeAnalytics.categoryLabel}
                data={activeAnalytics.budget}
                loading={analyticsLoading}
                error={analyticsError}
              />
              <SalesForecastCard
                districtName={activeAnalytics.name}
                categoryLabel={activeAnalytics.categoryLabel}
                forecast={activeAnalytics.forecast}
                loading={analyticsLoading}
                error={analyticsError}
              />
              <NeighborhoodCard
                districtId={selectedInfo.id}
                districtName={selectedInfo.name}
                onSelect={handleNeighborhoodSelect}
              />
              <RestaurantOperationalCard type="cancel" />
              <RestaurantOperationalCard type="return" />
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

      <section className="min-h-screen mb-15">
        <CommentAnalist />
      </section>
    </div>
  );
}
