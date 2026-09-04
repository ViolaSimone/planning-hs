"use client";

import { formatDateTyping } from "@/lib/dates";

// Compact "DD/MM/YYYY" editor with confirm/cancel actions, used for
// editable date cells in a table row (Dashboard: hire date, birth date).
// Unlike DateField (form context), this component does not resolve the ISO
// value itself: the parent owns the raw typed text and decides when it is
// a valid, complete date worth saving (see saveDateField in the Dashboard
// page), so Enter can be pressed at any point without this component
// needing to know whether the date is valid yet.

interface InlineDateEditorProps {
  display: string;
  onDisplayChange: (display: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function InlineDateEditor({ display, onDisplayChange, onSave, onCancel, saving }: InlineDateEditorProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        placeholder="gg/mm/aaaa"
        maxLength={10}
        className="rounded border border-slate-300 px-1 py-0.5 text-xs w-24"
        value={display}
        onChange={(e) => onDisplayChange(formatDateTyping(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
      />
      <button onClick={onSave} disabled={saving} className="text-emerald-600 hover:underline text-xs px-1" title="Confirm (Enter)">
        ✓
      </button>
      <button onClick={onCancel} className="text-slate-400 hover:underline text-xs px-1">
        ✕
      </button>
    </div>
  );
}
