
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import SurveillancePlan
from schemas import SurveillancePlanCreate, SurveillancePlanUpdate, SurveillancePlanResponse
from repositories import (
    get_surveillance_plans,
    get_surveillance_plan,
    create_surveillance_plan,
    update_surveillance_plan,
    delete_surveillance_plan,
    set_plan_classifications,
)


router = APIRouter()


def _plan_to_response(plan: SurveillancePlan) -> SurveillancePlanResponse:
    return SurveillancePlanResponse(
        id=plan.id,
        name=plan.name,
        description=plan.description,
        renewal_value=plan.renewal_value,
        renewal_unit=plan.renewal_unit,
        is_active=plan.is_active,
        classification_ids=[c.id for c in plan.classifications],
    )


@router.get("/api/surveillance-plans", response_model=List[SurveillancePlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db)):
    plans = await get_surveillance_plans(db)
    return [_plan_to_response(plan) for plan in plans]


@router.post("/api/surveillance-plans", response_model=SurveillancePlanResponse, status_code=201)
async def create_plan(payload: SurveillancePlanCreate, db: AsyncSession = Depends(get_db)):
    plan = await create_surveillance_plan(db, SurveillancePlan(**payload.model_dump(exclude={"classification_ids"})))
    await set_plan_classifications(db, plan.id, payload.classification_ids or [])
    plan = await get_surveillance_plan(db, plan.id)
    return _plan_to_response(plan)


@router.put("/api/surveillance-plans/{plan_id}", response_model=SurveillancePlanResponse)
async def update_plan(plan_id: int, payload: SurveillancePlanUpdate, db: AsyncSession = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    classification_ids = data.pop("classification_ids", None)

    plan = await update_surveillance_plan(db, plan_id, data)
    if not plan:
        raise HTTPException(404, "Plan not found")

    if classification_ids is not None:
        await set_plan_classifications(db, plan_id, classification_ids)

    plan = await get_surveillance_plan(db, plan_id)
    return _plan_to_response(plan)


@router.delete("/api/surveillance-plans/{plan_id}", status_code=204)
async def delete_plan(plan_id: int, db: AsyncSession = Depends(get_db)):
    if not await delete_surveillance_plan(db, plan_id):
        raise HTTPException(404, "Plan not found")
