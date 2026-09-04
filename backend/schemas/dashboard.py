"""Dashboard export request schema."""

from typing import List, Literal

from pydantic import BaseModel, Field


class DashboardExportRequest(BaseModel):
    employee_ids: List[int] = []
    course_ids: List[int] = []
    columns: List[str] = Field(default_factory=lambda: ["first_name", "last_name", "roles", "medical"])
    format: Literal["csv", "excel"] = "csv"
