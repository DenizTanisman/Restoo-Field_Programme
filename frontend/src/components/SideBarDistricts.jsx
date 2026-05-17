import React, { useEffect, useState } from "react";
import { districts } from "../data/mapData";
import { api } from "../api/client";

const SideBarDistricts = ({
  setDistrict,
  selectedDistrictId,
  selectedNeighborhoodId,
  onNeighborhoodSelect,
}) => {
  const [openId, setOpenId] = useState(null);
  const [cache, setCache] = useState({}); // districtId -> neighborhoods[]
  const [loadingId, setLoadingId] = useState(null);

  // Veri-girilen-ilçe/mahalle filtresi
  const [coverageOnly, setCoverageOnly] = useState(false);
  const [coverage, setCoverage] = useState(null); // null = henüz yüklenmedi
  const [coverageLoading, setCoverageLoading] = useState(false);

  const toggleCoverage = async () => {
    if (!coverageOnly && coverage === null) {
      setCoverageLoading(true);
      try {
        const res = await api.getDataCoverage();
        setCoverage(res.district_neighborhoods || {});
      } catch {
        setCoverage({});
      } finally {
        setCoverageLoading(false);
      }
    }
    setCoverageOnly((v) => !v);
  };

  // Seçili ilçe değişirse otomatik aç
  useEffect(() => {
    if (selectedDistrictId) {
      setOpenId(selectedDistrictId);
    }
  }, [selectedDistrictId]);

  // Açılan ilçenin mahallelerini çek
  useEffect(() => {
    if (!openId || cache[openId]) return;
    let alive = true;
    setLoadingId(openId);
    api
      .getDistrictNeighborhoods(openId)
      .then((data) => {
        if (alive) setCache((prev) => ({ ...prev, [openId]: data }));
      })
      .catch(() => {
        if (alive) setCache((prev) => ({ ...prev, [openId]: [] }));
      })
      .finally(() => {
        if (alive) setLoadingId(null);
      });
    return () => { alive = false; };
  }, [openId, cache]);

  const handleDistrictClick = (district) => {
    const wasOpen = openId === district.id;
    setOpenId(wasOpen ? null : district.id);
    setDistrict(district);
  };

  const sortedAll = [...districts].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const sorted = coverageOnly && coverage
    ? sortedAll.filter((d) => (coverage[d.id]?.length ?? 0) > 0)
    : sortedAll;

  return (
    <aside className="w-64 bg-base-100 rounded-2xl shadow-md flex flex-col p-4 shrink-0 overflow-y-auto m-3 max-h-[calc(100vh-1.5rem)] sticky top-3">
      <button
        type="button"
        onClick={toggleCoverage}
        disabled={coverageLoading}
        className={`mb-3 w-full text-xs px-3 py-2 rounded-lg border transition-colors ${
          coverageOnly
            ? "bg-primary text-primary-content border-primary"
            : "bg-base-100 border-base-300 hover:bg-base-200"
        }`}
        title="Sadece verisi (Analytics/Metrics) girilmiş ilçe ve mahalleleri göster"
      >
        {coverageLoading
          ? "Yükleniyor…"
          : coverageOnly
            ? "✓ Sadece verisi olanlar"
            : "Sadece verisi olanlar"}
      </button>
      <ul className="flex flex-col gap-1">
        {sorted.length === 0 && (
          <li className="text-xs opacity-60 px-3 py-2">Veri girilmiş ilçe yok</li>
        )}
        {sorted.map((district) => {
          const active = selectedDistrictId === district.id;
          const open = openId === district.id;
          const rawNeighborhoods = cache[district.id] || [];
          const neighborhoods = coverageOnly && coverage
            ? rawNeighborhoods.filter((n) => coverage[district.id]?.includes(n.id))
            : rawNeighborhoods;
          return (
            <li key={district.id}>
              <button
                onClick={() => handleDistrictClick(district)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-primary text-primary-content shadow"
                      : "hover:bg-base-300 text-base-content"
                  }`}
              >
                <span>{district.name}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 transition-transform duration-200 ${open ? "rotate-90" : "opacity-50"}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd"
                    />
                  </svg>
              </button>

              {open && (
                <ul className="mt-1 ml-3 border-l border-base-300 pl-2 flex flex-col gap-0.5">
                  {loadingId === district.id && (
                    <li className="text-xs opacity-60 py-1">Yükleniyor…</li>
                  )}
                  {loadingId !== district.id && neighborhoods.length === 0 && (
                    <li className="text-xs opacity-60 py-1">Mahalle yok</li>
                  )}
                  {neighborhoods.map((n) => {
                    const nActive = selectedNeighborhoodId === n.id;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => onNeighborhoodSelect?.(n.id, n.name, district.id, district.name, district.side)}
                          className={`w-full text-left px-2 py-1 rounded text-xs transition-all
                            ${
                              nActive
                                ? "bg-primary/15 text-primary font-medium"
                                : "hover:bg-base-300 text-base-content/80"
                            }`}
                        >
                          {n.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default SideBarDistricts;
