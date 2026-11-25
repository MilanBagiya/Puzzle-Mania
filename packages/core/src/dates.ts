// Dates are ISO strings 'YYYY-MM-DD' in the player's local time zone.
const pad2 = (n: number): string => String(n).padStart(2, '0');
export const toIso = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const fromIso = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};
export const todayIso = (now: Date = new Date()): string => toIso(now);
export const addDays = (s: string, n: number): string => {
  const d = fromIso(s);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
/** True for a real calendar date written as YYYY-MM-DD (rejects shapes like 2026-1-5 and days like 2026-02-30). */
export const isIsoDate = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && toIso(fromIso(s)) === s;
export const formatDate = (s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }): string =>
  fromIso(s).toLocaleDateString('en-US', opts);
/** m:ss. Rounds to whole seconds and never shows a negative time (e.g. if the device clock moved back). */
export const formatTime = (secs: number): string => {
  const s = Number.isFinite(secs) ? Math.max(0, Math.round(secs)) : 0;
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
};
