"""Application entry point.

All actual endpoint logic lives in routers/, and data access lives in crud.py / alert_engine.py.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.triggers.cron import CronTrigger

from database import get_db, AsyncSessionLocal
from repositories import init_default_data
from alert_engine import run_daily_check
from notifications import notification_service
from config import settings
from scheduler import scheduler
from settings_service import apply_application_settings

from routers import (
    employees,
    classifications,
    safety_roles,
    courses,
    surveillance_plans,
    training_records,
    medical_records,
    dashboard,
    planning,
    reports,
    notifications as notifications_router,
)
from routers import settings as settings_router


async def scheduled_daily_check():
    async with AsyncSessionLocal() as db:
        await run_daily_check(
            db,
            settings.ALERT_EXPIRING_SOON_DAYS,
            settings.ALERT_CRITICAL_DAYS,
            notification_service,
            settings.REPORT_RECIPIENT_EMAIL,
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database schema is managed by Alembic ("alembic upgrade head"),
    # run separately before starting the app (see start_backend.py).
    async for db in get_db():
        await init_default_data(db)
        await apply_application_settings(db, notification_service)
        break

    scheduler.add_job(
        scheduled_daily_check,
        CronTrigger(hour=settings.DAILY_CHECK_HOUR, minute=settings.DAILY_CHECK_MINUTE),
        id="daily_alert_check",
        replace_existing=True,
    )
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)


app = FastAPI(title=settings.APP_NAME, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "status": "running"}


app.include_router(employees.router)
app.include_router(classifications.router)
app.include_router(safety_roles.router)
app.include_router(courses.router)
app.include_router(surveillance_plans.router)
app.include_router(training_records.router)
app.include_router(medical_records.router)
app.include_router(dashboard.router)
app.include_router(planning.router)
app.include_router(reports.router)
app.include_router(settings_router.router)
app.include_router(notifications_router.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
