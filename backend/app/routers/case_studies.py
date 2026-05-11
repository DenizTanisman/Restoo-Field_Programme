from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import CaseStudy
from app.schemas import CaseStudySchema
from app.schemas.case_study import CaseStudyBefore, CaseStudyAfter

router = APIRouter(prefix="/case-studies", tags=["CaseStudies"])


@router.get("", response_model=list[CaseStudySchema])
async def list_case_studies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CaseStudy)
        .where(CaseStudy.is_active == True)
        .order_by(CaseStudy.sort_order, CaseStudy.id)
    )
    studies = result.scalars().all()

    return [
        CaseStudySchema(
            id=s.id,
            title=s.title,
            before=CaseStudyBefore(
                image=s.before_image_url,
                dailyOrder=s.before_daily_order,
                avgBasket=s.before_avg_basket,
                complaints=s.before_complaints or [],
            ),
            after=CaseStudyAfter(
                image=s.after_image_url,
                dailyOrder=s.after_daily_order,
                avgBasket=s.after_avg_basket,
                improvements=s.after_improvements or [],
            ),
        )
        for s in studies
    ]
