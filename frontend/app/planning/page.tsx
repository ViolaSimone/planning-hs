"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { planningCategoryLabel, planningCategoryClass, type PlanningCategory } from "@/lib/categories";
import { loadFromSession, saveToSession, clearSessionKeys } from "@/lib/storage";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { StatusBadge } from "@/components/ui/StatusBadge";


type PlanningMode = "courses" | "medical";
type CoursePlanningFilter = "training" | "refresh";

type PlanningColumnKey =
  | "classification"
  | "department"
  | "job_position"
  | "work_location"
  | "email"
  | "phone"
  | "hire_date"
  | "tax_code"
  | "birth_date"
  | "birth_place"
  | "roles"
  | "event_date"
  | "expiry_date"
  | "status";

const PLANNING_COLUMN_ORDER: PlanningColumnKey[] = [
  "classification",
  "department",
  "job_position",
  "work_location",
  "email",
  "phone",
  "hire_date",
  "tax_code",
  "birth_date",
  "birth_place",
  "roles",
  "event_date",
  "expiry_date",
  "status",
];

const PLANNING_COLUMN_LABELS: Record<PlanningColumnKey, string> = {
  classification: "Inquadramento",
  department: "Reparto",
  job_position: "Posizione lavorativa",
  work_location: "Sede",
  email: "Email",
  phone: "Telefono",
  hire_date: "Data assunzione",
  tax_code: "Codice Fiscale",
  birth_date: "Data di nascita",
  birth_place: "Luogo di nascita",
  roles: "Ruoli",
  event_date: "Data corso/visita",
  expiry_date: "Data rinnovo",
  status: "Stato",
};

const DEFAULT_PLANNING_COLUMNS: PlanningColumnKey[] = [
  "classification",
  "department",
  "roles",
  "event_date",
  "expiry_date",
  "status",
];

const STORAGE_KEYS = {
  columns: "planning_visible_columns",
  locations: "planning_selected_locations",
  courseFilters: "planning_course_filters",
};

interface Course {
  id: number;
  name: string;
  code: string;
  renewal_years: number;
}

interface MedicalPlan {
  id: number;
  name: string;
  renewal_value: number;
  renewal_unit: "years" | "months";
}

interface PlanningEmployee {
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_name: string;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  work_location: string | null;
  department: string | null;
  job_position: string | null;
  tax_code: string | null;
  birth_date: string | null;
  birth_place: string | null;
  classification_name: string | null;
  safety_roles?: string[];
  course_name?: string;
  course_code?: string;
  plan_name?: string;
  completion_date?: string | null;
  visit_date?: string | null;
  expiry_date: string | null;
  days_remaining: number | null;
  category: PlanningCategory;
}

interface PlanningResponse {
  type: "course" | "medical";
  item: {
    id: number;
    name: string;
    code?: string;
    renewal_value?: number;
    renewal_unit?: "years" | "months";
  };
  total_candidates: number;
  employees: PlanningEmployee[];
}

function columnLabel(key: PlanningColumnKey, mode: PlanningMode): string {
  if (key === "event_date") return mode === "courses" ? "Data corso" : "Ultima visita";
  return PLANNING_COLUMN_LABELS[key];
}

function renderPlanningCell(employee: PlanningEmployee, key: PlanningColumnKey, mode: PlanningMode): React.ReactNode {
  switch (key) {
    case "classification":
      return employee.classification_name || "—";
    case "department":
      return employee.department || "—";
    case "job_position":
      return employee.job_position || "—";
    case "work_location":
      return employee.work_location || "—";
    case "email":
      return employee.email || "—";
    case "phone":
      return employee.phone || "—";
    case "hire_date":
      return formatDate(employee.hire_date);
    case "tax_code":
      return employee.tax_code || "—";
    case "birth_date":
      return formatDate(employee.birth_date);
    case "birth_place":
      return employee.birth_place || "—";
    case "roles":
      return employee.safety_roles?.join(", ") || "—";
    case "event_date":
      return mode === "courses" ? formatDate(employee.completion_date) : formatDate(employee.visit_date);
    case "expiry_date":
      return formatDate(employee.expiry_date);
    case "status":
  return (
        <StatusBadge
          label={planningCategoryLabel(employee.category)}
          className={planningCategoryClass(employee.category)}
          suffix={employee.days_remaining !== null && employee.category !== "missing" ? ` · ${employee.days_remaining} gg` : ""}
        />
     );
    default:
      return "—";
  }
}

export default function PlanningPage() {
  const [mode, setMode] = useState<PlanningMode>("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<MedicalPlan[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState<PlanningResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

  const [selectedColumns, setSelectedColumns] = useState<PlanningColumnKey[]>(() =>
    loadFromSession(STORAGE_KEYS.columns, DEFAULT_PLANNING_COLUMNS)
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(() =>
    loadFromSession(STORAGE_KEYS.locations, [])
  );
  const [coursePlanningFilters, setCoursePlanningFilters] = useState<CoursePlanningFilter[]>(() =>
    loadFromSession(STORAGE_KEYS.courseFilters, [])
  );

  const [openMenu, setOpenMenu] = useState<"columns" | "location" | "courseFilters" | null>(null);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [coursesRes, plansRes] = await Promise.all([
        fetch(`${API_BASE}/api/courses`),
        fetch(`${API_BASE}/api/surveillance-plans`),
      ]);
      if (!coursesRes.ok || !plansRes.ok) throw new Error("Impossibile caricare corsi o piani sanitari.");
      setCourses(await coursesRes.json());
      setPlans(await plansRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il caricamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => saveToSession(STORAGE_KEYS.columns, selectedColumns), [selectedColumns]);
  useEffect(() => saveToSession(STORAGE_KEYS.locations, selectedLocations), [selectedLocations]);
  useEffect(() => saveToSession(STORAGE_KEYS.courseFilters, coursePlanningFilters), [coursePlanningFilters]);

  const switchMode = (nextMode: PlanningMode) => {
    setMode(nextMode);
    setSelectedId("");
    setData(null);
    setError("");
    setSelectedColumns(DEFAULT_PLANNING_COLUMNS);
    setSelectedLocations([]);
    setCoursePlanningFilters([]);
    setOpenMenu(null);
    clearSessionKeys(Object.values(STORAGE_KEYS));
  };

  const loadCandidates = async (id: string) => {
    setSelectedId(id);
    setData(null);
    setError("");
    setOpenMenu(null);
    if (!id) return;

    setLoadingCandidates(true);
    try {
      const endpoint = mode === "courses"
        ? `${API_BASE}/api/planning/courses/${id}`
        : `${API_BASE}/api/planning/medical-plans/${id}`;
      const response = await fetch(endpoint);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail || "Impossibile caricare i dipendenti da pianificare.");
      }
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il caricamento.");
    } finally {
      setLoadingCandidates(false);
    }
  };

  const selectedPlan = plans.find((plan) => plan.id === Number(selectedId));
  const selectedCourse = courses.find((course) => course.id === Number(selectedId));

  const shouldShowCoursePlanningFilters = mode === "courses" && !!selectedCourse && selectedCourse.renewal_years > 0;

  const availableColumnKeys = useMemo<PlanningColumnKey[]>(() => {
    return mode === "courses" ? PLANNING_COLUMN_ORDER : PLANNING_COLUMN_ORDER.filter((key) => key !== "roles");
  }, [mode]);

  const isColumnVisible = (key: PlanningColumnKey) =>
    availableColumnKeys.includes(key) && selectedColumns.includes(key);

  const visibleColumns = useMemo(
    () => PLANNING_COLUMN_ORDER.filter((key) => isColumnVisible(key)),
    [selectedColumns, availableColumnKeys]
  );

  const allLocations = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.employees.forEach((emp) => {
      if (emp.work_location) set.add(emp.work_location);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "it"));
  }, [data]);

  const filteredEmployees = useMemo(() => {
    if (!data) return [];

    return data.employees.filter((emp) => {
      const matchesLocation = selectedLocations.length === 0 || (
        !!emp.work_location && selectedLocations.includes(emp.work_location)
      );
      if (!matchesLocation) return false;

      if (!shouldShowCoursePlanningFilters || coursePlanningFilters.length === 0) return true;

      const matchesTraining = coursePlanningFilters.includes("training") && emp.category === "missing";
      const matchesRefresh = coursePlanningFilters.includes("refresh") && (
        emp.category === "expired" || emp.category === "critical" || emp.category === "expiring_soon"
      );

      return matchesTraining || matchesRefresh;
    });
  }, [data, selectedLocations, coursePlanningFilters, shouldShowCoursePlanningFilters]);

  const toggleCoursePlanningFilter = (filter: CoursePlanningFilter) => {
    setCoursePlanningFilters((current) => (
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter]
    ));
  };

  const resetPlanningFilters = () => {
    setSelectedColumns(DEFAULT_PLANNING_COLUMNS);
    setSelectedLocations([]);
    setCoursePlanningFilters([]);
    setOpenMenu(null);
    clearSessionKeys(Object.values(STORAGE_KEYS));
  };

  const exportFile = async (format: "csv" | "excel") => {
    if (!selectedId) return;
    setExporting(format);

    try {
      const endpoint = mode === "courses"
        ? `${API_BASE}/api/planning/courses/${selectedId}/export`
        : `${API_BASE}/api/planning/medical-plans/${selectedId}/export`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_ids: filteredEmployees.map((employee) => employee.employee_id),
          visible_fields: visibleColumns,
          locations: selectedLocations,
          format,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail || "Errore durante l'export.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pianifica_${mode}.${format === "excel" ? "xlsx" : "csv"}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore di rete durante l'export.");
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Caricamento Pianifica…</div>;

  const totalColSpan = 2 + visibleColumns.length;
  const hasModifiedFilters =
    selectedColumns.length !== DEFAULT_PLANNING_COLUMNS.length ||
    selectedLocations.length > 0 ||
    coursePlanningFilters.length > 0;

  return (
    <div className="space-y-5" onClick={() => openMenu && setOpenMenu(null)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pianifica</h2>
          <p className="text-xs text-slate-500">
            Individua rapidamente le persone per cui pianificare corsi e visite mediche.
          </p>
        </div>
        {data && (
          <div className="flex gap-2">
            <button
              onClick={() => exportFile("excel")}
              disabled={exporting !== null}
              className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {exporting === "excel" ? "Export Excel…" : "Esporta Excel"}
            </button>
            <button
              onClick={() => exportFile("csv")}
              disabled={exporting !== null}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {exporting === "csv" ? "Export CSV…" : "Esporta CSV"}
            </button>
          </div>
        )}
      </div>

      <div className="inline-flex rounded-lg bg-slate-200 p-1">
        <button
          onClick={() => switchMode("courses")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            mode === "courses" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pianifica Corsi
        </button>
        <button
          onClick={() => switchMode("medical")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            mode === "medical" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Pianifica Visite Mediche
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid items-end gap-4 md:grid-cols-[minmax(0,420px)_1fr]">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              {mode === "courses" ? "Seleziona un corso" : "Seleziona un piano sanitario"}
            </span>
            <select
              className="input"
              value={selectedId}
              onChange={(event) => loadCandidates(event.target.value)}
            >
              <option value="">
                {mode === "courses" ? "— Seleziona corso —" : "— Seleziona piano sanitario —"}
              </option>
              {mode === "courses"
                ? courses.map((course) => {
                    const normalizedName = course.name.trim().toLowerCase();
                    const normalizedCode = course.code.trim().toLowerCase();
                    const codeAlreadyInName =
                      normalizedName === normalizedCode ||
                      normalizedName.includes(`(${normalizedCode})`);

                    return (
                      <option key={course.id} value={course.id}>
                        {codeAlreadyInName ? course.name : `${course.name} (${course.code})`}
                      </option>
                    );
                  })
                : plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — rinnovo ogni {plan.renewal_value} {plan.renewal_unit === "years" ? "anni" : "mesi"}
                    </option>
                  ))}
            </select>
          </label>

          <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-600">
            {mode === "courses" ? (
              <p>
                Verranno mostrati soltanto i dipendenti per cui il corso selezionato è obbligatorio e risulta <strong>mancante, scaduto o in scadenza</strong>.
              </p>
            ) : (
              <p>
                Verranno mostrati soltanto i dipendenti associati al piano sanitario selezionato con idoneità <strong>mancante, scaduta o in scadenza</strong>.
              </p>
            )}
          </div>
        </div>
      </div>

      {loadingCandidates && (
        <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-500 shadow-sm">Caricamento dipendenti da pianificare…</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {data && !loadingCandidates && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">
                {data.item.name}
                {mode === "courses" && data.item.code ? <span className="ml-2 font-mono text-xs font-normal text-slate-400">{data.item.code}</span> : null}
              </h3>
              {mode === "medical" && selectedPlan && (
                <p className="mt-1 text-xs text-slate-500">
                  Rinnovo pianificato ogni {selectedPlan.renewal_value} {selectedPlan.renewal_unit === "years" ? "anni" : "mesi"}
                </p>
              )}
              {mode === "courses" && selectedCourse && selectedCourse.renewal_years > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Rinnovo pianificato ogni {selectedCourse.renewal_years} {selectedCourse.renewal_years === 1 ? "anno" : "anni"}
                </p>
              )}
            </div>
            <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {filteredEmployees.length} {filteredEmployees.length === 1 ? "persona da pianificare" : "persone da pianificare"}
              {(selectedLocations.length > 0 || coursePlanningFilters.length > 0) && (
                <span className="ml-1 font-normal text-slate-400">(su {data.total_candidates} totali)</span>
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div className="mb-4 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <FilterMenu
              label="Campi visibili"
              count={selectedColumns.length !== DEFAULT_PLANNING_COLUMNS.length ? selectedColumns.length : 0}
              isOpen={openMenu === "columns"}
              onToggle={() => setOpenMenu(openMenu === "columns" ? null : "columns")}
              width="w-56"
            >
              {availableColumnKeys.map((key) => (
                <label key={key} className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedColumns([...selectedColumns, key]);
                      else setSelectedColumns(selectedColumns.filter((c) => c !== key));
                    }}
                  />
                  {columnLabel(key, mode)}
                </label>
              ))}
            </FilterMenu>

            <FilterMenu
              label="Sede"
              count={selectedLocations.length}
              isOpen={openMenu === "location"}
              onToggle={() => setOpenMenu(openMenu === "location" ? null : "location")}
              width="w-56"
            >
              {allLocations.length === 0 && (
                <p className="px-1 py-1 text-xs text-slate-400">Nessuna sede impostata per questi dipendenti.</p>
              )}
              {allLocations.map((location) => (
                <label key={location} className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(location)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedLocations([...selectedLocations, location]);
                      else setSelectedLocations(selectedLocations.filter((l) => l !== location));
                    }}
                  />
                  {location}
                </label>
              ))}
            </FilterMenu>

            {/* Menu */}
            {shouldShowCoursePlanningFilters && (
              <FilterMenu
                label="Tipo pianificazione"
                count={coursePlanningFilters.length}
                isOpen={openMenu === "courseFilters"}
                onToggle={() => setOpenMenu(openMenu === "courseFilters" ? null : "courseFilters")}
                width="w-56"
              >
                <label className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={coursePlanningFilters.includes("training")}
                    onChange={() => toggleCoursePlanningFilter("training")}
                  />
                  Formazione
                </label>
                <p className="px-1 pb-1 text-[11px] text-slate-400">Dipendenti senza attestato</p>
                <label className="flex items-center gap-2 rounded px-1 py-1 text-xs cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={coursePlanningFilters.includes("refresh")}
                    onChange={() => toggleCoursePlanningFilter("refresh")}
                  />
                  Aggiornamento
                </label>
                <p className="px-1 text-[11px] text-slate-400">Attestati scaduti o in scadenza</p>
              </FilterMenu>
            )}

            {hasModifiedFilters && (
              <button onClick={resetPlanningFilters} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Reset filtri
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Nome</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Cognome</th>
                  {visibleColumns.map((key) => (
                    <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                      {columnLabel(key, mode)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{employee.first_name}</td>
                    <td className="px-3 py-2">{employee.last_name}</td>
                    {visibleColumns.map((key) => (
                      <td key={key} className="px-3 py-2">
                        {renderPlanningCell(employee, key, mode)}
                      </td>
                    ))}
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={totalColSpan} className="px-3 py-8 text-center text-sm text-slate-400">
                      {data.employees.length === 0
                        ? "Tutti i dipendenti associati sono in regola per l'elemento selezionato. Nessuna pianificazione necessaria."
                        : shouldShowCoursePlanningFilters && coursePlanningFilters.length > 0
                        ? "Nessun dipendente corrisponde al tipo di pianificazione selezionato."
                        : "Nessun dipendente corrisponde al filtro Sede selezionato."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
