from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


ApplicationStatus = Literal["pending", "reviewed", "accepted", "rejected"]


class ApplicationCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=4, max_length=20)
    city: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    vehicle: str | None = Field(default=None, max_length=50)
    message: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationSchema(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    city: str | None
    district: str | None
    vehicle: str | None
    message: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
