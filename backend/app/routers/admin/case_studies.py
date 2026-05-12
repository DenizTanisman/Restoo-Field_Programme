from __future__ import annotations

import json
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CaseStudy, Category, District
from app.services.csv_service import CASE_STUDY_COLUMNS, rows_to_csv
from app.services.storage_service import delete_media, save_upload


router = APIRouter(prefix="/case-studies", tags=["Admin Case Studies"])


class CaseStudyAdminSchema(BaseModel):
    id: int
    title: str
    district_id: str | None
    category_id: int | None
    sort_order: int
    is_active: bool
    before_image_url: str | None
    before_daily_order: str | None
    before_avg_basket: str | None
    before_complaints: list[str]
    after_image_url: str | None
    after_daily_order: str | None
    after_avg_basket: str | None
    after_improvements: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReorderItem(BaseModel):
    id: int
    sort_order: int


def _serialize(s: CaseStudy) -> CaseStudyAdminSchema:
    return CaseStudyAdminSchema(
        id=s.id,
        title=s.title,
        district_id=s.district_id,
        category_id=s.category_id,
        sort_order=s.sort_order,
        is_active=s.is_active,
        before_image_url=s.before_image_url,
        before_daily_order=s.before_daily_order,
        before_avg_basket=s.before_avg_basket,
        before_complaints=s.before_complaints or [],
        after_image_url=s.after_image_url,
        after_daily_order=s.after_daily_order,
        after_avg_basket=s.after_avg_basket,
        after_improvements=s.after_improvements or [],
        created_at=s.created_at,
        updated_at=s.updated_at,
    )


def _parse_json_list(raw: str | None, field: str) -> list[str]:
    if raw is None or raw.strip() == "":
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail=f"{field}: JSON listesi geçerli değil ({exc})")
    if not isinstance(data, list) or not all(isinstance(x, str) for x in data):
        raise HTTPException(status_code=400, detail=f"{field}: string listesi olmalı")
    return data


async def _validate_refs(db: AsyncSession, district_id: str | None, category_id: int | None) -> None:
    if district_id:
        d = (await db.execute(select(District).where(District.id == district_id))).scalar_one_or_none()
        if not d:
            raise HTTPException(status_code=400, detail=f"district_id '{district_id}' bulunamadı")
    if category_id:
        c = (await db.execute(select(Category).where(Category.id == category_id))).scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=400, detail=f"category_id '{category_id}' bulunamadı")


@router.get("", response_model=list[CaseStudyAdminSchema])
async def list_case_studies(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(CaseStudy).order_by(CaseStudy.sort_order, CaseStudy.id))
    ).scalars().all()
    return [_serialize(s) for s in rows]


@router.post("", response_model=CaseStudyAdminSchema, status_code=status.HTTP_201_CREATED)
async def create_case_study(
    db: AsyncSession = Depends(get_db),
    title: str = Form(...),
    district_id: str | None = Form(default=None),
    category_id: int | None = Form(default=None),
    sort_order: int = Form(default=0),
    is_active: bool = Form(default=True),
    before_daily_order: str | None = Form(default=None),
    before_avg_basket: str | None = Form(default=None),
    before_complaints: str | None = Form(default=None),
    after_daily_order: str | None = Form(default=None),
    after_avg_basket: str | None = Form(default=None),
    after_improvements: str | None = Form(default=None),
    before_image: UploadFile | None = File(default=None),
    after_image: UploadFile | None = File(default=None),
):
    district_id = district_id or None
    await _validate_refs(db, district_id, category_id)
    before_complaints_list = _parse_json_list(before_complaints, "before_complaints")
    after_improvements_list = _parse_json_list(after_improvements, "after_improvements")

    before_url = None
    after_url = None
    if before_image and before_image.filename:
        result = await save_upload(before_image, "case-studies")
        before_url = result["url"]
    if after_image and after_image.filename:
        result = await save_upload(after_image, "case-studies")
        after_url = result["url"]

    s = CaseStudy(
        title=title.strip(),
        district_id=district_id,
        category_id=category_id,
        sort_order=sort_order,
        is_active=is_active,
        before_image_url=before_url,
        before_daily_order=before_daily_order,
        before_avg_basket=before_avg_basket,
        before_complaints=before_complaints_list or None,
        after_image_url=after_url,
        after_daily_order=after_daily_order,
        after_avg_basket=after_avg_basket,
        after_improvements=after_improvements_list or None,
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return _serialize(s)


@router.put("/{case_id}", response_model=CaseStudyAdminSchema)
async def update_case_study(
    case_id: int,
    db: AsyncSession = Depends(get_db),
    title: str = Form(...),
    district_id: str | None = Form(default=None),
    category_id: int | None = Form(default=None),
    sort_order: int = Form(default=0),
    is_active: bool = Form(default=True),
    before_daily_order: str | None = Form(default=None),
    before_avg_basket: str | None = Form(default=None),
    before_complaints: str | None = Form(default=None),
    after_daily_order: str | None = Form(default=None),
    after_avg_basket: str | None = Form(default=None),
    after_improvements: str | None = Form(default=None),
    before_image: UploadFile | None = File(default=None),
    after_image: UploadFile | None = File(default=None),
):
    s = (await db.execute(select(CaseStudy).where(CaseStudy.id == case_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Case study bulunamadı")
    district_id = district_id or None
    await _validate_refs(db, district_id, category_id)

    s.title = title.strip()
    s.district_id = district_id
    s.category_id = category_id
    s.sort_order = sort_order
    s.is_active = is_active
    s.before_daily_order = before_daily_order
    s.before_avg_basket = before_avg_basket
    s.before_complaints = _parse_json_list(before_complaints, "before_complaints") or None
    s.after_daily_order = after_daily_order
    s.after_avg_basket = after_avg_basket
    s.after_improvements = _parse_json_list(after_improvements, "after_improvements") or None

    if before_image and before_image.filename:
        if s.before_image_url:
            delete_media(s.before_image_url)
        result = await save_upload(before_image, "case-studies")
        s.before_image_url = result["url"]
    if after_image and after_image.filename:
        if s.after_image_url:
            delete_media(s.after_image_url)
        result = await save_upload(after_image, "case-studies")
        s.after_image_url = result["url"]

    await db.commit()
    await db.refresh(s)
    return _serialize(s)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case_study(case_id: int, db: AsyncSession = Depends(get_db)):
    s = (await db.execute(select(CaseStudy).where(CaseStudy.id == case_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Case study bulunamadı")
    s.is_active = False
    await db.commit()


@router.patch("/reorder", response_model=list[CaseStudyAdminSchema])
async def reorder_case_studies(items: list[ReorderItem], db: AsyncSession = Depends(get_db)):
    ids = [i.id for i in items]
    rows = (await db.execute(select(CaseStudy).where(CaseStudy.id.in_(ids)))).scalars().all()
    by_id = {r.id: r for r in rows}
    missing = [i for i in ids if i not in by_id]
    if missing:
        raise HTTPException(status_code=400, detail=f"id bulunamadı: {missing}")
    for item in items:
        by_id[item.id].sort_order = item.sort_order
    await db.commit()
    refreshed = (
        await db.execute(select(CaseStudy).order_by(CaseStudy.sort_order, CaseStudy.id))
    ).scalars().all()
    return [_serialize(s) for s in refreshed]


@router.get("/csv", response_class=Response)
async def export_csv(db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(select(CaseStudy).order_by(CaseStudy.sort_order, CaseStudy.id))
    ).scalars().all()
    csv_text = rows_to_csv(
        (
            {
                "id": r.id,
                "title": r.title,
                "district_id": r.district_id or "",
                "category_id": r.category_id or "",
                "sort_order": r.sort_order,
                "is_active": "true" if r.is_active else "false",
                "before_image_url": r.before_image_url or "",
                "before_daily_order": r.before_daily_order or "",
                "before_avg_basket": r.before_avg_basket or "",
                "before_complaints": "|".join(r.before_complaints or []),
                "after_image_url": r.after_image_url or "",
                "after_daily_order": r.after_daily_order or "",
                "after_avg_basket": r.after_avg_basket or "",
                "after_improvements": "|".join(r.after_improvements or []),
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ),
        CASE_STUDY_COLUMNS,
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="case_studies.csv"'},
    )
