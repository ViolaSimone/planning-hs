"""Safety role schemas (RSPP, RLS, Preposto, etc.)."""

from typing import Optional

from pydantic import BaseModel, Field


class SafetyRoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class SafetyRoleCreate(SafetyRoleBase):
    pass


class SafetyRoleResponse(SafetyRoleBase):
    id: int

    class Config:
        from_attributes = True
