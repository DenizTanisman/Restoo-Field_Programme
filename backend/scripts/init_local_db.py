"""Lokal SQLite şemasını sıfırdan oluştur. Sadece dev için — prod Alembic kullanır."""
import asyncio

from app.database import engine
from app.models import Base


async def main() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"OK - schema created on {engine.url}")


if __name__ == "__main__":
    asyncio.run(main())
