from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean,String, Text


class Application(Base):

    __tablename__ ="applications"

    id: Mapped[int]=mapped_column(primary_key=True)
    first_name: Mapped[str] =mapped_column(String(100),nullable=False)
    last_name: Mapped[str] =mapped_column(String(100),nullable=False)
    email: Mapped[str] =mapped_column(String(200),nullable=False)
    phone: Mapped[str] =mapped_column(String(20),nullable=False)
    city: Mapped[str | None] =mapped_column(String(100))
    district: Mapped[str | None] =mapped_column(String(100))
    vehicle: Mapped[str | None] =mapped_column(String(50))
    message: Mapped[str | None]=mapped_column(Text)
    
    is_active: Mapped[bool] = mapped_column(Boolean,default=True,nullable=False)
    status: Mapped[str] = mapped_column(String(50),default="pending",nullable=False)