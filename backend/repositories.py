"""Repository layer: database access only.

Every function here talks directly to SQLAlchemy and returns ORM objects
or plain rows. No business rules live in this file (no status/category
calculation, no report aggregation): that logic belongs in services.py.
"""

from datetime import date
from typing import Optional

from sqlalchemy import and_, func, select

from models import (
    ClassificationHistory,
    Course,
    Employee,
    JobClassification,
    MedicalRecord,
    MedicalVisitHistory,
    RoleCourseRequirement,
    SafetyRole,
    SurveillancePlan,
    TrainingRecord,
)

# --- Employees -----------------------------------------------------------

async def get_employees(db, skip=0, limit=100):
    result = await db.execute(select(Employee).offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_employee(db, employee_id):
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    return result.scalar_one_or_none()


async def create_employee(db, employee):
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    if employee.classification_id:
        classification = await get_classification(db, employee.classification_id)
        db.add(ClassificationHistory(
            employee_id=employee.id,
            classification_id=employee.classification_id,
            classification_name=classification.name if classification else None,
            start_date=date.today(),
        ))
        await db.commit()
    return employee


async def update_employee(db, employee_id, update_data):
    employee = await get_employee(db, employee_id)
    if not employee:
        return None

    # Track classification changes over time: close the previous open
    # history entry and open a new one whenever classification_id changes.
    if "classification_id" in update_data and update_data["classification_id"] != employee.classification_id:
        result = await db.execute(
            select(ClassificationHistory).where(
                and_(ClassificationHistory.employee_id == employee_id, ClassificationHistory.end_date == None)
            )
        )
        for entry in result.scalars().all():
            entry.end_date = date.today()

        new_id = update_data["classification_id"]
        if new_id:
            classification = await get_classification(db, new_id)
            db.add(ClassificationHistory(
                employee_id=employee_id,
                classification_id=new_id,
                classification_name=classification.name if classification else None,
                start_date=date.today(),
            ))

    for key, value in update_data.items():
        setattr(employee, key, value)

    await db.commit()
    await db.refresh(employee)
    return employee


async def delete_employee(db, employee_id):
    employee = await get_employee(db, employee_id)
    if not employee:
        return False
    await db.delete(employee)
    await db.commit()
    return True


# --- Job classifications --------------------------------------------------

async def get_classifications(db):
    result = await db.execute(select(JobClassification).order_by(JobClassification.name))
    return list(result.scalars().all())


async def get_classification(db, classification_id):
    result = await db.execute(select(JobClassification).where(JobClassification.id == classification_id))
    return result.scalar_one_or_none()


async def get_classification_by_name(db, name):
    result = await db.execute(select(JobClassification).where(func.lower(JobClassification.name) == name.strip().lower()))
    return result.scalar_one_or_none()


async def create_classification(db, classification):
    db.add(classification)
    await db.commit()
    await db.refresh(classification)
    return classification


async def update_classification(db, classification_id, update_data):
    classification = await get_classification(db, classification_id)
    if not classification:
        return None
    for key, value in update_data.items():
        if value is not None:
            setattr(classification, key, value)
    await db.commit()
    await db.refresh(classification)
    return classification


async def delete_classification(db, classification_id):
    classification = await get_classification(db, classification_id)
    if not classification:
        return False
    # Employees keep existing, just lose their classification reference.
    result = await db.execute(select(Employee).where(Employee.classification_id == classification_id))
    for employee in result.scalars().all():
        employee.classification_id = None
    await db.delete(classification)
    await db.commit()
    return True


# --- Safety roles ----------------------------------------------------------

async def get_safety_roles(db):
    result = await db.execute(select(SafetyRole).order_by(SafetyRole.name))
    return list(result.scalars().all())


async def get_safety_role(db, role_id):
    result = await db.execute(select(SafetyRole).where(SafetyRole.id == role_id))
    return result.scalar_one_or_none()


async def get_safety_role_by_name(db, name):
    result = await db.execute(select(SafetyRole).where(func.lower(SafetyRole.name) == name.strip().lower()))
    return result.scalar_one_or_none()


async def create_safety_role(db, role):
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


async def delete_safety_role(db, role_id):
    role = await get_safety_role(db, role_id)
    if not role:
        return False
    await db.delete(role)
    await db.commit()
    return True


# --- Courses -----------------------------------------------------------------

async def get_courses(db):
    result = await db.execute(select(Course).order_by(Course.display_order, Course.id))
    return list(result.scalars().all())


async def get_course(db, course_id):
    result = await db.execute(select(Course).where(Course.id == course_id))
    return result.scalar_one_or_none()


async def create_course(db, course):
    if course.display_order == 0:
        result = await db.execute(select(func.max(Course.display_order)))
        current_max = result.scalar()
        course.display_order = (current_max + 1) if current_max is not None else 0
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def update_course(db, course_id, update_data):
    course = await get_course(db, course_id)
    if not course:
        return None

    renewal_changed = (
        "renewal_years" in update_data
        and update_data["renewal_years"] is not None
        and update_data["renewal_years"] != course.renewal_years
    )

    for key, value in update_data.items():
        if value is not None:
            setattr(course, key, value)

    if renewal_changed:
        result = await db.execute(select(TrainingRecord).where(TrainingRecord.course_id == course_id))
        for record in result.scalars().all():
            record.expiry_date = calculate_expiry_date(record.completion_date, course.renewal_years)

    await db.commit()
    await db.refresh(course)
    return course


async def delete_course(db, course_id):
    course = await get_course(db, course_id)
    if not course:
        return False
    await db.delete(course)
    await db.commit()
    return True


async def reorder_courses(db, course_ids):
    for index, course_id in enumerate(course_ids):
        course = await get_course(db, course_id)
        if course:
            course.display_order = index
    await db.commit()


async def get_course_role_ids(db, course_id):
    result = await db.execute(
        select(RoleCourseRequirement.safety_role_id).where(RoleCourseRequirement.course_id == course_id)
    )
    return [row[0] for row in result.all()]


async def set_course_roles(db, course_id, role_ids):
    result = await db.execute(select(RoleCourseRequirement).where(RoleCourseRequirement.course_id == course_id))
    for requirement in result.scalars().all():
        await db.delete(requirement)
    for role_id in role_ids:
        db.add(RoleCourseRequirement(safety_role_id=role_id, course_id=course_id, is_mandatory=True))
    await db.commit()
    return role_ids


# --- Training records -------------------------------------------------------

async def get_training_records(db, employee_id):
    result = await db.execute(select(TrainingRecord).where(TrainingRecord.employee_id == employee_id))
    return list(result.scalars().all())


async def get_training_record(db, employee_id, course_id):
    result = await db.execute(
        select(TrainingRecord).where(and_(TrainingRecord.employee_id == employee_id, TrainingRecord.course_id == course_id))
    )
    return result.scalar_one_or_none()


async def create_training_record(db, record):
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def update_training_record(db, employee_id, course_id, update_data):
    record = await get_training_record(db, employee_id, course_id)
    if not record:
        return None
    for key, value in update_data.items():
        if value is not None:
            setattr(record, key, value)
    await db.commit()
    await db.refresh(record)
    return record


async def delete_training_record(db, employee_id: int, course_id: int) -> bool:
    record = await get_training_record(db, employee_id, course_id)
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True


# --- Surveillance plans ------------------------------------------------------

async def get_surveillance_plans(db):
    result = await db.execute(select(SurveillancePlan).order_by(SurveillancePlan.name))
    return list(result.scalars().all())


async def get_surveillance_plan(db, plan_id):
    result = await db.execute(select(SurveillancePlan).where(SurveillancePlan.id == plan_id))
    return result.scalar_one_or_none()


async def create_surveillance_plan(db, plan):
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


async def update_surveillance_plan(db, plan_id, update_data):
    plan = await get_surveillance_plan(db, plan_id)
    if not plan:
        return None
    for key, value in update_data.items():
        if value is not None:
            setattr(plan, key, value)
    await db.commit()
    await db.refresh(plan)
    return plan


async def delete_surveillance_plan(db, plan_id):
    plan = await get_surveillance_plan(db, plan_id)
    if not plan:
        return False
    # Employees whose medical record pointed at this plan lose the link
    # and its computed expiry date, rather than the record being deleted.
    result = await db.execute(select(MedicalRecord).where(MedicalRecord.plan_id == plan_id))
    for record in result.scalars().all():
        record.plan_id = None
        record.expiry_date = None
    await db.delete(plan)
    await db.commit()
    return True


async def set_plan_classifications(db, plan_id, classification_ids):
    plan = await get_surveillance_plan(db, plan_id)
    if not plan:
        return
    classifications = []
    for classification_id in classification_ids:
        classification = await get_classification(db, classification_id)
        if classification:
            classifications.append(classification)
    plan.classifications = classifications
    await db.commit()


async def get_plan_for_classification(db, classification_id):
    if not classification_id:
        return None
    result = await db.execute(
        select(SurveillancePlan)
        .join(SurveillancePlan.classifications)
        .where(and_(JobClassification.id == classification_id, SurveillancePlan.is_active == True))
    )
    return result.scalars().first()


# --- Medical records ---------------------------------------------------------

async def get_medical_record(db, employee_id):
    result = await db.execute(select(MedicalRecord).where(MedicalRecord.employee_id == employee_id))
    return result.scalar_one_or_none()


async def upsert_medical_record(db, employee_id, visit_date, notes=None):
    employee = await get_employee(db, employee_id)
    if not employee:
        return None

    plan = await get_plan_for_classification(db, employee.classification_id)
    expiry = calculate_medical_expiry(visit_date, plan.renewal_value, plan.renewal_unit) if plan else None

    record = await get_medical_record(db, employee_id)
    if record:
        record.visit_date = visit_date
        record.plan_id = plan.id if plan else None
        record.expiry_date = expiry
        record.notes = notes
    else:
        record = MedicalRecord(
            employee_id=employee_id,
            plan_id=plan.id if plan else None,
            visit_date=visit_date,
            expiry_date=expiry,
            notes=notes,
        )
        db.add(record)

    # Every visit is also appended to the permanent history table, even
    # though only the current MedicalRecord is shown in the dashboard.
    db.add(MedicalVisitHistory(
        employee_id=employee_id,
        plan_id=plan.id if plan else None,
        plan_name=plan.name if plan else None,
        visit_date=visit_date,
        expiry_date=expiry,
        notes=notes,
    ))

    await db.commit()
    await db.refresh(record)
    return record


async def delete_medical_record(db, employee_id: int) -> bool:
    """Deletes the employee's current medical record. MedicalVisitHistory
    is untouched: only the "current" record shown in the dashboard is
    removed, the visit history stays intact."""
    record = await get_medical_record(db, employee_id)
    if not record:
        return False
    await db.delete(record)
    await db.commit()
    return True


async def get_medical_visit_history(db, employee_id):
    result = await db.execute(
        select(MedicalVisitHistory).where(MedicalVisitHistory.employee_id == employee_id).order_by(MedicalVisitHistory.visit_date.desc())
    )
    return [
        {
            "id": h.id,
            "employee_id": h.employee_id,
            "plan_id": h.plan_id,
            "plan_name": h.plan_name,
            "visit_date": h.visit_date,
            "expiry_date": h.expiry_date,
            "notes": h.notes,
        }
        for h in result.scalars().all()
    ]


async def get_classification_history(db, employee_id):
    result = await db.execute(
        select(ClassificationHistory).where(ClassificationHistory.employee_id == employee_id).order_by(ClassificationHistory.start_date.desc())
    )
    return [
        {
            "id": h.id,
            "employee_id": h.employee_id,
            "classification_id": h.classification_id,
            "classification_name": h.classification_name,
            "start_date": h.start_date,
            "end_date": h.end_date,
        }
        for h in result.scalars().all()
    ]


# --- Date calculation helpers --------------------------------------------
# Kept here (rather than only in services.py) because create_course/
# update_course need calculate_expiry_date to recompute existing training
# records when a course's renewal period changes, and upsert_medical_record
# needs calculate_medical_expiry. services.py re-exports all three for use
# by the status/report calculations, so callers never need to know which
# module actually defines them.

def calculate_days_remaining(expiry_date: Optional[date]) -> Optional[int]:
    return (expiry_date - date.today()).days if expiry_date else None


def calculate_expiry_date(completion_date: date, renewal_years: int) -> Optional[date]:
    if renewal_years == 0:
        return None
    return completion_date.replace(year=completion_date.year + renewal_years)


def calculate_medical_expiry(visit_date: date, renewal_value: int, renewal_unit: str) -> date:
    if renewal_unit == "months":
        month = visit_date.month - 1 + renewal_value
        year = visit_date.year + month // 12
        month = month % 12 + 1
        last_day = [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
        return date(year, month, min(visit_date.day, last_day))
    return visit_date.replace(year=visit_date.year + renewal_value)


# --- Seed data ---------------------------------------------------------------

async def init_default_data(db):
    """Populates default roles, courses, classifications and their
    relationships, but only the first time the app runs against an empty
    database. Safe to call on every startup: it is a no-op once any
    SafetyRole already exists."""
    existing_roles = await db.execute(select(func.count(SafetyRole.id)))
    if (existing_roles.scalar() or 0) > 0:
        return

    default_roles = [
        SafetyRole(name="Lavoratore", description="Nessun ruolo specifico di sicurezza"),
        SafetyRole(name="Datore di Lavoro", description="Datore di Lavoro (DL)"),
        SafetyRole(name="RSPP", description="Responsabile del Servizio di Prevenzione e Protezione"),
        SafetyRole(name="ASPP", description="Addetto al Servizio di Prevenzione e Protezione"),
        SafetyRole(name="RLS", description="Rappresentante dei Lavoratori per la Sicurezza"),
        SafetyRole(name="Preposto", description="Persona che sovrintende all'attività lavorativa"),
        SafetyRole(name="Dirigente", description="Persona con potere decisionale"),
        SafetyRole(name="Addetto Antincendio", description="Addetto alla gestione emergenze incendio"),
        SafetyRole(name="Addetto Primo Soccorso", description="Addetto alla gestione emergenze sanitarie"),
        SafetyRole(name="Operatore Alimentare", description="Operatore del settore alimentare: richiede formazione HACCP"),
    ]
    db.add_all(default_roles)

    default_courses = [
        Course(name="Sicurezza Generale", code="SIC_GEN", renewal_years=0, display_order=0),
        Course(name="Sicurezza Specifica", code="SIC_SPEC", renewal_years=5, display_order=1),
        Course(name="HACCP", code="HACCP", renewal_years=2, display_order=2),
        Course(name="Preposto", code="PREP", renewal_years=2, display_order=3),
        Course(name="Antincendio", code="ANTINC", renewal_years=5, display_order=4),
        Course(name="Primo Soccorso", code="PRIMSOCC", renewal_years=3, display_order=5),
        Course(name="RLS", code="RLS", renewal_years=1, display_order=6),
        Course(name="Dirigente", code="DIR", renewal_years=5, display_order=7),
        Course(name="Datore di Lavoro (DL)", code="DL", renewal_years=5, display_order=8),
        Course(name="RSPP", code="RSPP", renewal_years=5, display_order=9),
    ]
    db.add_all(default_courses)

    default_classifications = [
        JobClassification(name="Impiegato", description="Lavoratore d'ufficio"),
        JobClassification(name="Operaio", description="Lavoratore di produzione"),
    ]
    db.add_all(default_classifications)
    await db.commit()

    roles_result = await db.execute(select(SafetyRole))
    roles_by_name = {role.name: role for role in roles_result.scalars().all()}
    courses_result = await db.execute(select(Course))
    courses_by_code = {course.code: course for course in courses_result.scalars().all()}

    requirements = {
        "Lavoratore": ["SIC_GEN", "SIC_SPEC"],
        "Datore di Lavoro": ["SIC_GEN", "SIC_SPEC", "DL"],
        "RSPP": ["SIC_GEN", "SIC_SPEC", "RSPP"],
        "ASPP": ["SIC_GEN", "SIC_SPEC", "RSPP"],
        "RLS": ["SIC_GEN", "SIC_SPEC", "RLS"],
        "Preposto": ["SIC_GEN", "SIC_SPEC", "PREP"],
        "Dirigente": ["SIC_GEN", "SIC_SPEC", "DIR"],
        "Addetto Antincendio": ["SIC_GEN", "SIC_SPEC", "ANTINC"],
        "Addetto Primo Soccorso": ["SIC_GEN", "SIC_SPEC", "PRIMSOCC"],
        "Operatore Alimentare": ["SIC_GEN", "SIC_SPEC", "HACCP"],
    }
    for role_name, course_codes in requirements.items():
        role = roles_by_name[role_name]
        for code in course_codes:
            course = courses_by_code[code]
            db.add(RoleCourseRequirement(safety_role_id=role.id, course_id=course.id, is_mandatory=True))

    classes_result = await db.execute(select(JobClassification))
    classes_by_name = {item.name: item for item in classes_result.scalars().all()}

    office_plan = SurveillancePlan(
        name="Piano Videoterminalisti",
        description="Sorveglianza periodica per lavoratori videoterminalisti",
        renewal_value=2,
        renewal_unit="years",
        is_active=True,
    )
    office_plan.classifications = [classes_by_name["Impiegato"]]

    manual_handling_plan = SurveillancePlan(
        name="Piano Movimentazione Carichi",
        description="Sorveglianza per movimentazione manuale dei carichi",
        renewal_value=1,
        renewal_unit="years",
        is_active=True,
    )
    manual_handling_plan.classifications = [classes_by_name["Operaio"]]

    db.add_all([office_plan, manual_handling_plan])
    await db.commit()
