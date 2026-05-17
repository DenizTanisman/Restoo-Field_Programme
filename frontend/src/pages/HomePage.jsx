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
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // {id, name} — search ile seçildiyse cascade dashboard kullanılır
  const [searchQuery, setSearchQuery] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);
  const [neighborhoodWarning, setNeighborhoodWarning] = useState(null);

  // Restoran kartları sadece search ile görünür.
  // İlçe/mahalle/kategori seçimi tek başına restoranları listelemez —
  // sadece analytics/metrics kartlarını günceller. Search box'a yazınca veya
  // restoran ismiyle arayınca o sonuçlar görünür.
  useEffect(() => {
    if (!searchQuery) setRestaurants(null);
  }, [selectedDistrict, selectedNeighborhood, selectedCategory, searchQuery]);

  // Helper: bir mahalle analitiğinin tamamen boş olup olmadığını anlar
  const isNeighborhoodEmpty = (data) => {
    if (!data) return true;
    const platformsEmpty = !data.platforms || data.platforms.length === 0
      || data.platforms.every((p) => !p.customers);
    const m = data.metrics || {};
    const metricsEmpty = !m
      || (
        (!m.cancel_rate || Number(m.cancel_rate) === 0)
        && (!m.return_rate || Number(m.return_rate) === 0)
        && (!m.area_rating || Number(m.area_rating) === 0)
        && (!m.area_performance_score || Number(m.area_performance_score) === 0)
        && (!m.avg_basket || Number(m.avg_basket) === 0)
        && (!m.negative_comment_total || Number(m.negative_comment_total) === 0)
      );
    return platformsEmpty && metricsEmpty;
  };

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

  // Restoran cascade dashboard (search ile bir restoran seçildiğinde)
  const fetchRestaurantDashboard = useCallback(async (restaurantId, restaurantName) => {
    setNeighborhoodLoading(true);
    setNeighborhoodWarning(null);
    try {
      const data = await api.getRestaurantDashboard(restaurantId);
      setNeighborhoodInfo({
        name: restaurantName,
        platforms: data.platforms,
        budget: data.budget,
        forecast: data.forecast,
        metrics: data.metrics,
        analytics_source: data.analytics_source,
        metrics_source: data.metrics_source,
      });
      if (data.analytics_source === "none" && data.metrics_source === "none") {
        setNeighborhoodWarning({ kind: "none", name: restaurantName });
      } else if (data.analytics_source === "district_fallback" || data.metrics_source === "district_fallback") {
        setNeighborhoodWarning({ kind: "fallback", name: restaurantName, analytics_source: data.analytics_source, metrics_source: data.metrics_source });
      }
    } catch {
      setNeighborhoodInfo({ name: restaurantName, platforms: [], budget: {}, forecast: {}, metrics: null, analytics_source: "none", metrics_source: "none" });
      setNeighborhoodWarning({ kind: "none", name: restaurantName });
    } finally {
      setNeighborhoodLoading(false);
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
      // Sadece her iki kaynak da "none" ise (mahalle + ilçe ikisi de boş) uyar
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
    setRestaurants(null);
    setSearchQuery("");
    setSelectedRestaurant(null);
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
      setSelectedRestaurant(null);
      return;
    }
    try {
      const results = await api.searchRestaurants(query);
      setRestaurants(results);
      if (results.length > 0) {
        const first = results[0];
        const district = districts.find((d) => d.id === first.district_id);
        const categoryId = first.category_id ?? null;
        const categoryLabel = first.category_label || "";
        const cat = categoryId ? { id: categoryId, label: categoryLabel } : null;
        setSelectedDistrict(first.district_id);
        setSelectedCategory(cat);
        setSelectedNeighborhood(first.neighborhood_id || null);
        setSelectedRestaurant({ id: first.id, name: first.name });
        // Restoran-bazlı cascade dashboard (en spesifik)
        fetchRestaurantDashboard(first.id, first.name);
        if (district) {
          fetchDistrictAnalytics(district.id, district.name, district.side, categoryId);
        }
      } else {
        setSelectedRestaurant(null);
      }
    } catch {
      setRestaurants([]);
      setSelectedRestaurant(null);
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

          {neighborhoodWarning && !neighborhoodLoading && (() => {
            const w = neighborhoodWarning;
            const neighName = w.name || selectedNeighborhood?.name || activeAnalytics.name;
            const catLabel = selectedCategory?.label;
            const comboLabel = catLabel ? `"${neighName}" mahallesi × "${catLabel}" kategorisi` : `"${neighName}" mahallesi (tüm kategoriler)`;

            // Tam boş durum
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
                    <p className="text-xs opacity-70 mt-1">
                      Admin panel → <code className="px-1">Analytics</code> / <code className="px-1">Metrics</code> sekmelerinden bu kombinasyon için veri girin (mahalle bazında en spesifik; mahalle veri yoksa ilçe bazında fallback otomatik devreye girer).
                    </p>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => setNeighborhoodWarning(null)}>Kapat</button>
                </div>
              );
            }

            // Fallback durumu (en az birinin kaynağı ilçe)
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
                    <p className="text-xs opacity-70 mt-1">
                      Mahalleye özel veri görmek için admin panelden bu mahalle + kategori için kayıt ekleyebilirsin.
                    </p>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => setNeighborhoodWarning(null)}>Kapat</button>
                </div>
              );
            }
            return null;
          })()}

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
                <RestaurantOperationalCard
                  type="cancel"
                  totalRate={activeAnalytics.metrics?.cancel_rate}
                  reasons={activeAnalytics.metrics?.cancel_reasons}
                />
              </div>
              {/* 5 — 2-col modunda 6. konum, 3-col'da 5. konum */}
              <div className="h-full md:order-6 xl:order-5">
                <RestaurantOperationalCard
                  type="return"
                  totalRate={activeAnalytics.metrics?.return_rate}
                  reasons={activeAnalytics.metrics?.return_reasons}
                />
              </div>
              {/* 6 — 2-col modunda 4. konum (3 ile yan yana), 3-col'da 6. konum */}
              <div className="h-full md:order-4 xl:order-6">
                <GeneralPerformanceScore
                  myScore={null}
                  areaScore={activeAnalytics.metrics?.area_performance_score ?? 0}
                />
              </div>
            </div>

          <div className="border-t-2 border-dashed border-slate-300 my-10" />

          <div>
            <Kiyaslama
              districtName={selectedInfo?.name}
              neighborhoodName={neighborhoodInfo?.name}
              metrics={activeAnalytics?.metrics}
              budget={activeAnalytics?.budget}
            />
          </div>

          <div className="border-t-2 border-dashed border-slate-300 my-10" />

          <div>
            <CommentAnalist
              districtId={selectedDistrict}
              neighborhoodId={selectedNeighborhood}
              neighborhoodName={neighborhoodInfo?.name}
              metrics={activeAnalytics?.metrics}
            />
          </div>
        </div>
        <SideBarCategories onCategorySelect={handleCategorySelect} selectedCategoryId={selectedCategory?.id ?? null} />
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
