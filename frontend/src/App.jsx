import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import { Routes, Route } from "react-router-dom";
import ApplyPage from "./pages/ApplyPage";
import AdminPage from "./pages/AdminPage";

const App = () => {
  return (
    <div className="bg-gray-200">

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