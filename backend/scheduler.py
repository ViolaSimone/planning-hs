"""
Shared APScheduler instance.

Kept in its own module (instead of living inside main.py) so that
routers/settings.py can reschedule the daily check job after a settings
update without creating a circular import with main.py.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
