import { describe, expect, it } from 'vitest';
import { addDays, formatTime } from './dates.js';
import { daysPlayed, formatCountdown, loadProgress, msUntilMidnight, nextInSet, recordGame, recordLevel, recordTrek, saveProgress, starsFor, streak, streakInfo, trekUnlocked, type Progress } from './progress.js';
import { BADGES, takeNewBadges } from './badges.js';
import { GUIDES } from './guides.js';
import { JOURNAL } from './journal.js';

const T = '2027-01-27'; // a Wednesday
const r = { time: 50, hints: 0 };
describe('streaks with Snow Days', () => {
  it('counts consecutive days', () => {
    const p: Progress = { days: {} };
    [0, 1, 2].forEach((k) => recordLevel(p, addDays(T, -k), 'morning', r));
    expect(streak(p, T)).toBe(3);
  });
  it('keeps yesterday’s streak alive before today is played', () => {
    const p: Progress = { days: {} };
    recordLevel(p, addDays(T, -1), 'morning', r);
    expect(streak(p, T)).toBe(1);
  });
  it('forgives one missed day per week as a Snow Day', () => {
    const p: Progress = { days: {} };
    [0, 1, 3, 4].forEach((k) => recordLevel(p, addDays(T, -k), 'morning', r)); // missed T-2 (Monday)
    const s = streakInfo(p, T);
    expect(s.current).toBe(4);
    expect(s.snowDays).toEqual([addDays(T, -2)]);
  });
  it('breaks after two missed days in a row', () => {
    const p: Progress = { days: {} };
    [0, 3].forEach((k) => recordLevel(p, addDays(T, -k), 'morning', r));
    expect(streak(p, T)).toBe(1);
  });
  it('does not let archive play backfill a streak', () => {
    const p: Progress = { days: {} };
    recordGame(p, T, 'morning', { ...r, live: true });
    recordGame(p, addDays(T, -2), 'morning', { ...r, live: true });
    recordGame(p, addDays(T, -1), 'morning', { ...r, live: false }); // played later from the archive
    recordGame(p, addDays(T, -3), 'morning', { ...r, live: false });
    // T and T-2 were played live; T-1 was only played later from the archive, so it is bridged by a Snow Day, not counted.
    expect(streakInfo(p, T)).toEqual({ current: 2, best: 2, snowDays: [addDays(T, -1)] });
    recordGame(p, addDays(T, -9), 'noon', { ...r, live: false });
    expect(daysPlayed(p)).toBe(5);
  });
  it('tracks the best streak', () => {
    const p: Progress = { days: {} };
    [10, 11, 12, 13, 14].forEach((k) => recordLevel(p, addDays(T, -k), 'noon', r));
    recordLevel(p, T, 'noon', r);
    expect(streakInfo(p, T).best).toBe(5);
  });
});
describe('results, stars, trek, badges', () => {
  it('rates solves with paws and keeps the best result', () => {
    expect(starsFor(60, 0, 90)).toBe(3);
    expect(starsFor(100, 1, 90)).toBe(2);
    expect(starsFor(400, 3, 90)).toBe(1);
    const p: Progress = { days: {} };
    expect(recordGame(p, T, 'nests', { time: 500, hints: 2 }).firstPlayOfDay).toBe(true);
    recordGame(p, T, 'nests', { time: 100, hints: 0 });
    expect(p.days[T]?.nests?.stars).toBe(3);
    expect(nextInSet(p, T)).toBe('morning');
    expect(daysPlayed(p)).toBe(1);
  });
  it('unlocks Trek stages in order', () => {
    const p: Progress = { days: {} };
    expect(trekUnlocked(p)).toBe(1);
    recordTrek(p, 1, 5, r); recordTrek(p, 2, 5, r);
    expect(trekUnlocked(p)).toBe(3);
  });
  it('celebrates each badge once', () => {
    const p: Progress = { days: {} };
    recordLevel(p, T, 'morning', { time: 30, hints: 0 });
    const first = takeNewBadges(p, T).map((b) => b.id);
    expect(first).toContain('first-tracks');
    expect(first).toContain('speedy');
    expect(takeNewBadges(p, T)).toEqual([]);
    expect(BADGES.length).toBe(23);
  });
  it('gives every badge a distinct name (ignoring case)', () => {
    const names = BADGES.map((b) => b.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    // The first-puzzle badge keeps its id so badges people already earned stay earned.
    expect(BADGES.find((b) => b.id === 'first-tracks')?.name).toBe('First steps');
  });
  it('round-trips storage, upgrades old data and survives junk', () => {
    const store: Record<string, string> = {};
    const s = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; } };
    store['wilddaily:v1'] = JSON.stringify({ days: { [T]: { dawn: { at: 5 } } } });
    expect(loadProgress(s).days[T]?.dawn?.stars).toBe(2);
    const p: Progress = { days: {}, theme: 'dark' };
    recordLevel(p, T, 'night', { time: 400, hints: 2 });
    saveProgress(p, s);
    expect(loadProgress(s)).toEqual(p);
    store['wilddaily:v1'] = '{not json';
    expect(loadProgress(s)).toEqual({ days: {} });
  });
  it('counts down to midnight', () => {
    expect(msUntilMidnight(new Date(2027, 0, 1, 23, 0))).toBe(3600000);
    expect(formatCountdown(3 * 3600000 + 5 * 60000)).toBe('3h 5m');
    expect(formatTime(65)).toBe('1:05');
  });
});
describe('game pack', () => {
  it('has 20 pack games with names and par times, and 3 distinct daily picks', async () => {
    const { GAMES, PACK_KEYS, todaysPicks } = await import('./progress.js');
    expect(PACK_KEYS).toHaveLength(20);
    for (const k of PACK_KEYS) { expect(GAMES[k].href).toBe(`/play/${k}`); expect(GAMES[k].par).toBeGreaterThan(0); }
    const a = todaysPicks('2027-01-18'), b = todaysPicks('2027-01-19');
    expect(new Set(a).size).toBe(3); expect(a).toEqual(todaysPicks('2027-01-18')); expect(a).not.toEqual(b);
  });
});
describe('content', () => {
  it('has 11 guides and 12 journal cards linking to real guides', () => {
    expect(GUIDES).toHaveLength(11);
    expect(JOURNAL).toHaveLength(12);
    for (const j of JOURNAL) expect(GUIDES.some((g) => g.slug === j.guide)).toBe(true);
  });
});

import { hemisphereFromTimeZone, seasonFor } from './season.js';
import { todaysPicks as picks, packSeason, PACK_KEYS as KEYS } from './progress.js';
describe('seasons', () => {
  it('uses meteorological seasons, flipped in the south', () => {
    expect(seasonFor('2027-01-15')).toBe('winter'); expect(seasonFor('2027-04-01')).toBe('spring');
    expect(seasonFor('2027-07-04')).toBe('summer'); expect(seasonFor('2026-11-22')).toBe('autumn');
    expect(seasonFor('2026-12-25', 'south')).toBe('summer'); expect(seasonFor('2027-04-01', 'south')).toBe('autumn');
  });
  it('detects the hemisphere from the time zone', () => {
    expect(hemisphereFromTimeZone('Australia/Sydney')).toBe('south'); expect(hemisphereFromTimeZone('Pacific/Auckland')).toBe('south');
    expect(hemisphereFromTimeZone('Europe/London')).toBe('north'); expect(hemisphereFromTimeZone('America/Toronto')).toBe('north');
    expect(hemisphereFromTimeZone(undefined)).toBe('north');
  });
  it('always leads Today’s picks with an in-season game', () => {
    for (const s of ['spring', 'summer', 'autumn', 'winter'] as const) for (let d = 1; d <= 28; d++) {
      const p = picks(`2027-02-${String(d).padStart(2, '0')}`, 3, s);
      expect(packSeason(p[0]!)).toBe(s); expect(new Set(p).size).toBe(3);
    }
    expect(KEYS.every((k) => ['spring', 'summer', 'autumn', 'winter', 'any'].includes(packSeason(k)))).toBe(true);
  });
  it('awards Four seasons', async () => {
    const { BADGES: B } = await import('./badges.js');
    const four = B.find((b) => b.id === 'four-seasons')!;
    const p: Progress = { days: {} };
    for (const d of ['2027-01-10', '2027-04-10', '2027-07-10']) recordLevel(p, d, 'morning', r);
    expect(four.earned(p, '2027-10-10')).toBe(false);
    recordLevel(p, '2027-10-10', 'morning', r);
    expect(four.earned(p, '2027-10-10')).toBe(true);
  });
});
