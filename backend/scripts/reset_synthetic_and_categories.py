"""Yapay verileri tamamen sıfırla + kategorileri 26 yeni isimle değiştir.

Sırası (FK güvenli):
  1) restaurant_metrics, restaurant_analytics, restaurant_platforms (cascade ile)
  2) restaurants
  3) neighborhood_analytics, neighborhood_metrics
  4) district_analytics, district_metrics
  5) categories (DELETE) + sequence reset
  6) 26 yeni kategori INSERT (sort_order'a göre alfabetik)

Districts, neighborhoods, platforms tablolarına DOKUNULMAZ.

Çalıştırma:
    cd backend && python -m scripts.reset_synthetic_and_categories
"""
import asyncio

from sqlalchemy import text

from app.database import AsyncSessionLocal


NEW_CATEGORIES = [
    "Balık & Deniz Ürünleri",
    "Börek",
    "Çiğ Köfte",
    "Çorba",
    "Dondurma",
    "Döner",
    "Dünya Mutfağı & Cafe",
    "Ev Yemekleri",
    "Hamburger",
    "Kahvaltı",
    "Kahve & İçecek",
    "Kebap",
    "Köfte",
    "Mantı & Makarna",
    "Meze",
    "Pastane & Fırın",
    "Pide & Lahmacun",
    "Pizza",
    "Salata & Sağlık",
    "Sokak Lezzetleri",
    "Steak",
    "Tantuni",
    "Tatlı",
    "Tavuk",
    "Tost & Sandviç",
    "Uzak Doğu",
]

EMOJI = {
    "Balık & Deniz Ürünleri": "🐟",
    "Börek": "🥟",
    "Çiğ Köfte": "🌶️",
    "Çorba": "🍲",
    "Dondurma": "🍦",
    "Döner": "🌯",
    "Dünya Mutfağı & Cafe": "🌍",
    "Ev Yemekleri": "🍛",
    "Hamburger": "🍔",
    "Kahvaltı": "🥐",
    "Kahve & İçecek": "☕",
    "Kebap": "🥙",
    "Köfte": "🍡",
    "Mantı & Makarna": "🍝",
    "Meze": "🫒",
    "Pastane & Fırın": "🥖",
    "Pide & Lahmacun": "🫓",
    "Pizza": "🍕",
    "Salata & Sağlık": "🥗",
    "Sokak Lezzetleri": "🌭",
    "Steak": "🥩",
    "Tantuni": "🌯",
    "Tatlı": "🍰",
    "Tavuk": "🍗",
    "Tost & Sandviç": "🥪",
    "Uzak Doğu": "🍣",
}


async def main() -> None:
    async with AsyncSessionLocal() as session:
        # 0) Diğer FK bağlı tablolar
        await session.execute(text("DELETE FROM competitors"))
        # 1) Restoran-bağımlı tablolar (CASCADE'ler restaurant_platforms/restaurant_metrics'i temizler)
        await session.execute(text("DELETE FROM restaurants"))
        # 2) Bölge metrics/analytics
        await session.execute(text("DELETE FROM neighborhood_analytics"))
        await session.execute(text("DELETE FROM neighborhood_metrics"))
        await session.execute(text("DELETE FROM district_analytics"))
        await session.execute(text("DELETE FROM district_metrics"))
        # 3) Kategoriler — önce FK refs'lerini temizle
        await session.execute(text("UPDATE case_studies SET category_id = NULL WHERE category_id IS NOT NULL"))
        await session.execute(text("DELETE FROM categories"))
        await session.execute(text("ALTER SEQUENCE categories_id_seq RESTART WITH 1"))
        # 4) Yeni kategoriler — alfabetik sırayla, sort_order otomatik
        for i, name in enumerate(NEW_CATEGORIES, start=1):
            await session.execute(
                text("INSERT INTO categories (id, name, emoji, sort_order, is_active) VALUES (:id, :name, :emoji, :so, TRUE)"),
                {"id": i, "name": name, "emoji": EMOJI.get(name, "🍽️"), "so": i},
            )
        # Sequence'i son ID'nin üstüne çek
        await session.execute(text(f"SELECT setval('categories_id_seq', {len(NEW_CATEGORIES)})"))
        await session.commit()
        print(f"OK — yapay veriler silindi, {len(NEW_CATEGORIES)} yeni kategori eklendi.")


if __name__ == "__main__":
    asyncio.run(main())
