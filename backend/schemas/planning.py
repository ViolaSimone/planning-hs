"""Planning export request schema (Pianifica Corsi / Visite Mediche)."""

from typing import List, Literal

from pydantic import BaseModel, Field


class PlanningExportRequest(BaseModel):
    employee_ids: List[int] = Field(default_factory=list)
    visible_fields: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    format: Literal["csv", "excel"] = "excel"
