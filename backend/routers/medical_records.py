"""Current medical fitness record endpoints (one active record per employee)."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import MedicalRecordUpsert
from repositories import upsert_medical_record, delete_medical_record
from services import get_employee_training_status
from config import settings

router = APIRouter()


@router.get("/api/employees/{employee_id}/medical")
async def get_employee_medical(employee_id: int, db: AsyncSession = Depends(get_db)):
    status_data = await get_employee_training_status(
        db, employee_id,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    if not status_data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return status_data["medical"]


@router.put("/api/employees/{employee_id}/medical")
async def upsert_employee_medical(employee_id: int, payload: MedicalRecordUpsert, db: AsyncSession = Depends(get_db)):
    """Records/updates the employee's latest medical visit date.

    The expiry date is calculated automatically from the surveillance plan
    linked to the employee's current classification. The visit is also
    stored in MedicalVisitHistory (backend-only, not exposed to the
    frontend yet).
    """
    if payload.visit_date > date.today():
        raise HTTPException(status_code=422, detail="La data dell'idoneità medica non può essere successiva a oggi")

    record = await upsert_medical_record(db, employee_id, payload.visit_date, payload.notes)
    if not record:
        raise HTTPException(status_code=404, detail="Employee not found")

    status_data = await get_employee_training_status(
        db, employee_id,
        yellow=settings.ALERT_EXPIRING_SOON_DAYS,
        red=settings.ALERT_CRITICAL_DAYS,
    )
    return status_data["medical"]


@router.delete("/api/employees/{employee_id}/medical", status_code=204)
async def delete_medical_record_endpoint(employee_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_medical_record(db, employee_id):
        raise HTTPException(status_code=404, detail="Medical record not found")
