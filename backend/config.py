"""Application configuration, loaded from environment variables / .env.

Most fields here can also be changed at runtime from the Impostazioni
Alert page (see routers/settings.py): those changes live only in memory
and are lost on restart, at which point the values below (or whatever is
in .env) apply again.
"""

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite+aiosqlite:///./planning_hs.db"

    APP_NAME: str = "Planning H&S"
    DEBUG: bool = True

    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "Planning H&S"
    REPORT_RECIPIENT_EMAIL: Optional[str] = None

    ALERT_EXPIRING_SOON_DAYS: int = 70
    ALERT_CRITICAL_DAYS: int = 0
    REPORT_DAYS_THRESHOLD: int = 150

    DAILY_CHECK_HOUR: int = 6
    DAILY_CHECK_MINUTE: int = 0

    SETTINGS_ENCRYPTION_KEY: Optional[str] = None


settings = Settings()