from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title = settings.PROJECT_NAME,
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Sağlık Kontrolü
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status":"working", "project": settings.PROJECT_NAME}

