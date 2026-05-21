from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Category,
    District,
    DistrictAnalytics,
    DistrictMetrics,
    Neighborhood,
    NeighborhoodAnalytics,
    NeighborhoodMetrics,
    Platform,
    Restaurant,
    RestaurantAnalytics,
    RestaurantMetrics,
    RestaurantPlatform,
)
from app.schemas import RestaurantSchema
from app.services.csv_service import (
    RESTAURANT_COLUMNS,
    parse_csv_upload,
    rows_to_csv,
    flatten_restaurant_platforms,
    unflatten_restaurant_platforms,
    to_bool, to_int,
)
from app.services.metric_schemas import PLATFORM_KEYS
from app.services.restaurant_service import LOAD_OPTIONS, serialize_restaurant


router = APIRouter(prefix="/restaurants", tags=["Admin Restaurants"])


class PlatformLink(BaseModel):
    platform_id: int
    customers: int = Field(ge=0, default=0)


class RestaurantAnalyticsInput(BaseModel):
    """Restoran × platform analytics: müşteri zaten platforms[] içinde; burada
    sadece bütçe ve forecast alanları var."""
    platform_id: int
    ad_budget: float = 0
    campaign_rate: float = 0
    coupon_rate: float = 0
    flash_rate: float = 0
    joker_rate: float = 0
    daily_forecast: float = 0
    monthly_forecast: float = 0
    yearly_forecast: float = 0


class RestaurantMetricsInput(BaseModel):
    cancel_rate: float = 0
    return_rate: float = 0
    cancel_reasons: list[dict[str, Any]] = Field(default_factory=list)
    return_reasons: list[dict[str, Any]] = Field(default_factory=list)
    area_performance_score: float = 0
    area_rating: float = 0
    highest_rating: float = 0
    lowest_rating: float = 0
    avg_basket: float = 0
    avg_menu_price: float = 0
    avg_monthly_revenue: float = 0
    courier_fee: float = 0
    hourly_heatmap: list[list[float]] = Field(default_factory=list)
    negative_comment_total: int = 0
    negative_comment_rate: float = 0
    negative_avg_rating: float = 0
    platform_negative_distribution: list[dict[str, Any]] = Field(default_factory=list)
    rating_distribution: list[dict[str, Any]] = Field(default_factory=list)
    negative_word_cloud: list[dict[str, Any]] = Field(default_factory=list)
    courier_comparison: dict[str, Any] = Field(default_factory=dict)


class RestaurantInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    district_id: str
    neighborhood_id: int | None = None
    category_id: int
    is_active: bool = True
    platforms: list[PlatformLink] = Field(default_factory=list)
    # Restoran-bazlı override'lar (opsiyonel) — cascade'de en yüksek öncelik
    metrics: RestaurantMetricsInput | None = None
    analytics: list[RestaurantAnalyticsInput] = Field(default_factory=list)


class RestaurantListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: list[RestaurantSchema]


async def _ensure_refs(
    db: AsyncSession,
    district_id: str,
    category_id: int,
    platforms: list[PlatformLink],
    neighborhood_id: int | None = None,
):
    district = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
    if not district:
        raise HTTPException(status_code=400, detail=f"district_id '{district_id}' bulunamadı")
    if neighborhood_id is not None:
        nb = (await db.execute(select(Neighborhood).where(Neighborhood.id == neighborhood_id))).scalar_one_or_none()
        if not nb:
            raise HTTPException(status_code=400, detail=f"neighborhood_id '{neighborhood_id}' bulunamadı")
        if nb.district_id != district_id:
            raise HTTPException(
                status_code=400,
                detail=f"Mahalle '{nb.name}' bu ilçeye ({district_id}) ait değil",
            )
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


async def _upsert_restaurant_metrics(
    db: AsyncSession, restaurant_id: int, payload: RestaurantMetricsInput | None
) -> None:
    if payload is None:
        return
    existing = (
        await db.execute(
            select(RestaurantMetrics).where(RestaurantMetrics.restaurant_id == restaurant_id)
        )
    ).scalar_one_or_none()
    data = payload.model_dump()
    if existing:
        for k, v in data.items():
            setattr(existing, k, v)
    else:
        db.add(RestaurantMetrics(restaurant_id=restaurant_id, **data))


async def _replace_restaurant_analytics(
    db: AsyncSession, restaurant_id: int, rows: list[RestaurantAnalyticsInput]
) -> None:
    await db.execute(delete(RestaurantAnalytics).where(RestaurantAnalytics.restaurant_id == restaurant_id))
    for row in rows:
        db.add(
            RestaurantAnalytics(
                restaurant_id=restaurant_id,
                **row.model_dump(),
            )
        )


async def _reload(db: AsyncSession, restaurant_id: int) -> Restaurant:
    res = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id).options(*LOAD_OPTIONS)
    )
    return res.scalar_one()


@router.get("/data-presence")
async def restaurant_data_presence(
    district_id: str = Query(...),
    neighborhood_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    """Yeni restoran formunda kullanıcıya 'bu seçim için veri var mı?' bilgisi.

    Her bir (analytics + metrics) × (district + neighborhood) için ayrı ayrı kontrol.
    Kategori filtresi opsiyonel: verilirse o kategoriye özel kayıt; verilmezse
    'tüm kategoriler' (category_id=NULL) kaydı aranır.
    """
    def cat_filter(col):
        return col == category_id if category_id is not None else col.is_(None)

    da = (await db.execute(
        select(DistrictAnalytics.id).where(
            DistrictAnalytics.district_id == district_id, cat_filter(DistrictAnalytics.category_id),
        ).limit(1)
    )).first() is not None
    dm = (await db.execute(
        select(DistrictMetrics.id).where(
            DistrictMetrics.district_id == district_id, cat_filter(DistrictMetrics.category_id),
        ).limit(1)
    )).first() is not None

    na = nm = False
    if neighborhood_id is not None:
        na = (await db.execute(
            select(NeighborhoodAnalytics.id).where(
                NeighborhoodAnalytics.neighborhood_id == neighborhood_id, cat_filter(NeighborhoodAnalytics.category_id),
            ).limit(1)
        )).first() is not None
        nm = (await db.execute(
            select(NeighborhoodMetrics.id).where(
                NeighborhoodMetrics.neighborhood_id == neighborhood_id, cat_filter(NeighborhoodMetrics.category_id),
            ).limit(1)
        )).first() is not None

    return {
        "district": {"analytics": da, "metrics": dm, "any": da or dm},
        "neighborhood": {"analytics": na, "metrics": nm, "any": na or nm},
    }


@router.get("/{restaurant_id}/detail")
async def get_restaurant_detail(restaurant_id: int, db: AsyncSession = Depends(get_db)):
    """Form için tam restoran detayı — metrics + analytics dahil."""
    r = (
        await db.execute(
            select(Restaurant)
            .where(Restaurant.id == restaurant_id)
            .options(*LOAD_OPTIONS)
        )
    ).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")
    # Lazy-load: metrics ve analytics ilişkilerini de yükle
    m_row = (await db.execute(
        select(RestaurantMetrics).where(RestaurantMetrics.restaurant_id == restaurant_id)
    )).scalar_one_or_none()
    a_rows = (await db.execute(
        select(RestaurantAnalytics).where(RestaurantAnalytics.restaurant_id == restaurant_id)
    )).scalars().all()
    base = serialize_restaurant(r)
    return {
        **base.model_dump(),
        "is_active": r.is_active,
        "metrics": None if m_row is None else {
            "cancel_rate": m_row.cancel_rate,
            "return_rate": m_row.return_rate,
            "cancel_reasons": m_row.cancel_reasons or [],
            "return_reasons": m_row.return_reasons or [],
            "area_performance_score": m_row.area_performance_score,
            "area_rating": m_row.area_rating,
            "highest_rating": m_row.highest_rating,
            "lowest_rating": m_row.lowest_rating,
            "avg_basket": m_row.avg_basket,
            "avg_menu_price": m_row.avg_menu_price,
            "avg_monthly_revenue": m_row.avg_monthly_revenue,
            "courier_fee": m_row.courier_fee,
            "hourly_heatmap": m_row.hourly_heatmap or [],
            "negative_comment_total": m_row.negative_comment_total,
            "negative_comment_rate": m_row.negative_comment_rate,
            "negative_avg_rating": m_row.negative_avg_rating,
            "platform_negative_distribution": m_row.platform_negative_distribution or [],
            "rating_distribution": m_row.rating_distribution or [],
            "negative_word_cloud": m_row.negative_word_cloud or [],
            "courier_comparison": m_row.courier_comparison or {},
        },
        "analytics": [
            {
                "platform_id": a.platform_id,
                "ad_budget": a.ad_budget,
                "campaign_rate": a.campaign_rate,
                "coupon_rate": a.coupon_rate,
                "flash_rate": a.flash_rate,
                "joker_rate": a.joker_rate,
                "daily_forecast": a.daily_forecast,
                "monthly_forecast": a.monthly_forecast,
                "yearly_forecast": a.yearly_forecast,
            }
            for a in a_rows
        ],
    }


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
    await _ensure_refs(
        db,
        payload.district_id,
        payload.category_id,
        payload.platforms,
        neighborhood_id=payload.neighborhood_id,
    )
    r = Restaurant(
        name=payload.name.strip(),
        district_id=payload.district_id,
        neighborhood_id=payload.neighborhood_id,
        category_id=payload.category_id,
        is_active=payload.is_active,
    )
    db.add(r)
    await db.flush()
    await _replace_platforms(db, r.id, payload.platforms)
    await _upsert_restaurant_metrics(db, r.id, payload.metrics)
    await _replace_restaurant_analytics(db, r.id, payload.analytics)
    await db.commit()
    return serialize_restaurant(await _reload(db, r.id))


@router.put("/{restaurant_id}", response_model=RestaurantSchema)
async def update_restaurant(restaurant_id: int, payload: RestaurantInput, db: AsyncSession = Depends(get_db)):
    r = (await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")
    await _ensure_refs(
        db,
        payload.district_id,
        payload.category_id,
        payload.platforms,
        neighborhood_id=payload.neighborhood_id,
    )
    r.name = payload.name.strip()
    r.district_id = payload.district_id
    r.neighborhood_id = payload.neighborhood_id
    r.category_id = payload.category_id
    r.is_active = payload.is_active
    await db.flush()
    await _replace_platforms(db, r.id, payload.platforms)
    await _upsert_restaurant_metrics(db, r.id, payload.metrics)
    await _replace_restaurant_analytics(db, r.id, payload.analytics)
    await db.commit()
    return serialize_restaurant(await _reload(db, r.id))


class ActiveToggle(BaseModel):
    is_active: bool


@router.patch("/{restaurant_id}/active", response_model=RestaurantSchema)
async def set_restaurant_active(
    restaurant_id: int,
    payload: ActiveToggle,
    db: AsyncSession = Depends(get_db),
):
    """Aktif/pasif durumunu doğrudan değiştir — diğer alanlara dokunmaz."""
    r = (await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")
    r.is_active = payload.is_active
    await db.commit()
    return serialize_restaurant(await _reload(db, restaurant_id))


@router.delete("/{restaurant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_restaurant(
    restaurant_id: int,
    hard: bool = Query(default=False, description="true → kalıcı silme (cascade RestaurantPlatform); false → soft delete (is_active=False)"),
    db: AsyncSession = Depends(get_db),
):
    r = (await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Restoran bulunamadı")
    if hard:
        await db.delete(r)
    else:
        r.is_active = False
    await db.commit()


# === CSV (flat: 9 sütun) ===

async def _platform_maps(db: AsyncSession) -> tuple[dict[int, str], dict[str, int]]:
    """Platform.id ↔ PLATFORM_KEYS eşleme."""
    rows = (await db.execute(select(Platform.id, Platform.name))).all()
    id_to_key: dict[int, str] = {}
    key_to_id: dict[str, int] = {}
    for pid, name in rows:
        lower = (name or "").lower()
        for key in PLATFORM_KEYS:
            if key in lower:
                id_to_key[pid] = key
                key_to_id.setdefault(key, pid)
                break
    return id_to_key, key_to_id


def _restaurant_to_csv_row(r: Restaurant, platform_id_to_key: dict[int, str]) -> dict[str, Any]:
    return {
        "id": r.id,
        "name": r.name,
        "district_id": r.district_id,
        "neighborhood_id": r.neighborhood_id if r.neighborhood_id is not None else "",
        "category_id": r.category_id,
        "is_active": "true" if r.is_active else "false",
        **flatten_restaurant_platforms(r.platforms, platform_id_to_key),
    }


@router.get("/csv", response_class=Response)
async def export_csv(db: AsyncSession = Depends(get_db)):
    platform_id_to_key, _ = await _platform_maps(db)
    rows = (
        await db.execute(select(Restaurant).options(*LOAD_OPTIONS).order_by(Restaurant.id))
    ).scalars().all()
    csv_text = rows_to_csv(
        (_restaurant_to_csv_row(r, platform_id_to_key) for r in rows),
        RESTAURANT_COLUMNS,
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="restaurants.csv"'},
    )


@router.post("/csv", response_model=dict)
async def import_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    records, warnings = await parse_csv_upload(file, RESTAURANT_COLUMNS)
    _, platform_key_to_id = await _platform_maps(db)

    created = 0
    updated = 0
    skipped = 0
    errors: list[str] = []

    for idx, row in enumerate(records, start=2):
        name = (row.get("name") or "").strip()
        district_id = (row.get("district_id") or "").strip()
        category_id_raw = (row.get("category_id") or "").strip()
        if not name or not district_id or not category_id_raw:
            errors.append(f"satır {idx}: name/district_id/category_id zorunlu — atlandı")
            skipped += 1
            continue
        try:
            category_id = int(category_id_raw)
        except ValueError:
            errors.append(f"satır {idx}: category_id geçersiz — atlandı")
            skipped += 1
            continue

        neighborhood_id: int | None = None
        nb_raw = (row.get("neighborhood_id") or "").strip()
        if nb_raw:
            try:
                neighborhood_id = int(nb_raw)
            except ValueError:
                errors.append(f"satır {idx}: neighborhood_id geçersiz — mahallesiz kaydedildi")
                neighborhood_id = None

        is_active = to_bool(row.get("is_active"), default=True)

        # 3 platform sütunundan platforms listesi inşa et
        platforms_raw = unflatten_restaurant_platforms(row, platform_key_to_id)
        platforms = [PlatformLink(**p) for p in platforms_raw]

        try:
            await _ensure_refs(db, district_id, category_id, platforms, neighborhood_id=neighborhood_id)
        except HTTPException as exc:
            errors.append(f"satır {idx}: {exc.detail} — atlandı")
            skipped += 1
            continue

        # id varsa o kayıt; yoksa name+district kombinasyonu
        existing = None
        id_raw = (row.get("id") or "").strip()
        if id_raw:
            try:
                rid = int(id_raw)
                existing = (await db.execute(
                    select(Restaurant).where(Restaurant.id == rid)
                )).scalar_one_or_none()
            except ValueError:
                pass
        if existing is None:
            existing = (await db.execute(
                select(Restaurant).where(
                    Restaurant.name == name, Restaurant.district_id == district_id
                )
            )).scalar_one_or_none()

        if existing:
            existing.name = name
            existing.district_id = district_id
            existing.category_id = category_id
            existing.neighborhood_id = neighborhood_id
            existing.is_active = is_active
            await db.flush()
            await _replace_platforms(db, existing.id, platforms)
            updated += 1
        else:
            r = Restaurant(
                name=name,
                district_id=district_id,
                neighborhood_id=neighborhood_id,
                category_id=category_id,
                is_active=is_active,
            )
            db.add(r)
            await db.flush()
            await _replace_platforms(db, r.id, platforms)
            created += 1

    await db.commit()
    return {
        "created": created,
        "updated": updated,
        "skipped": skipped,
        "warnings": warnings,
        "errors": errors,
    }
