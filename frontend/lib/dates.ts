// Shared date helpers.
//
// The backend always exchanges dates as ISO strings ("YYYY-MM-DD"). These
// helpers cover the two things every page needs to do with that string:
// display it in Italian format, and let the user type/edit it as
// "DD/MM/YYYY" through a plain text input (used for fields such as hire
// date and birth date, where a native <input type="date"> picker was
// intentionally replaced by a masked text field).

/**
 * Formats an ISO date string ("YYYY-MM-DD") as "DD/MM/YYYY" for display.
 * Returns an em dash when the value is missing, so tables can render a
 * consistent placeholder instead of an empty cell.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formats raw keystrokes into a "DD/MM/YYYY" pattern as the user types.
 * Non-digit characters are stripped and slashes are inserted automatically,
 * so the input never needs a native date picker.
 */
export function formatDateTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  let result = day;
  if (month) result += "/" + month;
  if (year) result += "/" + year;
  return result;
}

/**
 * Converts a fully-typed "DD/MM/YYYY" string into an ISO date string.
 * Returns null when the input is incomplete or not a valid calendar date,
 * so callers can distinguish "still typing" from "invalid".
 */
export function displayToIso(display: string): string | null {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const parsed = new Date(iso + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return null;

  return iso;
}

/** Converts an ISO date string into "DD/MM/YYYY" for populating a text input. */
export function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

/**
 * True when the given ISO date string is strictly after today.
 * Used to block saving future completion dates for courses and medical
 * visits, which cannot logically have happened yet.
 */
export function isFutureDate(value: string): boolean {
  if (!value) return false;
  const selected = new Date(value + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected > today;
}
