"use client";

// Small text input with confirm/cancel actions, used for every editable
// text cell in the Dashboard table (first name, department, email, phone,
// tax code, birth place...). Enter confirms, Escape cancels.

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function InlineEditor({ value, onChange, onSave, onCancel, saving }: InlineEditorProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        className="rounded border border-slate-300 px-1 py-0.5 text-xs w-28"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
