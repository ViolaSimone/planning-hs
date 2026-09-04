"""Dashboard status feed and its Excel/CSV export."""

from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import DashboardExportRequest
from repositories import get_employees, get_employee, get_courses
from services import get_employee_training_status
from config import settings
from excel_utils import autosize_worksheet

router = APIRouter()


@router.get("/api/dashboard/status")
async def dashboard_status(db: AsyncSession = Depends(get_db)):
    employees = await get_employees(db, limit=10000)
    employee_statuses = [
        await get_employee_training_status(
            db, e.id,
            yellow=settings.ALERT_EXPIRING_SOON_DAYS,
            red=settings.ALERT_CRITICAL_DAYS,
        )
        for e in employees
    ]
    return {
        "total_employees": len(employees),
        "employees": employee_statuses,
        "thresholds": {
            "expiring_soon_days": settings.ALERT_EXPIRING_SOON_DAYS,
            "critical_days": settings.ALERT_CRITICAL_DAYS,
        },
    }


@router.post("/api/dashboard/export")
async def export_dashboard(payload: DashboardExportRequest, db: AsyncSession = Depends(get_db)):
    courses = [c for c in await get_courses(db) if c.id in payload.course_ids]
    rows = []

    for employee_id in payload.employee_ids:
        employee = await get_employee(db, employee_id)
        status_data = await get_employee_training_status(
            db, employee_id,
            yellow=settings.ALERT_EXPIRING_SOON_DAYS,
            red=settings.ALERT_CRITICAL_DAYS,
        )
        if not employee or not status_data:
            continue

        row = {}
        for col in payload.columns:
            if col == "first_name":
                row["Nome"] = employee.first_name
            elif col == "last_name":
                row["Cognome"] = employee.last_name
            elif col == "roles":
                row["Ruoli"] = ", ".join(status_data["safety_roles"])
            elif col == "medical":
                row["Idoneità medica"] = status_data["medical"].get("visit_date") if status_data.get("medical") else ""
            elif col == "job_position":
                row["Posizione lavorativa"] = employee.job_position or ""
            elif col == "classification":
                row["Inquadramento"] = status_data.get("classification_name") or ""
            elif col == "department":
                row["Reparto"] = employee.department or ""
            elif col == "email":
                row["Email"] = employee.email or ""

        for course in courses:
            item = next((x for x in status_data["courses"] if x["course_id"] == course.id), None)
            if not item or not item.get("completion_date"):
                row[course.code] = ""
            else:
                value = item["completion_date"].strftime("%d/%m/%Y")
                if item["renewal_years"] > 0 and item.get("expiry_date"):
                    value += " → " + item["expiry_date"].strftime("%d/%m/%Y")
                row[course.code] = value

        rows.append(row)

    df = pd.DataFrame(rows)
    stream = BytesIO()

    if payload.format == "excel":
        with pd.ExcelWriter(stream, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Dashboard")
            autosize_worksheet(writer.sheets["Dashboard"], df)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=dashboard_export.xlsx"},
        )

    df.to_csv(stream, index=False, encoding="utf-8-sig")
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dashboard_export.csv"},
    )
