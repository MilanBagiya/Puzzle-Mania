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

/** The 20 games in the game pack (/play/<id>). */
export const PACK_META = [
  ['frog-pond', 'Frog Pond', 240, 'summer'], ['firefly-night', 'Firefly Night', 300, 'summer'], ['owl-watch', 'Owl Watch', 240, 'winter'], ['acorn-stash', 'Acorn Stash', 240, 'autumn'],
  ['beehive', 'Beehive', 300, 'spring'], ['beaver-lodges', 'Beaver Lodges', 300, 'summer'], ['snow-picture', 'Snow Picture', 420, 'winter'], ['otter-slide', 'Otter Slide', 150, 'summer'],
  ['moose-crossing', 'Moose Crossing', 120, 'winter'], ['burrow-escape', 'Burrow Escape', 240, 'winter'], ['salmon-run', 'Salmon Run', 120, 'autumn'], ['bears-last-snack', 'Bear’s Last Snack', 240, 'autumn'],
  ['who-ate', 'Who Ate the Berries?', 300, 'any'], ['freshest-track', 'Freshest Track', 150, 'winter'], ['egg-match', 'Egg Match', 180, 'spring'], ['track-word', 'Track Word', 180, 'any'],
  ['whose-print', 'Whose Print?', 90, 'any'], ['feather-pairs', 'Feather Pairs', 120, 'spring'], ['leaf-pile', 'Leaf Pile', 150, 'autumn'], ['who-was-here', 'Who Was Here?', 90, 'any'],
  ['nut-sort', 'Nut Sort', 180, 'autumn'],
  ['vine-links', 'Vine Links', 200, 'spring'],
  ['spot-the-change', 'Spot the Change', 120, 'any'],
  ['berry-match', 'Berry Match', 180, 'summer'],
  ['acorn-thief', 'Acorn Thief', 150, 'any'],
] as const;
export type PackKey = (typeof PACK_META)[number][0];
export const PACK_KEYS: readonly PackKey[] = PACK_META.map((m) => m[0]);
/** Every daily game. The Daily Set is the first five; stones and rings are bonus games; the pack adds 20 more. */
export type GameKey = LevelId | 'nests' | 'dawn' | 'stones' | 'rings' | PackKey;
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
  ...(Object.fromEntries(PACK_META.map(([id, name, par]) => [id, { name, href: `/play/${id}`, note: 'Daily puzzle', par }])) as Record<PackKey, GameInfo>),
};
export type PackSeason = (typeof PACK_META)[number][3];
export const packSeason = (k: PackKey): PackSeason => PACK_META.find((m) => m[0] === k)![3];
/**
 * Three pack games featured each day (the same for everyone in a hemisphere), to keep variety fresh.
 * With a season, the first pick is always a game that belongs to that season.
 */
export function todaysPicks(date: string, count = 3, season?: 'spring' | 'summer' | 'autumn' | 'winter'): PackKey[] {
  let h = 2166136261;
  for (const ch of date) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const keys = PACK_KEYS.slice();
  for (let i = keys.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; const j = h % (i + 1); [keys[i], keys[j]] = [keys[j]!, keys[i]!]; }
  if (season) {
    const k = keys.findIndex((x) => packSeason(x) === season);
    if (k > 0) { const [g] = keys.splice(k, 1); keys.unshift(g!); }
  }
  return keys.slice(0, count);
}

/** live = played on its own day (only live results count toward streaks; archive play doesn't). */
export interface GameResult { time: number; hints: number; stars: number; moves?: number; live?: boolean }
export type DayRecord = Partial<Record<GameKey, GameResult>>;
export type Theme = 'auto' | 'light' | 'dark';
export interface Progress {
  days: Record<string, DayRecord>;
  trek?: Record<string, GameResult>;
  badges?: string[];
  theme?: Theme;
  /** 'auto' follows the calendar; a season forces that look. */
  season?: 'auto' | 'spring' | 'summer' | 'autumn' | 'winter';
  hemisphere?: 'auto' | 'north' | 'south';
  /** Sound effects and vibration: both off unless the player turns them on. */
  sound?: boolean;
  vibrate?: boolean;
  tutorialDone?: boolean;
  tutorialSeen?: boolean;
}
export const STORAGE_KEY = 'wilddaily:v1';

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isResult = (r: unknown): r is GameResult => isObj(r) && isNum(r.time) && isNum(r.hints) && isNum(r.stars);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Read saved progress. A damaged entry (one bad day, one bad result) is dropped on its own,
 * so it can never cost the player the rest of their history.
 */
export function loadProgress(storage: Pick<Storage, 'getItem'> | null = safeStorage()): Progress {
  let data: Record<string, unknown>;
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    data = isObj(parsed) ? parsed : {};
  } catch {
    return { days: {} };
  }
  const days: Progress['days'] = {};
  if (isObj(data.days)) {
    for (const [date, day] of Object.entries(data.days)) {
      if (!ISO.test(date) || !isObj(day)) continue;
      const rec: DayRecord = {};
      for (const [g, r] of Object.entries(day)) {
        // v1 stored Dawn Chorus as { at }; upgrade it to a normal result.
        if (g === 'dawn' && isObj(r) && r.time === undefined) { rec.dawn = { time: 0, hints: 0, stars: 2 }; continue; }
        if (isResult(r)) rec[g as GameKey] = r;
      }
      days[date] = rec;
    }
  }
  const out = { ...data, days } as Progress;
  if (isObj(data.trek)) out.trek = Object.fromEntries(Object.entries(data.trek).filter(([, r]) => isResult(r))) as Progress['trek'];
  else delete out.trek;
  if (Array.isArray(data.badges)) out.badges = data.badges.filter((b): b is string => typeof b === 'string');
  else delete out.badges;
  return out;
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
 * as long as the days on both sides were played. Today never breaks a streak before it ends, and neither
 * does a missed yesterday that today's play can still bridge with that week's Snow Day.
 */
export function streakInfo(p: Progress, today: string): StreakInfo {
  const played = (d: string): boolean => Object.values(p.days[d] ?? {}).some((r) => r && r.live !== false);
  // `pending`: the day after `end` (today) is still to play, so a missed `end` may become a Snow Day.
  const walk = (end: string, pending = false): { len: number; snow: string[] } => {
    let d = end, len = 0;
    const snow: string[] = [], usedWeeks = new Set<string>();
    for (;;) {
      if (played(d)) { len++; d = addDays(d, -1); continue; }
      const prev = addDays(d, -1);
      if ((len > 0 || (pending && d === end)) && played(prev) && !usedWeeks.has(weekKey(d))) { usedWeeks.add(weekKey(d)); snow.push(d); d = prev; continue; }
      break;
    }
    return { len, snow };
  };
  const cur = played(today) ? walk(today) : walk(addDays(today, -1), true);
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
