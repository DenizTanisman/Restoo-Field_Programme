from fastapi import APIRouter, File, Form, UploadFile

from app.services.storage_service import save_upload


router = APIRouter(prefix="/upload", tags=["Admin Upload"])

ALLOWED_FOLDERS = {"case-studies", "restaurants", "general"}


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form(default="general"),
):
    safe_folder = folder if folder in ALLOWED_FOLDERS else "general"
    return await save_upload(file, safe_folder)
