from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Category, Restaurant
from app.schemas import CategorySchema


router = APIRouter(prefix="/categories", tags=["Admin Categories"])


class CategoryInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    emoji: str = Field(min_length=1, max_length=10)
    sort_order: int = 0
    is_active: bool = True


@router.get("", response_model=list[CategorySchema])
async def list_categories(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category).order_by(Category.sort_order, Category.name))
    return res.scalars().all()


@router.post("", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryInput, db: AsyncSession = Depends(get_db)):
    cat = Category(**payload.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(category_id: int, payload: CategoryInput, db: AsyncSession = Depends(get_db)):
    cat = (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    for k, v in payload.model_dump().items():
        setattr(cat, k, v)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    cat = (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    in_use = (
        await db.execute(select(func.count(Restaurant.id)).where(Restaurant.category_id == category_id))
    ).scalar_one()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"Bu kategori {in_use} restoran tarafından kullanılıyor",
        )
    await db.delete(cat)
    await db.commit()
