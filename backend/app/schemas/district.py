from pydantic import BaseModel


class NeighborhoodSchema(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class DistrictSchema(BaseModel):
    id: str
    name: str
    side: str
    svg_path: str

    model_config = {"from_attributes": True}
