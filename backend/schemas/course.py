"""Course schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    renewal_years: int = Field(..., ge=0, le=10)
    is_active: bool = True


class CourseCreate(CourseBase):
    required_role_ids: Optional[List[int]] = []


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    renewal_years: Optional[int] = Field(None, ge=0, le=10)
    is_active: Optional[bool] = None
    required_role_ids: Optional[List[int]] = None


class CourseResponse(CourseBase):
    id: int
    display_order: int = 0
    required_role_ids: List[int] = []

    class Config:
        from_attributes = True


class CourseOrderUpdate(BaseModel):
    course_ids: List[int] = Field(..., min_length=1)
