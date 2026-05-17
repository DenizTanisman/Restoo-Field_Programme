import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "./components/layout/AdminLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MetricsPage from "./pages/MetricsPage";
import DataEntryPage from "./pages/DataEntryPage";
import CategoriesPage from "./pages/CategoriesPage";
import PlatformsPage from "./pages/PlatformsPage";
import DistrictsPage from "./pages/DistrictsPage";
import SettingsPage from "./pages/SettingsPage";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/restaurants" element={<RestaurantsPage />} />
        <Route path="/case-studies" element={<CaseStudiesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/data-entry" element={<DataEntryPage />} />
        {/* Eski sayfalar — direkt URL ile hâlâ erişilebilir (geri uyumluluk için) */}
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/metrics" element={<MetricsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/platforms" element={<PlatformsPage />} />
        <Route path="/districts" element={<DistrictsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
