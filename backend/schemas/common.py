"""Shared enums and validators used across multiple schema domains."""

from datetime import date
from enum import Enum
from typing import Optional


class CourseStatus(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"
    MISSING = "missing"


def reject_future_date(value: Optional[date]) -> Optional[date]:
    """Shared Pydantic validator: completion/visit dates cannot be in the
    future, since they represent something that has already happened."""
    if value is not None and value > date.today():
        raise ValueError("La data non può essere successiva a oggi")
    return value
