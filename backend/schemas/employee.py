"""Employee schemas."""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    hire_date: Optional[date] = None
    work_location: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    job_position: Optional[str] = Field(None, max_length=255)
    tax_code: Optional[str] = Field(None, max_length=16)
    birth_date: Optional[date] = None
    birth_place: Optional[str] = Field(None, max_length=255)
    classification_id: Optional[int] = None
    safety_role_ids: List[int] = Field(..., min_length=1)


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    hire_date: Optional[date] = None
    work_location: Optional[str] = Field(None, max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    job_position: Optional[str] = Field(None, max_length=255)
    tax_code: Optional[str] = Field(None, max_length=16)
    birth_date: Optional[date] = None
    birth_place: Optional[str] = Field(None, max_length=255)
    classification_id: Optional[int] = None
    safety_role_ids: Optional[List[int]] = None


class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    work_location: Optional[str] = None
    department: Optional[str] = None
    job_position: Optional[str] = None
    tax_code: Optional[str] = Field(None, max_length=16)
    birth_date: Optional[date] = None
    birth_place: Optional[str] = Field(None, max_length=255)
    classification_id: Optional[int] = None
    classification_name: Optional[str] = None
    safety_role_ids: List[int] = []

    class Config:
        from_attributes = True
