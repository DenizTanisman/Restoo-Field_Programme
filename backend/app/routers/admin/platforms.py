from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Platform, RestaurantPlatform
from app.schemas import PlatformSchema


router = APIRouter(prefix="/platforms", tags=["Admin Platforms"])


class PlatformInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color_hex: str | None = Field(default=None, max_length=7)
    logo_url: str | None = None
    is_active: bool = True


@router.get("", response_model=list[PlatformSchema])
async def list_platforms(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Platform).order_by(Platform.name))
    return res.scalars().all()


@router.post("", response_model=PlatformSchema, status_code=status.HTTP_201_CREATED)
async def create_platform(payload: PlatformInput, db: AsyncSession = Depends(get_db)):
    existing = (
        await db.execute(select(Platform).where(Platform.name == payload.name))
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Bu isimde platform zaten var")
    p = Platform(**payload.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@router.put("/{platform_id}", response_model=PlatformSchema)
async def update_platform(platform_id: int, payload: PlatformInput, db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Platform).where(Platform.id == platform_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Platform bulunamadı")
    for k, v in payload.model_dump().items():
        setattr(p, k, v)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/{platform_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_platform(platform_id: int, db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(Platform).where(Platform.id == platform_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Platform bulunamadı")
    in_use = (
        await db.execute(
            select(func.count(RestaurantPlatform.id)).where(RestaurantPlatform.platform_id == platform_id)
        )
    ).scalar_one()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"Bu platform {in_use} restoran ilişkisinde kullanılıyor",
        )
    await db.delete(p)
    await db.commit()
