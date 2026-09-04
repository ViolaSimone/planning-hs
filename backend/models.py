from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from database import Base

# Many-to-many: Employee <-> SafetyRole
employee_safety_roles = Table(
    'employee_safety_roles',
    Base.metadata,
    Column('employee_id', Integer, ForeignKey('employees.id'), primary_key=True),
    Column('safety_role_id', Integer, ForeignKey('safety_roles.id'), primary_key=True),
)

# Many-to-many: SurveillancePlan <-> JobClassification
plan_classifications = Table(
    'plan_classifications',
    Base.metadata,
    Column('plan_id', Integer, ForeignKey('surveillance_plans.id'), primary_key=True),
    Column('classification_id', Integer, ForeignKey('job_classifications.id'), primary_key=True),
)


class Employee(Base):
    __tablename__ = 'employees'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    hire_date = Column(Date, nullable=True)
    work_location = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    job_position = Column(String(255), nullable=True)
    tax_code = Column(String(16), nullable=True)
    birth_date = Column(Date, nullable=True)
    birth_place = Column(String(255), nullable=True)

    # Classification: exactly one per employee (e.g. Operaio, Impiegato).
    # Determines which surveillance plan, if any, applies to them.
    classification_id = Column(Integer, ForeignKey('job_classifications.id'), nullable=True)
    classification = relationship('JobClassification', back_populates='employees', lazy='joined')

    safety_roles = relationship(
        'SafetyRole',
        secondary=employee_safety_roles,
        back_populates='employees',
        lazy='selectin',
    )

    training_records = relationship(
        'TrainingRecord',
        back_populates='employee',
        cascade='all, delete-orphan',
        lazy='selectin',
    )

    medical_record = relationship(
        'MedicalRecord',
        back_populates='employee',
        cascade='all, delete-orphan',
        uselist=False,
        lazy='selectin',
    )

    def __repr__(self):
        return f"<Employee {self.first_name} {self.last_name}>"


class JobClassification(Base):
    """Employee classification (e.g. Operaio, Impiegato)."""
    __tablename__ = 'job_classifications'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    employees = relationship('Employee', back_populates='classification')

    surveillance_plans = relationship(
        'SurveillancePlan',
        secondary=plan_classifications,
        back_populates='classifications',
        lazy='selectin',
    )

    def __repr__(self):
        return f"<JobClassification {self.name}>"


class SafetyRole(Base):
    """Safety role an employee can hold: RSPP, DL, RLS, Preposto, etc."""
    __tablename__ = 'safety_roles'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    required_courses = relationship(
        'RoleCourseRequirement',
        back_populates='safety_role',
        cascade='all, delete-orphan',
        lazy='selectin',
    )

    employees = relationship(
        'Employee',
        secondary=employee_safety_roles,
        back_populates='safety_roles',
    )

    def __repr__(self):
        return f"<SafetyRole {self.name}>"


class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    code = Column(String(50), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    # 0 means the course never expires (e.g. Sicurezza Generale)
    renewal_years = Column(Integer, nullable=False, default=5)
    is_active = Column(Boolean, default=True)
    # Column display order in the dashboard table (0 = first)
    display_order = Column(Integer, nullable=False, default=0)

    role_requirements = relationship(
        'RoleCourseRequirement',
        back_populates='course',
        cascade='all, delete-orphan',
    )

    # Deleting a course also deletes every employee's training record for
    # it. This is intentional (the frontend warns the user before doing so).
    training_records = relationship(
        'TrainingRecord',
        back_populates='course',
        cascade='all, delete-orphan',
    )

    def __repr__(self):
        return f"<Course {self.name}>"


class RoleCourseRequirement(Base):
    __tablename__ = 'role_course_requirements'

    id = Column(Integer, primary_key=True, index=True)
    safety_role_id = Column(Integer, ForeignKey('safety_roles.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    is_mandatory = Column(Boolean, default=True)

    safety_role = relationship('SafetyRole', back_populates='required_courses')
    course = relationship('Course', back_populates='role_requirements', lazy='joined')

    def __repr__(self):
        return f"<RoleCourseRequirement role={self.safety_role_id} course={self.course_id}>"


class TrainingRecord(Base):
    __tablename__ = 'training_records'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)

    completion_date = Column(Date, nullable=False)
    # NULL for courses with no renewal (renewal_years = 0): never expires
    expiry_date = Column(Date, nullable=True)

    notes = Column(String(1000), nullable=True)
    certificate_url = Column(String(500), nullable=True)

    employee = relationship('Employee', back_populates='training_records')
    course = relationship('Course', back_populates='training_records')

    def __repr__(self):
        return f"<TrainingRecord emp={self.employee_id} course={self.course_id}>"


# === Health surveillance ===

class SurveillancePlan(Base):
    """
    Health surveillance plan (e.g. "Videoterminalisti"). Defines only the
    renewal period for fitness certification (in years or months), not
    the type of medical visit. Associated with one or more classifications.
    """
    __tablename__ = 'surveillance_plans'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(String(500), nullable=True)
    # Renewal period: value + unit ('years' | 'months')
    renewal_value = Column(Integer, nullable=False, default=1)
    renewal_unit = Column(String(10), nullable=False, default='years')
    is_active = Column(Boolean, default=True)

    classifications = relationship(
        'JobClassification',
        secondary=plan_classifications,
        back_populates='surveillance_plans',
        lazy='selectin',
    )

    def __repr__(self):
        return f"<SurveillancePlan {self.name} ({self.renewal_value} {self.renewal_unit})>"


class MedicalRecord(Base):
    """
    Employee's current medical fitness record (one per employee). Expiry
    is calculated from the plan linked to their current classification.
    """
    __tablename__ = 'medical_records'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False, unique=True)
    plan_id = Column(Integer, ForeignKey('surveillance_plans.id'), nullable=True)

    visit_date = Column(Date, nullable=False)
    # NULL if the plan has no renewal period
    expiry_date = Column(Date, nullable=True)

    notes = Column(String(1000), nullable=True)

    employee = relationship('Employee', back_populates='medical_record')
    plan = relationship('SurveillancePlan', lazy='joined')

    def __repr__(self):
        return f"<MedicalRecord emp={self.employee_id} visit={self.visit_date}>"


# === History tables (backend only, not currently exposed to the frontend) ===

class ClassificationHistory(Base):
    """
    History of an employee's classification changes over time.
    classification_name is a snapshot: it stays readable even if the
    classification itself is later deleted.
    """
    __tablename__ = 'classification_history'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    classification_id = Column(Integer, ForeignKey('job_classifications.id'), nullable=True)
    classification_name = Column(String(100), nullable=True)

    start_date = Column(Date, nullable=False, default=date.today)
    end_date = Column(Date, nullable=True)  # NULL = current classification
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ClassificationHistory emp={self.employee_id} class={self.classification_name}>"


class MedicalVisitHistory(Base):
    """
    History of every medical visit an employee has had. plan_name is a
    snapshot: it stays readable even if the plan is later deleted.
    """
    __tablename__ = 'medical_visit_history'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    plan_id = Column(Integer, ForeignKey('surveillance_plans.id'), nullable=True)
    plan_name = Column(String(255), nullable=True)

    visit_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    notes = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<MedicalVisitHistory emp={self.employee_id} visit={self.visit_date}>"


# === Alerts ===

class AlertSettings(Base):
    """Per-employee/per-course alert threshold overrides. Not currently
    used by any endpoint: alert thresholds are configured globally via
    config.py / the Impostazioni Alert page. Kept for a possible future
    per-employee or per-course override feature."""
    __tablename__ = 'alert_settings'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=True)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)

    green_threshold = Column(Integer, default=120)
    yellow_threshold = Column(Integer, default=70)
    red_threshold = Column(Integer, default=0)

    email_notifications = Column(Boolean, default=True)
    in_app_notifications = Column(Boolean, default=True)

    def __repr__(self):
        return f"<AlertSettings emp={self.employee_id} course={self.course_id}>"


class AlertStateSnapshot(Base):
    """
    Last known category for a given employee+course combination.
    course_id NULL identifies the employee's medical fitness entry.
    """
    __tablename__ = 'alert_state_snapshots'

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('employees.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)

    # category: missing | expired | critical | expiring_soon | ok
    category = Column(String(30), nullable=False)
    days_remaining = Column(Integer, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AlertStateSnapshot emp={self.employee_id} course={self.course_id} cat={self.category}>"


class AlertRunLog(Base):
    """Log of automatic check runs (prevents sending the summary email
    more than once on the same day)."""
    __tablename__ = 'alert_run_logs'

    id = Column(Integer, primary_key=True, index=True)
    run_date = Column(Date, nullable=False, unique=True)
    changes_detected = Column(Integer, default=0)
    email_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AlertRunLog {self.run_date} changes={self.changes_detected}>"

class ApplicationSettings(Base):
    """
    Single persistent record containing the global application configuration.

    SMTP password is stored encrypted; it is never exposed by API responses.
    """
    __tablename__ = "application_settings"

    id = Column(Integer, primary_key=True, default=1)

    alert_expiring_soon_days = Column(Integer, nullable=False, default=70)
    alert_critical_days = Column(Integer, nullable=False, default=0)
    report_days_threshold = Column(Integer, nullable=False, default=150)

    smtp_host = Column(String(255), nullable=True)
    smtp_port = Column(Integer, nullable=False, default=587)
    smtp_user = Column(String(255), nullable=True)
    smtp_password_encrypted = Column(String(2048), nullable=True)
    smtp_from_email = Column(String(255), nullable=True)
    smtp_from_name = Column(String(255), nullable=False, default="Planning H&S")
    report_recipient_email = Column(String(255), nullable=True)

    daily_check_hour = Column(Integer, nullable=False, default=6)
    daily_check_minute = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )