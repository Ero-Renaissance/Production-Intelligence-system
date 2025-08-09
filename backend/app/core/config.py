from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "Production Gap API"
    ENV: str = "local"
    PORT: int = 8000
    LOG_LEVEL: str = "info"

    # Comma-separated list of allowed origins
    CORS_ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Optional integrations
    APPLICATION_INSIGHTS_CONNECTION_STRING: str | None = None
    DATABASE_URL: str | None = None

    # Azure Entra ID / OIDC (optional, future)
    AZURE_TENANT_ID: str | None = None
    AZURE_CLIENT_ID: str | None = None
    AZURE_AUDIENCE: str | None = None

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings() 