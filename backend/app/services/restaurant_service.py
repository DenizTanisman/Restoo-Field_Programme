from sqlalchemy.orm import selectinload

from app.models import Restaurant, RestaurantPlatform
from app.schemas import RestaurantSchema


LOAD_OPTIONS = (
    selectinload(Restaurant.district),
    selectinload(Restaurant.neighborhood),
    selectinload(Restaurant.category),
    selectinload(Restaurant.platforms).selectinload(RestaurantPlatform.platform),
)


def serialize_restaurant(r: Restaurant) -> RestaurantSchema:
    return RestaurantSchema(
        id=r.id,
        name=r.name,
        district_id=r.district_id,
        district_name=r.district.name if r.district else "",
        neighborhood_id=r.neighborhood_id,
        neighborhood_name=r.neighborhood.name if r.neighborhood else None,
        category_id=r.category_id,
        category_label=r.category.name if r.category else "",
        category_emoji=r.category.emoji if r.category else "",
        is_active=r.is_active,
        platforms=[
            {"name": rp.platform.name, "customers": rp.customers}
            for rp in r.platforms
            if rp.platform
        ],
    )
