"""Lokal dev için admin kullanıcısı oluştur — idempotent."""
import asyncio

from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import AdminUser
from app.services.auth_service import hash_password


async def main() -> None:
    async with AsyncSessionLocal() as session:
        existing = (
            await session.execute(
                select(AdminUser).where(AdminUser.email == settings.ADMIN_DEFAULT_EMAIL)
            )
        ).scalar_one_or_none()
        if existing:
            print(f"Admin already exists: {existing.email} (id={existing.id})")
            return
        admin = AdminUser(
            email=settings.ADMIN_DEFAULT_EMAIL,
            password_hash=hash_password(settings.ADMIN_DEFAULT_PASSWORD),
            full_name=settings.ADMIN_DEFAULT_NAME,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Created admin: {admin.email}")


if __name__ == "__main__":
    asyncio.run(main())
