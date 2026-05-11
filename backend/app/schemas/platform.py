from pydantic import BaseModel


class PlatformSchema(BaseModel):
    id: int
    name: str
    color_hex: str | None
    logo_url: str | None

    model_config = {"from_attributes": True}
