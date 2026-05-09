from app.models.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Boolean, String, ForeignKey, Text

class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    side: Mapped[str] = mapped_column(String(20), nullable=False)
    svg_path: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True,nullable=False)

    neighborhoods: Mapped[list["Neighborhood"]] = relationship("Neighborhood",back_populates="district",cascade="all, delete-orphan")
    

class Neighborhood(Base):
    __tablename__ = "neighborhoods"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50),nullable=False,index=True)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True,nullable=False)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True)

    district: Mapped["District"] = relationship("District", back_populates="neighborhoods")