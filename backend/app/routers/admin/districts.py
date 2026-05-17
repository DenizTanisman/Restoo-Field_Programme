from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    District,
    Neighborhood,
    NeighborhoodAnalytics,
    NeighborhoodMetrics,
    Restaurant,
)
from app.schemas import DistrictSchema, NeighborhoodSchema


router = APIRouter(prefix="/districts", tags=["Admin Districts"])


class DistrictInput(BaseModel):
    id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=100)
    side: str = Field(min_length=1, max_length=20)
    svg_path: str = ""
    is_active: bool = True


class DistrictUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    side: str = Field(min_length=1, max_length=20)
    svg_path: str = ""
    is_active: bool = True


class NeighborhoodInput(BaseModel):
    name: str
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def _validate_name(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Mahalle adı boş olamaz")
        if len(v) > 50:
            raise ValueError("Mahalle adı en fazla 50 karakter olabilir")
        return v


@router.get("", response_model=list[DistrictSchema])
async def list_districts(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(District).order_by(District.name))
    return res.scalars().all()


@router.post("", response_model=DistrictSchema, status_code=status.HTTP_201_CREATED)
async def create_district(payload: DistrictInput, db: AsyncSession = Depends(get_db)):
    existing = (await db.execute(select(District).where(District.id == payload.id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Bu ID'de ilçe zaten var")
    d = District(**payload.model_dump())
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return d


@router.put("/{district_id}", response_model=DistrictSchema)
async def update_district(district_id: str, payload: DistrictUpdate, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="İlçe bulunamadı")
    for k, v in payload.model_dump().items():
        setattr(d, k, v)
    await db.commit()
    await db.refresh(d)
    return d


@router.delete("/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_district(district_id: str, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="İlçe bulunamadı")
    in_use = (
        await db.execute(select(func.count(Restaurant.id)).where(Restaurant.district_id == district_id))
    ).scalar_one()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"Bu ilçe {in_use} restoran tarafından kullanılıyor",
        )
    await db.delete(d)
    await db.commit()


# === Data coverage (toggle: sadece veri girilen ilçe/mahalleleri göster) ===

@router.get("/data-coverage")
async def districts_data_coverage(db: AsyncSession = Depends(get_db)):
    """Verisi olan mahalleleri ilçeye gruplayarak döner.

    "Veri" = NeighborhoodMetrics veya NeighborhoodAnalytics tablosunda kayıt.
    Response: { "district_neighborhoods": { "34-kadıköy": [513, 514, ...], ... } }
    Sadece en az bir verili mahallesi olan ilçeler dahildir.
    """
    metric_ids = (
        await db.execute(select(NeighborhoodMetrics.neighborhood_id).distinct())
    ).scalars().all()
    analytics_ids = (
        await db.execute(select(NeighborhoodAnalytics.neighborhood_id).distinct())
    ).scalars().all()
    data_nb_ids = {nid for nid in (*metric_ids, *analytics_ids) if nid is not None}

    coverage: dict[str, list[int]] = {}
    if data_nb_ids:
        rows = (
            await db.execute(
                select(Neighborhood).where(Neighborhood.id.in_(data_nb_ids))
            )
        ).scalars().all()
        for n in rows:
            coverage.setdefault(n.district_id, []).append(n.id)
        # Sıralı dönelim
        for k in coverage:
            coverage[k].sort()

    return {"district_neighborhoods": coverage}


# === Neighborhoods (nested) ===

@router.get("/{district_id}/neighborhoods", response_model=list[NeighborhoodSchema])
async def list_neighborhoods(district_id: str, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="İlçe bulunamadı")
    res = await db.execute(
        select(Neighborhood).where(Neighborhood.district_id == district_id).order_by(Neighborhood.name)
    )
    return res.scalars().all()


@router.post(
    "/{district_id}/neighborhoods",
    response_model=NeighborhoodSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_neighborhood(district_id: str, payload: NeighborhoodInput, db: AsyncSession = Depends(get_db)):
    d = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="İlçe bulunamadı")
    n = Neighborhood(district_id=district_id, **payload.model_dump())
    db.add(n)
    await db.commit()
    await db.refresh(n)
    return n


@router.put("/neighborhoods/{neighborhood_id}", response_model=NeighborhoodSchema)
async def update_neighborhood(neighborhood_id: int, payload: NeighborhoodInput, db: AsyncSession = Depends(get_db)):
    n = (await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))).scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404, detail="Mahalle bulunamadı")
    for k, v in payload.model_dump().items():
        setattr(n, k, v)
    await db.commit()
    await db.refresh(n)
    return n


@router.delete("/neighborhoods/{neighborhood_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_neighborhood(neighborhood_id: int, db: AsyncSession = Depends(get_db)):
    n = (await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))).scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404, detail="Mahalle bulunamadı")
    await db.delete(n)
    await db.commit()
