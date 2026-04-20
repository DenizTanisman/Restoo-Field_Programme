import React, { useState } from 'react';
import { CheckCircle2, XCircle, Tag, ShoppingBasket } from 'lucide-react';

const successStories = [
  {
    id: 1,
    title: "Pizza Napoli - Kadıköy",
    before: {
      image: "/ResturantImage1.png",
      dailyOrder: "8-12 adet",
      avgBasket: "120 ₺",
      complaints: ["Geç teslimat", "Soğuk ürün", "Yüksek fiyat algısı"]
    },
    after: {
      image: "/ResturantImage2.png",
      dailyOrder: "35-50 adet",
      avgBasket: "165 ₺",
      improvements: ["Teslimat süresi optimize edildi", "Kampanya kullanımı artırıldı", "Menü fiyat dengesi sağlandı"]
    }
  },
  {
    id: 2,
    title: "Burger House - Üsküdar",
    before: {
      image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800",
      dailyOrder: "5-10 adet",
      avgBasket: "90 ₺",
      complaints: ["Düşük görünürlük", "Kampanya yok", "Yüksek kargo"]
    },
    after: {
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800",
      dailyOrder: "28-50 adet",
      avgBasket: "150 ₺",
      improvements: ["Trendyol kampanyaları aktif edildi", "Kampanya kullanımı artırıldı", "Ücretsiz kargo stratejisi"]
    }
  }
];

const RestaurantCaseStudy = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const story = successStories[activeIndex];

  return (
    <div className="min-h-screen bg-[#f3f6f9] py-12 px-4 font-sans">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Başarı Hikayeleri</h2>
        <p className="text-gray-500">Müşterilerimizle çalışmadan önce ve sonra elde edilen sonuçlar</p>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#4a90e2] py-3 text-center">
          <h3 className="text-white font-semibold text-lg">{story.title}</h3>
        </div>

        <div className="p-6 md:p-10 grid md:grid-cols-2 gap-8">
          {/* ÖNCESİ BÖLÜMÜ */}
          <div className="flex flex-col gap-6">
            <h4 className="text-center font-bold text-gray-700 text-xl">Öncesi</h4>
            {/* Yüksekliği h-[550px] yaparak Figma'daki uzunluğu yakaladık */}
            <div className="rounded-3xl overflow-hidden h-[550px] shadow-md border border-gray-100">
              <img 
                src={story.before.image} 
                alt="Öncesi" 
                className="w-full h-full object-cover object-center" 
              />
            </div>
            
            <div className="bg-[#fff1f1] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Tag className="text-red-400 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Günlük Sipariş</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400" /> {story.before.dailyOrder}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBasket className="text-red-400 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ortalama Sepet</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400" /> {story.before.avgBasket}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="text-red-500 w-5 h-5" />
                  <span className="font-bold text-gray-700">Şikayet</span>
                </div>
                <ul className="space-y-1 ml-7 text-xs text-gray-600 italic">
                  {story.before.complaints.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* SONRASI BÖLÜMÜ */}
          <div className="flex flex-col gap-6">
            <h4 className="text-center font-bold text-gray-700 text-xl">Sonrası</h4>
            <div className="rounded-3xl overflow-hidden h-[550px] shadow-md border border-gray-100">
              <img 
                src={story.after.image} 
                alt="Sonrası" 
                className="w-full h-full object-cover object-center" 
              />
            </div>

            <div className="bg-[#f0f9f4] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Tag className="text-green-500 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Günlük Sipariş</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {story.after.dailyOrder}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBasket className="text-green-500 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ortalama Sepet</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {story.after.avgBasket}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="text-green-500 w-5 h-5 rotate-45" />
                  <span className="font-bold text-gray-700">İyileşmeler</span>
                </div>
                <ul className="space-y-1 ml-7 text-xs text-gray-600 italic">
                  {story.after.improvements.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination aynı kalıyor */}
      <div className="flex justify-center gap-3 mt-8">
        {[0, 1, 2].map((num) => (
          <button
            key={num}
            onClick={() => num < successStories.length && setActiveIndex(num)}
            className={`w-10 h-10 rounded-full font-bold transition-all ${
              activeIndex === num ? 'bg-[#4d44f5] text-white' : 'bg-white text-[#4d44f5] border border-[#4d44f5] hover:bg-indigo-50'
            }`}
          >
            {num + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
export default RestaurantCaseStudy;