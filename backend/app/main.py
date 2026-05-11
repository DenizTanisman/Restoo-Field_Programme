from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import districts, categories, restaurants, analytics, case_studies

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

app.include_router(districts.router)
app.include_router(categories.router)
app.include_router(restaurants.router)
app.include_router(analytics.router)
app.include_router(case_studies.router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "working", "project": settings.PROJECT_NAME}
