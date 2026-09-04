"use client";

import { useEffect, useState } from "react";
import { displayToIso, formatDateTyping, isoToDisplay } from "@/lib/dates";

// Labeled "DD/MM/YYYY" text field for forms (Employees create/edit: hire
// date, birth date). Keeps its own local "what the user is currently
// typing" state, separate from the ISO value stored by the parent form, so
// the field can hold an incomplete date while the user is still typing.

interface DateFieldProps {
  label: string;
  isoValue: string;
  onIsoChange: (iso: string) => void;
  required?: boolean;
}

export function DateField({ label, isoValue, onIsoChange, required }: DateFieldProps) {
  const [display, setDisplay] = useState(isoToDisplay(isoValue));

  useEffect(() => {
    setDisplay(isoToDisplay(isoValue));
  }, [isoValue]);

  return (
    <label className="text-sm">
      <span className="block text-slate-700 font-medium mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        className="input"
        type="text"
        inputMode="numeric"
        placeholder="gg/mm/aaaa"
        maxLength={10}
        value={display}
        onChange={(e) => {
          const formatted = formatDateTyping(e.target.value);
          setDisplay(formatted);
          if (formatted === "") {
            onIsoChange("");
            return;
          }
          const iso = displayToIso(formatted);
          if (iso) onIsoChange(iso);
        }}
      />
    </label>
  );
}
