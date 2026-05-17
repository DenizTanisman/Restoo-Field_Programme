from pydantic import BaseModel, Field


class RestaurantPlatformSchema(BaseModel):
    name: str
    customers: int

    model_config = {"from_attributes": True}


class RestaurantSchema(BaseModel):
    id: int
    name: str
    district_id: str
    district_name: str
    neighborhood_id: int | None = None
    neighborhood_name: str | None = None
    category_id: int
    category_label: str
    category_emoji: str
    is_active: bool = True
    platforms: list[RestaurantPlatformSchema]

    model_config = {"from_attributes": True}


class RestaurantCreateSchema(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    district_id: str
    category_id: int
    is_active: bool = True
