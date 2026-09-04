from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import ApplicationSettings
from schemas.settings import AppSettings, AppSettingsUpdate


def _get_cipher() -> Optional[Fernet]:
    key = settings.SETTINGS_ENCRYPTION_KEY

    if not key:
        return None

    try:
        return Fernet(key.encode("utf-8"))
    except (TypeError, ValueError):
        return None


def encrypt_password(password: str) -> str:
    cipher = _get_cipher()

    if cipher is None:
        raise RuntimeError(
            "SETTINGS_ENCRYPTION_KEY is missing or invalid."
        )

    return cipher.encrypt(password.encode("utf-8")).decode("utf-8")


def decrypt_password(encrypted_password: Optional[str]) -> Optional[str]:
    if not encrypted_password:
        return None

    cipher = _get_cipher()

    if cipher is None:
        return None

    try:
        return cipher.decrypt(
            encrypted_password.encode("utf-8")
        ).decode("utf-8")
    except (InvalidToken, TypeError, ValueError):
        return None


async def get_or_create_application_settings(
    db: AsyncSession,
) -> ApplicationSettings:
    record = await db.get(ApplicationSettings, 1)

    if record is not None:
        return record

    record = ApplicationSettings(
        id=1,
        alert_expiring_soon_days=settings.ALERT_EXPIRING_SOON_DAYS,
        alert_critical_days=settings.ALERT_CRITICAL_DAYS,
        report_days_threshold=settings.REPORT_DAYS_THRESHOLD,
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_user=settings.SMTP_USER,
        smtp_from_email=settings.SMTP_FROM_EMAIL,
        smtp_from_name=settings.SMTP_FROM_NAME,
        report_recipient_email=settings.REPORT_RECIPIENT_EMAIL,
        daily_check_hour=settings.DAILY_CHECK_HOUR,
        daily_check_minute=settings.DAILY_CHECK_MINUTE,
    )

    if settings.SMTP_PASSWORD:
        record.smtp_password_encrypted = encrypt_password(
            settings.SMTP_PASSWORD
        )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    return record


def to_public_settings(record: ApplicationSettings) -> AppSettings:
    return AppSettings(
        alert_expiring_soon_days=record.alert_expiring_soon_days,
        alert_critical_days=record.alert_critical_days,
        report_days_threshold=record.report_days_threshold,
        smtp_host=record.smtp_host,
        smtp_port=record.smtp_port,
        smtp_user=record.smtp_user,
        smtp_from_email=record.smtp_from_email,
        smtp_from_name=record.smtp_from_name,
        report_recipient_email=record.report_recipient_email,
        daily_check_hour=record.daily_check_hour,
        daily_check_minute=record.daily_check_minute,
        smtp_password_configured=bool(
            record.smtp_password_encrypted
        ),
    )


async def update_application_settings(
    db: AsyncSession,
    payload: AppSettingsUpdate,
) -> ApplicationSettings:
    record = await get_or_create_application_settings(db)
    data = payload.model_dump(exclude_unset=True)

    password_present = "smtp_password" in data
    password = data.pop("smtp_password", None)

    for field, value in data.items():
        setattr(record, field, value)

    if password_present:
        if password:
            if _get_cipher() is None:
                record.smtp_password_encrypted = None
            else:
                record.smtp_password_encrypted = encrypt_password(password)
        else:
            record.smtp_password_encrypted = None

    await db.commit()
    await db.refresh(record)

    return record


async def apply_application_settings(
    db: AsyncSession,
    notification_service,
) -> ApplicationSettings:
    record = await get_or_create_application_settings(db)

    settings.ALERT_EXPIRING_SOON_DAYS = (
        record.alert_expiring_soon_days
    )
    settings.ALERT_CRITICAL_DAYS = record.alert_critical_days
    settings.REPORT_DAYS_THRESHOLD = record.report_days_threshold

    settings.SMTP_HOST = record.smtp_host
    settings.SMTP_PORT = record.smtp_port
    settings.SMTP_USER = record.smtp_user
    settings.SMTP_PASSWORD = decrypt_password(
        record.smtp_password_encrypted
    )
    settings.SMTP_FROM_EMAIL = record.smtp_from_email
    settings.SMTP_FROM_NAME = record.smtp_from_name
    settings.REPORT_RECIPIENT_EMAIL = record.report_recipient_email

    settings.DAILY_CHECK_HOUR = record.daily_check_hour
    settings.DAILY_CHECK_MINUTE = record.daily_check_minute

    notification_service._init_mail_config()

    return record