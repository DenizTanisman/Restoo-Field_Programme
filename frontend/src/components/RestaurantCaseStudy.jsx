import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Tag, ShoppingBasket } from 'lucide-react';
import { api } from '../api/client';

const RestaurantCaseStudy = () => {
  const [stories, setStories] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCaseStudies()
      .then(setStories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || stories.length === 0) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] flex items-center justify-center">
        <p className="text-gray-400 text-sm">{error ?? "Henüz başarı hikayesi eklenmemiş."}</p>
      </div>
    );
  }

  const story = stories[activeIndex] ?? stories[0];

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
          {/* ÖNCESİ */}
          <div className="flex flex-col gap-6">
            <h4 className="text-center font-bold text-gray-700 text-xl">Öncesi</h4>
            <div className="rounded-3xl overflow-hidden h-[550px] shadow-md border border-gray-100">
              {story.before.image ? (
                <img src={story.before.image} alt="Öncesi" className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Görsel yok</div>
              )}
            </div>
            <div className="bg-[#fff1f1] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Tag className="text-red-400 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Günlük Sipariş</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400" /> {story.before.dailyOrder ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBasket className="text-red-400 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ortalama Sepet</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-red-400" /> {story.before.avgBasket ?? "-"}
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

          {/* SONRASI */}
          <div className="flex flex-col gap-6">
            <h4 className="text-center font-bold text-gray-700 text-xl">Sonrası</h4>
            <div className="rounded-3xl overflow-hidden h-[550px] shadow-md border border-gray-100">
              {story.after.image ? (
                <img src={story.after.image} alt="Sonrası" className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Görsel yok</div>
              )}
            </div>
            <div className="bg-[#f0f9f4] rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Tag className="text-green-500 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Günlük Sipariş</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {story.after.dailyOrder ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBasket className="text-green-500 w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ortalama Sepet</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> {story.after.avgBasket ?? "-"}
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

      <div className="flex justify-center gap-3 mt-8">
        {stories.map((_, num) => (
          <button
            key={num}
            onClick={() => setActiveIndex(num)}
            className={`w-10 h-10 rounded-full font-bold transition-all ${
              activeIndex === num
                ? 'bg-[#4d44f5] text-white'
                : 'bg-white text-[#4d44f5] border border-[#4d44f5] hover:bg-indigo-50'
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
