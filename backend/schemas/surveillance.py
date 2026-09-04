"""Health surveillance schemas: surveillance plans and the employee's
current medical fitness record."""

from datetime import date
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

from .common import reject_future_date


class SurveillancePlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    renewal_value: int = Field(..., ge=1, le=120)
    renewal_unit: Literal["years", "months"] = "years"
    is_active: bool = True


class SurveillancePlanCreate(SurveillancePlanBase):
    classification_ids: Optional[List[int]] = []


class SurveillancePlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    renewal_value: Optional[int] = Field(None, ge=1, le=120)
    renewal_unit: Optional[Literal["years", "months"]] = None
    is_active: Optional[bool] = None
    classification_ids: Optional[List[int]] = None


class SurveillancePlanResponse(SurveillancePlanBase):
    id: int
    classification_ids: List[int] = []

    class Config:
        from_attributes = True


class MedicalRecordUpsert(BaseModel):
    visit_date: date
    notes: Optional[str] = Field(None, max_length=1000)

    _visit_date_not_future = field_validator("visit_date")(reject_future_date)
