// Session-scoped filter persistence.
//
// Filters and visible-column selections are kept in sessionStorage rather
// than localStorage: they survive navigation between pages during the same
// browser tab session, but are cleared automatically when the tab is
// closed or the app is restarted, which matches how users expect a
// "working session" to behave.
//
// Each page defines its own set of storage keys (they are unrelated to one
// another) and calls these generic helpers to read, write, and clear them.

export function loadFromSession<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveToSession<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage can be unavailable (e.g. private browsing mode).
    // The app should keep working without persistence in that case.
  }
}

/** Removes every key in the given list, e.g. when the user hits "Reset filters". */
export function clearSessionKeys(keys: string[]): void {
  if (typeof window === "undefined") return;
  keys.forEach((key) => window.sessionStorage.removeItem(key));
}
