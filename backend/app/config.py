from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):

    PROJECT_NAME: str = "Opencard API"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    ALLOWED_ORIGINS: List[str]

    S3_BUCKET: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_REGION: str
    CDN_BASE_URL: str
    STORAGE_PROVIDER: str

    # Admin bootstrap
    ADMIN_DEFAULT_EMAIL: str = "admin@opencard.com"
    ADMIN_DEFAULT_PASSWORD: str = "change-me"
    ADMIN_DEFAULT_NAME: str = "OpenCard Admin"

    # Local media (used when STORAGE_PROVIDER=local)
    MEDIA_ROOT: str = "./media"
    MEDIA_URL_PREFIX: str = "/media"
    PUBLIC_BASE_URL: str = "http://localhost:8003"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()