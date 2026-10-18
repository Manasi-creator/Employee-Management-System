from pathlib import Path
from typing import Literal
from urllib.parse import quote_plus

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: Literal["development", "test", "production"] = "development"
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "ems_db"
    JWT_SECRET: SecretStr = Field(min_length=32)
    JWT_ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, gt=0, le=1440)
    CORS_ORIGINS: str = "http://localhost:5174,http://127.0.0.1:5174"
    DATABASE_URL: str | None = None
    AUTH_COOKIE_NAME: str = "ems_access_token"
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

    @model_validator(mode="after")
    def validate_security_settings(self):
        secret = self.JWT_SECRET.get_secret_value()
        if len(secret.encode("utf-8")) < 32 or secret.lower().startswith("replace-with"):
            raise ValueError("JWT_SECRET must be a unique random secret of at least 32 bytes")

        if self.APP_ENV == "production":
            if not self.AUTH_COOKIE_SECURE:
                raise ValueError("AUTH_COOKIE_SECURE must be enabled in production")
            database_user = self.DB_USER
            database_password = self.DB_PASSWORD
            if self.DATABASE_URL:
                database_url = make_url(self.DATABASE_URL)
                database_user = database_url.username or ""
                database_password = database_url.password or ""
            if not database_password or database_user.lower() == "root":
                raise ValueError("Production database credentials must use a non-root user and password")
            origins = self.cors_origins
            if not origins or any(not origin.startswith("https://") or "*" in origin for origin in origins):
                raise ValueError("Production CORS origins must be explicit HTTPS origins")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def _build_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        return (
            f"mysql+pymysql://{quote_plus(self.DB_USER)}:{quote_plus(self.DB_PASSWORD)}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def database_url(self) -> str:
        return self._build_database_url()

settings = Settings()
settings.DATABASE_URL = settings._build_database_url()