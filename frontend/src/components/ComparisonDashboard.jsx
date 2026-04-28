import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ComparisonDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Genel grafik ayarları
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        display: false,
        grid: { display: false }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      }
    },
  };

  // Görseldeki gibi dikey ve çizgili özel ayar (Ortalama Sipariş Tutarı için)
  const verticalBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        max: 250,
        ticks: { stepSize: 50, color: '#94a3b8' },
        grid: { color: '#f1f5f9', drawBorder: false }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    },
  };

  const ordersData = {
    labels: ['Restoran (?)', 'İlçe Ort.'],
    datasets: [{
      data: [0, 90],
      backgroundColor: ['#f1f5f9', '#94a3b8'],
      borderRadius: 6,
      barThickness: 40,
    }],
  };

  // İstediğin dikey bar verisi
  const priceData = {
    labels: ['', ''], // Etiketleri boş bırakabilir veya isimlendirebilirsin
    datasets: [{
      data: [0, 240],
      backgroundColor: ['#f1f5f9', '#94a3b8'], // Görseldeki o gri/mavi ton
      borderRadius: 4,
      barThickness: 30,
    }],
  };

  const platformData = {
    labels: ['Trendyol', 'Getir', 'Yemeksepeti'],
    datasets: [
      { label: 'İlçe', data: [80, 60, 85], backgroundColor: '#cbd5e1', borderRadius: 4 },
      { label: 'Restoran', data: [0, 0, 0], backgroundColor: '#f1f5f9', borderRadius: 4 }
    ],
  };

  const getGaugeData = (val, color) => ({
    datasets: [{
      data: [val, 5 - val],
      backgroundColor: [color, '#f1f5f9'],
      borderWidth: 0,
    }],
  });

  const gaugeOptions = {
    circumference: 180,
    rotation: 270,
    cutout: '85%',
    plugins: { tooltip: false, legend: false },
  };

  const distHeatData = [5, 2, 0, 0, 0, 5, 15, 30, 45, 65, 80, 95, 100, 90, 75, 60, 70, 85, 95, 80, 60, 40, 20, 10];

  return (
    <div className="bg-[#f9fafb] min-h-screen py-10 px-4 text-[#1f2937] font-sans">
      <div className="max-w-[900px] mx-auto">
        
        <div className="text-center mb-10">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#e2e8f0] text-[#1f2937] px-12 py-4 rounded-md font-semibold text-lg border-b-4 border-[#cbd5e1] hover:bg-[#d1d5db] active:translate-y-1 active:border-b-0 transition-all"
          >
            Tıkla ve Formu Doldur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[15px] font-semibold mb-4 text-[#374151]">Günlük Ortalama Sipariş</h3>
            <div className="h-[200px]"><Bar data={ordersData} options={commonOptions} /></div>
          </div>
          
          {/* GÜNCELLENEN KART: Ortalama Sipariş Tutarı */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[15px] font-semibold mb-4 text-[#374151]">Ortalama Sipariş Tutarı</h3>
            <div className="h-[200px]"><Bar data={priceData} options={verticalBarOptions} /></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
          <h3 className="text-[15px] font-semibold mb-4 text-[#374151]">Platform Bazlı Sipariş Dağılımı</h3>
          <div className="h-[130px]">
            <Bar data={platformData} options={{...commonOptions, scales: {y:{display:false}, x:{grid:{display:false}}}}} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[15px] font-semibold mb-4 text-[#374151]">Müşteri Puanı Kıyaslaması</h3>
            <div className="flex justify-around items-center">
              <div className="relative w-32 h-28 text-center">
                <Doughnut data={getGaugeData(0, '#f1f5f9')} options={gaugeOptions} />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl mt-4">?</div>
                <p className="text-[11px] mt-2">Restoran</p>
              </div>
              <div className="relative w-32 h-28 text-center">
                <Doughnut data={getGaugeData(4.2, '#10b981')} options={gaugeOptions} />
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl mt-4">4.2</div>
                <p className="text-[11px] mt-2">İlçe Ort.</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-[15px] font-semibold mb-4 text-[#374151]">Menü Büyüklüğü vs Sipariş</h3>
            <div className="h-[200px]">
              <Scatter 
                data={{
                  datasets: [
                    { label: 'Diğerleri', data: [{x: 20, y: 30}, {x: 45, y: 50}, {x: 65, y: 70}], backgroundColor: '#cbd5e1' },
                    { label: 'Sen', data: [], backgroundColor: '#ef4444', pointRadius: 8 }
                  ]
                }} 
                options={commonOptions} 
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
          <h3 className="text-[15px] font-semibold mb-2 text-[#374151]">Satış Saatleri Yoğunluğu (İlçe)</h3>
          <div className="grid grid-cols-24 gap-[3px] mt-4">
            {distHeatData.map((val, i) => (
              <div 
                key={i} 
                className="h-9 rounded-sm" 
                style={{ backgroundColor: `rgba(239, 68, 68, ${val / 100})` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[#9ca3af] mt-2">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-dashed border-[#cbd5e1]">
          <h3 className="text-[15px] font-semibold mb-2 text-[#374151]">Satış Saatleri Yoğunluğu (Restoran)</h3>
          <div className="grid grid-cols-24 gap-[3px] mt-4">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-9 bg-[#f1f5f9] rounded-sm flex items-center justify-center text-[10px] text-[#cbd5e1]">?</div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[#9ca3af] mt-2">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
          <h3 className="text-[15px] font-semibold mb-4 text-[#374151]">Yoğun Saatler</h3>
          <div className="h-[200px]">
            <Line 
              data={{
                labels: ['10:00', '13:00', '16:00', '19:00', '22:00'],
                datasets: [{ data: [15, 40, 55, 95, 35], borderColor: '#94a3b8', tension: 0.4, pointRadius: 0 }]
              }} 
              options={commonOptions} 
            />
          </div>
          <p className="text-xs text-slate-500 mt-3">*Akşam saatlerinde talep zirve yapıyor.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-[15px] font-semibold mb-4 text-[#374151] text-center">Genel Performans Skoru</h3>
          <div className="flex justify-center gap-12 md:gap-20">
            <div className="text-center">
                <div className="relative w-32 h-32">
                    <Doughnut data={getGaugeData(0, '#f1f5f9')} options={{cutout:'80%', plugins:{legend:false, tooltip:false}}} />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">?</div>
                </div>
                <p className="text-sm font-semibold mt-2">Restoran</p>
            </div>
            <div className="text-center">
                <div className="relative w-32 h-32">
                    <Doughnut data={getGaugeData(3.9, '#22c55e')} options={{cutout:'80%', plugins:{legend:false, tooltip:false}}} />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">78</div>
                </div>
                <p className="text-sm font-semibold mt-2">İlçe Ort.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Veri Giriş Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold mb-6">Analiz Veri Girişi</h3>
            <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
              <div className="mb-6">
                <label className="block text-sm mb-2 font-medium">Günlük Sipariş</label>
                <input type="number" className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-900" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">İptal</button>
                <button type="submit" className="px-4 py-2 bg-[#1e3a8a] text-white rounded-md hover:bg-blue-800 transition-colors">Gönder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonDashboard;