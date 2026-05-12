"""Dosya yükleme/silme. STORAGE_PROVIDER=local için lokal disk."""
from __future__ import annotations

import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status

from app.config import settings


_ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_MAX_BYTES = 10 * 1024 * 1024  # 10 MB


def _media_root() -> Path:
    return Path(settings.MEDIA_ROOT).resolve()


def _ext(filename: str | None) -> str:
    if not filename:
        return ""
    _, ext = os.path.splitext(filename)
    return ext.lower()


async def save_upload(file: UploadFile, folder: str = "general") -> dict[str, object]:
    if settings.STORAGE_PROVIDER != "local":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=f"STORAGE_PROVIDER={settings.STORAGE_PROVIDER} desteklenmiyor (sadece local)",
        )

    ext = _ext(file.filename)
    if folder in {"case-studies", "restaurants"} and ext not in _ALLOWED_IMAGE_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya uzantısı: {ext or '(yok)'}",
        )

    safe_folder = folder.strip("/").replace("..", "")
    target_dir = _media_root() / safe_folder
    target_dir.mkdir(parents=True, exist_ok=True)

    name = f"{uuid.uuid4().hex}{ext}"
    target_path = target_dir / name

    size = 0
    async with aiofiles.open(target_path, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > _MAX_BYTES:
                await out.close()
                target_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Dosya çok büyük (max 10MB)")
            await out.write(chunk)

    rel_url = f"{settings.MEDIA_URL_PREFIX.rstrip('/')}/{safe_folder}/{name}"
    return {
        "url": f"{settings.PUBLIC_BASE_URL.rstrip('/')}{rel_url}",
        "path": rel_url,
        "filename": name,
        "size": size,
    }


def delete_media(url_or_path: str) -> None:
    """URL veya /media/... path'inden dosyayı sil. Hata varsa sessizce geç."""
    if not url_or_path:
        return
    path = url_or_path
    if path.startswith("http"):
        prefix = settings.PUBLIC_BASE_URL.rstrip("/")
        if path.startswith(prefix):
            path = path[len(prefix):]
    if not path.startswith(settings.MEDIA_URL_PREFIX):
        return
    rel = path[len(settings.MEDIA_URL_PREFIX):].lstrip("/")
    full = _media_root() / rel
    try:
        full.unlink(missing_ok=True)
    except OSError:
        pass
