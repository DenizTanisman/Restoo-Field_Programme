import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

import { Routes, Route } from "react-router-dom";
import ApplyPage from "./pages/ApplyPage";

const App = () => {
  return (
    <div className="bg-gray-200">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="*" element={<NotFoundPage/>} /> {/* 404 */}
      </Routes>
    </div>
  );
};

export default App;
