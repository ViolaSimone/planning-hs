"use client";

// Dropdown button used for every multi-select filter across the app
// (roles, status, courses, visible columns, location...). Previously this
// exact component was duplicated in full in both the Dashboard and the
// Planning page.

interface FilterMenuProps {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  width?: string;
}

export function FilterMenu({ label, count, isOpen, onToggle, children, width = "w-64" }: FilterMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        {label} {count > 0 ? `(${count})` : ""} ▾
      </button>
      {isOpen && (
        <div
          className={`absolute z-30 top-full left-0 mt-2 ${width} max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
