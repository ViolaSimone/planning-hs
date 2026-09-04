"""Email notification service built on fastapi-mail.

The service is inactive until SMTP host, username and password are available.
SMTP settings may come from environment variables or from the persisted
application settings service. Passwords are never returned by the API.
"""

import logging
from typing import List

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

from config import settings

logger = logging.getLogger(__name__)

CATEGORY_LABELS = {
    "missing": "Mancante",
    "expired": "Scaduto",
    "critical": "Critico",
    "expiring_soon": "In scadenza",
    "ok": "In regola",
}

CATEGORY_COLORS = {
    "missing": "#64748b",
    "expired": "#dc2626",
    "critical": "#ea580c",
    "expiring_soon": "#ca8a04",
    "ok": "#16a34a",
}


class NotificationService:
    """Sends aggregated alert emails using the current SMTP settings."""

    def __init__(self):
        self.conf = None
        self.fastmail = None
        self._init_mail_config()

    def _init_mail_config(self):
        """Build or clear the FastMail client from current runtime settings."""
        if not (
            settings.SMTP_HOST
            and settings.SMTP_USER
            and settings.SMTP_PASSWORD
        ):
            self.conf = None
            self.fastmail = None
            logger.warning(
                "Email service not configured - SMTP host, username, "
                "or password is missing"
            )
            return

        try:
            self.conf = ConnectionConfig(
                MAIL_USERNAME=settings.SMTP_USER,
                MAIL_PASSWORD=settings.SMTP_PASSWORD,
                MAIL_FROM=settings.SMTP_FROM_EMAIL or settings.SMTP_USER,
                MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
                MAIL_SERVER=settings.SMTP_HOST,
                MAIL_PORT=settings.SMTP_PORT,
                MAIL_STARTTLS=True,
                MAIL_SSL_TLS=False,
                USE_CREDENTIALS=True,
                VALIDATE_CERTS=True,
            )
            self.fastmail = FastMail(self.conf)
            logger.info(
                "Email service configured for host=%s port=%s user=%s",
                settings.SMTP_HOST,
                settings.SMTP_PORT,
                settings.SMTP_USER,
            )
        except Exception:
            self.conf = None
            self.fastmail = None
            logger.exception("Unable to configure SMTP email service")

    async def send_summary_alert_email(
        self,
        recipient_email: str,
        changes: List[dict],
        check_date: str,
    ) -> bool:
        """Send one email containing all status changes from the latest check."""
        if not recipient_email:
            logger.warning("Cannot send summary email: recipient is missing")
            return False

        if not self.fastmail:
            logger.warning(
                "Cannot send summary email: SMTP service is not configured"
            )
            return False

        grouped = {}
        for change in changes:
            grouped.setdefault(change["category"], []).append(change)

        rows_html = ""
        for category in [
            "missing",
            "expired",
            "critical",
            "expiring_soon",
        ]:
            items = grouped.get(category, [])
            if not items:
                continue

            color = CATEGORY_COLORS.get(category, "#64748b")
            label = CATEGORY_LABELS.get(category, category)
            rows_html += (
                f'<tr><td colspan="4" style="background:{color};'
                f'color:#fff;padding:8px 12px;font-weight:bold">'
                f"{label} ({len(items)})</td></tr>"
            )

            for item in items:
                days_remaining = item.get("days_remaining")
                if days_remaining is None:
                    detail = "N/D"
                elif days_remaining < 0:
                    detail = f"scaduto da {abs(days_remaining)} giorni"
                else:
                    detail = f"{days_remaining} giorni rimanenti"

                rows_html += (
                    "<tr>"
                    f'<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">'
                    f'{item.get("employee_name", "")}</td>'
                    f'<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">'
                    f'{item.get("course_name", "")}</td>'
                    f'<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">'
                    f'{item.get("expiry_date") or "N/D"}</td>'
                    f'<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0">'
                    f"{detail}</td>"
                    "</tr>"
                )

        html_content = f"""
        <html>
          <body style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
            <div style="max-width:700px;margin:0 auto;padding:20px">
              <h2>Planning H&amp;S — Report cambiamenti formazione</h2>
              <p>Data controllo: {check_date}</p>
              <p>Sono stati rilevati <strong>{len(changes)}</strong> cambiamenti
              di stato rispetto all'ultimo controllo.</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px">
                <thead>
                  <tr style="background:#f1f5f9">
                    <th style="text-align:left;padding:8px 12px">Dipendente</th>
                    <th style="text-align:left;padding:8px 12px">Corso</th>
                    <th style="text-align:left;padding:8px 12px">Scadenza</th>
                    <th style="text-align:left;padding:8px 12px">Dettaglio</th>
                  </tr>
                </thead>
                <tbody>{rows_html}</tbody>
              </table>
              <p style="color:#64748b;font-size:13px;margin-top:24px">
                Questo report viene generato automaticamente solo quando cambia
                qualcosa rispetto al controllo precedente.
              </p>
            </div>
          </body>
        </html>
        """

        message = MessageSchema(
            subject=f"Planning H&S — {len(changes)} cambiamenti rilevati",
            recipients=[recipient_email],
            body=html_content,
            subtype="html",
        )

        try:
            await self.fastmail.send_message(message)
            logger.info(
                "Summary alert email sent to recipient=%s changes=%s",
                recipient_email,
                len(changes),
            )
            return True
        except Exception:
            logger.exception(
                "Failed to send summary alert email to recipient=%s",
                recipient_email,
            )
            return False


notification_service = NotificationService()
