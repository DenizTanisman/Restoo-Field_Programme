from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Category, District, Platform, Restaurant, RestaurantPlatform
from app.schemas import RestaurantSchema
from app.services.csv_service import RESTAURANT_COLUMNS, parse_csv_upload, rows_to_csv
from app.services.restaurant_service import LOAD_OPTIONS, serialize_restaurant


router = APIRouter(prefix="/restaurants", tags=["Admin Restaurants"])


class PlatformLink(BaseModel):
    platform_id: int
    customers: int = Field(ge=0, default=0)


class RestaurantInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    district_id: str
    category_id: int
    is_active: bool = True
    platforms: list[PlatformLink] = Field(default_factory=list)


class RestaurantListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: list[RestaurantSchema]


async def _ensure_refs(db: AsyncSession, district_id: str, category_id: int, platforms: list[PlatformLink]):
    district = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
    if not district:
        raise HTTPException(status_code=400, detail=f"district_id '{district_id}' bulunamadı")
    category = (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=400, detail=f"category_id '{category_id}' bulunamadı")
    if platforms:
        platform_ids = {p.platform_id for p in platforms}
        found = (
            await db.execute(select(Platform.id).where(Platform.id.in_(platform_ids)))
        ).scalars().all()
        missing = platform_ids - set(found)
        if missing:
            raise HTTPException(status_code=400, detail=f"platform_id bulunamadı: {sorted(missing)}")


async def _replace_platforms(db: AsyncSession, restaurant_id: int, links: list[PlatformLink]) -> None:
    await db.execute(delete(RestaurantPlatform).where(RestaurantPlatform.restaurant_id == restaurant_id))
    for link in links:
        db.add(
            RestaurantPlatform(
                restaurant_id=restaurant_id,
                platform_id=link.platform_id,
                customers=link.customers,
            )
        )


async def _reload(db: AsyncSession, restaurant_id: int) -> Restaurant:
    res = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id).options(*LOAD_OPTIONS)
    )
    return res.scalar_one()


@router.get("", response_model=RestaurantListResponse)
async def list_restaurants(
    db: AsyncSession = Depends(get_db),
    search: str | None = Query(default=None),
    district_id: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
):
    base = select(Restaurant).options(*LOAD_OPTIONS).order_by(Restaurant.id.desc())
    conds = []
    if search:
        conds.append(Restaurant.name.ilike(f"%{search}%"))
    if district_id:
        conds.append(Restaurant.district_id == district_id)
    if category_id:
        conds.append(Restaurant.category_id == category_id)
    if is_active is not None:
        conds.append(Restaurant.is_active == is_active)
    if conds:
        base = base.where(*conds)

    total = (
        await db.execute(select(func.count()).select_from(base.order_by(None).subquery()))
    ).scalar_one()

    rows = (
        await db.execute(base.offset((page - 1) * limit).limit(limit))
    ).scalars().all()

    return RestaurantListResponse(
        total=total,
        page=page,
        limit=limit,
        data=[serialize_restaurant(r) for r in rows],
    )


@router.post("", response_model=RestaurantSchema, status_code=status.HTTP_201_CREATED)
async def create_restaurant(payload: RestaurantInput, db: AsyncSession = Depends(get_db)):
    await _ensure_refs(db, payload.district_id, payload.category_id, payload.platforms)
    r = Restaurant(
        name=payload.name.strip(),
        district_id=payload.district_id,
        category_id=payload.category_id,
        is_active=payload.is_active,
    )
    db.add(r)
    await db.flush()
    await _replace_platforms(db, r.id, payload.platforms)
    await db.commit()
    return serialize_restaurant(await _reload(db, r.id))


@router.put("/{restaurant_id}", response_model=RestaurantSchema)
async def update_restaurant(restaurant_id: int, payload: RestaurantInput, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")
    await _ensure_refs(db, payload.district_id, payload.category_id, payload.platforms)
    r.name = payload.name.strip()
    r.district_id = payload.district_id
    r.category_id = payload.category_id
    r.is_active = payload.is_active
    await db.flush()
    await _replace_platforms(db, r.id, payload.platforms)
    await db.commit()
    return serialize_restaurant(await _reload(db, r.id))


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_restaurant(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")
    r.is_active = False
    await db.commit()


# === CSV ===

def _restaurant_to_csv_row(r: Restaurant) -> dict[str, Any]:
    return {
        "name": r.name,
        "district_id": r.district_id,
        "category_id": r.category_id,
        "is_active": "true" if r.is_active else "false",
        "platforms": json.dumps(
            [{"platform_id": rp.platform_id, "customers": rp.customers} for rp in r.platforms]
        ),
    }


@router.get("/csv", response_class=Response)
async def export_csv(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(Restaurant).options(*LOAD_OPTIONS).order_by(Restaurant.id))
    ).scalars().all()
    csv_text = rows_to_csv((_restaurant_to_csv_row(r) for r in rows), RESTAURANT_COLUMNS)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="restaurants.csv"'},
    )


@router.post("/csv", response_model=dict)
async def import_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records = await parse_csv_upload(file, RESTAURANT_COLUMNS)
    created = 0
    updated = 0
    errors: list[str] = []

    for idx, row in enumerate(records, start=2):  # 2 = ilk veri satırı (1=header)
        name = (row.get("name") or "").strip()
        district_id = (row.get("district_id") or "").strip()
        category_id_raw = (row.get("category_id") or "").strip()
        if not name or not district_id or not category_id_raw:
            errors.append(f"satır {idx}: name/district_id/category_id zorunlu")
            continue
        try:
            category_id = int(category_id_raw)
        except ValueError:
            errors.append(f"satır {idx}: category_id geçersiz")
            continue
        is_active = (row.get("is_active") or "true").strip().lower() not in {"false", "0", "no", ""}

        platforms: list[PlatformLink] = []
        platforms_raw = (row.get("platforms") or "").strip()
        if platforms_raw:
            try:
                parsed = json.loads(platforms_raw)
                platforms = [PlatformLink(**p) for p in parsed]
            except Exception as exc:  # noqa: BLE001
                errors.append(f"satır {idx}: platforms JSON hatası: {exc}")
                continue

        try:
            await _ensure_refs(db, district_id, category_id, platforms)
        except HTTPException as exc:
            errors.append(f"satır {idx}: {exc.detail}")
            continue

        existing = (
            await db.execute(
                select(Restaurant).where(
                    Restaurant.name == name, Restaurant.district_id == district_id
                )
            )
        ).scalar_one_or_none()

        if existing:
            existing.category_id = category_id
            existing.is_active = is_active
            await db.flush()
            await _replace_platforms(db, existing.id, platforms)
            updated += 1
        else:
            r = Restaurant(
                name=name,
                district_id=district_id,
                category_id=category_id,
                is_active=is_active,
            )
            db.add(r)
            await db.flush()
            await _replace_platforms(db, r.id, platforms)
            created += 1

    await db.commit()
    return {"created": created, "updated": updated, "errors": errors}
