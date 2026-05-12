from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Restaurant
from app.schemas import RestaurantSchema
from app.services.restaurant_service import LOAD_OPTIONS, serialize_restaurant


router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/search", response_model=list[RestaurantSchema])
async def search_restaurants(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant)
        .where(Restaurant.name.ilike(f"%{q}%"), Restaurant.is_active == True)
        .options(*LOAD_OPTIONS)
        .limit(20)
    )
    return [serialize_restaurant(r) for r in result.scalars().all()]
