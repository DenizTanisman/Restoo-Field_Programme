import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const TITLES = {
  "/dashboard": "OpenCard Admin Panel",
  "/analytics": "Analytics",
  "/restaurants": "Restaurants",
  "/case-studies": "Case Studies",
  "/applications": "Applications",
  "/categories": "Categories",
  "/platforms": "Platforms",
  "/districts": "Districts",
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
