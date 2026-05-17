import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Platform, RestaurantPlatform
from app.schemas import PlatformSchema


router = APIRouter(prefix="/platforms", tags=["Admin Platforms"])


_HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class PlatformInput(BaseModel):
    name: str
    color_hex: str
    logo_url: str
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def _normalize_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Ad boş olamaz")
        if len(v) > 100:
            raise ValueError("Ad en fazla 100 karakter olabilir")
        return v

    @field_validator("color_hex")
    @classmethod
    def _validate_color(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Renk değeri zorunludur")
        if not _HEX_RE.match(v):
            raise ValueError("Renk değeri #RRGGBB formatında olmalıdır")
        return v.upper()

    @field_validator("logo_url")
    @classmethod
    def _validate_logo(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Logo URL zorunludur")
        return v


async def _check_duplicate_name(db: AsyncSession, name: str, exclude_id: int | None = None) -> None:
    """İsim eşleşmesi case-insensitive ve trim'lenmiş halde yapılır."""
    normalized = name.strip().lower()
    stmt = select(Platform).where(func.lower(Platform.name) == normalized)
    if exclude_id is not None:
        stmt = stmt.where(Platform.id != exclude_id)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"'{existing.name}' adında bir platform zaten var",
        )


@router.get("", response_model=list[PlatformSchema])
async def list_platforms(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Platform).order_by(Platform.name))
    return res.scalars().all()


@router.post("", response_model=PlatformSchema, status_code=status.HTTP_201_CREATED)
async def create_platform(payload: PlatformInput, db: AsyncSession = Depends(get_db)):
    await _check_duplicate_name(db, payload.name)
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
    await _check_duplicate_name(db, payload.name, exclude_id=platform_id)
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
