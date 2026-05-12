from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AdminUser
from app.services.auth_service import decode_token


_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


async def get_current_admin(
    token: str | None = Depends(_oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> AdminUser:
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise creds_exc
    try:
        payload = decode_token(token)
    except ValueError:
        raise creds_exc
    subject = payload.get("sub")
    if not subject:
        raise creds_exc
    user = (
        await db.execute(select(AdminUser).where(AdminUser.email == subject))
    ).scalar_one_or_none()
    if user is None or not user.is_active:
        raise creds_exc
    return user
