import { useState } from "react";
import DistrictAnalyticsTab from "../components/analytics/DistrictAnalyticsTab";
import NeighborhoodAnalyticsTab from "../components/analytics/NeighborhoodAnalyticsTab";
import CompetitorAnalyticsTab from "../components/analytics/CompetitorAnalyticsTab";

const TABS = [
  { id: "district", label: "İlçe" },
  { id: "neighborhood", label: "Mahalle" },
  { id: "competitor", label: "Rakip" },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState("district");
  return (
    <div className="space-y-4">
      <div className="tabs tabs-boxed bg-base-100 inline-flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "district" && <DistrictAnalyticsTab />}
      {tab === "neighborhood" && <NeighborhoodAnalyticsTab />}
      {tab === "competitor" && <CompetitorAnalyticsTab />}
    </div>
  );
}
