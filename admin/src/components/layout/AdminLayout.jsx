import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ErrorBoundary from "./ErrorBoundary";

const TITLES = {
  "/dashboard": "OpenCard Admin Panel",
  "/analytics": "Analytics",
  "/metrics": "Metrikler — Operasyon · Skor · Kıyaslama · Yorumlar",
  "/restaurants": "Restaurants",
  "/case-studies": "Başarı Hikayeleri",
  "/applications": "Applications",
  "/categories": "Categories",
  "/platforms": "Platforms",
  "/districts": "Districts",
  "/settings": "Sadakat Programı",
};

export default function AdminLayout() {
  const location = useLocation();
  const title = TITLES[location.pathname] || "OpenCard Admin Panel";

  return (
    <div className="flex bg-base-200 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
