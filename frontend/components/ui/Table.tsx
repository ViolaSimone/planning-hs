"use client";

import type { CSSProperties, ReactNode } from "react";

// Table header/cell primitives used by the Dashboard's employee table,
// where columns can be "sticky" (Name/Surname stay visible while scrolling
// horizontally through course columns).

interface ThProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Th({ children, className = "", style }: ThProps) {
  return (
    <th className={`px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap ${className}`} style={style}>
      {children}
    </th>
  );
}

interface TdProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Td({ children, className = "", style }: TdProps) {
  return (
    <td className={`px-3 py-2 ${className}`} style={style}>
      {children}
    </td>
  );
}
