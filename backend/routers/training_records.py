"""Course completion record endpoints (one per employee/course pair)."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import TrainingRecord
from schemas import TrainingRecordCreate, TrainingRecordResponse
from repositories import get_employee, get_course, get_training_records, create_training_record, delete_training_record
from services import calculate_expiry_date, record_status_and_days
from config import settings

router = APIRouter()


def training_record_to_response(record: TrainingRecord) -> dict:
    status_value, days = record_status_and_days(
        record, settings.ALERT_EXPIRING_SOON_DAYS, settings.ALERT_CRITICAL_DAYS
    )
    return {
        "id": record.id,
        "employee_id": record.employee_id,
        "course_id": record.course_id,
        "completion_date": record.completion_date,
        "expiry_date": record.expiry_date,
        "days_remaining": days,
        "status": status_value,
        "notes": record.notes,
        "certificate_url": record.certificate_url,
    }


@router.post("/api/employees/{employee_id}/training", response_model=TrainingRecordResponse, status_code=201)
async def save_training(employee_id: int, payload: TrainingRecordCreate, db: AsyncSession = Depends(get_db)):
    if payload.completion_date > date.today():
        raise HTTPException(status_code=422, detail="La data del corso non può essere successiva a oggi")

    employee = await get_employee(db, employee_id)
    course = await get_course(db, payload.course_id)
    if not employee or not course:
        raise HTTPException(status_code=404, detail="Employee or course not found")

    existing = next(
        (r for r in await get_training_records(db, employee_id) if r.course_id == payload.course_id),
        None,
    )
    expiry = calculate_expiry_date(payload.completion_date, course.renewal_years)

    if existing:
        existing.completion_date = payload.completion_date
        existing.expiry_date = expiry
        existing.notes = payload.notes
        existing.certificate_url = payload.certificate_url
        await db.commit()
        await db.refresh(existing)
        return training_record_to_response(existing)

    record = await create_training_record(
        db,
        TrainingRecord(
            employee_id=employee_id,
            course_id=payload.course_id,
            completion_date=payload.completion_date,
            expiry_date=expiry,
            notes=payload.notes,
            certificate_url=payload.certificate_url,
        ),
    )
    return training_record_to_response(record)


@router.delete("/api/employees/{employee_id}/training/{course_id}", status_code=204)
async def delete_training_record_endpoint(employee_id: int, course_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_training_record(db, employee_id, course_id):
        raise HTTPException(status_code=404, detail="Training record not found")
