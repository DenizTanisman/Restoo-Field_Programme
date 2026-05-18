import React, { useState, useCallback } from "react";
import IstanbulMap from "../components/IstanbulMap";
import PlatformDonutCard from "../components/PlatformDonutCard";
import BudgetAnalyticsCard from "../components/BudgetAnalyticsCard";
import SalesForecastCard from "../components/SalesForecastCard";
import SideBarDistricts from "../components/SideBarDistricts";
import SideBarCategories from "../components/SideBarCategories";
import Kiyaslama from "../components/Kiyaslama";
import RestaurantCaseStudy from "../components/RestaurantCaseStudy";
import LoyaltyPage from "../components/LoyaltyPage";
import RestaurantOperationalCard from "../components/RestaurantOperationalCard";
import GeneralPerformanceScore from "../components/GeneralPerformanceScore";
import CommentAnalist from "../components/CommentAnalist";
import { api } from "../api/client";

// Ana sayfa SADECE kapsam-bazlı görünüm: Genel İlçe / İlçe+Kategori / Mahalle+Kategori.
// Restoran-özel arama veya kartı YOK — kullanıcı bir restoran seçemez.

export default function HomePage() {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [neighborhoodInfo, setNeighborhoodInfo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);
  const [neighborhoodWarning, setNeighborhoodWarning] = useState(null);

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
        metrics: data.metrics,
      });
    } catch (err) {
      setAnalyticsError(err.message);
      setSelectedInfo({ id: districtId, name: districtName, side: districtSide, platforms: [], budget: {}, forecast: {}, metrics: null });
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchNeighborhoodAnalytics = useCallback(async (neighborhoodId, neighborhoodName, categoryId) => {
    setNeighborhoodLoading(true);
    setNeighborhoodWarning(null);
    try {
      const data = await api.getNeighborhoodAnalytics(neighborhoodId, categoryId);
      setNeighborhoodInfo({
        name: neighborhoodName,
        platforms: data.platforms,
        budget: data.budget,
        forecast: data.forecast,
        metrics: data.metrics,
        analytics_source: data.analytics_source,
        metrics_source: data.metrics_source,
      });
      if (data.analytics_source === "none" && data.metrics_source === "none") {
        setNeighborhoodWarning({ kind: "none", name: neighborhoodName });
      } else if (data.analytics_source === "district_fallback" || data.metrics_source === "district_fallback") {
        setNeighborhoodWarning({ kind: "fallback", name: neighborhoodName, analytics_source: data.analytics_source, metrics_source: data.metrics_source });
      }
    } catch {
      setNeighborhoodInfo({ name: neighborhoodName, platforms: [], budget: {}, forecast: {}, metrics: null, analytics_source: "none", metrics_source: "none" });
      setNeighborhoodWarning({ kind: "none", name: neighborhoodName });
    } finally {
      setNeighborhoodLoading(false);
    }
  }, []);

  const handleDistrictClick = (id, name, side) => {
    if (selectedDistrict === id) {
      setSelectedDistrict(null);
      setSelectedInfo(null);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      setNeighborhoodWarning(null);
    } else {
      setSelectedDistrict(id);
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      setNeighborhoodWarning(null);
      fetchDistrictAnalytics(id, name, side, selectedCategory?.id ?? null);
    }
  };

  const handleNeighborhoodSelect = (neighborhoodId, neighborhoodName, districtId, districtName, districtSide) => {
    if (!neighborhoodId) {
      setSelectedNeighborhood(null);
      setNeighborhoodInfo(null);
      setNeighborhoodWarning(null);
      return;
    }
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

  const EMPTY_METRICS = {
    cancel_rate: 0,
    return_rate: 0,
    cancel_reasons: [],
    return_reasons: [],
    area_performance_score: 0,
    area_rating: 0,
    highest_rating: 0,
    lowest_rating: 0,
    avg_basket: 0,
    avg_menu_price: 0,
    avg_monthly_revenue: 0,
    courier_fee: 0,
    hourly_heatmap: [],
    negative_comment_total: 0,
    negative_comment_rate: 0,
    negative_avg_rating: 0,
    platform_negative_distribution: [],
    rating_distribution: [],
    negative_word_cloud: [],
  };
  const EMPTY_BUDGET = { adBudget: 0, campaignRate: 0, couponRate: 0, flashRate: 0, jokerRate: 0 };
  const EMPTY_FORECAST = { daily: [], monthly: [], yearly: [] };

  const activeAnalytics = (() => {
    const base = selectedNeighborhood && neighborhoodInfo
      ? { name: neighborhoodInfo.name, ...neighborhoodInfo }
      : selectedInfo
        ? { name: selectedInfo.name, ...selectedInfo }
        : { name: null, platforms: [], budget: EMPTY_BUDGET, forecast: EMPTY_FORECAST, metrics: EMPTY_METRICS };
    return {
      categoryLabel: selectedCategory?.label,
      ...base,
      metrics: base.metrics || EMPTY_METRICS,
      budget: base.budget || EMPTY_BUDGET,
      forecast: base.forecast || EMPTY_FORECAST,
      platforms: base.platforms || [],
    };
  })();


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
          <div className="w-full max-w-7xl mx-auto">
            <IstanbulMap
              selectedDistrict={selectedDistrict}
              onDistrictClick={handleDistrictClick}
            />
          </div>

          {neighborhoodWarning && !neighborhoodLoading && (() => {
            const w = neighborhoodWarning;
            const neighName = w.name || activeAnalytics.name;
            const catLabel = selectedCategory?.label;
            const comboLabel = catLabel ? `"${neighName}" mahallesi × "${catLabel}" kategorisi` : `"${neighName}" mahallesi (tüm kategoriler)`;

            if (w.kind === "none") {
              return (
                <div className="mt-4 alert alert-warning shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M4.93 19.07A10 10 0 1119.07 4.93 10 10 0 014.93 19.07z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold">Bu seçim için hiçbir yerden veri bulunamadı</h4>
                    <p className="text-sm opacity-80">
                      {comboLabel} için ne mahalle ne de ilçe seviyesinde Analytics/Metrics kaydı var. Kartlar boş gösteriliyor.
                    </p>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => setNeighborhoodWarning(null)}>Kapat</button>
                </div>
              );
            }

            if (w.kind === "fallback") {
              const both = w.analytics_source === "district_fallback" && w.metrics_source === "district_fallback";
              return (
                <div className="mt-4 alert alert-info shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold">İlçe ortalaması gösteriliyor</h4>
                    <p className="text-sm opacity-80">
                      {comboLabel} için mahalle bazlı {both ? "veri" : (w.metrics_source === "district_fallback" ? "metrics verisi" : "analytics verisi")} yok — bu yüzden bu kartlar bağlı olduğu <b>ilçe</b> bazlı aggregate veriden çekildi.
                    </p>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => setNeighborhoodWarning(null)}>Kapat</button>
                </div>
              );
            }
            return null;
          })()}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4">
              <div className="h-full md:order-1 xl:order-1">
                <PlatformDonutCard
                  districtName={activeAnalytics.name}
                  categoryLabel={activeAnalytics.categoryLabel}
                  platforms={activeAnalytics.platforms}
                  loading={analyticsLoading}
                  error={analyticsError}
                />
              </div>
              <div className="h-full md:order-2 xl:order-2">
                <BudgetAnalyticsCard
                  districtName={activeAnalytics.name}
                  categoryLabel={activeAnalytics.categoryLabel}
                  data={activeAnalytics.budget}
                  loading={analyticsLoading}
                  error={analyticsError}
                />
              </div>
              <div className="h-full md:order-3 xl:order-3">
                <SalesForecastCard
                  districtName={activeAnalytics.name}
                  categoryLabel={activeAnalytics.categoryLabel}
                  forecast={activeAnalytics.forecast}
                  loading={analyticsLoading}
                  error={analyticsError}
                />
              </div>
              <div className="h-full md:order-5 xl:order-4">
                <RestaurantOperationalCard
                  type="cancel"
                  totalRate={activeAnalytics.metrics?.cancel_rate}
                  reasons={activeAnalytics.metrics?.cancel_reasons}
                />
              </div>
              <div className="h-full md:order-6 xl:order-5">
                <RestaurantOperationalCard
                  type="return"
                  totalRate={activeAnalytics.metrics?.return_rate}
                  reasons={activeAnalytics.metrics?.return_reasons}
                />
              </div>
              <div className="h-full md:order-4 xl:order-6">
                <GeneralPerformanceScore
                  myScore={null}
                  areaScore={activeAnalytics.metrics?.area_performance_score ?? 0}
                />
              </div>
            </div>

          <div className="border-t-2 border-dashed border-base-300 my-10" />

          <div>
            <Kiyaslama
              districtName={selectedInfo?.name}
              neighborhoodName={neighborhoodInfo?.name}
              metrics={activeAnalytics?.metrics}
              budget={activeAnalytics?.budget}
              categoryId={selectedCategory?.id ?? null}
            />
          </div>

          <div className="border-t-2 border-dashed border-base-300 my-10" />

          <div>
            <CommentAnalist metrics={activeAnalytics?.metrics} />
          </div>
        </div>
        <SideBarCategories onCategorySelect={handleCategorySelect} selectedCategoryId={selectedCategory?.id ?? null} />
      </section>

      <section className="mb-15 px-4 md:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
          <RestaurantCaseStudy />
          <LoyaltyPage />
        </div>
      </section>
    </div>
  );
}
