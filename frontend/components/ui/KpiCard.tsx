"use client";

// KPI summary card used at the top of the Dashboard (Employees total,
// courses in order, expiring, missing/expired, etc.).

interface KpiCardProps {
  label: string;
  value: number;
  color?: string;
  onHelpToggle?: () => void;
  helpNote?: string;
}

export function KpiCard({ label, value, color = "text-slate-800", onHelpToggle, helpNote }: KpiCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {onHelpToggle && (
          <button onClick={onHelpToggle} className="text-slate-300 hover:text-slate-500 text-xs" title="Info">
            ⓘ
          </button>
        )}
      </div>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      {helpNote && <p className="mt-2 text-[11px] text-slate-400">{helpNote}</p>}
    </div>
  );
}
