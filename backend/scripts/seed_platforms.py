"""Veritabanına platformları ID belirtmeden, otomatik artışa güvenerek ekleyen script."""
import asyncio
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Platform

# ID alanlarını tamamen kaldırdık, veritabanı sırayla kendi atayacak
PLATFORMS = [
    {
        "name": "Uber Eats Trendyol Go", 
        "color_hex": "#FF6000", 
        "logo_url": "http://localhost:8003/media/logos/ubereats.png"
    },
    {
        "name": "Getir", 
        "color_hex": "#5C3EBC", 
        "logo_url": "http://localhost:8003/media/logos/getir.png"
    },
    {
        "name": "Yemeksepeti", 
        "color_hex": "#CC0000", 
        "logo_url": "http://localhost:8003/media/logos/yemeksepeti.png"
    },
]

async def main() -> None:
    print("→ Platformlar veritabanına otomatik ID'lerle yükleniyor...")
    async with AsyncSessionLocal() as session:
        # İdempotent kontrolü bu sefer isimler üzerinden yapıyoruz
        existing_names = {p for p, in (await session.execute(select(Platform.name))).all()}
        
        created_count = 0
        for p_data in PLATFORMS:
            if p_data["name"] in existing_names:
                print(f"  ⚠ Platform zaten var, atlandı: {p_data['name']}")
                continue
                
            new_platform = Platform(
                name=p_data["name"],
                color_hex=p_data["color_hex"],
                logo_url=p_data["logo_url"]
            )
            session.add(new_platform)
            created_count += 1
            
        if created_count > 0:
            await session.commit()
            print(f"✅ Başarılı: {created_count} platform veritabanına eklendi.")
        else:
            print("ℹ Tüm platformlar isim kontrolüne göre zaten mevcut.")

if __name__ == "__main__":
    asyncio.run(main())