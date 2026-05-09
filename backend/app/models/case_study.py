from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, func, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ARRAY
from app.models.base import Base


class CaseStudy(Base):
    __tablename__ = "case_studies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincerment=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    district_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("districts.id"), nullable=True)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("category_id"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Öncesi 
    before_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    before_daily_order: Mapped[str | None] = mapped_column(String(50), nullable=True)
    before_avg_basket: Mapped[str | None] = mapped_column(String(50), nullable=True)
    before_complaints: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    # Sonrası 
    after_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_daily_order: Mapped[str | None] = mapped_column(String(50), nullable=True)
    after_avg_basket: Mapped[str | None] = mapped_column(String(50), nullable=True)
    after_improvements: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    