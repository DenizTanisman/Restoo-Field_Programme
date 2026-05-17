from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import District, Neighborhood, NeighborhoodAnalytics, NeighborhoodMetrics
from app.schemas import DistrictSchema, NeighborhoodSchema

router = APIRouter(prefix="/districts", tags=["Districts"])


@router.get("", response_model=list[DistrictSchema])
async def list_districts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(District).where(District.is_active == True))
    return result.scalars().all()


@router.get("/data-coverage")
async def public_data_coverage(db: AsyncSession = Depends(get_db)):
    """NeighborhoodMetrics veya NeighborhoodAnalytics tablosunda kaydı olan
    mahalleleri ilçeye gruplayarak döner. Public dashboard'daki
    'Sadece verisi olanlar' toggle'ı bu endpoint'i kullanır.
    """
    metric_ids = (await db.execute(select(NeighborhoodMetrics.neighborhood_id).distinct())).scalars().all()
    analytics_ids = (await db.execute(select(NeighborhoodAnalytics.neighborhood_id).distinct())).scalars().all()
    ids = {n for n in (*metric_ids, *analytics_ids) if n is not None}
    coverage: dict[str, list[int]] = {}
    if ids:
        rows = (await db.execute(select(Neighborhood).where(Neighborhood.id.in_(ids)))).scalars().all()
        for n in rows:
            coverage.setdefault(n.district_id, []).append(n.id)
        for k in coverage:
            coverage[k].sort()
    return {"district_neighborhoods": coverage}


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
