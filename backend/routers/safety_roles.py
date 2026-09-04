"""Safety role CRUD endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import SafetyRole
from schemas import SafetyRoleCreate, SafetyRoleResponse
from repositories import get_safety_roles, get_safety_role_by_name, create_safety_role, delete_safety_role


router = APIRouter()


@router.get("/api/safety-roles", response_model=List[SafetyRoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db)):
    return await get_safety_roles(db)


@router.post("/api/safety-roles", response_model=SafetyRoleResponse, status_code=201)
async def create_role(payload: SafetyRoleCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_safety_role_by_name(db, payload.name)
    return existing or await create_safety_role(db, SafetyRole(**payload.model_dump()))


@router.delete("/api/safety-roles/{role_id}", status_code=204)
async def delete_role(role_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_safety_role(db, role_id):
        raise HTTPException(404, "Role not found")
