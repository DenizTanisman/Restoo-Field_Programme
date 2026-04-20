import React from "react";
import ThemeToggle from "./components/ThemeToggle";
import IstanbulMap from "./components/IstanbulMap";
import Kiyaslama from './components/Kiyaslama'; // Senin modülün

const App = () => {
  return (
    <div>
      <ThemeToggle />
      
      {/* Senin modülün buraya eklendi */}
      <Kiyaslama />

      <IstanbulMap />
    </div>
  );
};

export default App;