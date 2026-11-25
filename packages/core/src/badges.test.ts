import { describe, expect, it } from 'vitest';
import { BADGES, earnedBadges, takeNewBadges } from './badges.js';
import { addDays } from './dates.js';
import { SEASONS } from './season.js';
import { DAILY_SET, PACK_KEYS, todaysPicks, type GameKey, type GameResult, type Progress } from './progress.js';

const T = '2027-01-27'; // a Wednesday
const live: GameResult = { time: 60, hints: 1, stars: 2, live: true };
const res = (over: Partial<GameResult> = {}): GameResult => ({ ...live, ...over });

/** Progress with the given games solved on the given dates. */
function prog(days: Record<string, GameKey[] | Partial<Record<GameKey, GameResult>>>, extra: Partial<Progress> = {}): Progress {
  const out: Progress = { days: {}, ...extra };
  for (const [d, g] of Object.entries(days)) out.days[d] = Array.isArray(g) ? Object.fromEntries(g.map((k) => [k, res()])) : g;
  return out;
}
/** `n` consecutive played days ending at T. */
const run = (n: number): Progress => prog(Object.fromEntries(Array.from({ length: n }, (_, k) => [addDays(T, -k), ['morning'] as GameKey[]])));
const trek = (stages: number, stars = 1): Progress => ({ days: {}, trek: Object.fromEntries(Array.from({ length: stages }, (_, k) => [String(k + 1), res({ stars })])) });
const has = (p: Progress, id: string, today = T): boolean => {
  const b = BADGES.find((x) => x.id === id);
  if (!b) throw new Error(`no badge ${id}`);
  return b.earned(p, today);
};

describe('badge conditions (each just below and at its threshold)', () => {
  it('first-tracks: any solved puzzle', () => {
    expect(has({ days: {} }, 'first-tracks')).toBe(false);
    expect(has(prog({ [T]: {} }), 'first-tracks')).toBe(false); // an empty day record is not a solve
    expect(has(prog({ [T]: ['nests'] }), 'first-tracks')).toBe(true);
  });
  it('tutorial: finishing the tutorial', () => {
    expect(has({ days: {} }, 'tutorial')).toBe(false);
    expect(has({ days: {}, tutorialSeen: true }, 'tutorial')).toBe(false);
    expect(has({ days: {}, tutorialDone: true }, 'tutorial')).toBe(true);
  });
  it('daily-set: all five on the same day', () => {
    expect(has(prog({ [T]: DAILY_SET.slice(0, 4) }), 'daily-set')).toBe(false);
    expect(has(prog({ [T]: DAILY_SET.slice(0, 4), [addDays(T, -1)]: DAILY_SET.slice(4) }), 'daily-set')).toBe(false);
    expect(has(prog({ [T]: [...DAILY_SET] }), 'daily-set')).toBe(true);
  });
  it('streak badges: 3, 7 and 30 days', () => {
    expect(has(run(2), 'streak-3')).toBe(false);
    expect(has(run(3), 'streak-3')).toBe(true);
    expect(has(run(6), 'streak-7')).toBe(false);
    expect(has(run(7), 'streak-7')).toBe(true);
    expect(has(run(29), 'streak-30')).toBe(false);
    expect(has(run(30), 'streak-30')).toBe(true);
  });
  it('streak badges keep the best streak after it breaks', () => {
    const p = run(7);
    expect(has(p, 'streak-7', addDays(T, 20))).toBe(true);
  });
  it('streak badges ignore archive play (not live)', () => {
    const p = prog(Object.fromEntries([0, 1, 2].map((k) => [addDays(T, -k), { morning: res({ live: false }) }])));
    expect(has(p, 'streak-3')).toBe(false);
  });
  it('night-clean: a Night solve with zero hints', () => {
    expect(has(prog({ [T]: { night: res({ hints: 1 }) } }), 'night-clean')).toBe(false);
    expect(has(prog({ [T]: { noon: res({ hints: 0 }) } }), 'night-clean')).toBe(false);
    expect(has(prog({ [T]: { night: res({ hints: 0 }) } }), 'night-clean')).toBe(true);
  });
  it('speedy: Morning under 45 seconds', () => {
    expect(has(prog({ [T]: { morning: res({ time: 45 }) } }), 'speedy')).toBe(false);
    expect(has(prog({ [T]: { noon: res({ time: 10 }) } }), 'speedy')).toBe(false);
    expect(has(prog({ [T]: { morning: res({ time: 44 }) } }), 'speedy')).toBe(true);
  });
  it('first-solve badges for each companion game', () => {
    for (const [id, game] of [['nests', 'nests'], ['dawn', 'dawn'], ['stones', 'stones'], ['rings', 'rings']] as const) {
      expect(has(prog({ [T]: ['morning'] }), id)).toBe(false);
      expect(has(prog({ [T]: [game] }), id)).toBe(true);
    }
  });
  it('Trail Trek chapters need every stage up to the chapter end', () => {
    for (const [id, end] of [['trek-1', 15], ['trek-2', 30], ['trek-3', 45], ['trek-4', 60]] as const) {
      expect(has(trek(end - 1), id)).toBe(false);
      expect(has(trek(end), id)).toBe(true);
    }
    const gap = trek(15);
    delete gap.trek!['7'];
    gap.trek!['16'] = res();
    expect(has(gap, 'trek-1')).toBe(false);
  });
  it('paws-30: 30 Trek paws in total', () => {
    expect(has(trek(10, 2), 'paws-30')).toBe(false);
    expect(has(trek(10, 3), 'paws-30')).toBe(true);
  });
  it('archive-5: five days played from the archive (not live)', () => {
    const arch = (n: number, live: boolean): Progress => prog(Object.fromEntries(Array.from({ length: n }, (_, k) => [addDays(T, -2 - k), { morning: res({ live }) }])));
    expect(has(arch(4, false), 'archive-5')).toBe(false);
    expect(has(arch(5, false), 'archive-5')).toBe(true);
    // playing five past days when they were today is not time travel
    expect(has(arch(30, true), 'archive-5')).toBe(false);
    // a day with any archive replay counts, even if another game that day was live
    const mixed = arch(4, false);
    mixed.days[addDays(T, -20)] = { morning: res({ live: true }), noon: res({ live: false }) };
    expect(has(mixed, 'archive-5')).toBe(true);
    // older saves without the live flag never count as archive play
    expect(has(prog({ ...arch(4, false).days, [addDays(T, -30)]: { noon: res({ live: undefined }) } }), 'archive-5')).toBe(false);
  });
  it('explorer: 10 different games, on any days', () => {
    const games: GameKey[] = ['morning', 'noon', 'night', 'nests', 'dawn', 'stones', 'rings', ...PACK_KEYS.slice(0, 3)];
    expect(has(prog({ [T]: games.slice(0, 9) }), 'explorer')).toBe(false);
    expect(has(prog({ [T]: games.slice(0, 5), [addDays(T, -1)]: games.slice(5) }), 'explorer')).toBe(true);
  });
  it("picks: all three of that day's picks, as shown for the player's season", () => {
    const picks = todaysPicks(T);
    expect(picks).toHaveLength(3);
    expect(has(prog({ [T]: picks.slice(0, 2) }), 'picks')).toBe(false);
    // The home page leads with a seasonal game, so the picks it shows can differ from the unseasoned list.
    for (const season of SEASONS) {
      const shown = todaysPicks(T, 3, season);
      expect(has(prog({ [T]: shown }), 'picks'), season).toBe(true);
      expect(has(prog({ [T]: shown.slice(1) }), 'picks'), season).toBe(false);
    }
  });
  it('arcade: every pack game at least once', () => {
    expect(has(prog({ [T]: PACK_KEYS.slice(1) }), 'arcade')).toBe(false);
    expect(has(prog({ [T]: PACK_KEYS.slice(1), [addDays(T, -9)]: PACK_KEYS.slice(0, 1) }), 'arcade')).toBe(true);
  });
  it('four-seasons: played in all four seasons, in either hemisphere', () => {
    const three = prog({ '2027-01-10': ['morning'], '2027-04-10': ['morning'], '2027-07-10': ['morning'] });
    expect(has(three, 'four-seasons')).toBe(false);
    const four = prog({ ...three.days, '2027-10-10': ['morning'] });
    expect(has(four, 'four-seasons')).toBe(true);
    expect(has({ ...four, hemisphere: 'south' }, 'four-seasons')).toBe(true);
    expect(has(prog({ ...three.days, '2027-10-10': {} }), 'four-seasons')).toBe(false); // empty day doesn't count
  });
  it('journal-6: six days played', () => {
    expect(has(run(5), 'journal-6')).toBe(false);
    expect(has(run(6), 'journal-6')).toBe(true);
  });
});

describe('earnedBadges and takeNewBadges', () => {
  it('earns nothing on empty progress', () => {
    expect(earnedBadges({ days: {} }, T)).toEqual([]);
    const p: Progress = { days: {} };
    expect(takeNewBadges(p, T)).toEqual([]);
    expect(p.badges).toEqual([]);
  });
  it('returns only badges not seen before, and keeps already-seen ids', () => {
    const p = prog({ [T]: ['nests'] }, { badges: ['first-tracks', 'retired-badge'] });
    expect(takeNewBadges(p, T).map((b) => b.id)).toEqual(['nests']);
    expect(p.badges).toEqual(['first-tracks', 'retired-badge', 'nests']);
    expect(takeNewBadges(p, T)).toEqual([]);
  });
  it('every badge id is unique', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});
