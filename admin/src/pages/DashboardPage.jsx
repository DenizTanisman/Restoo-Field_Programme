import { useEffect, useState } from "react";
import { restaurantsApi } from "../api/restaurants";
import { applicationsApi } from "../api/applications";
import { caseStudiesApi } from "../api/caseStudies";
import { categoriesApi } from "../api/categories";
import { platformsApi } from "../api/platforms";
import { districtsApi } from "../api/districts";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [r, apps, cs, cats, plats, dists] = await Promise.all([
          restaurantsApi.list({ limit: 1 }),
          applicationsApi.list({ limit: 1 }),
          caseStudiesApi.list(),
          categoriesApi.list(),
          platformsApi.list(),
          districtsApi.list(),
        ]);
        const pending = await applicationsApi.list({ status: "pending", limit: 1 });
        setStats({
          restaurants: r.total,
          applications: apps.total,
          pendingApplications: pending.total,
          caseStudies: cs.length,
          categories: cats.length,
          platforms: plats.length,
          districts: dists.length,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  if (!stats) {
    return <span className="loading loading-spinner" />;
  }

  const cards = [
    { label: "Restoran", value: stats.restaurants, icon: "🍽️" },
    { label: "Toplam Başvuru", value: stats.applications, icon: "🛵" },
    { label: "Bekleyen Başvuru", value: stats.pendingApplications, icon: "⏳" },
    { label: "Case Study", value: stats.caseStudies, icon: "📚" },
    { label: "Kategori", value: stats.categories, icon: "🏷️" },
    { label: "Platform", value: stats.platforms, icon: "📱" },
    { label: "İlçe", value: stats.districts, icon: "🗺️" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="text-3xl mb-1">{c.icon}</div>
              <div className="text-sm opacity-70">{c.label}</div>
              <div className="text-2xl font-bold">{c.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
