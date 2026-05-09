from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean, String


class Category(Base):

    __tablename__= "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    emoji: Mapped[str] = mapped_column(String(10), nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True,nullable=False)
    
