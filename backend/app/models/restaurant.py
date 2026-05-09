from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, ForeignKey, String


class Restaurant(Base):

    __tablename__ ="restaurants"

    id: Mapped[int]=mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200),nullable=False)
    district_id: Mapped[int]=mapped_column(ForeignKey("districts.id"),nullable=False,index=True)
    category_id: Mapped[int] =mapped_column(ForeignKey("categories.id"),nullable=False,index=True)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True,nullable=False)

    district: Mapped["District"]=relationship("District")
    category: Mapped["Category"]=relationship("Category")