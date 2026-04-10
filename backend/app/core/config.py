from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    TEST_DATABASE_URL: str
    REDIS_URL: str
    DEBUG: bool = False

    # JWT settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
