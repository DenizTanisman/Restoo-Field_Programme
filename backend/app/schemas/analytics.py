from pydantic import BaseModel


class PlatformCustomers(BaseModel):
    name: str
    customers: int
    restaurants: int


class PlatformForecast(BaseModel):
    platform: str
    amount: float


class ForecastData(BaseModel):
    daily: list[PlatformForecast]
    monthly: list[PlatformForecast]
    yearly: list[PlatformForecast]


class BudgetData(BaseModel):
    adBudget: float
    campaignRate: float
    couponRate: float
    flashRate: float
    jokerRate: float


class DistrictAnalyticsResponse(BaseModel):
    district_id: str
    district_name: str
    category_id: int | None
    platforms: list[PlatformCustomers]
    budget: BudgetData
    forecast: ForecastData


class NeighborhoodAnalyticsResponse(BaseModel):
    neighborhood_id: int
    neighborhood_name: str
    category_id: int | None
    platforms: list[PlatformCustomers]
    budget: BudgetData
    forecast: ForecastData
