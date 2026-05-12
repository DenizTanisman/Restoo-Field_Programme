from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import District, Neighborhood, Restaurant
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
    name: str = Field(min_length=1, max_length=50)
    is_active: bool = True


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
