from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import JobClassification
from schemas import JobClassificationCreate, JobClassificationResponse
from repositories import (
    get_classifications,
    get_classification_by_name,
    create_classification,
    update_classification,
    delete_classification,
)

router = APIRouter()


@router.get("/api/classifications", response_model=List[JobClassificationResponse])
async def list_classifications(db: AsyncSession = Depends(get_db)):
    return await get_classifications(db)


@router.post("/api/classifications", response_model=JobClassificationResponse, status_code=201)
async def create_classification_endpoint(payload: JobClassificationCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_classification_by_name(db, payload.name)
    if existing:
        return existing
    return await create_classification(db, JobClassification(**payload.model_dump()))


@router.put("/api/classifications/{classification_id}", response_model=JobClassificationResponse)
async def update_classification_endpoint(
    classification_id: int, payload: JobClassificationCreate, db: AsyncSession = Depends(get_db)
):
    updated = await update_classification(db, classification_id, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(404, "Classification not found")
    return updated


@router.delete("/api/classifications/{classification_id}", status_code=204)
async def delete_classification_endpoint(classification_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_classification(db, classification_id):
        raise HTTPException(404, "Classification not found")
