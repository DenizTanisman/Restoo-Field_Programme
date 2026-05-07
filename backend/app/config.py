from pydantic_settings import BaseSettings,SettingsConfigDict
from typing import List

class Settings(BaseSettings):

    PROJECT_NAME: str ="Opencard API"
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

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()