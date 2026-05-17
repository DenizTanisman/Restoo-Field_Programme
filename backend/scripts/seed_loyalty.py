"""Sadakat (loyalty) sayfası varsayılan içeriği — idempotent seed.

Sadece site_settings tablosunda hiç satır yoksa (id=1) ekler.
Mevcut satıra DOKUNMAZ — admin panelden değiştirildiyse korunsun.

Çalıştırma:
    cd backend && python -m scripts.seed_loyalty
"""
import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import SiteSettings


DEFAULT_FEATURE_CARDS = [
    {
        "title": "Performans Karşılaştırmaları",
        "text": (
            "Dönemsel karşılaştırmalar sunarak bu ay/hafta ile geçen ay/hafta "
            "arasındaki sadakat metriklerini kıyaslamanıza olanak sağlıyoruz.\n"
            "Platform bazlı analiz sunarak Yemeksepeti, Getir ve Trendyol üzerinden "
            "gelen siparişlerin sadakat farklılıklarını görmenize katkı sağlıyoruz.\n"
            "Trend grafikleri sunarak sadakat metriklerinin zaman içindeki "
            "değişimini takip etmenize yardımcı oluyoruz."
        ),
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "title": "Tahmin ve Öneriler",
        "text": (
            "Gelecek dönem tahminleri sunarak mevcut trendlere göre gelecek ay "
            "beklenen sadakat metriklerini öngörmenize katkı sağlıyoruz.\n"
            "Aksiyon önerileri sunarak sadakat artırmak için uygulanabilecek genel "
            "stratejileri belirlemenize yardımcı oluyoruz.\n"
            "Benchmark karşılaştırmaları sunarak sektör ortalamalarıyla performansınızı "
            "kıyaslamanıza olanak sağlıyoruz."
        ),
        "image_url": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "title": "Genel Sadakat Metrikleri",
        "text": (
            "Tekrar sipariş oranı sunarak tüm müşterilerin yüzde kaçının tekrar "
            "sipariş verdiğini görmenize katkı sağlıyoruz.\n"
            "Ortalama sipariş sıklığı sunarak müşterilerin ortalama kaç günde bir "
            "sipariş verdiğini anlamanıza yardımcı oluyoruz.\n"
            "Müşteri segmentasyonu dağılımı sunarak toplam müşterilerin yüzde kaçının "
            "sadık, yeni veya kaybedilen kategorisinde olduğunu görmenize olanak sağlıyoruz.\n"
            "Ortalama müşteri yaşam süresi sunarak müşterilerin ortalama kaç gün/ay "
            "aktif kaldığını ölçmenize katkı sağlıyoruz."
        ),
        "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    },
    {
        "title": "Segmentasyon Analizleri",
        "text": (
            "Müşteri segmentlerinin dağılımı sunarak sadık, yeni, yüksek değerli ve "
            "kayıp riski taşıyan müşterilerin yüzdelerini görmenize katkı sağlıyoruz.\n"
            "Segment bazlı ortalama değerler sunarak her segmentin ortalama sipariş "
            "sıklığı, sepet değeri ve yaşam süresini anlamanıza yardımcı oluyoruz.\n"
            "Segment geçişleri sunarak müşterilerin segmentler arası hareketlerini "
            "(örn: yeni müşteriden sadık müşteriye geçiş oranı) takip etmenize olanak sağlıyoruz."
        ),
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    },
]


DEFAULTS = dict(
    id=1,
    # Stats sayıları
    loyalty_active_firms="340+",
    loyalty_churn_reduction="%38",
    loyalty_avg_roi="2.6x",
    loyalty_payback_period="90 Gün",
    # Stats etiketleri
    loyalty_stats_active_firms_label="Aktif Firma",
    loyalty_stats_churn_label="Ortalama Churn Azalması",
    loyalty_stats_roi_label="Ortalama ROI",
    loyalty_stats_payback_label="Ortalama Geri Ödeme Süresi",
    # Hero
    loyalty_hero_bg_url="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1800&q=80",
    loyalty_hero_badge="Sadakat Programı",
    loyalty_hero_title="Müşterini koru,",
    loyalty_hero_title_accent="gelirini büyüt.",
    loyalty_hero_subtitle=(
        "Yemeksepeti, Trendyol ve Getir gibi platformlardaki müşterilerinizi "
        "segmentlere ayırın, risk altındakileri tespit edin, doğru kampanyayla geri kazanın."
    ),
    loyalty_hero_cta_text="Nasıl Çalışır?",
    # Features section header
    loyalty_features_title="Neler Sunuyoruz?",
    loyalty_features_subtitle="Her özellik, somut bir kazanımla geliyor.",
    # 4 feature card
    loyalty_feature_cards=DEFAULT_FEATURE_CARDS,
)


async def main() -> None:
    """Backfill loyalty content into site_settings.id=1.

    Yeni satır: hepsini doldurur.
    Var olan satır: SADECE boş alanları doldurur — admin panelden yapılan
    değişiklikler korunur.
    """
    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(select(SiteSettings).where(SiteSettings.id == 1))
        ).scalar_one_or_none()
        if existing is None:
            session.add(SiteSettings(**DEFAULTS))
            await session.commit()
            print("OK — sadakat varsayılan içeriği eklendi (id=1).")
            return

        filled = []
        for key, value in DEFAULTS.items():
            if key == "id":
                continue
            current = getattr(existing, key, None)
            # boş string, None, veya boş liste → backfill
            is_empty = current is None or current == "" or current == []
            if is_empty:
                setattr(existing, key, value)
                filled.append(key)
        if filled:
            await session.commit()
            print(f"OK — {len(filled)} boş alan dolduruldu: {', '.join(filled)}")
        else:
            print("Tüm sadakat alanları zaten dolu — değişiklik yapılmadı.")


if __name__ == "__main__":
    asyncio.run(main())
