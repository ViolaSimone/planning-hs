"""Change-detection engine for training and medical surveillance status.

How it works:
1. For every employee/mandatory-course pair (plus their medical fitness,
   keyed separately as "employeeId_medical"), compute the current
   category (missing | expired | critical | expiring_soon | ok) using the
   same thresholds that drive the dashboard's colors.
2. Compare against the last known snapshot in AlertStateSnapshot.
3. A category change is treated as something worth reporting.
4. If there are changes, send a single aggregated summary email, then
   update the snapshots.
5. If nothing changed since the last check, no email is sent.
"""

from datetime import date
from typing import Dict, List
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import AlertRunLog, AlertStateSnapshot, Employee
from repositories import get_employees
from services import get_employee_training_status
from schemas import CourseStatus

logger = logging.getLogger(__name__)


def categorize(course: dict) -> str:
    """Converts the raw green/yellow/red/missing status into the textual
    category used for alerts, consistent with what the dashboard shows."""
    if course['status'] == CourseStatus.MISSING:
        return "missing"
    days = course['days_remaining']
    if days is not None and days < 0:
        return "expired"
    if course['status'] == CourseStatus.RED:
        return "critical"
    if course['status'] == CourseStatus.YELLOW:
        return "expiring_soon"
    return "ok"


# Used to decide whether a category change counts as "worse" (worth
# reporting) or just noise, e.g. going from "expired" back to "critical"
# should not silently get skipped as a non-event.
SEVERITY_RANK = {"ok": 0, "expiring_soon": 1, "critical": 2, "expired": 3, "missing": 3}


async def compute_current_alert_map(db, yellow, red) -> Dict[str, dict]:
    """Returns a map keyed by "employeeId_courseId" or "employeeId_medical",
    with the current status of every mandatory course and medical fitness
    record across all employees."""
    employees = await get_employees(db)
    current_map = {}

    for emp in employees:
        status_data = await get_employee_training_status(db, emp.id, yellow, red)
        if not status_data:
            continue

        for course in status_data['courses']:
            if not course['is_mandatory']:
                continue
            category = categorize(course)
            key = f"{status_data['employee_id']}_{course['course_id']}"
            current_map[key] = {
                'employee_id': status_data['employee_id'],
                'employee_name': status_data['employee_name'],
                'employee_email': status_data.get('employee_email'),
                'item_type': 'course',
                'course_id': course['course_id'],
                'course_name': course['course_name'],
                'course_code': course['course_code'],
                'category': category,
                'days_remaining': course['days_remaining'],
                'expiry_date': course['expiry_date'].isoformat() if course['expiry_date'] else None,
            }

        medical = status_data.get('medical')
        if medical and medical.get('requires_surveillance'):
            category = categorize(medical)
            key = f"{status_data['employee_id']}_medical"
            current_map[key] = {
                'employee_id': status_data['employee_id'],
                'employee_name': status_data['employee_name'],
                'employee_email': status_data.get('employee_email'),
                'item_type': 'medical',
                'course_id': None,
                'course_name': f"Idoneita' medica ({medical['plan_name']})" if medical['plan_name'] else "Idoneita' medica",
                'course_code': 'MED',
                'category': category,
                'days_remaining': medical['days_remaining'],
                'expiry_date': medical['expiry_date'].isoformat() if medical['expiry_date'] else None,
            }

    return current_map


async def get_previous_snapshot_map(db: AsyncSession) -> Dict[str, AlertStateSnapshot]:
    result = await db.execute(select(AlertStateSnapshot))
    snapshots = result.scalars().all()
    # course_id is NULL for the medical fitness entry.
    return {
        f"{s.employee_id}_{s.course_id if s.course_id is not None else 'medical'}": s
        for s in snapshots
    }


async def detect_changes_and_update_snapshot(db, yellow, red) -> List[dict]:
    """Compares the current status against the last saved snapshot.

    Returns the list of changes (new non-ok entries, or a category that
    got worse) and updates the snapshots in the database as a side effect.
    """
    current_map = await compute_current_alert_map(db, yellow, red)
    previous_map = await get_previous_snapshot_map(db)

    changes = []
    for key, current in current_map.items():
        previous = previous_map.get(key)
        prev_category = previous.category if previous else None

        if current['category'] != 'ok':
            if prev_category is None or prev_category != current['category']:
                if prev_category is None or SEVERITY_RANK.get(current['category'], 0) >= SEVERITY_RANK.get(prev_category, 0):
                    changes.append({**current, 'previous_category': prev_category})

        if previous:
            previous.category = current['category']
            previous.days_remaining = current['days_remaining']
        else:
            db.add(AlertStateSnapshot(
                employee_id=current['employee_id'],
                course_id=current['course_id'],
                category=current['category'],
                days_remaining=current['days_remaining'],
            ))

    # Remove snapshots for combinations that no longer exist, e.g. a
    # deleted employee or a course that is no longer mandatory for anyone.
    stale_keys = set(previous_map.keys()) - set(current_map.keys())
    for stale_key in stale_keys:
        await db.delete(previous_map[stale_key])

    await db.commit()
    return changes


async def run_daily_check(
    db,
    yellow,
    red,
    notification_service,
    recipient_email=None
) -> dict:
    """Runs the scheduled nightly check: detects changes since the last
    known state and, if there are any, sends a single aggregated summary
    email. Records a log entry per calendar day to avoid double-sending
    if the job somehow runs twice on the same date."""

    today = date.today()

    existing_log = await db.execute(
        select(AlertRunLog).where(AlertRunLog.run_date == today)
    )
    existing_log = existing_log.scalar_one_or_none()

    if existing_log:
        return {
            "already_run_today": True,
            "changes_detected": existing_log.changes_detected,
            "email_sent": existing_log.email_sent,
            "email_error": None,
        }

    changes = await detect_changes_and_update_snapshot(
        db,
        yellow,
        red
    )

    email_sent = False
    email_error = None

    if not changes:
        email_error = "No alert changes were detected."

    elif not recipient_email:
        email_error = "No report recipient email has been configured."

    elif not notification_service.fastmail:
        email_error = (
            "SMTP is not configured. Check SMTP host, username, "
            "password, and sender email in Settings."
        )

    else:
        try:
            sent = await notification_service.send_summary_alert_email(
                recipient_email=recipient_email,
                changes=changes,
                check_date=today.isoformat(),
            )

            if sent:
                email_sent = True
            else:
                email_error = (
                    "The SMTP server did not confirm delivery. "
                    "Check the backend logs and SMTP credentials."
                )

        except Exception:
            logger.exception("Unable to send daily summary email")
            email_error = (
                "Unable to send the email. Check SMTP credentials, "
                "provider security settings, and backend logs."
            )

    db.add(
        AlertRunLog(
            run_date=today,
            changes_detected=len(changes),
            email_sent=email_sent,
        )
    )

    await db.commit()

    return {
        "already_run_today": False,
        "changes_detected": len(changes),
        "email_sent": email_sent,
        "email_error": email_error,
        "changes": changes,
    }
