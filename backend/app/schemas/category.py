from pydantic import BaseModel


class CategorySchema(BaseModel):
    id: int
    name: str
    emoji: str
    sort_order: int

    model_config = {"from_attributes": True}
