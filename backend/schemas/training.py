"""Training record schemas (one per employee/course completion)."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from .common import CourseStatus, reject_future_date


class TrainingRecordBase(BaseModel):
    employee_id: int
    course_id: int
    completion_date: date
    notes: Optional[str] = Field(None, max_length=1000)
    certificate_url: Optional[str] = Field(None, max_length=500)


class TrainingRecordCreate(TrainingRecordBase):
    _completion_date_not_future = field_validator("completion_date")(reject_future_date)


class TrainingRecordUpdate(BaseModel):
    completion_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)
    certificate_url: Optional[str] = Field(None, max_length=500)

    _completion_date_not_future = field_validator("completion_date")(reject_future_date)


class TrainingRecordResponse(TrainingRecordBase):
    id: int
    expiry_date: Optional[date] = None
    days_remaining: Optional[int] = None
    status: CourseStatus

    class Config:
        from_attributes = True
