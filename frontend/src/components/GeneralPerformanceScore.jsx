import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function ScoreCircle({ value, max = 100, color }) {
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
    cutout: "78%",
    plugins: { tooltip: { enabled: false }, legend: { display: false } },
    maintainAspectRatio: false,
  };
  return (
    <div className="relative w-28 h-28">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl text-base-content">
        {value === null || value === undefined ? "?" : value}
      </div>
    </div>
  );
}

export default function GeneralPerformanceScore({ myScore = null, areaScore = 78 }) {
  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full">
      <div className="card-body p-5">
        <h3 className="text-base font-semibold text-base-content mb-5 text-center">
          Genel Performans Skoru
        </h3>
        <div className="flex flex-col items-center justify-center gap-6 flex-1">
          <div className="text-center">
            <ScoreCircle value={myScore} color="#ef4444" />
            <p className="text-sm font-semibold mt-3 text-base-content/70">Senin Skorun</p>
          </div>
          <div className="text-center">
            <ScoreCircle value={areaScore} color="#22c55e" />
            <p className="text-sm font-semibold mt-3 text-base-content/70">İlçe Ort.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
