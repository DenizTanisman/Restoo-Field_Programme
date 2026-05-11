from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import District, Neighborhood
from app.schemas import DistrictSchema, NeighborhoodSchema

router = APIRouter(prefix="/districts", tags=["Districts"])


@router.get("", response_model=list[DistrictSchema])
async def list_districts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(District).where(District.is_active == True))
    return result.scalars().all()


@router.get("/{district_id}", response_model=DistrictSchema)
async def get_district(district_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(District).where(District.id == district_id))
    district = result.scalar_one_or_none()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district


@router.get("/{district_id}/neighborhoods", response_model=list[NeighborhoodSchema])
async def get_neighborhoods(district_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Neighborhood)
        .where(Neighborhood.district_id == district_id, Neighborhood.is_active == True)
        .order_by(Neighborhood.name)
    )
    return result.scalars().all()
