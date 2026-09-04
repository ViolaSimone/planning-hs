
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Employee
from schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from repositories import (
    get_employees,
    get_employee,
    create_employee,
    update_employee,
    delete_employee,
    get_safety_role,
)


router = APIRouter()

# Fields that can be edited one at a time from the Dashboard's inline
# editors (PATCH endpoint below). Date fields are included here but need
# extra parsing before being handed to SQLAlchemy (see patch_employee_field).
PATCHABLE_FIELDS = {
    "first_name", "last_name", "job_position", "department",
    "work_location", "email", "phone", "tax_code", "birth_place",
    "hire_date", "birth_date",
}


def employee_to_response(employee: Employee) -> dict:
    """Builds the API representation of an Employee, including the
    classification name (resolved from the relationship) and the list of
    safety role IDs (rather than full role objects)."""
    return {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "email": employee.email,
        "phone": employee.phone,
        "hire_date": employee.hire_date,
        "work_location": employee.work_location,
        "department": employee.department,
        "job_position": employee.job_position,
        "tax_code": employee.tax_code,
        "birth_date": employee.birth_date,
        "birth_place": employee.birth_place,
        "classification_id": employee.classification_id,
        "classification_name": employee.classification.name if employee.classification else None,
        "safety_role_ids": [role.id for role in employee.safety_roles],
    }


@router.get("/api/employees", response_model=List[EmployeeResponse])
async def list_employees(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    employees = await get_employees(db, skip, limit)
    return [employee_to_response(e) for e in employees]


@router.post("/api/employees", response_model=EmployeeResponse, status_code=201)
async def create_employee_endpoint(payload: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    employee = Employee(**payload.model_dump(exclude={"safety_role_ids"}))
    for role_id in payload.safety_role_ids:
        role = await get_safety_role(db, role_id)
        if role:
            employee.safety_roles.append(role)
    created = await create_employee(db, employee)
    return employee_to_response(created)


@router.put("/api/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee_endpoint(employee_id: int, payload: EmployeeUpdate, db: AsyncSession = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)

    if "safety_role_ids" in data:
        employee = await get_employee(db, employee_id)
        if not employee:
            raise HTTPException(404, "Employee not found")
        employee.safety_roles = []
        for role_id in data.pop("safety_role_ids") or []:
            role = await get_safety_role(db, role_id)
            if role:
                employee.safety_roles.append(role)

    updated = await update_employee(db, employee_id, data)
    if not updated:
        raise HTTPException(404, "Employee not found")
    return employee_to_response(updated)


@router.patch("/api/employees/{employee_id}/field", response_model=EmployeeResponse)
async def patch_employee_field(
    employee_id: int,
    field: str = Query(...),
    value: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Updates a single field, used by the Dashboard's click-to-edit cells.

    Date fields need to be parsed into a real date object: SQLAlchemy's
    SQLite Date type rejects plain strings.
    """
    if field not in PATCHABLE_FIELDS:
        raise HTTPException(400, "Campo non modificabile")

    parsed_value: object = value
    if field in ("hire_date", "birth_date"):
        try:
            parsed_value = date.fromisoformat(value)
        except ValueError:
            raise HTTPException(400, "Formato data non valido, usare AAAA-MM-GG")

    updated = await update_employee(db, employee_id, {field: parsed_value})
    if not updated:
        raise HTTPException(404, "Employee not found")
    return employee_to_response(updated)


@router.delete("/api/employees/{employee_id}", status_code=204)
async def delete_employee_endpoint(employee_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_employee(db, employee_id):
        raise HTTPException(404, "Employee not found")
