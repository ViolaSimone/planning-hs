"""On-demand alert check and the notification bell feed."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from alert_engine import detect_changes_and_update_snapshot, compute_current_alert_map
from notifications import notification_service
from config import settings

router = APIRouter()

CATEGORY_PRIORITY = {"missing": 0, "expired": 1, "critical": 2, "expiring_soon": 3}


@router.post("/api/notifications/run-daily-check")
async def run_check_now_endpoint(db: AsyncSession = Depends(get_db)):
    """Runs an immediate check, used by the "Verifica cambiamenti ora"
    button in Settings.

    Unlike the scheduled nightly job (alert_engine.run_daily_check), this
    does not write to AlertRunLog, so it never blocks tonight's automatic
    run from also happening.
    """
    changes = await detect_changes_and_update_snapshot(
        db, settings.ALERT_EXPIRING_SOON_DAYS, settings.ALERT_CRITICAL_DAYS
    )

    email_sent = False
    if changes and notification_service.fastmail and settings.REPORT_RECIPIENT_EMAIL:
        await notification_service.send_summary_alert_email(
            recipient_email=settings.REPORT_RECIPIENT_EMAIL,
            changes=changes,
            check_date=date.today().isoformat(),
        )
        email_sent = True

    return {"changes_detected": len(changes), "email_sent": email_sent}


@router.get("/api/notifications/summary")
async def notifications_summary_endpoint(db: AsyncSession = Depends(get_db)):
    """Feeds the notification bell shown in every page's header."""
    current_map = await compute_current_alert_map(
        db, settings.ALERT_EXPIRING_SOON_DAYS, settings.ALERT_CRITICAL_DAYS
    )

    alerts = [item for item in current_map.values() if item["category"] != "ok"]
    alerts.sort(
        key=lambda item: (
            CATEGORY_PRIORITY.get(item["category"], 9),
            item["days_remaining"] if item["days_remaining"] is not None else -99999,
        )
    )

    return {"total_alerts": len(alerts), "alerts": alerts}
