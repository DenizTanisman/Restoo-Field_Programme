from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Restaurant, RestaurantPlatform
from app.schemas import RestaurantSchema

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/search", response_model=list[RestaurantSchema])
async def search_restaurants(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant)
        .where(Restaurant.name.ilike(f"%{q}%"), Restaurant.is_active == True)
        .options(
            selectinload(Restaurant.district),
            selectinload(Restaurant.category),
            selectinload(Restaurant.platforms).selectinload(RestaurantPlatform.platform),
        )
        .limit(20)
    )
    restaurants = result.scalars().all()

    return [
        RestaurantSchema(
            id=r.id,
            name=r.name,
            district_id=r.district_id,
            district_name=r.district.name if r.district else "",
            category_label=r.category.name if r.category else "",
            category_emoji=r.category.emoji if r.category else "",
            platforms=[
                {"name": rp.platform.name, "customers": rp.customers}
                for rp in r.platforms
                if rp.platform
            ],
        )
        for r in restaurants
    ]
