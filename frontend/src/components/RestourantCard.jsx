// components/RestaurantCard.jsx
import React from "react";

const TrendyolIcon = () => (
  <svg width="50" height="70" viewBox="0 0 60 48" fill="none">
    <circle cx="27" cy="20" r="28" fill="#FF6000" />
    <text x="24" y="23" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">TGo</text>
  </svg>
);

const GetirIcon = () => (
  <svg width="50" height="70" viewBox="0 0 60 48" fill="none">
    <circle cx="27" cy="20" r="28" fill="#5C3EBC" />
    <text x="24" y="23" textAnchor="middle" fill="#FFD603" fontSize="15" fontWeight="bold">getir</text>
  </svg>
);

const YemeksepIcon = () => (
  <svg width="50" height="70" viewBox="0 0 60 48" fill="none">
    <circle cx="27" cy="20" r="28" fill="#CC0000" />
    <text x="24" y="23" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">yemeksepeti</text>
  </svg>
);

const PLATFORM_ICONS = [<TrendyolIcon />, <GetirIcon />, <YemeksepIcon />];

export default function RestaurantCard({ restaurants }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {restaurants.map((r, idx) => (
        <div key={idx} className="card shadow-md bg-white animate-[fadeIn_0.25s_ease] text-gray-900">
          <div className="card-body">

            {/* Restoran adı + district */}
            <div className="text-center mb-4">
              <h2 className="text-3xl font-semibold text-gray-900">{r.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{r.districtName}</p>
            </div>

            {/* Platform satırları */}
            {r.platforms && (
              <div className="flex flex-col gap-3">
                {r.platforms.map((platform, i) => (
                  <div key={platform.name} className="flex items-center gap-4">
                    {PLATFORM_ICONS[i]}
                    <span className="text-2xl font-bold min-w-12">{platform.customers}</span>
                    <span className="text-sm text-gray-600">Aktif Müşteri</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      ))}
    </div>
  );
}