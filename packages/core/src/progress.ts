// Player progress lives only on the device (localStorage). The server stores nothing personal.
import { addDays, fromIso, toIso } from './dates.js';

export type LevelId = 'morning' | 'noon' | 'night';
export const LEVELS: readonly LevelId[] = ['morning', 'noon', 'night'];
export const LEVEL_NAME: Record<LevelId, string> = { morning: 'Morning', noon: 'Noon', night: 'Night' };
export const LEVEL_NOTE: Record<LevelId, string> = {
  morning: '2 animals, about 1–2 minutes',
  noon: '3 animals, about 3–5 minutes',
  night: 'The hardest, about 8–12 minutes',
};

/** Every daily game. The Daily Set is the first five; the rest are bonus games. */
export type GameKey = LevelId | 'nests' | 'dawn' | 'stones' | 'rings';
export const DAILY_SET: readonly GameKey[] = ['morning', 'noon', 'night', 'nests', 'dawn'];
export const BONUS: readonly GameKey[] = ['stones', 'rings'];
export interface GameInfo { name: string; href: string; note: string; par: number }
export const GAMES: Record<GameKey, GameInfo> = {
  morning: { name: 'Fresh Snow · Morning', href: '/fresh-snow?level=morning', note: LEVEL_NOTE.morning, par: 90 },
  noon: { name: 'Fresh Snow · Noon', href: '/fresh-snow?level=noon', note: LEVEL_NOTE.noon, par: 240 },
  night: { name: 'Fresh Snow · Night', href: '/fresh-snow?level=night', note: LEVEL_NOTE.night, par: 600 },
  nests: { name: 'Nests', href: '/nests', note: 'Find the hidden nests, about 2–4 minutes', par: 240 },
  dawn: { name: 'Dawn Chorus', href: '/dawn-chorus', note: 'Order the birds, about 1–3 minutes', par: 120 },
  stones: { name: 'Stepping Stones', href: '/stepping-stones', note: 'Get the frog across, about 1–4 minutes', par: 150 },
  rings: { name: 'Mushroom Rings', href: '/mushroom-rings', note: 'Find the spore, about 1 minute', par: 60 },
};

/** live = played on its own day (only live results count toward streaks; archive play doesn't). */
export interface GameResult { time: number; hints: number; stars: number; moves?: number; live?: boolean }
export type DayRecord = Partial<Record<GameKey, GameResult>>;
export type Theme = 'auto' | 'light' | 'dark';
export interface Progress {
  days: Record<string, DayRecord>;
  trek?: Record<string, GameResult>;
  badges?: string[];
  theme?: Theme;
  tutorialDone?: boolean;
  tutorialSeen?: boolean;
}
export const STORAGE_KEY = 'wilddaily:v1';

export function loadProgress(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Progress {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Progress) : { days: {} };
    if (!data.days || typeof data.days !== 'object') data.days = {};
    // v1 stored Dawn Chorus as { at }; upgrade it to a normal result.
    for (const d of Object.values(data.days)) { const x = d.dawn as unknown as { at?: number; time?: number } | undefined; if (x && x.time === undefined) d.dawn = { time: 0, hints: 0, stars: 2 }; }
    return data;
  } catch {
    return { days: {} };
  }
}
export function saveProgress(p: Progress, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* storage full or blocked: keep progress for this visit */ }
}
function safeStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

/** 3 paws: no hints and within par. 2 paws: at most one hint (or a bit slow). 1 paw: solved. */
export function starsFor(time: number, hints: number, par: number): number {
  if (hints === 0 && time <= par) return 3;
  if (hints <= 1 && time <= par * 2) return 2;
  return 1;
}

export const gameDone = (p: Progress, d: string, g: GameKey): boolean => !!p.days[d]?.[g];
export const levelDone = (p: Progress, d: string, l: LevelId): boolean => gameDone(p, d, l);
export const solvedCount = (p: Progress, d: string): number => LEVELS.filter((l) => levelDone(p, d, l)).length;
export const dawnDone = (p: Progress, d: string): boolean => gameDone(p, d, 'dawn');
export const setCount = (p: Progress, d: string): number => DAILY_SET.filter((g) => gameDone(p, d, g)).length;
export const playedDay = (p: Progress, d: string): boolean => Object.keys(p.days[d] ?? {}).length > 0;
export const daysPlayed = (p: Progress): number => Object.keys(p.days).filter((d) => playedDay(p, d)).length;
export const nextLevel = (p: Progress, d: string): LevelId | undefined => LEVELS.find((l) => !levelDone(p, d, l));
export const nextInSet = (p: Progress, d: string): GameKey | undefined => DAILY_SET.find((g) => !gameDone(p, d, g));

const weekKey = (iso: string): string => { const d = fromIso(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toIso(d); };

export interface StreakInfo { current: number; best: number; snowDays: string[] }
/**
 * Streak with Snow Days: one missed day per calendar week (Mon–Sun) is forgiven automatically,
 * as long as the days on both sides were played. Today never breaks a streak before it ends.
 */
export function streakInfo(p: Progress, today: string): StreakInfo {
  const played = (d: string): boolean => Object.values(p.days[d] ?? {}).some((r) => r && r.live !== false);
  const walk = (end: string): { len: number; snow: string[] } => {
    let d = end, len = 0;
    const snow: string[] = [], usedWeeks = new Set<string>();
    for (;;) {
      if (played(d)) { len++; d = addDays(d, -1); continue; }
      const prev = addDays(d, -1);
      if (len > 0 && played(prev) && !usedWeeks.has(weekKey(d))) { usedWeeks.add(weekKey(d)); snow.push(d); d = prev; continue; }
      break;
    }
    return { len, snow };
  };
  const start = played(today) ? today : addDays(today, -1);
  const cur = walk(start);
  let best = cur.len;
  const dates = Object.keys(p.days).filter(played).sort();
  for (const d of dates) { if (played(addDays(d, 1))) continue; best = Math.max(best, walk(d).len); }
  return { current: cur.len, best, snowDays: cur.snow };
}
export const streak = (p: Progress, today: string): number => streakInfo(p, today).current;

/** Record a daily result; keeps the best one. Returns whether this was the first play of that day. */
export function recordGame(p: Progress, d: string, g: GameKey, r: Omit<GameResult, 'stars'> & { stars?: number }): { firstPlayOfDay: boolean; result: GameResult } {
  const firstPlayOfDay = !playedDay(p, d);
  const result: GameResult = { ...r, stars: r.stars ?? starsFor(r.time, r.hints, GAMES[g].par) };
  const day = (p.days[d] ??= {});
  const prev = day[g];
  if (prev?.live) result.live = true; // a day once played live stays live
  if (!prev || result.stars > prev.stars || (result.stars === prev.stars && result.time < prev.time)) day[g] = result;
  else if (result.live && !prev.live) prev.live = true;
  return { firstPlayOfDay, result };
}
export const recordLevel = (p: Progress, d: string, l: LevelId, r: { time: number; hints: number }): { firstPlayOfDay: boolean; result: GameResult } => recordGame(p, d, l, r);
export const recordDawn = (p: Progress, d: string, r: { time: number; hints: number }): { firstPlayOfDay: boolean; result: GameResult } => recordGame(p, d, 'dawn', r);

/** Trail Trek: stages unlock one at a time. */
export const TREK_PAR: Record<number, number> = { 5: 90, 6: 240, 7: 600 };
export const trekUnlocked = (p: Progress): number => { let s = 1; while (p.trek?.[String(s)]) s++; return s; };
export function recordTrek(p: Progress, stage: number, n: number, r: { time: number; hints: number }): GameResult {
  const result: GameResult = { ...r, stars: starsFor(r.time, r.hints, TREK_PAR[n] ?? 240) };
  const t = (p.trek ??= {}), prev = t[String(stage)];
  if (!prev || result.stars > prev.stars || (result.stars === prev.stars && result.time < prev.time)) t[String(stage)] = result;
  return result;
}
export const trekStars = (p: Progress): number => Object.values(p.trek ?? {}).reduce((s, r) => s + r.stars, 0);

/** Milliseconds until the next local midnight (when fresh snow falls). */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
export function formatCountdown(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000)), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
