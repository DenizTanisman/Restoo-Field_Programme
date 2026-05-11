from pydantic import BaseModel


class RestaurantPlatformSchema(BaseModel):
    name: str
    customers: int

    model_config = {"from_attributes": True}


class RestaurantSchema(BaseModel):
    id: int
    name: str
    district_id: str
    district_name: str
    category_label: str
    category_emoji: str
    platforms: list[RestaurantPlatformSchema]

    model_config = {"from_attributes": True}
