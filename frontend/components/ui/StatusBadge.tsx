"use client";

// Non-interactive colored pill used to display a compliance category
// (Planning's "Stato" column, the notification bell's alert list). For the
// Dashboard's clickable course/medical badges, which need onClick handling
// and richer content (arrows between two dates), use the raw classes from
// lib/categories.ts directly on a <button> instead of this component.

interface StatusBadgeProps {
  label: string;
  className: string;
  suffix?: string;
}

export function StatusBadge({ label, className, suffix }: StatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {label}
      {suffix ? suffix : ""}
    </span>
  );
}
