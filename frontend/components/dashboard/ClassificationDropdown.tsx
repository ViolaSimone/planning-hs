"use client";

import type { Classification } from "./types";

// Floating single-select panel for editing an employee's classification.
// Unlike RolesDropdown, only one checkbox can be active: clicking the
// currently selected classification again clears it (no classification).

interface ClassificationDropdownProps {
  position: { x: number; y: number };
  classifications: Classification[];
  selectedClassificationId: number | null;
  onSelect: (classificationId: number) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function ClassificationDropdown({
  position,
  classifications,
  selectedClassificationId,
  onSelect,
  onSave,
  onCancel,
  saving,
}: ClassificationDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div
        className="fixed z-50 bg-white border border-slate-300 rounded-md shadow-lg p-2 w-56"
        style={{ top: position.y, left: position.x }}
      >
        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Inquadramento (selezione singola)</p>
        {classifications.map((classification) => (
          <label key={classification.id} className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer hover:bg-slate-50 rounded px-1">
            <input
              type="checkbox"
              checked={selectedClassificationId === classification.id}
              onChange={() => onSelect(classification.id)}
            />
            {classification.name}
          </label>
        ))}
        {classifications.length === 0 && <p className="text-xs text-slate-400 px-1 py-1">Nessun inquadramento creato.</p>}
        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
          <button onClick={onSave} disabled={saving} className="text-emerald-600 text-xs hover:underline">
            Salva
          </button>
          <button onClick={onCancel} className="text-slate-400 text-xs hover:underline">
            Annulla
          </button>
        </div>
      </div>
    </>
  );
}
