import React from "react";

export default function RestaurantOperationalCard({ type }) {
  // --- İPTAL SEBEPLERİ BÖLÜMÜ ---
  if (type === "cancel") {
    const cancelData = [
      { label: "Uzun bekleme", color: "bg-[#EE4444]", percent: 45 },
      { label: "Yanlış ürün", color: "bg-[#A65EEA]", percent: 25 },
      { label: "Lezzet", color: "bg-[#22CCEE]", percent: 15 },
      { label: "Ürün stokta yok", color: "bg-[#66DD22]", percent: 10 },
      { label: "Diğer", color: "bg-[#F99F1B]", percent: 5 },
    ];

    return (
      <div className="card bg-base-100 shadow-md rounded-2xl h-full border border-gray-100">
        <div className="card-body p-5">
          <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
            İPTAL SEBEPLERİ
          </h3>
          
          <div className="flex flex-col items-center">
            {/* Donut Chart */}
            <div 
              className="relative w-44 h-44 rounded-full flex items-center justify-center mb-8 shadow-inner"
              style={{
                background: "conic-gradient(#EE4444 0% 45%, #A65EEA 45% 70%, #22CCEE 70% 85%, #66DD22 85% 95%, #F99F1B 95% 100%)"
              }}
            >
               <div className="absolute w-[72%] h-[72%] bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                 <span className="text-3xl font-extrabold text-gray-800">%12</span>
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Toplam İptal</span>
               </div>
            </div>

            {/* Lejant - Büyük ve Vurgulu Rakamlar */}
            <div className="w-full space-y-3 px-2">
              {cancelData.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-md ${item.color} shadow-sm`}></span>
                    <span className="text-gray-600 font-semibold text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-900 font-bold text-lg font-mono">%{item.percent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- İADE SEBEPLERİ BÖLÜMÜ (Zarif ve İnce Barlar) ---
  const returnData = [
    { label: "Eksik Malzeme", percent: 48 },
    { label: "Soğuk Geldi", percent: 34 },
    { label: "Yanlış Sipariş", percent: 18 },
    { label: "Ambalaj", percent: 12 },
  ];

  return (
    <div className="card bg-base-100 shadow-md rounded-2xl h-full border border-gray-100">
      <div className="card-body p-5">
        <h3 className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
          İADE SEBEPLERİ
        </h3>
        <div className="space-y-6 mt-4">
          {returnData.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] text-gray-600 font-medium">{item.label}</span>
                <span className="font-bold text-gray-900 text-sm">%{item.percent}</span>
              </div>
              {/* h-1.5 ile inceltilmiş bar yapısı */}
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-red-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}