import React, { useState, useEffect, useMemo } from "react";
import { api } from "../api/client";

export default function NeighborhoodCard({ districtId, districtName, onSelect }) {
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!districtId) return;
    setSelected(null);
    setSearch("");
    setLoading(true);
    api.getDistrictNeighborhoods(districtId)
      .then(setNeighborhoods)
      .catch(() => setNeighborhoods([]))
      .finally(() => setLoading(false));
  }, [districtId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return neighborhoods;
    const q = search.toLowerCase();
    return neighborhoods.filter((n) => n.name.toLowerCase().includes(q));
  }, [neighborhoods, search]);

  const handleSelect = (neighborhood) => {
    const next = selected?.id === neighborhood.id ? null : neighborhood;
    setSelected(next);
    onSelect?.(next?.id ?? null, next?.name ?? null);
  };

  if (!districtId) return null;

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl">
      <div className="card-body p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Mahalle Seçimi</h3>
          {districtName && <p className="text-sm text-gray-500">{districtName}</p>}
        </div>

        {selected && (
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-primary badge-lg gap-1 font-medium">
              {selected.name}
              <button
                onClick={() => handleSelect(selected)}
                className="ml-1 text-primary-content/60 hover:text-primary-content transition-colors"
                aria-label="Seçimi kaldır"
              >
                ✕
              </button>
            </span>
          </div>
        )}

        {neighborhoods.length > 6 && (
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Mahalle ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered input-sm w-full pl-8 rounded-lg text-sm"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-6">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : neighborhoods.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Bu ilçe için mahalle verisi bulunamadı.</p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelect(n)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selected?.id === n.id
                    ? "bg-primary text-primary-content border-primary shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }`}
              >
                {n.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 w-full text-center py-4">Sonuç bulunamadı.</p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-3">
          {neighborhoods.length} mahalle • {selected ? "1 seçili" : "Seçim yok"}
        </p>
      </div>
    </div>
  );
}
