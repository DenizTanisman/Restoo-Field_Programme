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

  const sorted = [...districts].sort((a, b) => a.name.localeCompare(b.name, "tr"));

  return (
    <aside className="w-64 bg-white rounded-2xl shadow-md flex flex-col p-4 shrink-0 overflow-y-auto m-3 max-h-[calc(100vh-1.5rem)] sticky top-3">
      <ul className="flex flex-col gap-1">
        {sorted.map((district) => {
          const active = selectedDistrictId === district.id;
          const open = openId === district.id;
          const neighborhoods = cache[district.id] || [];
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
                <span className={`text-xs transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
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
