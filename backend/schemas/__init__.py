"""Schema package: re-exports every schema so existing imports keep
working unchanged, e.g. `from schemas import EmployeeCreate` behaves
exactly as it did when schemas.py was a single file. Each domain's
definitions live in their own module for readability; this file is the
single place that stitches them back together.
"""

from .common import CourseStatus, reject_future_date
from .classification import JobClassificationBase, JobClassificationCreate, JobClassificationResponse
from .employee import EmployeeBase, EmployeeCreate, EmployeeUpdate, EmployeeResponse
from .safety_role import SafetyRoleBase, SafetyRoleCreate, SafetyRoleResponse
from .course import CourseBase, CourseCreate, CourseUpdate, CourseResponse, CourseOrderUpdate
from .training import TrainingRecordBase, TrainingRecordCreate, TrainingRecordUpdate, TrainingRecordResponse
from .surveillance import (
    SurveillancePlanBase,
    SurveillancePlanCreate,
    SurveillancePlanUpdate,
    SurveillancePlanResponse,
    MedicalRecordUpsert,
)
from .dashboard import DashboardExportRequest
from .planning import PlanningExportRequest
from .settings import AppSettings, AppSettingsUpdate

__all__ = [
    "CourseStatus",
    "reject_future_date",
    "JobClassificationBase",
    "JobClassificationCreate",
    "JobClassificationResponse",
    "EmployeeBase",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "SafetyRoleBase",
    "SafetyRoleCreate",
    "SafetyRoleResponse",
    "CourseBase",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseOrderUpdate",
    "TrainingRecordBase",
    "TrainingRecordCreate",
    "TrainingRecordUpdate",
    "TrainingRecordResponse",
    "SurveillancePlanBase",
    "SurveillancePlanCreate",
    "SurveillancePlanUpdate",
    "SurveillancePlanResponse",
    "MedicalRecordUpsert",
    "DashboardExportRequest",
    "PlanningExportRequest",
    "AppSettings",
    "AppSettingsUpdate",
]
