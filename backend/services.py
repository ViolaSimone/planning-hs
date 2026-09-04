"""Service layer: business rules built on top of the repository layer.

Everything here answers questions like "what status is this course in",
"which employees need to be scheduled for this course", or "what does the
compliance report look like" — logic that combines multiple repository
calls and applies the app's actual rules, as opposed to plain data access.
"""

from sqlalchemy import select

from models import Course, SurveillancePlan
from schemas import CourseStatus
import repositories as repo
from repositories import calculate_days_remaining, calculate_expiry_date, calculate_medical_expiry

# Re-exported so routers that only need date math don't have to import
# from the repository layer directly.
__all__ = [
    "calculate_days_remaining",
    "calculate_expiry_date",
    "calculate_medical_expiry",
    "get_course_status",
    "record_status_and_days",
    "get_employee_medical_status",
    "get_employee_training_status",
    "get_course_planning_candidates",
    "get_medical_plan_planning_candidates",
    "get_training_report",
    "get_medical_surveillance_report",
]


# --- Status calculation -------------------------------------------------

def get_course_status(days_remaining, yellow, red, has_record=True, no_expiry=False):
    """Maps a number of days remaining into a traffic-light status.

    A course with no expiry (no_expiry=True) is green as soon as it has
    been completed at all, regardless of the other thresholds.
    """
    if no_expiry and has_record:
        return CourseStatus.GREEN
    if days_remaining is None:
        return CourseStatus.MISSING
    if days_remaining <= red:
        return CourseStatus.RED
    if days_remaining <= yellow:
        return CourseStatus.YELLOW
    return CourseStatus.GREEN


def record_status_and_days(record, yellow, red):
    if record.expiry_date is None:
        return CourseStatus.GREEN, None
    days = calculate_days_remaining(record.expiry_date)
    return get_course_status(days, yellow, red), days


async def get_employee_medical_status(db, employee, yellow, red):
    plan = await repo.get_plan_for_classification(db, employee.classification_id)
    record = await repo.get_medical_record(db, employee.id)

    base = {
        "plan_id": plan.id if plan else None,
        "plan_name": plan.name if plan else None,
        "renewal_value": plan.renewal_value if plan else None,
        "renewal_unit": plan.renewal_unit if plan else None,
        "requires_surveillance": plan is not None,
    }

    if not record:
        return {
            **base,
            "visit_date": None,
            "expiry_date": None,
            "days_remaining": None,
            "status": CourseStatus.MISSING if plan else CourseStatus.GREEN,
        }

    days = calculate_days_remaining(record.expiry_date)
    return {
        **base,
        "visit_date": record.visit_date,
        "expiry_date": record.expiry_date,
        "days_remaining": days,
        "status": get_course_status(days, yellow, red),
    }


async def get_employee_training_status(db, employee_id, yellow=70, red=0):
    """Builds the full compliance picture for one employee: every
    mandatory course (from their safety roles, plus the always-mandatory
    Sicurezza Generale/Specifica) with its current status, and their
    medical fitness status.
    """
    employee = await repo.get_employee(db, employee_id)
    if not employee:
        return None

    required = {}
    for role in employee.safety_roles:
        for requirement in role.required_courses:
            required[requirement.course_id] = {"course": requirement.course, "is_mandatory": requirement.is_mandatory}

    always_mandatory = await db.execute(select(Course).where(Course.code.in_(["SIC_GEN", "SIC_SPEC"])))
    for course in always_mandatory.scalars().all():
        required.setdefault(course.id, {"course": course, "is_mandatory": True})

    records = {r.course_id: r for r in await repo.get_training_records(db, employee_id)}
    courses = []
    worst = CourseStatus.GREEN

    for course_id, info in required.items():
        course = info["course"]
        record = records.get(course_id)

        if record:
            days = calculate_days_remaining(record.expiry_date)
            status = get_course_status(days, yellow, red, True, course.renewal_years == 0)
            item = {
                "course_id": course.id,
                "course_name": course.name,
                "course_code": course.code,
                "renewal_years": course.renewal_years,
                "display_order": course.display_order,
                "completion_date": record.completion_date,
                "expiry_date": record.expiry_date,
                "days_remaining": days,
                "status": status,
                "is_mandatory": info["is_mandatory"],
            }
        else:
            item = {
                "course_id": course.id,
                "course_name": course.name,
                "course_code": course.code,
                "renewal_years": course.renewal_years,
                "display_order": course.display_order,
                "completion_date": None,
                "expiry_date": None,
                "days_remaining": None,
                "status": CourseStatus.MISSING,
                "is_mandatory": info["is_mandatory"],
            }

        courses.append(item)

    for item in courses:
        if item["is_mandatory"] and item["status"] == CourseStatus.MISSING:
            worst = CourseStatus.MISSING
            break
        if item["status"] == CourseStatus.RED:
            worst = CourseStatus.RED
        elif item["status"] == CourseStatus.YELLOW and worst not in [CourseStatus.RED, CourseStatus.MISSING]:
            worst = CourseStatus.YELLOW

    courses.sort(key=lambda x: (x["display_order"], x["course_id"]))

    return {
        "employee_id": employee.id,
        "employee_name": f"{employee.first_name} {employee.last_name}",
        "employee_email": employee.email,
        "department": employee.department,
        "job_position": employee.job_position,
        "classification_id": employee.classification_id,
        "classification_name": employee.classification.name if employee.classification else None,
        "safety_roles": [r.name for r in employee.safety_roles],
        "safety_role_ids": [r.id for r in employee.safety_roles],
        "phone": employee.phone,
        "hire_date": employee.hire_date,
        "work_location": employee.work_location,
        "tax_code": employee.tax_code,
        "birth_date": employee.birth_date,
        "birth_place": employee.birth_place,
        "courses": courses,
        "medical": await get_employee_medical_status(db, employee, yellow, red),
        "overall_status": worst,
    }


# --- Planning: who needs to be scheduled --------------------------------

_CATEGORY_PRIORITY = {"missing": 0, "expired": 1, "critical": 2, "expiring_soon": 3}


def _sort_candidates(candidates):
    candidates.sort(key=lambda item: (
        _CATEGORY_PRIORITY.get(item["category"], 9),
        item["days_remaining"] if item["days_remaining"] is not None else -99999,
        item["last_name"].lower(),
        item["first_name"].lower(),
    ))
    return candidates


def _category_for_course(course_status, days):
    if course_status["status"] == CourseStatus.MISSING:
        return "missing"
    if days is not None and days < 0:
        return "expired"
    if course_status["status"] == CourseStatus.RED:
        return "critical"
    return "expiring_soon"


async def get_course_planning_candidates(db, course_id, yellow=70, red=0):
    """Employees for whom the given course is mandatory and not currently
    compliant (missing, expired, critical or expiring soon)."""
    course = await repo.get_course(db, course_id)
    if not course:
        return None, []

    employees = await repo.get_employees(db, limit=10000)
    candidates = []

    for employee in employees:
        status_data = await get_employee_training_status(db, employee.id, yellow=yellow, red=red)
        if not status_data:
            continue

        course_status = next((item for item in status_data["courses"] if item["course_id"] == course_id), None)
        if not course_status or not course_status["is_mandatory"]:
            continue
        if course_status["status"] == CourseStatus.GREEN:
            continue

        days = course_status["days_remaining"]
        candidates.append({
            "employee_id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "email": employee.email,
            "phone": employee.phone,
            "hire_date": employee.hire_date,
            "work_location": employee.work_location,
            "department": employee.department,
            "job_position": employee.job_position,
            "tax_code": employee.tax_code,
            "birth_date": employee.birth_date,
            "birth_place": employee.birth_place,
            "classification_name": status_data.get("classification_name"),
            "safety_roles": status_data.get("safety_roles", []),
            "course_id": course.id,
            "course_name": course.name,
            "course_code": course.code,
            "completion_date": course_status["completion_date"],
            "expiry_date": course_status["expiry_date"],
            "days_remaining": days,
            "status": course_status["status"].value if hasattr(course_status["status"], "value") else course_status["status"],
            "category": _category_for_course(course_status, days),
        })

    return course, _sort_candidates(candidates)


async def get_medical_plan_planning_candidates(db, plan_id, yellow=70, red=0):
    """Employees linked to the given surveillance plan whose medical
    fitness is not currently compliant."""
    plan = await repo.get_surveillance_plan(db, plan_id)
    if not plan:
        return None, []

    employees = await repo.get_employees(db, limit=10000)
    candidates = []

    for employee in employees:
        status_data = await get_employee_training_status(db, employee.id, yellow=yellow, red=red)
        if not status_data:
            continue

        medical = status_data.get("medical")
        if not medical or medical.get("plan_id") != plan_id:
            continue

        status_value = medical.get("status")
        if hasattr(status_value, "value"):
            status_value = status_value.value
        if status_value == CourseStatus.GREEN.value:
            continue

        days = medical.get("days_remaining")
        if status_value == CourseStatus.MISSING.value:
            category = "missing"
        elif days is not None and days < 0:
            category = "expired"
        elif status_value == CourseStatus.RED.value:
            category = "critical"
        else:
            category = "expiring_soon"

        candidates.append({
            "employee_id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "email": employee.email,
            "phone": employee.phone,
            "hire_date": employee.hire_date,
            "work_location": employee.work_location,
            "department": employee.department,
            "job_position": employee.job_position,
            "tax_code": employee.tax_code,
            "birth_date": employee.birth_date,
            "birth_place": employee.birth_place,
            "classification_name": status_data.get("classification_name"),
            "plan_id": plan.id,
            "plan_name": plan.name,
            "renewal_value": plan.renewal_value,
            "renewal_unit": plan.renewal_unit,
            "visit_date": medical.get("visit_date"),
            "expiry_date": medical.get("expiry_date"),
            "days_remaining": days,
            "status": status_value,
            "category": category,
        })

    return plan, _sort_candidates(candidates)


# --- Reports ---------------------------------------------------------------

async def get_training_report(db, days_threshold=150, course_ids=None, yellow=70, red=0):
    """Aggregated compliance report, one row per course, counting only
    employees for whom that course is mandatory."""
    if course_ids:
        courses_result = await db.execute(select(Course).where(Course.id.in_(course_ids)))
    else:
        courses_result = await db.execute(select(Course).order_by(Course.display_order, Course.id))
    courses = list(courses_result.scalars().all())

    employees = await repo.get_employees(db, limit=10000)
    report_map = {
        course.id: {
            "course_id": course.id,
            "course_name": course.name,
            "total_employees": 0,
            "trained_count": 0,
            "missing_count": 0,
            "expiring_soon_count": 0,
            "expired_count": 0,
        }
        for course in courses
    }

    for employee in employees:
        employee_status = await get_employee_training_status(db, employee.id, yellow=yellow, red=red)
        if not employee_status:
            continue

        for course_status in employee_status["courses"]:
            item = report_map.get(course_status["course_id"])
            if not item or not course_status["is_mandatory"]:
                continue

            item["total_employees"] += 1

            if course_status["status"] == CourseStatus.MISSING:
                item["missing_count"] += 1
                continue

            days = course_status["days_remaining"]
            if days is not None and days < 0:
                item["expired_count"] += 1
            elif days is not None and days <= days_threshold:
                item["expiring_soon_count"] += 1
            else:
                # Only counted as "trained" once missing/expired/expiring
                # have all been ruled out, so the three counts never overlap.
                item["trained_count"] += 1

    result = []
    for item in report_map.values():
        item["to_update_count"] = item["expiring_soon_count"] + item["expired_count"]
        item["compliance_percentage"] = round(
            (item["trained_count"] / item["total_employees"] * 100) if item["total_employees"] else 0, 2
        )
        result.append(item)
    return result


async def get_medical_surveillance_report(db, days_threshold=150, plan_ids=None):
    """Aggregated medical fitness report, one row per surveillance plan.

    An employee counts toward a plan only if their current classification
    is associated with it; a medical record inherited from a previous
    classification does not satisfy the current plan's requirement.
    """
    if plan_ids:
        plans_result = await db.execute(
            select(SurveillancePlan).where(SurveillancePlan.id.in_(plan_ids)).order_by(SurveillancePlan.name)
        )
    else:
        plans_result = await db.execute(select(SurveillancePlan).order_by(SurveillancePlan.name))
    plans = list(plans_result.scalars().all())

    employees = await repo.get_employees(db, limit=10000)
    reports = []

    for plan in plans:
        classification_ids = {classification.id for classification in plan.classifications}
        applicable_employees = [e for e in employees if e.classification_id in classification_ids]

        item = {
            "plan_id": plan.id,
            "plan_name": plan.name,
            "renewal_value": plan.renewal_value,
            "renewal_unit": plan.renewal_unit,
            "total_employees": len(applicable_employees),
            "medically_fit_count": 0,
            "missing_count": 0,
            "expiring_soon_count": 0,
            "expired_count": 0,
            "compliance_percentage": 0.0,
        }

        for employee in applicable_employees:
            record = await repo.get_medical_record(db, employee.id)

            if not record or record.plan_id != plan.id:
                item["missing_count"] += 1
                continue

            if record.expiry_date is None:
                item["medically_fit_count"] += 1
                continue

            days_remaining = calculate_days_remaining(record.expiry_date)
            if days_remaining is not None and days_remaining < 0:
                item["expired_count"] += 1
            elif days_remaining is not None and days_remaining <= days_threshold:
                item["expiring_soon_count"] += 1
            else:
                item["medically_fit_count"] += 1

        item["to_visit_count"] = item["missing_count"] + item["expiring_soon_count"] + item["expired_count"]
        item["compliance_percentage"] = round(
            (item["medically_fit_count"] / item["total_employees"] * 100) if item["total_employees"] > 0 else 0, 2
        )
        reports.append(item)

    return reports
