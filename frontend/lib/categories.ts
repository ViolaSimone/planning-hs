// Shared status/category helpers.
//
// IMPORTANT: this file intentionally exports TWO separate category systems,
// not one. They look similar (same four-ish string values) but represent
// different things and must not be merged:
//
// - DashboardCategory ("missing" | "expired" | "expiring_soon" | "ok"):
//   used by the Dashboard to answer "is this course/medical record fine or
//   not", derived directly from days_remaining and the raw green/yellow/red
//   status. It has an explicit "ok" value.
//
// - PlanningCategory ("missing" | "expired" | "critical" | "expiring_soon"):
//   used by Planning and by the notification bell, where "critical" is a
//   distinct, more urgent state than a generic "expiring_soon" and there is
//   no "ok" value (only non-compliant records are shown in those views in
//   the first place).
//
// Collapsing these into a single shared type would silently change the
// meaning of "critical" vs "expiring_soon" in one of the two views.

// Raw status computed by the backend's alert engine (maps to badge colors).
export type CourseStatus = "green" | "yellow" | "red" | "missing";

// --- Dashboard category -----------------------------------------------

export type DashboardCategory = "missing" | "expired" | "expiring_soon" | "ok";

interface DashboardCategorySource {
  status: CourseStatus;
  days_remaining: number | null;
  // Only present on course records; absent (undefined) on medical records.
  renewal_years?: number;
  // Only present on medical records; absent (undefined) on course records.
  requires_surveillance?: boolean;
}

/**
 * Derives the Dashboard-level category from a course or medical status
 * object.
 *
 * The "missing" check MUST run first: a course with no renewal (e.g.
 * Sicurezza Generale, renewal_years === 0) or a medical record that does
 * not require surveillance should still show as "missing" when the
 * employee has never completed it. Checking the no-renewal/no-surveillance
 * shortcut before the "missing" check would make those records look
 * permanently "ok" even when nothing has ever been recorded.
 */
export function getDashboardCategory(item: DashboardCategorySource): DashboardCategory {
  const isMedicalRecord = item.requires_surveillance !== undefined;

  if (item.status === "missing") return "missing";
  if (isMedicalRecord && !item.requires_surveillance) return "ok";
  if (!isMedicalRecord && item.renewal_years === 0) return "ok";
  if (item.days_remaining != null && item.days_remaining < 0) return "expired";
  if (item.status === "red" || item.status === "yellow") return "expiring_soon";
  return "ok";
}

export function dashboardCategoryLabel(category: DashboardCategory): string {
  switch (category) {
    case "missing":
      return "Mancante";
    case "expired":
      return "Scaduto";
    case "expiring_soon":
      return "In scadenza";
    default:
      return "In regola";
  }
}

export function dashboardCategoryBadgeClasses(category: DashboardCategory): string {
  switch (category) {
    case "missing":
      return "bg-slate-200 text-slate-700 border border-slate-300";
    case "expired":
      return "bg-red-100 text-red-700 border border-red-200";
    case "expiring_soon":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
}

// --- Planning / notifications category ---------------------------------

export type PlanningCategory = "missing" | "expired" | "critical" | "expiring_soon";

export function planningCategoryLabel(category: PlanningCategory): string {
  switch (category) {
    case "missing":
      return "Mancante";
    case "expired":
      return "Scaduto";
    case "critical":
      return "Critico";
    default:
      return "In scadenza";
  }
}

export function planningCategoryClass(category: PlanningCategory): string {
  switch (category) {
    case "missing":
      return "bg-slate-200 text-slate-700 border border-slate-300";
    case "expired":
      return "bg-red-100 text-red-700 border border-red-200";
    case "critical":
      return "bg-orange-100 text-orange-700 border border-orange-200";
    default:
      return "bg-amber-100 text-amber-700 border border-amber-200";
  }
}
