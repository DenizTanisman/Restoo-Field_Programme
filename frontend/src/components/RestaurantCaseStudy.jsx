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
      <div className="bg-base-200 rounded-3xl flex items-center justify-center p-12">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || stories.length === 0) {
    return (
      <div className="bg-base-200 rounded-3xl flex items-center justify-center p-12">
        <p className="text-base-content/50 text-sm">{error ?? "Henüz başarı hikayesi eklenmemiş."}</p>
      </div>
    );
  }

  const story = stories[activeIndex] ?? stories[0];

  return (
    <div className="bg-base-200 py-10 px-4 font-sans rounded-3xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-base-content mb-1">Başarı Hikayeleri</h2>
        <p className="text-base-content text-sm opacity-80">Müşterilerimizle çalışmadan önce ve sonra elde edilen sonuçlar</p>
      </div>

      {/* Restoran navigasyonu — üstte */}
      <div className="flex justify-center gap-3 mb-6">
        {stories.map((_, num) => (
          <button
            key={num}
            onClick={() => setActiveIndex(num)}
            className={`w-10 h-10 rounded-full font-bold transition-all ${
              activeIndex === num
                ? 'bg-primary text-primary-content shadow'
                : 'bg-base-100 text-primary border border-primary hover:bg-primary/10'
            }`}
          >
            {num + 1}
          </button>
        ))}
      </div>

      <div className="bg-base-100 rounded-3xl shadow-sm border border-base-300 overflow-hidden">
        <div className="bg-info py-3 text-center">
          <h3 className="text-info-content font-semibold text-lg">{story.title}</h3>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-8">
          {/* ÖNCESİ — üstte */}
          <div className="flex flex-col gap-4">
            <h4 className="text-center font-bold text-base-content text-xl">Öncesi</h4>
            <div className="rounded-3xl overflow-hidden h-[410px] shadow-md border border-base-300">
              {story.before.image ? (
                <img src={story.before.image} alt="Öncesi" className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full bg-base-200 flex items-center justify-center text-base-content/50 text-sm">Görsel yok</div>
              )}
            </div>
            <div className="bg-error/10 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Tag className="text-error w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-base-content uppercase tracking-wider">Günlük Sipariş</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-base-content">
                      <CheckCircle2 className="w-3.5 h-3.5 text-error" /> {story.before.dailyOrder ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBasket className="text-error w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-base-content uppercase tracking-wider">Ortalama Sepet</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-base-content">
                      <CheckCircle2 className="w-3.5 h-3.5 text-error" /> {story.before.avgBasket ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-error/30">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="text-error w-5 h-5" />
                  <span className="font-bold text-base-content">Şikayet</span>
                </div>
                <ul className="space-y-1 ml-7 text-xs text-base-content italic">
                  {story.before.complaints.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-error rounded-full"></span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* SONRASI — altta */}
          <div className="flex flex-col gap-4">
            <h4 className="text-center font-bold text-base-content text-xl">Sonrası</h4>
            <div className="rounded-3xl overflow-hidden h-[410px] shadow-md border border-base-300">
              {story.after.image ? (
                <img src={story.after.image} alt="Sonrası" className="w-full h-full object-cover object-center" />
              ) : (
                <div className="w-full h-full bg-base-200 flex items-center justify-center text-base-content/50 text-sm">Görsel yok</div>
              )}
            </div>
            <div className="bg-success/10 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Tag className="text-success w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-base-content uppercase tracking-wider">Günlük Sipariş</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-base-content">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" /> {story.after.dailyOrder ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBasket className="text-success w-5 h-5 mt-1 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-base-content uppercase tracking-wider">Ortalama Sepet</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-base-content">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" /> {story.after.avgBasket ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-success/30">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="text-success w-5 h-5 rotate-45" />
                  <span className="font-bold text-base-content">İyileşmeler</span>
                </div>
                <ul className="space-y-1 ml-7 text-xs text-base-content italic">
                  {story.after.improvements.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-success rounded-full"></span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCaseStudy;