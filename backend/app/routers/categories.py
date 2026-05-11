from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Category
from app.schemas import CategorySchema

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategorySchema])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.sort_order, Category.name)
    )
    return result.scalars().all()
