import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import { Routes, Route } from "react-router-dom";
import ApplyPage from "./pages/ApplyPage";
import AdminPage from "./pages/AdminPage";
import ThemeToggle from "./components/ThemeToggle";

const App = () => {
  return (
    <div className="bg-base-300 min-h-screen">
      {/* Sağ üstte sabit tema toggle — tüm public sayfalarda görünür */}
      <div className="fixed top-3 right-3 z-50">
        <ThemeToggle className="bg-base-100/80 shadow-md backdrop-blur" />
      </div>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;