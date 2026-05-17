// components/RestaurantCard.jsx
import React from "react";

const UberEatsIcon = () => (
  <img src="/logos/ubereats.png" alt="Uber Eats" className="w-12 h-12 object-contain" />
);

const GetirIcon = () => (
  <img src="/logos/getir.png" alt="Getir" className="w-12 h-12 object-contain" />
);

const YemeksepIcon = () => (
  <img src="/logos/yemeksepeti.png" alt="Yemeksepeti" className="w-12 h-12 object-contain" />
);

const PLATFORM_ICONS = [<UberEatsIcon />, <GetirIcon />, <YemeksepIcon />];

export default function RestaurantCard({ restaurants }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 mb-6">
      {restaurants.map((r, idx) => (
        <div key={idx} className="card shadow-md bg-base-100 animate-[fadeIn_0.25s_ease] text-base-content">
          <div className="card-body">

            {/* Restoran adı + district */}
            <div className="text-center mb-4">
              <h2 className="text-3xl font-semibold text-base-content">{r.name}</h2>
              <p className="text-sm text-base-content/60 mt-1">{r.districtName}</p>
            </div>

            {/* Platform satırları */}
            {r.platforms && (
              <div className="flex flex-col gap-3">
                {r.platforms.map((platform, i) => (
                  <div key={platform.name} className="flex items-center gap-4">
                    {PLATFORM_ICONS[i]}
                    <span className="text-2xl font-bold min-w-12">{platform.customers}</span>
                    <span className="text-sm text-base-content/70">Aktif Müşteri</span>
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