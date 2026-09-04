"""Job classification schemas (e.g. Impiegato, Operaio)."""

from typing import Optional

from pydantic import BaseModel, Field


class JobClassificationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = True


class JobClassificationCreate(JobClassificationBase):
    pass


class JobClassificationResponse(JobClassificationBase):
    id: int

    class Config:
        from_attributes = True
