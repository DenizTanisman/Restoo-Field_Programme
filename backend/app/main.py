import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import (
    analytics,
    applications,
    auth,
    case_studies,
    categories,
    districts,
    restaurants,
)
from app.routers.admin import admin_router


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public
app.include_router(auth.router)
app.include_router(districts.router)
app.include_router(categories.router)
app.include_router(restaurants.router)
app.include_router(analytics.router)
app.include_router(case_studies.router)
app.include_router(applications.router)

# Admin (JWT korumalı)
app.include_router(admin_router)

# Media (lokal disk)
if settings.STORAGE_PROVIDER == "local":
    media_root = Path(settings.MEDIA_ROOT).resolve()
    media_root.mkdir(parents=True, exist_ok=True)
    app.mount(
        settings.MEDIA_URL_PREFIX,
        StaticFiles(directory=str(media_root)),
        name="media",
    )


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "working", "project": settings.PROJECT_NAME}
