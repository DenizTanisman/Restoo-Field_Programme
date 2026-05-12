"""Lokal dev için minimal seed — idempotent."""
import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import Category, District


CATEGORIES = [
    {"id": 1, "name": "Burger", "emoji": "🍔", "sort_order": 1},
    {"id": 2, "name": "Pizza", "emoji": "🍕", "sort_order": 2},
    {"id": 3, "name": "Kebap", "emoji": "🥙", "sort_order": 3},
    {"id": 4, "name": "Sushi", "emoji": "🍣", "sort_order": 4},
    {"id": 5, "name": "Tatlı", "emoji": "🍰", "sort_order": 5},
    {"id": 6, "name": "Kahvaltı", "emoji": "🥐", "sort_order": 6},
]


def load_districts() -> list[dict]:
    paths = [
        Path("/tmp/opencard_districts.json"),
        Path(__file__).resolve().parent / "districts.json",
    ]
    for p in paths:
        if p.exists():
            return json.loads(p.read_text())
    return []


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = {d for d, in (await session.execute(select(District.id))).all()}
        for d in load_districts():
            if d["id"] in existing:
                continue
            session.add(District(id=d["id"], name=d["name"], side=d["side"], svg_path=d.get("svg_path", "")))
        existing_cat = {c for c, in (await session.execute(select(Category.id))).all()}
        for c in CATEGORIES:
            if c["id"] in existing_cat:
                continue
            session.add(Category(**c))
        await session.commit()
    print("OK - seed complete")


if __name__ == "__main__":
    asyncio.run(main())
