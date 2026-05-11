from pydantic import BaseModel


class CaseStudyBefore(BaseModel):
    image: str | None
    dailyOrder: str | None
    avgBasket: str | None
    complaints: list[str]


class CaseStudyAfter(BaseModel):
    image: str | None
    dailyOrder: str | None
    avgBasket: str | None
    improvements: list[str]


class CaseStudySchema(BaseModel):
    id: int
    title: str
    before: CaseStudyBefore
    after: CaseStudyAfter

    model_config = {"from_attributes": True}
