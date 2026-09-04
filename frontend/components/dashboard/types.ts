// Shared types and constants for the Dashboard feature.

import type { CourseStatus } from "@/lib/categories";

export type ColumnKey =
  | "first_name"
  | "last_name"
  | "job_position"
  | "classification"
  | "department"
  | "email"
  | "phone"
  | "hire_date"
  | "work_location"
  | "tax_code"
  | "birth_date"
  | "birth_place"
  | "medical"
  | "roles"
  | "courses";

export interface CourseDetail {
  course_id: number;
  course_name: string;
  course_code: string;
  renewal_years: number;
  display_order: number;
  completion_date: string | null;
  expiry_date: string | null;
  days_remaining: number | null;
  status: CourseStatus;
  is_mandatory: boolean;
}

export interface MedicalStatus {
  plan_id: number | null;
  plan_name: string | null;
  renewal_value: number | null;
  renewal_unit: string | null;
  visit_date: string | null;
  expiry_date: string | null;
  days_remaining: number | null;
  status: CourseStatus;
  requires_surveillance: boolean;
}

export interface EmployeeStatus {
  employee_id: number;
  employee_name: string;
  employee_email: string | null;
  department: string | null;
  job_position: string | null;
  classification_id: number | null;
  classification_name: string | null;
  safety_roles: string[];
  safety_role_ids: number[];
  phone: string | null;
  hire_date: string | null;
  work_location: string | null;
  tax_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
  courses: CourseDetail[];
  medical: MedicalStatus | null;
  overall_status: CourseStatus;
}

export interface DashboardResponse {
  total_employees: number;
  employees: EmployeeStatus[];
  thresholds: {
    expiring_soon_days: number;
    critical_days: number;
  };
}

export interface SafetyRole {
  id: number;
  name: string;
}

export interface Classification {
  id: number;
  name: string;
}

export interface CourseColumn {
  course_id: number;
  course_code: string;
  course_name: string;
  display_order: number;
}

// The Courses toggle controls the complete group of dynamic course columns.
// It is enabled by default so the Dashboard initially matches the existing
// behavior, while users who only need employee data can hide every course
// column with a single checkbox.
export const DEFAULT_COLUMNS: ColumnKey[] = [
  "first_name",
  "last_name",
  "roles",
  "medical",
  "courses",
];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  first_name: "Nome",
  last_name: "Cognome",
  job_position: "Posizione lavorativa",
  classification: "Inquadramento",
  department: "Reparto",
  email: "Email",
  phone: "Telefono",
  hire_date: "Data assunzione",
  work_location: "Sede",
  tax_code: "Codice Fiscale",
  birth_date: "Data di nascita",
  birth_place: "Luogo di nascita",
  medical: "Idoneità medica",
  roles: "Ruoli",
  courses: "Corsi",
};

export const FIRST_NAME_WIDTH = 100;
export const LAST_NAME_WIDTH = 110;
