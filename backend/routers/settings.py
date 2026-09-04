
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from notifications import notification_service
from schemas.settings import AppSettings, AppSettingsUpdate
from settings_service import (
    apply_application_settings,
    get_or_create_application_settings,
    to_public_settings,
    update_application_settings,
)

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
)


@router.get("", response_model=AppSettings)
async def get_settings(
    db: AsyncSession = Depends(get_db),
):
    record = await get_or_create_application_settings(db)
    return to_public_settings(record)


@router.put("", response_model=AppSettings)
async def update_settings(
    payload: AppSettingsUpdate,
    db: AsyncSession = Depends(get_db),
):
    record = await update_application_settings(db, payload)
    await apply_application_settings(db, notification_service)
    return to_public_settings(record)