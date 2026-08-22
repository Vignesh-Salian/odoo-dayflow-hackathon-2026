/**
 * App "today" helpers. Honors VITE_DEMO_TODAY (YYYY-MM-DD) for weekend demos.
 * Unset / empty → real UTC calendar date.
 */
function overrideKey(): string | null {
  const raw = import.meta.env.VITE_DEMO_TODAY;
  if (typeof raw !== "string") return null;
  const v = raw.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** YYYY-MM-DD (UTC) for attendance "today". */
export function todayKey(): string {
  return overrideKey() ?? new Date().toISOString().slice(0, 10);
}

/** Date object for the app's "today" (UTC midnight). */
export function todayDate(): Date {
  return new Date(`${todayKey()}T00:00:00.000Z`);
}

/** Month (1–12) and year for the app's "today". */
export function todayMonthYear(): { month: number; year: number } {
  const d = todayDate();
  return { month: d.getUTCMonth() + 1, year: d.getUTCFullYear() };
}
