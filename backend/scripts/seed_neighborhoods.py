"""İstanbul mahallelerini DB'ye yükle. Idempotent.

Veri kaynağı: scripts/neighborhoods.json (Wikipedia'dan parse edildi).
Beklenen yapı: { "34-fatih": { "name": "Fatih", "neighborhoods": ["...", ...] }, ... }
"""
import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import District, Neighborhood


def load_data() -> dict:
    path = Path(__file__).resolve().parent / "neighborhoods.json"
    if not path.exists():
        raise SystemExit(f"Veri dosyası yok: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


async def main() -> None:
    data = load_data()

    async with AsyncSessionLocal() as session:
        existing_districts = {
            d for d, in (await session.execute(select(District.id))).all()
        }
        created_neigh = 0
        skipped_neigh = 0
        missing_districts = []

        for district_id, info in data.items():
            if district_id not in existing_districts:
                missing_districts.append(district_id)
                continue

            # Bu ilçedeki mevcut mahalle adları
            existing_names = {
                n for n, in (
                    await session.execute(
                        select(Neighborhood.name).where(Neighborhood.district_id == district_id)
                    )
                ).all()
            }

            for name in info["neighborhoods"]:
                if name in existing_names:
                    skipped_neigh += 1
                    continue
                session.add(
                    Neighborhood(district_id=district_id, name=name, is_active=True)
                )
                created_neigh += 1

        await session.commit()

    print(f"Eklenen mahalle: {created_neigh}")
    print(f"Zaten var (atlandı): {skipped_neigh}")
    if missing_districts:
        print(f"DB'de bulunmayan ilçeler: {missing_districts}")


if __name__ == "__main__":
    asyncio.run(main())
