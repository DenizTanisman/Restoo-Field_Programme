from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_admin
from app.models import AdminUser
from app.schemas.auth import AdminUserResponse, LoginRequest, TokenResponse
from app.services.auth_service import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


async def _authenticate(db: AsyncSession, email: str, password: str) -> AdminUser:
    user = (
        await db.execute(select(AdminUser).where(AdminUser.email == email))
    ).scalar_one_or_none()
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
        )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """JSON tabanlı login — frontend admin paneli bunu kullanır."""
    user = await _authenticate(db, payload.email, payload.password)
    token = create_access_token(subject=user.email, extra_claims={"uid": user.id})
    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/token", response_model=TokenResponse)
async def login_oauth_form(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """OAuth2 password flow — Swagger UI'nın Authorize butonu bu endpoint'i kullanır.
    Form alanları: username (e-posta), password.
    """
    user = await _authenticate(db, form.username, form.password)
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
