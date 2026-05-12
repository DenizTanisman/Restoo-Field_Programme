from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser
from app.schemas.auth import AdminUserResponse, LoginRequest, TokenResponse
from app.services.auth_service import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    user = (
        await db.execute(select(AdminUser).where(AdminUser.email == payload.email))
    ).scalar_one_or_none()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
        )
    token = create_access_token(subject=user.email, extra_claims={"uid": user.id})
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(current: AdminUser = Depends(get_current_admin)) -> TokenResponse:
    token = create_access_token(subject=current.email, extra_claims={"uid": current.id})
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=AdminUserResponse)
async def me(current: AdminUser = Depends(get_current_admin)) -> AdminUser:
    return current
