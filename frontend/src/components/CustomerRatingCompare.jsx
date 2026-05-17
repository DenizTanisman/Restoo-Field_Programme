import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function Gauge({ value, max = 5, color }) {
  const data = {
    datasets: [
      {
        data: value === null || value === undefined ? [0, max] : [value, max - value],
        backgroundColor: [color, "#f1f5f9"],
        borderWidth: 0,
      },
    ],
  };
  const options = {
    circumference: 180,
    rotation: 270,
    cutout: "75%",
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    maintainAspectRatio: false,
  };
  return (
    <div className="relative w-32 h-20">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-end justify-center pb-1 font-bold text-2xl text-base-content">
        {value === null || value === undefined ? "?" : value.toFixed(1)}
      </div>
    </div>
  );
}

export default function CustomerRatingCompare({ myRating = null, areaRating = 4.2 }) {
  return (
    <div className="rounded-xl bg-base-100 p-6 shadow-sm h-full">
      <div className="mb-6 flex items-start gap-4">
        <span className="text-2xl">⭐</span>
        <div>
          <h3 className="text-base font-semibold text-base-content">Müşteri Puanı Kıyaslaması</h3>
          <p className="text-sm text-base-content/50">Senin puanın vs ilçe ortalaması</p>
        </div>
      </div>

      <div className="flex justify-around items-center mt-4">
        <div className="text-center">
          <Gauge value={myRating} color="#ef4444" />
          <p className="text-xs font-bold text-base-content/60 mt-3 uppercase">Senin Puanın</p>
        </div>
        <div className="text-center">
          <Gauge value={areaRating} color="#10b981" />
          <p className="text-xs font-bold text-base-content/60 mt-3 uppercase">İlçe Ortalaması</p>
        </div>
      </div>
    </div>
  );
}
