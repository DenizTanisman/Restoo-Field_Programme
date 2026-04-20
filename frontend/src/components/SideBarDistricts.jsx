import React from "react";
import { districts } from "../data/mapData";

const SideBarDistricts = ({ setDistrict }) => {
  return (
    <aside className="w-64 min-h-screen bg-base-200 flex flex-col p-4 shrink-0">
      <ul className="menu w-full gap-1">
        {districts.map((district) => (
          <li key={district.id}>
            <button onClick={() => setDistrict(district)} className="w-full text-left">{district.name}</button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SideBarDistricts;
