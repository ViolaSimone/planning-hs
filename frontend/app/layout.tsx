"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { planningCategoryLabel, planningCategoryClass, type PlanningCategory } from "@/lib/categories";
import { StatusBadge } from "@/components/ui/StatusBadge";



const nav = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/employees", label: "Dipendenti", icon: "☺" },
  { href: "/courses", label: "Corsi", icon: "▤" },
  { href: "/surveillance", label: "Sorveglianza", icon: "⚕" },
  { href: "/reports", label: "Report", icon: "▥" },
  { href: "/planning", label: "Pianifica", icon: "▧" },
  { href: "/settings", label: "Impostazioni Alert", icon: "⚙" },
];

interface NotificationAlert {
  employee_id: number;
  employee_name: string;
  employee_email: string | null;
  item_type: "course" | "medical";
  course_id: number | null;
  course_name: string;
  course_code: string;
  category: PlanningCategory;
  days_remaining: number | null;
  expiry_date: string | null;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(true);
  const [count, setCount] = useState(0);
  const [alerts, setAlerts] = useState<NotificationAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const f = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/notifications/summary`);
        const json = await r.json();
        setCount(json.total_alerts || 0);
        setAlerts(json.alerts || []);
      } catch {
// Backend unreachable: the notification bell remains at 0 without blocking the app.
      }
    };
    f();
    const i = setInterval(f, 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <html lang="it">
      <body className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen">
          <aside className={`${open ? "w-56" : "w-14"} bg-slate-900 text-white transition-all`}>
            <div className="p-3 font-bold border-b border-slate-700">
              {open && "Planning H&S"}
              <button className="float-right" onClick={() => setOpen(!open)}>
                ◀
              </button>
            </div>
            <nav>
              {nav.map((n) => (
                <Link
                  className={`block px-3 py-3 text-sm ${path === n.href ? "bg-slate-700" : "hover:bg-slate-800"}`}
                  href={n.href}
                  key={n.href}
                >
                  {n.icon} {open && n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0">
            <header className="h-14 bg-white border-b px-5 flex justify-between items-center font-semibold">
              Planning H&S
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative text-lg leading-none"
                  title="Notifiche"
                >
                  🔔
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-96 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="sticky top-0 border-b border-slate-100 bg-white px-4 py-2">
                        <p className="text-sm font-semibold text-slate-700">
                          Notifiche{count > 0 ? ` (${count})` : ""}
                        </p>
                      </div>
                      {alerts.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-400">
                          Nessuna scadenza da segnalare al momento.
                        </p>
                      ) : (
                        <ul>
                          {alerts.map((alert, index) => (
                            <li
                              key={`${alert.employee_id}_${alert.item_type}_${alert.course_id ?? "medical"}_${index}`}
                              className="border-b border-slate-50 px-4 py-2.5 text-xs hover:bg-slate-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-slate-800">{alert.employee_name}</span>
                                <StatusBadge label={planningCategoryLabel(alert.category)} className={`text-[10px] px-2 py-0.5 ${planningCategoryClass(alert.category)}`} />
                              </div>
                              <p className="mt-0.5 text-slate-500">{alert.course_name}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Scadenza: {formatDate(alert.expiry_date)}
                                {alert.days_remaining !== null && alert.category !== "missing" ? ` · ${alert.days_remaining} gg` : ""}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            </header>
            <section className="p-5">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
