from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean, String, Text


class Platform(Base):

    __tablename__ = "platforms"

    id: Mapped[int] = mapped_column(primary_key=True)
    name : Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    color_hex: Mapped[str | None] = mapped_column(String(7))
    logo_url: Mapped[str | None] = mapped_column(Text,nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True,nullable=False)