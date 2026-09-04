"use client";

import { useEffect, useMemo, useState } from "react";

import { API_BASE } from "@/lib/api";
import { displayToIso, isFutureDate, isoToDisplay } from "@/lib/dates";
import { getDashboardCategory, type DashboardCategory } from "@/lib/categories";
import { loadFromSession, saveToSession, clearSessionKeys } from "@/lib/storage";

import { KpiCard } from "@/components/ui/KpiCard";
import { DashboardFilterBar, type DashboardOpenMenu } from "@/components/dashboard/DashboardFilterBar";
import { DashboardTable } from "@/components/dashboard/DashboardTable";
import { RolesDropdown } from "@/components/dashboard/RolesDropdown";
import { ClassificationDropdown } from "@/components/dashboard/ClassificationDropdown";
import {
  DEFAULT_COLUMNS,
  type ColumnKey,
  type Classification,
  type CourseColumn,
  type DashboardResponse,
  type EmployeeStatus,
  type SafetyRole,
} from "@/components/dashboard/types";

type KpiMode = "courses" | "medical";

// Filters and visible-column selections persist for the whole browser tab
// session (see lib/storage.ts), so navigating to another page and back
// keeps everything as the user left it. "Reset filtri" and switching KPI
// mode both clear this and return to the defaults below.
const STORAGE_KEYS = {
  search: "dashboard_search",
  selectedRoles: "dashboard_selected_roles",
  selectedCategories: "dashboard_selected_categories",
  selectedCourseIds: "dashboard_selected_course_ids",
  selectedColumns: "dashboard_selected_columns",
  kpiMode: "dashboard_kpi_mode",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [roles, setRoles] = useState<SafetyRole[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(() => loadFromSession(STORAGE_KEYS.search, ""));
  const [selectedRoles, setSelectedRoles] = useState<number[]>(() => loadFromSession(STORAGE_KEYS.selectedRoles, []));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    loadFromSession(STORAGE_KEYS.selectedCategories, [])
  );
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>(() =>
    loadFromSession(STORAGE_KEYS.selectedCourseIds, [])
  );
  const [showThresholdNote, setShowThresholdNote] = useState(false);

  const [openMenu, setOpenMenu] = useState<DashboardOpenMenu>(null);

  // Course completion date editor state.
  const [editingCourseCell, setEditingCourseCell] = useState<{ empId: number; courseId: number } | null>(null);
  const [dateValue, setDateValue] = useState("");

  // Generic text field editor state (job_position, department, email, phone,
  // work_location, tax_code, birth_place, first/last name).
  const [editingField, setEditingField] = useState<{ empId: number; field: string } | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Medical visit date editor state.
  const [editingMedicalCell, setEditingMedicalCell] = useState<number | null>(null);
  const [medicalDateValue, setMedicalDateValue] = useState("");

  // hire_date / birth_date masked editor state.
  const [editingDateField, setEditingDateField] = useState<{ empId: number; field: "hire_date" | "birth_date" } | null>(null);
  const [dateFieldDisplay, setDateFieldDisplay] = useState("");

  // Roles dropdown state.
  const [rolesDropdown, setRolesDropdown] = useState<{ empId: number; x: number; y: number } | null>(null);
  const [tempRoleIds, setTempRoleIds] = useState<number[]>([]);

  // Classification dropdown state.
  const [classificationDropdown, setClassificationDropdown] = useState<{ empId: number; x: number; y: number } | null>(null);
  const [tempClassificationId, setTempClassificationId] = useState<number | null>(null);

  const [kpiMode, setKpiMode] = useState<KpiMode>(() => loadFromSession(STORAGE_KEYS.kpiMode, "courses"));
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(() =>
    loadFromSession(STORAGE_KEYS.selectedColumns, DEFAULT_COLUMNS)
  );
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("csv");

  const fetchData = async () => {
    try {
      const [dashRes, rolesRes, classificationsRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/status`),
        fetch(`${API_BASE}/api/safety-roles`),
        fetch(`${API_BASE}/api/classifications`),
      ]);
      setData(await dashRes.json());
      setRoles(await rolesRes.json());
      setClassifications(await classificationsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => saveToSession(STORAGE_KEYS.search, search), [search]);
  useEffect(() => saveToSession(STORAGE_KEYS.selectedRoles, selectedRoles), [selectedRoles]);
  useEffect(() => saveToSession(STORAGE_KEYS.selectedCategories, selectedCategories), [selectedCategories]);
  useEffect(() => saveToSession(STORAGE_KEYS.selectedCourseIds, selectedCourseIds), [selectedCourseIds]);
  useEffect(() => saveToSession(STORAGE_KEYS.selectedColumns, selectedColumns), [selectedColumns]);
  useEffect(() => saveToSession(STORAGE_KEYS.kpiMode, kpiMode), [kpiMode]);

  const allSafetyRoleNames = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.employees.forEach((e) => e.safety_roles.forEach((r) => set.add(r)));
    return Array.from(set);
  }, [data]);

  const allCourses = useMemo<CourseColumn[]>(() => {
    if (!data) return [];
    const map = new Map<number, CourseColumn>();
    data.employees.forEach((emp) =>
      emp.courses.forEach((c) => {
        if (!map.has(c.course_id)) {
          map.set(c.course_id, { course_id: c.course_id, course_code: c.course_code, course_name: c.course_name, display_order: c.display_order });
        }
      })
    );
    return Array.from(map.values()).sort((a, b) => a.display_order - b.display_order || a.course_id - b.course_id);
  }, [data]);

  const courseColumns = useMemo(() => {
    if (selectedCourseIds.length === 0) return allCourses;
    return allCourses.filter((c) => selectedCourseIds.includes(c.course_id));
  }, [allCourses, selectedCourseIds]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];
    return data.employees.filter((emp) => {
      const matchSearch = !search || emp.employee_name.toLowerCase().includes(search.toLowerCase());
      const matchRole = selectedRoles.length === 0 || selectedRoles.some((roleId) => emp.safety_role_ids.includes(roleId));
      const relevantCourses = selectedCourseIds.length === 0
        ? emp.courses
        : emp.courses.filter((course) => selectedCourseIds.includes(course.course_id));
      const empCats = relevantCourses.map(getDashboardCategory);

      const medCat: DashboardCategory = emp.medical ? getDashboardCategory(emp.medical) : "ok";
      const allCats = kpiMode === "medical" ? [medCat] : empCats;
      const matchCategory = selectedCategories.length === 0 || selectedCategories.some((cat) => allCats.includes(cat as DashboardCategory));
      return matchSearch && matchRole && matchCategory;
    });
  }, [data, search, selectedRoles, selectedCategories, selectedCourseIds, kpiMode]);

  const counts = useMemo(() => {
    const c = { missing: 0, expired: 0, expiring_soon: 0, ok: 0 };
    filteredEmployees.forEach((emp) => {
      if (kpiMode === "medical") {
        if (emp.medical && emp.medical.requires_surveillance) c[getDashboardCategory(emp.medical)]++;
      } else {
        const relevantCourses = selectedCourseIds.length === 0
          ? emp.courses
          : emp.courses.filter((course) => selectedCourseIds.includes(course.course_id));
        relevantCourses.forEach((course) => c[getDashboardCategory(course)]++);
      }
    });
    return c;
  }, [filteredEmployees, kpiMode, selectedCourseIds]);


  // --- Course date editor: save, delete, confirm with Enter ---
  const openCourseEditor = (empId: number, courseId: number, currentDate: string | null) => {
    setEditingCourseCell({ empId, courseId });
    setDateValue(currentDate ?? "");
  };

  const saveCourseDate = async () => {
    if (!editingCourseCell || !dateValue) return;

    if (isFutureDate(dateValue)) {
      alert("La data del corso non può essere successiva a oggi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${editingCourseCell.empId}/training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: editingCourseCell.empId, course_id: editingCourseCell.courseId, completion_date: dateValue }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(`Errore salvataggio: ${err?.detail ?? res.statusText}`);
        return;
      }
      await fetchData();
      setEditingCourseCell(null);
      setDateValue("");
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCourseDate = async (empId: number, courseId: number) => {
    if (!confirm("Cancellare la data di questo corso? L'operazione non è reversibile.")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${empId}/training/${courseId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Errore durante la cancellazione.");
        return;
      }
      await fetchData();
      setEditingCourseCell(null);
    } catch {
      alert("Errore di rete durante la cancellazione.");
    } finally {
      setSaving(false);
    }
  };

  // --- Medical visit editor: save, delete, confirm with Enter ---
  const openMedicalEditor = (empId: number, currentDate: string | null) => {
    setEditingMedicalCell(empId);
    setMedicalDateValue(currentDate ?? "");
  };

  const saveMedicalDate = async () => {
    if (!editingMedicalCell || !medicalDateValue) return;

    if (isFutureDate(medicalDateValue)) {
      alert("La data dell'idoneità medica non può essere successiva a oggi.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${editingMedicalCell}/medical`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_date: medicalDateValue }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(`Errore salvataggio idoneità medica: ${err?.detail ?? res.statusText}`);
        return;
      }
      await fetchData();
      setEditingMedicalCell(null);
      setMedicalDateValue("");
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMedicalDate = async (empId: number) => {
    if (!confirm("Cancellare la data dell'ultima idoneità medica? L'operazione non è reversibile.")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${empId}/medical`, { method: "DELETE" });
      if (!res.ok) {
        alert("Errore durante la cancellazione.");
        return;
      }
      await fetchData();
      setEditingMedicalCell(null);
    } catch {
      alert("Errore di rete durante la cancellazione.");
    } finally {
      setSaving(false);
    }
  };

  // --- Generic text field editor ---
  const openFieldEditor = (empId: number, field: string, currentValue: string) => {
    setEditingField({ empId, field });
    setFieldValue(currentValue);
  };

  const saveField = async () => {
    if (!editingField) return;
    setSaving(true);
    try {
      const url = `${API_BASE}/api/employees/${editingField.empId}/field?field=${editingField.field}&value=${encodeURIComponent(fieldValue)}`;
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(`Errore salvataggio campo: ${err?.detail ?? res.statusText}`);
        return;
      }
      await fetchData();
      setEditingField(null);
      setFieldValue("");
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  // --- hire_date / birth_date editor (gg/mm/aaaa) ---
  const openDateFieldEditor = (empId: number, field: "hire_date" | "birth_date", currentIso: string | null) => {
    setEditingDateField({ empId, field });
    setDateFieldDisplay(isoToDisplay(currentIso));
  };

  const saveDateField = async () => {
    if (!editingDateField) return;
    const iso = displayToIso(dateFieldDisplay);
    if (!iso) {
      alert("Inserisci una data valida nel formato gg/mm/aaaa.");
      return;
    }
    setSaving(true);
    try {
      const url = `${API_BASE}/api/employees/${editingDateField.empId}/field?field=${editingDateField.field}&value=${encodeURIComponent(iso)}`;
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(`Errore salvataggio campo: ${err?.detail ?? res.statusText}`);
        return;
      }
      await fetchData();
      setEditingDateField(null);
      setDateFieldDisplay("");
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  // --- Roles dropdown ---
  const openRolesDropdown = (emp: EmployeeStatus, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRolesDropdown({ empId: emp.employee_id, x: rect.left, y: rect.bottom + 4 });
    setTempRoleIds(emp.safety_role_ids);
  };

  const toggleTempRole = (roleId: number) => {
    setTempRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  const saveRolesDropdown = async () => {
    if (!rolesDropdown) return;
    if (tempRoleIds.length === 0) {
      alert("Un dipendente deve avere almeno un ruolo.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${rolesDropdown.empId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ safety_role_ids: tempRoleIds }),
      });
      if (!res.ok) {
        alert("Errore salvataggio ruoli");
        return;
      }
      await fetchData();
      setRolesDropdown(null);
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  // --- Classification dropdown ---
  const openClassificationDropdown = (emp: EmployeeStatus, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setClassificationDropdown({ empId: emp.employee_id, x: rect.left, y: rect.bottom + 4 });
    setTempClassificationId(emp.classification_id);
  };

  // Single-select: clicking the currently selected classification again clears it.
  const selectTempClassification = (classificationId: number) => {
    setTempClassificationId((prev) => (prev === classificationId ? null : classificationId));
  };

  const saveClassificationDropdown = async () => {
    if (!classificationDropdown) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/employees/${classificationDropdown.empId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classification_id: tempClassificationId }),
      });
      if (!res.ok) {
        alert("Errore salvataggio inquadramento");
        return;
      }
      await fetchData();
      setClassificationDropdown(null);
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  // --- Export ---
  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_ids: filteredEmployees.map((e) => e.employee_id),
          course_ids: courseColumns.map((c) => c.course_id),
          columns: selectedColumns,
          format: exportFormat,
        }),
      });
      if (!res.ok) {
        alert("Errore durante l'export");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard_export.${exportFormat === "excel" ? "xlsx" : "csv"}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Errore di rete durante l'export.");
    } finally {
      setExporting(false);
    }
  };

  const resetAllFilters = () => {
    setSearch("");
    setSelectedRoles([]);
    setSelectedCategories([]);
    setSelectedCourseIds([]);
    setSelectedColumns(DEFAULT_COLUMNS);
    setOpenMenu(null);
    clearSessionKeys(Object.values(STORAGE_KEYS));
  };

  if (loading || !data) return <div className="text-sm text-slate-500">Caricamento dashboard…</div>;

  const expiringSoonThresholdDays = data.thresholds.expiring_soon_days;

  return (
    <div className="space-y-5" onClick={() => openMenu && setOpenMenu(null)}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setKpiMode("courses")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${kpiMode === "courses" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"}`}
        >
          Panoramica Corsi
        </button>
        <button
          onClick={() => setKpiMode("medical")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${kpiMode === "medical" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"}`}
        >
          Panoramica Idoneità medica
        </button>
      </div>

      <div className={`grid grid-cols-2 gap-3 ${kpiMode === "medical" ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
        <KpiCard label="Dipendenti totali" value={data.total_employees} />
        <KpiCard label={kpiMode === "medical" ? "Idoneità in regola" : "Corsi in regola"} value={counts.ok} color="text-emerald-600" />
        <KpiCard
          label={kpiMode === "medical" ? "Idoneità in scadenza" : "Corsi in scadenza"}
          value={counts.expiring_soon}
          color="text-amber-600"
          onHelpToggle={() => setShowThresholdNote(!showThresholdNote)}
          helpNote={
            showThresholdNote
              ? `Una voce è "in scadenza" quando restano ${expiringSoonThresholdDays} giorni o meno alla data di rinnovo (valore configurabile in Impostazioni). Il conteggio è per singola voce, non per dipendente.`
              : undefined
          }
        />
        <KpiCard
          label={kpiMode === "medical" ? "Idoneità mancanti/scadute" : "Corsi mancanti"}
          value={kpiMode === "medical" ? counts.missing + counts.expired : counts.missing}
          color="text-red-600"
        />
        {kpiMode === "courses" && <KpiCard label="Da aggiornare/Scaduti" value={counts.expired} color="text-orange-600" />}
      </div>

      <DashboardFilterBar
        search={search}
        onSearchChange={setSearch}
        allSafetyRoleNames={allSafetyRoleNames}
        roles={roles}
        selectedRoles={selectedRoles}
        onSelectedRolesChange={setSelectedRoles}
        selectedCategories={selectedCategories}
        onSelectedCategoriesChange={setSelectedCategories}
        allCourses={allCourses}
        selectedCourseIds={selectedCourseIds}
        onSelectedCourseIdsChange={setSelectedCourseIds}
        selectedColumns={selectedColumns}
        onSelectedColumnsChange={setSelectedColumns}
        defaultColumnsCount={DEFAULT_COLUMNS.length}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onExport={handleExport}
        exporting={exporting}
        onResetFilters={resetAllFilters}
        openMenu={openMenu}
        onOpenMenuChange={setOpenMenu}
      />

      <DashboardTable
        employees={filteredEmployees}
        selectedColumns={selectedColumns}
        courseColumns={courseColumns}
        saving={saving}
        editingField={editingField}
        fieldValue={fieldValue}
        onFieldValueChange={setFieldValue}
        onOpenFieldEditor={openFieldEditor}
        onSaveField={saveField}
        onCancelFieldEditor={() => setEditingField(null)}
        editingDateField={editingDateField}
        dateFieldDisplay={dateFieldDisplay}
        onDateFieldDisplayChange={setDateFieldDisplay}
        onOpenDateFieldEditor={openDateFieldEditor}
        onSaveDateField={saveDateField}
        onCancelDateFieldEditor={() => setEditingDateField(null)}
        editingCourseCell={editingCourseCell}
        dateValue={dateValue}
        onDateValueChange={setDateValue}
        onOpenCourseEditor={openCourseEditor}
        onSaveCourseDate={saveCourseDate}
        onCancelCourseEditor={() => setEditingCourseCell(null)}
        onDeleteCourseDate={deleteCourseDate}
        editingMedicalCell={editingMedicalCell}
        medicalDateValue={medicalDateValue}
        onMedicalDateValueChange={setMedicalDateValue}
        onOpenMedicalEditor={openMedicalEditor}
        onSaveMedicalDate={saveMedicalDate}
        onCancelMedicalEditor={() => setEditingMedicalCell(null)}
        onDeleteMedicalDate={deleteMedicalDate}
        onOpenRolesDropdown={openRolesDropdown}
        onOpenClassificationDropdown={openClassificationDropdown}
      />

      {rolesDropdown && (
        <RolesDropdown
          position={{ x: rolesDropdown.x, y: rolesDropdown.y }}
          roles={roles}
          selectedRoleIds={tempRoleIds}
          onToggleRole={toggleTempRole}
          onSave={saveRolesDropdown}
          onCancel={() => setRolesDropdown(null)}
          saving={saving}
        />
      )}

      {classificationDropdown && (
        <ClassificationDropdown
          position={{ x: classificationDropdown.x, y: classificationDropdown.y }}
          classifications={classifications}
          selectedClassificationId={tempClassificationId}
          onSelect={selectTempClassification}
          onSave={saveClassificationDropdown}
          onCancel={() => setClassificationDropdown(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
