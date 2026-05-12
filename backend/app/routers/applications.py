from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Application
from app.schemas.application import ApplicationCreate, ApplicationSchema


router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationSchema, status_code=status.HTTP_201_CREATED)
async def create_application(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    app_row = Application(**payload.model_dump())
    db.add(app_row)
    await db.commit()
    await db.refresh(app_row)
    return app_row
