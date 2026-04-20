import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import { Routes, Route } from "react-router-dom";
import ApplyPage from "./pages/ApplyPage";
import Kiyaslama from "./components/Kiyaslama"; // Senin modülün

const App = () => {
  return (
    <div className="bg-gray-200">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/kıyaslama" element={<Kiyaslama />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};

export default App;