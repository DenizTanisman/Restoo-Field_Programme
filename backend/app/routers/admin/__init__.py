from fastapi import APIRouter, Depends

from app.deps import get_current_admin

from . import (
    analytics,
    applications,
    case_studies,
    categories,
    districts,
    metrics,
    platforms,
    restaurants,
    upload,
)


admin_router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],
)

admin_router.include_router(categories.router)
admin_router.include_router(platforms.router)
admin_router.include_router(districts.router)
admin_router.include_router(restaurants.router)
admin_router.include_router(case_studies.router)
admin_router.include_router(applications.router)
admin_router.include_router(analytics.router)
admin_router.include_router(metrics.router)
admin_router.include_router(upload.router)
