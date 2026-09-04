"""Planning views: which employees need a course or a medical visit, and
their CSV/Excel export with user-selected visible fields and location
filter."""

from io import BytesIO

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import PlanningExportRequest
from services import get_course_planning_candidates, get_medical_plan_planning_candidates
from config import settings
from excel_utils import autosize_worksheet

router = APIRouter()

# Column keys the frontend may request in "visible_fields". Kept as an
# explicit allow-list so the export can never emit an arbitrary field name.
ALLOWED_EXPORT_FIELDS = {
    "classification", "department", "job_position", "email", "phone",
    "hire_date", "work_location", "roles", "tax_code", "birth_date",
    "birth_place", "event_date", "expiry_date", "status", "item_name", "period",
}


def _display_status(category: str) -> str:
    return {
        "missing": "Mancante",
        "expired": "Scaduto",
        "critical": "Critico",
        "expiring_soon": "In scadenza",
    }.get(category, category)


def _format_date(value) -> str:
    if not value:
        return ""
    if hasattr(value, "strftime"):
        return value.strftime("%d/%m/%Y")
    return str(value)


def _field_value(item: dict, field: str) -> str:
    values = {
        "first_name": item.get("first_name") or "",
        "last_name": item.get("last_name") or "",
        "classification": item.get("classification_name") or "",
        "department": item.get("department") or "",
        "job_position": item.get("job_position") or "",
        "work_location": item.get("work_location") or "",
        "email": item.get("email") or "",
        "phone": item.get("phone") or "",
        "hire_date": _format_date(item.get("hire_date")),
        "roles": ", ".join(item.get("safety_roles") or []),
        "tax_code": item.get("tax_code") or "",
        "birth_date": _format_date(item.get("birth_date")),
        "birth_place": item.get("birth_place") or "",
        "event_date": _format_date(item.get("completion_date")) if item.get("course_id") else _format_date(item.get("visit_date")),
        "expiry_date": _format_date(item.get("expiry_date")),
        "status": _display_status(item.get("category", "")),
    }
    return values.get(field, "")


def _field_label(field: str, mode: str) -> str:
    if field == "event_date":
        return "Data corso" if mode == "course" else "Ultima visita"
    return {
        "first_name": "Nome",
        "last_name": "Cognome",
        "classification": "Inquadramento",
        "department": "Reparto",
        "job_position": "Posizione lavorativa",
        "work_location": "Sede",
        "email": "Email",
        "phone": "Telefono",
        "hire_date": "Data assunzione",
        "tax_code": "Codice Fiscale",
        "birth_date": "Data di nascita",
        "birth_place": "Luogo di nascita",
        "roles": "Ruoli",
        "expiry_date": "Data rinnovo",
        "status": "Stato",
    }.get(field, field)


def _filter_by_location(employees: list, locations: list[str]) -> list:
    if not locations:
        return employees
    selected = {location.strip() for location in locations if location.strip()}
    return [item for item in employees if item.get("work_location") in selected]


def _build_export_rows(employees: list, visible_fields: list[str], mode: str, item_label: str, period: str | None = None) -> list[dict]:
    """Builds export rows. First name/last name are always included, every
    other column is opt-in based on what the frontend's "visible fields"
    menu currently has checked."""
    requested = [field for field in visible_fields if field in ALLOWED_EXPORT_FIELDS]

    rows = []
    for item in employees:
        row = {
            "Nome": item.get("first_name") or "",
            "Cognome": item.get("last_name") or "",
        }
        for field in requested:
            if field == "item_name":
                name = item.get("course_name") if mode == "course" else item.get("plan_name")
                row["Corso" if mode == "course" else "Piano sanitario"] = name or item_label
                continue
            if field == "period":
                row["Periodicità"] = period or ""
                continue
            row[_field_label(field, mode)] = _field_value(item, field)
        rows.append(row)
    return rows


def _export_response(rows: list[dict], export_format: str, filename_base: str, sheet_name: str) -> StreamingResponse:
    df = pd.DataFrame(rows)
    stream = BytesIO()

    if export_format == "csv":
        df.to_csv(stream, index=False, encoding="utf-8-sig")
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename_base}.csv"},
        )

    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
        autosize_worksheet(writer.sheets[sheet_name], df)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename_base}.xlsx"},
    )


@router.get("/api/planning/courses/{course_id}")
async def get_course_planning_endpoint(course_id: int, db: AsyncSession = Depends(get_db)):
    course, employees = await get_course_planning_candidates(
        db, course_id,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return {
        "type": "course",
        "item": {"id": course.id, "name": course.name, "code": course.code},
        "total_candidates": len(employees),
        "employees": employees,
    }


@router.get("/api/planning/medical-plans/{plan_id}")
async def get_medical_plan_planning_endpoint(plan_id: int, db: AsyncSession = Depends(get_db)):
    plan, employees = await get_medical_plan_planning_candidates(
        db, plan_id,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Medical plan not found")
    return {
        "type": "medical",
        "item": {
            "id": plan.id,
            "name": plan.name,
            "renewal_value": plan.renewal_value,
            "renewal_unit": plan.renewal_unit,
        },
        "total_candidates": len(employees),
        "employees": employees,
    }


@router.post("/api/planning/courses/{course_id}/export")
async def export_course_planning_endpoint(course_id: int, payload: PlanningExportRequest, db: AsyncSession = Depends(get_db)):
    course, employees = await get_course_planning_candidates(
        db, course_id,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if payload.employee_ids:
        selected_ids = set(payload.employee_ids)
        employees = [item for item in employees if item.get("employee_id") in selected_ids]
    elif payload.locations:
        employees = _filter_by_location(employees, payload.locations)

    rows = _build_export_rows(employees, payload.visible_fields, "course", course.name)
    return _export_response(
        rows, payload.format,
        f"pianifica_corso_{course.code.lower().replace(' ', '_')}",
        "Pianifica corsi",
    )


@router.post("/api/planning/medical-plans/{plan_id}/export")
async def export_medical_plan_planning_endpoint(plan_id: int, payload: PlanningExportRequest, db: AsyncSession = Depends(get_db)):
    plan, employees = await get_medical_plan_planning_candidates(
        db, plan_id,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Medical plan not found")

    if payload.employee_ids:
        selected_ids = set(payload.employee_ids)
        employees = [item for item in employees if item.get("employee_id") in selected_ids]
    elif payload.locations:
        employees = _filter_by_location(employees, payload.locations)

    period = f"{plan.renewal_value} {'anni' if plan.renewal_unit == 'years' else 'mesi'}"
    rows = _build_export_rows(employees, payload.visible_fields, "medical", plan.name, period)
    return _export_response(
        rows, payload.format,
        f"pianifica_visite_{plan.name.lower().replace(' ', '_')}",
        "Pianifica visite",
    )
