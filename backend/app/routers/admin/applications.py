from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Application
from app.schemas.application import ApplicationSchema, ApplicationStatusUpdate
from app.services.csv_service import APPLICATION_COLUMNS, rows_to_csv

from pydantic import BaseModel


router = APIRouter(prefix="/applications", tags=["Admin Applications"])


class ApplicationListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: list[ApplicationSchema]


@router.get("", response_model=ApplicationListResponse)
async def list_applications(
    db: AsyncSession = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
):
    base = select(Application).order_by(Application.created_at.desc())
    if status_filter:
        base = base.where(Application.status == status_filter)

    total = (
        await db.execute(select(func.count()).select_from(base.order_by(None).subquery()))
    ).scalar_one()

    rows = (
        await db.execute(base.offset((page - 1) * limit).limit(limit))
    ).scalars().all()

    return ApplicationListResponse(total=total, page=page, limit=limit, data=rows)


@router.patch("/{application_id}/status", response_model=ApplicationSchema)
async def update_status(
    application_id: int,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    app_row = (await db.execute(select(Application).where(Application.id == application_id))).scalar_one_or_none()
    if not app_row:
        raise HTTPException(status_code=404, detail="Başvuru bulunamadı")
    app_row.status = payload.status
    await db.commit()
    await db.refresh(app_row)
    return app_row


@router.get("/csv", response_class=Response)
async def export_csv(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Application).order_by(Application.created_at.desc()))).scalars().all()
    csv_text = rows_to_csv(
        (
            {
                "id": r.id,
                "first_name": r.first_name,
                "last_name": r.last_name,
                "email": r.email,
                "phone": r.phone,
                "city": r.city or "",
                "district": r.district or "",
                "vehicle": r.vehicle or "",
                "message": (r.message or "").replace("\n", " "),
                "status": r.status,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ),
        APPLICATION_COLUMNS,
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="applications.csv"'},
    )
