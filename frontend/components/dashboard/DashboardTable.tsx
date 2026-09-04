"use client";

import { Th, Td } from "@/components/ui/Table";
import { InlineEditor } from "@/components/ui/InlineEditor";
import { InlineDateEditor } from "@/components/ui/InlineDateEditor";
import { formatDate } from "@/lib/dates";
import { getDashboardCategory, dashboardCategoryBadgeClasses, dashboardCategoryLabel } from "@/lib/categories";
import { COLUMN_LABELS, FIRST_NAME_WIDTH, LAST_NAME_WIDTH, type ColumnKey, type CourseColumn, type EmployeeStatus } from "./types";

interface FieldEditorState {
  empId: number;
  field: string;
}

interface DateEditorState {
  empId: number;
  field: "hire_date" | "birth_date";
}

interface CourseEditorState {
  empId: number;
  courseId: number;
}

interface DashboardTableProps {
  employees: EmployeeStatus[];
  selectedColumns: ColumnKey[];
  courseColumns: CourseColumn[];
  saving: boolean;
  editingField: FieldEditorState | null;
  fieldValue: string;
  onFieldValueChange: (value: string) => void;
  onOpenFieldEditor: (empId: number, field: string, currentValue: string) => void;
  onSaveField: () => void;
  onCancelFieldEditor: () => void;
  editingDateField: DateEditorState | null;
  dateFieldDisplay: string;
  onDateFieldDisplayChange: (display: string) => void;
  onOpenDateFieldEditor: (empId: number, field: "hire_date" | "birth_date", currentIso: string | null) => void;
  onSaveDateField: () => void;
  onCancelDateFieldEditor: () => void;
  editingCourseCell: CourseEditorState | null;
  dateValue: string;
  onDateValueChange: (value: string) => void;
  onOpenCourseEditor: (empId: number, courseId: number, currentDate: string | null) => void;
  onSaveCourseDate: () => void;
  onCancelCourseEditor: () => void;
  onDeleteCourseDate: (empId: number, courseId: number) => void;
  editingMedicalCell: number | null;
  medicalDateValue: string;
  onMedicalDateValueChange: (value: string) => void;
  onOpenMedicalEditor: (empId: number, currentDate: string | null) => void;
  onSaveMedicalDate: () => void;
  onCancelMedicalEditor: () => void;
  onDeleteMedicalDate: (empId: number) => void;
  onOpenRolesDropdown: (emp: EmployeeStatus, e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenClassificationDropdown: (emp: EmployeeStatus, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function DashboardTable({
  employees,
  selectedColumns,
  courseColumns,
  saving,
  editingField,
  fieldValue,
  onFieldValueChange,
  onOpenFieldEditor,
  onSaveField,
  onCancelFieldEditor,
  editingDateField,
  dateFieldDisplay,
  onDateFieldDisplayChange,
  onOpenDateFieldEditor,
  onSaveDateField,
  onCancelDateFieldEditor,
  editingCourseCell,
  dateValue,
  onDateValueChange,
  onOpenCourseEditor,
  onSaveCourseDate,
  onCancelCourseEditor,
  onDeleteCourseDate,
  editingMedicalCell,
  medicalDateValue,
  onMedicalDateValueChange,
  onOpenMedicalEditor,
  onSaveMedicalDate,
  onCancelMedicalEditor,
  onDeleteMedicalDate,
  onOpenRolesDropdown,
  onOpenClassificationDropdown,
}: DashboardTableProps) {
  const showFirstName = selectedColumns.includes("first_name");
  const showCourseColumns = selectedColumns.includes("courses");
  const visibleEmployeeColumns = selectedColumns.filter((column) => column !== "courses");
  const tableColumnCount = visibleEmployeeColumns.length + (showCourseColumns ? courseColumns.length : 0);

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Database formazione dipendenti</h3>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          Clicca su un valore per modificarlo direttamente
          {showCourseColumns && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">scorri per vedere altri corsi →</span>
            </>
          )}
        </p>
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-260px)] border border-slate-100 rounded-md">
        <table className="text-xs" style={{ borderCollapse: "separate" }}>
          <thead>
            <tr className="border-b border-slate-200">
              {visibleEmployeeColumns.map((col) => {
                const isFirst = col === "first_name";
                const isLast = col === "last_name";
                const stickyStyle = isFirst
                  ? { position: "sticky" as const, left: 0, width: FIRST_NAME_WIDTH, minWidth: FIRST_NAME_WIDTH, zIndex: 20 }
                  : isLast
                  ? { position: "sticky" as const, left: showFirstName ? FIRST_NAME_WIDTH : 0, width: LAST_NAME_WIDTH, minWidth: LAST_NAME_WIDTH, zIndex: 20 }
                  : {};

                return (
                  <Th
                    key={col}
                    className={isFirst || isLast ? "bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]" : "bg-slate-50"}
                    style={stickyStyle}
                  >
                    {COLUMN_LABELS[col]}
                  </Th>
                );
              })}
              {showCourseColumns && courseColumns.map((course) => (
                <Th key={course.course_id} className="bg-slate-50">
                  {course.course_code}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, rowIdx) => {
              const rowBg = rowIdx % 2 === 0 ? "#ffffff" : "#f8fafc";

              return (
                <tr key={emp.employee_id} className="border-t border-slate-100 hover:bg-slate-100" style={{ backgroundColor: rowBg }}>
                  {visibleEmployeeColumns.map((col) => {
                    const isFirst = col === "first_name";
                    const isLast = col === "last_name";
                    const stickyStyle = isFirst
                      ? { position: "sticky" as const, left: 0, width: FIRST_NAME_WIDTH, minWidth: FIRST_NAME_WIDTH, zIndex: 5, backgroundColor: rowBg }
                      : isLast
                      ? { position: "sticky" as const, left: showFirstName ? FIRST_NAME_WIDTH : 0, width: LAST_NAME_WIDTH, minWidth: LAST_NAME_WIDTH, zIndex: 5, backgroundColor: rowBg }
                      : {};
                    const stickyClass = isFirst || isLast ? "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]" : "";

                    if (col === "first_name") {
                      return (
                        <Td key={col} className={`whitespace-nowrap ${stickyClass}`} style={stickyStyle}>
                          {editingField?.empId === emp.employee_id && editingField.field === "first_name" ? (
                            <InlineEditor value={fieldValue} onChange={onFieldValueChange} onSave={onSaveField} onCancel={onCancelFieldEditor} saving={saving} />
                          ) : (
                            <button className="font-medium text-slate-800 hover:underline text-left" onClick={() => onOpenFieldEditor(emp.employee_id, "first_name", emp.employee_name.split(" ")[0])} title="Clicca per modificare">
                              {emp.employee_name.split(" ")[0]}
                            </button>
                          )}
                        </Td>
                      );
                    }

                    if (col === "last_name") {
                      return (
                        <Td key={col} className={`whitespace-nowrap ${stickyClass}`} style={stickyStyle}>
                          {editingField?.empId === emp.employee_id && editingField.field === "last_name" ? (
                            <InlineEditor value={fieldValue} onChange={onFieldValueChange} onSave={onSaveField} onCancel={onCancelFieldEditor} saving={saving} />
                          ) : (
                            <button className="hover:underline text-left" onClick={() => onOpenFieldEditor(emp.employee_id, "last_name", emp.employee_name.split(" ").slice(1).join(" "))} title="Clicca per modificare">
                              {emp.employee_name.split(" ").slice(1).join(" ")}
                            </button>
                          )}
                        </Td>
                      );
                    }

                    if (isGenericTextColumn(col)) {
                      const currentValue = genericTextValue(emp, col);
                      return (
                        <Td key={col} className="whitespace-nowrap">
                          {editingField?.empId === emp.employee_id && editingField.field === col ? (
                            <InlineEditor value={fieldValue} onChange={onFieldValueChange} onSave={onSaveField} onCancel={onCancelFieldEditor} saving={saving} />
                          ) : (
                            <button className="hover:underline text-left" onClick={() => onOpenFieldEditor(emp.employee_id, col, currentValue ?? "")} title="Clicca per modificare">
                              {currentValue || "—"}
                            </button>
                          )}
                        </Td>
                      );
                    }

                    if (col === "classification") {
                      return (
                        <Td key={col} className="whitespace-nowrap">
                          <button
                            onClick={(e) => onOpenClassificationDropdown(emp, e)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                            title="Clicca per modificare l'inquadramento"
                          >
                            {emp.classification_name || "—"} ▾
                          </button>
                        </Td>
                      );
                    }

                    if (col === "hire_date" || col === "birth_date") {
                      const isEditingDate = editingDateField?.empId === emp.employee_id && editingDateField.field === col;
                      const currentIso = col === "hire_date" ? emp.hire_date : emp.birth_date;

                      return (
                        <Td key={col} className="whitespace-nowrap">
                          {isEditingDate ? (
                            <InlineDateEditor
                              display={dateFieldDisplay}
                              onDisplayChange={onDateFieldDisplayChange}
                              onSave={onSaveDateField}
                              onCancel={onCancelDateFieldEditor}
                              saving={saving}
                            />
                          ) : (
                            <button className="hover:underline text-left" onClick={() => onOpenDateFieldEditor(emp.employee_id, col, currentIso)} title="Clicca per modificare">
                              {formatDate(currentIso)}
                            </button>
                          )}
                        </Td>
                      );
                    }

                    if (col === "medical") {
                      const medical = emp.medical;
                      const category = medical ? getDashboardCategory(medical) : "ok";
                      const isEditingMedical = editingMedicalCell === emp.employee_id;

                      return (
                        <Td key={col} className="whitespace-nowrap">
                          {isEditingMedical ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                                value={medicalDateValue}
                                onChange={(e) => onMedicalDateValueChange(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") onSaveMedicalDate();
                                  if (e.key === "Escape") onCancelMedicalEditor();
                                }}
                                autoFocus
                              />
                              <button onClick={onSaveMedicalDate} disabled={saving} className="text-emerald-600 hover:underline text-xs px-1" title="Confermare (Invio)">
                                ✓
                              </button>
                              {medical?.visit_date && (
                                <button onClick={() => onDeleteMedicalDate(emp.employee_id)} disabled={saving} className="text-red-500 hover:underline text-xs px-1" title="Cancella data">
                                  🗑
                                </button>
                              )}
                              <button onClick={onCancelMedicalEditor} className="text-slate-400 hover:underline text-xs px-1">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenMedicalEditor(emp.employee_id, medical?.visit_date ?? null)}
                              className={`px-2 py-1 rounded-md text-[11px] font-medium ${dashboardCategoryBadgeClasses(category)} hover:opacity-80`}
                              title={medical?.requires_surveillance ? `${dashboardCategoryLabel(category)} — Clicca per inserire/modificare la data della visita` : "Clicca per registrare una visita"}
                            >
                              {medical?.visit_date ? formatDate(medical.visit_date) : "—"}
                              {medical?.requires_surveillance && medical.expiry_date && (
                                <>
                                  <span className="mx-1 opacity-70">→</span>
                                  <span>{formatDate(medical.expiry_date)}</span>
                                </>
                              )}
                            </button>
                          )}
                        </Td>
                      );
                    }

                    if (col === "roles") {
                      return (
                        <Td key={col} className="whitespace-nowrap">
                          <button
                            onClick={(e) => onOpenRolesDropdown(emp, e)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                            title="Clicca per vedere e modificare i ruoli"
                          >
                            {emp.safety_roles.length} {emp.safety_roles.length === 1 ? "ruolo" : "ruoli"} ▾
                          </button>
                        </Td>
                      );
                    }

                    return null;
                  })}

                  {showCourseColumns && courseColumns.map((courseColumn) => {
                    const course = emp.courses.find((item) => item.course_id === courseColumn.course_id);
                    if (!course) return <Td key={courseColumn.course_id} />;

                    const category = getDashboardCategory(course);
                    const isEditing = editingCourseCell?.empId === emp.employee_id && editingCourseCell?.courseId === course.course_id;
                    const hasRenewal = course.renewal_years > 0;

                    return (
                      <Td key={course.course_id} className="whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              className="rounded border border-slate-300 px-1 py-0.5 text-xs"
                              value={dateValue}
                              onChange={(e) => onDateValueChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onSaveCourseDate();
                                if (e.key === "Escape") onCancelCourseEditor();
                              }}
                              autoFocus
                            />
                            <button onClick={onSaveCourseDate} disabled={saving} className="text-emerald-600 hover:underline text-xs px-1" title="Confermare (Invio)">
                              ✓
                            </button>
                            {course.completion_date && (
                              <button onClick={() => onDeleteCourseDate(emp.employee_id, course.course_id)} disabled={saving} className="text-red-500 hover:underline text-xs px-1" title="Cancella data">
                                🗑
                              </button>
                            )}
                            <button onClick={onCancelCourseEditor} className="text-slate-400 hover:underline text-xs px-1">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenCourseEditor(emp.employee_id, course.course_id, course.completion_date)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${dashboardCategoryBadgeClasses(category)} hover:opacity-80`}
                            title={hasRenewal ? `${dashboardCategoryLabel(category)} — Clicca per inserire/modificare la data del corso` : "Corso senza rinnovo — Clicca per inserire la data del corso"}
                          >
                            <span>{course.completion_date ? formatDate(course.completion_date) : "—"}</span>
                            {hasRenewal && (
                              <>
                                <span className="mx-1 opacity-70">→</span>
                                <span>{course.expiry_date ? formatDate(course.expiry_date) : "—"}</span>
                              </>
                            )}
                          </button>
                        )}
                      </Td>
                    );
                  })}
                </tr>
              );
            })}
            {employees.length === 0 && (
              <tr>
                <td colSpan={Math.max(tableColumnCount, 1)} className="px-3 py-6 text-center text-slate-400 text-xs">
                  Nessun dipendente soddisfa i filtri correnti, oppure non hai ancora inserito dipendenti.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const GENERIC_TEXT_COLUMNS: ColumnKey[] = [
  "job_position",
  "department",
  "email",
  "phone",
  "work_location",
  "tax_code",
  "birth_place",
];

function isGenericTextColumn(column: ColumnKey): boolean {
  return GENERIC_TEXT_COLUMNS.includes(column);
}

function genericTextValue(employee: EmployeeStatus, column: ColumnKey): string | null {
  switch (column) {
    case "job_position":
      return employee.job_position;
    case "department":
      return employee.department;
    case "email":
      return employee.employee_email;
    case "phone":
      return employee.phone;
    case "work_location":
      return employee.work_location;
    case "tax_code":
      return employee.tax_code;
    case "birth_place":
      return employee.birth_place;
    default:
      return null;
  }
}
