"""Application settings schemas (alert threshold, SMTP, daily check time)."""

from typing import Optional

from pydantic import BaseModel, Field


class AppSettings(BaseModel):
    alert_expiring_soon_days: int = 70
    alert_critical_days: int = 0
    report_days_threshold: int = 150
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: str = "Planning H&S"
    report_recipient_email: Optional[str] = None
    daily_check_hour: int = 6
    daily_check_minute: int = 0
    smtp_password_configured: bool = False


class AppSettingsUpdate(BaseModel):
    alert_expiring_soon_days: Optional[int] = Field(None, ge=0)
    alert_critical_days: Optional[int] = Field(None, ge=0)
    report_days_threshold: Optional[int] = Field(None, ge=0)

    smtp_host: Optional[str] = Field(None, max_length=255)
    smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    smtp_user: Optional[str] = Field(None, max_length=255)

    # None: keep current password
    # "": remove current password
    # non-empty: replace current password
    smtp_password: Optional[str] = Field(None, max_length=1024)

    smtp_from_email: Optional[str] = Field(None, max_length=255)
    smtp_from_name: Optional[str] = Field(None, min_length=1, max_length=255)
    report_recipient_email: Optional[str] = Field(None, max_length=255)

    daily_check_hour: Optional[int] = Field(None, ge=0, le=23)
    daily_check_minute: Optional[int] = Field(None, ge=0, le=59)

class AppSettings(BaseModel):
    alert_expiring_soon_days: int = 70
    alert_critical_days: int = 0
    report_days_threshold: int = 150

    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_from_name: str = "Planning H&S"
    report_recipient_email: Optional[str] = None

    daily_check_hour: int = 6
    daily_check_minute: int = 0

    smtp_password_configured: bool = False


class AppSettingsUpdate(BaseModel):
    alert_expiring_soon_days: Optional[int] = Field(None, ge=0)
    alert_critical_days: Optional[int] = Field(None, ge=0)
    report_days_threshold: Optional[int] = Field(None, ge=0)

    smtp_host: Optional[str] = Field(None, max_length=255)
    smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    smtp_user: Optional[str] = Field(None, max_length=255)

    # None: do not change current password.
    # Empty string: explicitly remove current password.
    # Non-empty value: replace current password.
    smtp_password: Optional[str] = Field(None, max_length=1024)

    smtp_from_email: Optional[str] = Field(None, max_length=255)
    smtp_from_name: Optional[str] = Field(None, min_length=1, max_length=255)
    report_recipient_email: Optional[str] = Field(None, max_length=255)

    daily_check_hour: Optional[int] = Field(None, ge=0, le=23)
    daily_check_minute: Optional[int] = Field(None, ge=0, le=59)