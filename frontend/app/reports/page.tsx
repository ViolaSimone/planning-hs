"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

type ReportView = "courses" | "medical";

interface CourseReportItem {
  course_id: number;
  course_name: string;
  total_employees: number;
  trained_count: number;
  missing_count: number;
  expiring_soon_count: number;
  expired_count: number;
  to_update_count: number;
  compliance_percentage: number;
}

interface MedicalReportItem {
  plan_id: number;
  plan_name: string;
  renewal_value: number;
  renewal_unit: "years" | "months";
  total_employees: number;
  medically_fit_count: number;
  missing_count: number;
  expiring_soon_count: number;
  expired_count: number;
  to_visit_count: number;
  compliance_percentage: number;
}

function getRenewalLabel(value: number, unit: "years" | "months"): string {
  if (unit === "years") {
    return `${value} ${value === 1 ? "anno" : "anni"}`;
  }
  return `${value} ${value === 1 ? "mese" : "mesi"}`;
}

function parseDaysThreshold(raw: string): number {
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

// Piccola icona "i" con tooltip nativo (title), riutilizzata per le colonne
// che meritano una spiegazione più precisa del solo nome.
function InfoTooltip({ text }: { text: string }) {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-slate-300 text-[9px] font-semibold text-slate-500 hover:bg-slate-100"
      title={text}
    >
      i
    </span>
  );
}

export default function ReportsPage() {
  const [activeView, setActiveView] = useState<ReportView>("courses");
  const [courseReport, setCourseReport] = useState<CourseReportItem[]>([]);
  const [medicalReport, setMedicalReport] = useState<MedicalReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daysThresholdInput, setDaysThresholdInput] = useState("150");
  const [showThresholdHelp, setShowThresholdHelp] = useState(false);

  const fetchCourseReport = async () => {
    const threshold = parseDaysThreshold(daysThresholdInput);
    const res = await fetch(`${API_BASE}/api/reports/training?days_threshold=${threshold}`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail ?? `Errore backend: ${res.status}`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error("Il backend non ha restituito un elenco valido per il report corsi.");
    }
    setCourseReport(json);
  };

  const fetchMedicalReport = async () => {
    const threshold = parseDaysThreshold(daysThresholdInput);
    const res = await fetch(`${API_BASE}/api/reports/medical?days_threshold=${threshold}`);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail ?? `Errore backend: ${res.status}`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error("Il backend non ha restituito un elenco valido per il report idoneità mediche.");
    }
    setMedicalReport(json);
  };

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeView === "courses") {
        await fetchCourseReport();
      } else {
        await fetchMedicalReport();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile caricare il report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, daysThresholdInput]);

  const exportCsv = () => {
    const threshold = parseDaysThreshold(daysThresholdInput);
    const endpoint = activeView === "courses" ? "/api/reports/export/csv" : "/api/reports/medical/export/csv";
    window.location.href = `${API_BASE}${endpoint}?days_threshold=${threshold}`;
  };

  const exportExcel = () => {
    const threshold = parseDaysThreshold(daysThresholdInput);
    const endpoint = activeView === "courses" ? "/api/reports/export/excel" : "/api/reports/medical/export/excel";
    window.location.href = `${API_BASE}${endpoint}?days_threshold=${threshold}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Analizza lo stato della formazione e dell&apos;idoneità medica per dipendente.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveView("courses")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeView === "courses"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Report corsi
          </button>
          <button
            onClick={() => setActiveView("medical")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeView === "medical"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Report idoneità mediche
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-end gap-3 border-b border-slate-100 pb-4">
          <label className="block text-sm">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              Finestra giorni per il calcolo delle scadenze
              <span
                className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
                title="Cambia in modo dinamico quali attestati e idoneità mediche vengono considerati 'in scadenza' nel report."
                onMouseEnter={() => setShowThresholdHelp(true)}
                onMouseLeave={() => setShowThresholdHelp(false)}
              >
                i
              </span>
            </span>
            <input
              type="number"
              min="0"
              className="input mt-1 w-56"
              value={daysThresholdInput}
              onChange={(e) => setDaysThresholdInput(e.target.value)}
              placeholder="Giorni entro cui calcolare le scadenze"
            />
            {showThresholdHelp && (
              <span className="mt-1 block text-[11px] text-slate-400">
                Cambia in modo dinamico quali attestati e idoneità mediche vengono considerati "in scadenza".
              </span>
            )}
          </label>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Aggiorna
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Esporta CSV
            </button>
            <button
              onClick={exportExcel}
              className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Esporta Excel
            </button>
          </div>
        </div>

        {activeView === "courses" ? (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold">Report formazione corsi</h3>
              <p className="mt-1 text-xs text-slate-500">
                Ogni corso considera solamente i dipendenti per cui è obbligatorio in base ai ruoli assegnati.
              </p>
            </div>
            <CourseReportTable report={courseReport} loading={loading} error={error} />
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold">Report idoneità mediche</h3>
              <p className="mt-1 text-xs text-slate-500">
                Ogni piano sanitario considera solamente i dipendenti il cui inquadramento è associato al piano.
              </p>
            </div>
            <MedicalReportTable report={medicalReport} loading={loading} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingOrError({ loading, error, colSpan }: { loading: boolean; error: string; colSpan: number }) {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-slate-500">
          Caricamento report…
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-red-600">
          Impossibile caricare il report: {error}
        </td>
      </tr>
    );
  }

  return null;
}

function CourseReportTable({ report, loading, error }: { report: CourseReportItem[]; loading: boolean; error: string }) {
  const placeholder = <LoadingOrError loading={loading} error={error} colSpan={8} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Corso</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Totale dip.</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Formati</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1">
                Da Formare
                <InfoTooltip text="Dipendenti che non hanno ancora l'attestato di questo corso e devono quindi frequentarlo per la prima volta." />
              </span>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">In scadenza</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Scaduti</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1">
                Da aggiornare
                <InfoTooltip text="Totale dipendenti con l'attestato di questo corso in scadenza o già scaduto: serve un rinnovo." />
              </span>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Compliance %</th>
          </tr>
        </thead>
        <tbody>
          {placeholder}
          {!loading && !error && report.map((r) => (
            <tr key={r.course_id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-medium">{r.course_name}</td>
              <td className="px-3 py-2">{r.total_employees}</td>
              <td className="px-3 py-2 text-emerald-700">{r.trained_count}</td>
              {/* Colonna evidenziata in grigio, stessa tonalità dell'header,
                  per distinguere visivamente questo dato lungo tutta la tabella. */}
              <td className="px-3 py-2 bg-slate-50 text-red-600">{r.missing_count}</td>
              <td className="px-3 py-2 text-amber-600">{r.expiring_soon_count}</td>
              <td className="px-3 py-2 text-red-600">{r.expired_count}</td>
              <td className="px-3 py-2 bg-slate-50 font-medium text-orange-600">{r.to_update_count}</td>
              <td className="px-3 py-2 font-medium">{r.compliance_percentage}%</td>
            </tr>
          ))}
          {!loading && !error && report.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                Nessun dato report disponibile.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MedicalReportTable({ report, loading, error }: { report: MedicalReportItem[]; loading: boolean; error: string }) {
  const placeholder = <LoadingOrError loading={loading} error={error} colSpan={9} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Piano sanitario</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Rinnovo</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Totale dip.</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Idonei</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Mancanti</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">In scadenza</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Scaduti</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Tot da Visitare</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Compliance %</th>
          </tr>
        </thead>
        <tbody>
          {placeholder}
          {!loading && !error && report.map((r) => (
            <tr key={r.plan_id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-medium">{r.plan_name}</td>
              <td className="px-3 py-2">{getRenewalLabel(r.renewal_value, r.renewal_unit)}</td>
              <td className="px-3 py-2">{r.total_employees}</td>
              <td className="px-3 py-2 text-emerald-700">{r.medically_fit_count}</td>
              <td className="px-3 py-2 text-red-600">{r.missing_count}</td>
              <td className="px-3 py-2 text-amber-600">{r.expiring_soon_count}</td>
              <td className="px-3 py-2 text-red-600">{r.expired_count}</td>
              {/* Stessa colonna evidenziata in grigio, come nel report Corsi. */}
              <td className="px-3 py-2 bg-slate-50 font-medium text-orange-600">{r.to_visit_count}</td>
              <td className="px-3 py-2 font-medium">{r.compliance_percentage}%</td>
            </tr>
          ))}
          {!loading && !error && report.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                Nessun piano sanitario o dato di idoneità medica disponibile.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
