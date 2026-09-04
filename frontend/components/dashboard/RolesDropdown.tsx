"use client";

import type { SafetyRole } from "./types";

// Floating multi-select panel for editing an employee's safety roles,
// opened by clicking the "N ruoli ▾" button in the Dashboard table.

interface RolesDropdownProps {
  position: { x: number; y: number };
  roles: SafetyRole[];
  selectedRoleIds: number[];
  onToggleRole: (roleId: number) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function RolesDropdown({ position, roles, selectedRoleIds, onToggleRole, onSave, onCancel, saving }: RolesDropdownProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div
        className="fixed z-50 bg-white border border-slate-300 rounded-md shadow-lg p-2 w-56"
        style={{ top: position.y, left: position.x }}
      >
        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Ruoli assegnati</p>
        {roles.map((role) => (
          <label key={role.id} className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer hover:bg-slate-50 rounded px-1">
            <input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => onToggleRole(role.id)} />
            {role.name}
          </label>
        ))}
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
