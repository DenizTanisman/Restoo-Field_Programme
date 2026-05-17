from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Platform
from app.schemas import PlatformSchema

router = APIRouter(prefix="/platforms", tags=["Platforms"])


@router.get("", response_model=list[PlatformSchema])
async def list_platforms(db: AsyncSession = Depends(get_db)):
    """Public — aktif platformların id, name, color_hex, logo_url listesi."""
    result = await db.execute(
        select(Platform).where(Platform.is_active == True).order_by(Platform.name)  # noqa: E712
    )
    return result.scalars().all()
