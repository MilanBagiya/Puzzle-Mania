// Fresh Snow engine — TypeScript port of the tested prototype engine.
// Pure: no DOM, no unseeded randomness. Same seed + level => identical puzzle.

export type AnimalId = 'fox' | 'rabbit' | 'deer';
export type LevelId = 'morning' | 'noon' | 'night';

/** 0 = snow, 1 = rock, 2 = tree. Rocks and trees block every animal. */
export type Terrain = 0 | 1 | 2;
export const SNOW: Terrain = 0;
export const ROCK: Terrain = 1;
export const TREE: Terrain = 2;

export interface LevelProfile {
  label: string;
  n: number;
  animals: readonly AnimalId[];
  rocks: number;
  trees: number;
  /** Path length range in stood cells, including the home cell. */
  len: readonly [number, number];
  /** Target number of covered (drift) cells. */
  cover: readonly [number, number];
}

export const LEVELS: Readonly<Record<LevelId, LevelProfile>> = {
  morning: { label: 'Morning', n: 5, animals: ['fox', 'rabbit'], rocks: 1, trees: 2, len: [3, 5], cover: [2, 3] },
  noon: { label: 'Noon', n: 6, animals: ['fox', 'rabbit', 'deer'], rocks: 2, trees: 3, len: [3, 6], cover: [3, 5] },
  night: { label: 'Night', n: 7, animals: ['fox', 'rabbit', 'deer'], rocks: 3, trees: 4, len: [4, 7], cover: [6, 9] },
};

/** What the player sees. Contains no solution. Cell index i = row * n + col. */
export interface Puzzle {
  n: number;
  /** Daily level, or 'trek' for Trail Trek stages. */
  level: LevelId | 'trek';
  seed: string;
  terrain: Terrain[];
  /** Home (burrow) cells; each animal ends in exactly one, one animal per home. */
  homes: number[];
  /** prints[i] = animals whose print is stamped on cell i (hidden if i is covered). */
  prints: AnimalId[][];
  animals: AnimalId[];
  /** Cells under a snow drift: their prints are hidden from the player. */
  covered: number[];
}

/** Each animal's full path: border start ... home. Kept server-side only. */
export type Solution = Partial<Record<AnimalId, number[]>>;
export type PlayerPaths = Partial<Record<AnimalId, number[]>>;

export interface GeneratedPuzzle {
  puzzle: Puzzle;
  solution: Solution;
}

export type RuleErrorCode = 'no-path' | 'not-home' | 'shared-home' | 'no-print-here' | 'missed-print';
export interface RuleError {
  code: RuleErrorCode;
  animal: AnimalId;
  cell?: number;
  message: string;
}

type Dir = readonly [number, number];
const DIRS4: readonly Dir[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAG: readonly Dir[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

// ---------- seeded randomness ----------
export function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rngFrom = (s: string): (() => number) => mulberry32(hashStr(s));
const randInt = (rng: () => number, a: number, b: number): number => a + Math.floor(rng() * (b - a + 1));
function pick<T>(rng: () => number, arr: readonly T[]): T {
  const v = arr[Math.floor(rng() * arr.length)];
  if (v === undefined) throw new Error('pick from empty array');
  return v;
}
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

// ---------- movement rules ----------
export const isBorder = (n: number, idx: number): boolean => {
  const r = Math.floor(idx / n);
  const c = idx % n;
  return r === 0 || c === 0 || r === n - 1 || c === n - 1;
};

export interface Move {
  idx: number;
  dir: Dir;
}

/**
 * Candidate moves from idx, inside the board, ignoring terrain.
 * fox: 1 diagonal. rabbit: exactly 2 straight (jumps over anything).
 * deer: 1 straight, never reversing prevDir.
 */
export function rawMoves(n: number, animal: AnimalId, idx: number, prevDir: Dir | null): Move[] {
  const r = Math.floor(idx / n);
  const c = idx % n;
  const out: Move[] = [];
  const add = (d: Dir, k: number): void => {
    const rr = r + d[0] * k;
    const cc = c + d[1] * k;
    if (rr >= 0 && cc >= 0 && rr < n && cc < n) out.push({ idx: rr * n + cc, dir: d });
  };
  if (animal === 'fox') DIAG.forEach((d) => add(d, 1));
  else if (animal === 'rabbit') DIRS4.forEach((d) => add(d, 2));
  else DIRS4.forEach((d) => {
    if (!(prevDir && d[0] === -prevDir[0] && d[1] === -prevDir[1])) add(d, 1);
  });
  return out;
}

function dirBetween(n: number, a: number, b: number, animal: AnimalId): Dir {
  const dr = Math.floor(b / n) - Math.floor(a / n);
  const dc = (b % n) - (a % n);
  const k = animal === 'rabbit' ? 2 : 1;
  return [dr / k, dc / k];
}

export function prevDirOf(n: number, path: readonly number[], animal: AnimalId): Dir | null {
  if (path.length < 2) return null;
  return dirBetween(n, path[path.length - 2] as number, path[path.length - 1] as number, animal);
}

/** Cells the player may tap next for this animal (terrain + rules only, no answer needed). */
export function legalNextCells(p: Puzzle, animal: AnimalId, path: readonly number[]): number[] {
  const homes = new Set(p.homes);
  if (path.length === 0) return range(p.n * p.n).filter((i) => isBorder(p.n, i) && p.terrain[i] === SNOW && !homes.has(i));
  const last = path[path.length - 1] as number;
  if (homes.has(last)) return [];
  return rawMoves(p.n, animal, last, prevDirOf(p.n, path, animal))
    .map((m) => m.idx)
    .filter((i) => p.terrain[i] === SNOW && !path.includes(i));
}

// ---------- generation ----------
interface Draft {
  n: number;
  terrain: Terrain[];
  homes: number[];
  paths: Solution;
  prints: AnimalId[][];
  animals: AnimalId[];
}

function tryGenerate(L: LevelProfile, rng: () => number): Draft | null {
  const n = L.n;
  const N = n * n;
  const terrain: Terrain[] = new Array<Terrain>(N).fill(SNOW);
  const cells = shuffle(rng, range(N));
  let k = 0;
  for (let i = 0; i < L.rocks; i++) terrain[cells[k++] as number] = ROCK;
  for (let i = 0; i < L.trees; i++) terrain[cells[k++] as number] = TREE;

  const paths: Solution = {};
  const homes: number[] = [];
  for (const a of L.animals) {
    let ok = false;
    for (let t = 0; t < 300 && !ok; t++) {
      const target = randInt(rng, L.len[0], L.len[1]);
      const starts = range(N).filter((i) => isBorder(n, i) && terrain[i] === SNOW && !homes.includes(i));
      if (starts.length === 0) return null;
      const path = [pick(rng, starts)];
      const seen = new Set(path);
      while (path.length < target) {
        const opts = rawMoves(n, a, path[path.length - 1] as number, prevDirOf(n, path, a))
          .filter((m) => terrain[m.idx] === SNOW && !seen.has(m.idx) && !homes.includes(m.idx));
        if (opts.length === 0) break;
        const m = pick(rng, opts);
        path.push(m.idx);
        seen.add(m.idx);
      }
      if (path.length < target) continue;
      const end = path[path.length - 1] as number;
      if (Object.values(paths).some((p) => p.includes(end))) continue;
      paths[a] = path;
      homes.push(end);
      ok = true;
    }
    if (!ok) return null;
  }

  const prints: AnimalId[][] = range(N).map(() => []);
  for (const a of L.animals) {
    for (const i of (paths[a] as number[]).slice(0, -1)) {
      const cell = prints[i] as AnimalId[];
      if (!cell.includes(a)) cell.push(a);
    }
  }
  return { n, terrain, homes, paths, prints, animals: [...L.animals] };
}

interface View {
  n: number;
  terrain: readonly Terrain[];
  homes: readonly number[];
  prints: readonly (readonly AnimalId[])[];
  animals: readonly AnimalId[];
}

/** Every path for one animal consistent with what the player can see. null = more than cap. */
function enumeratePaths(v: View, covered: ReadonlySet<number>, a: AnimalId, cap: number): number[][] | null {
  const n = v.n;
  const N = n * n;
  const home = new Set(v.homes);
  const printsAt = (i: number): readonly AnimalId[] => v.prints[i] ?? [];
  const ownVisible = (i: number): boolean => !covered.has(i) && printsAt(i).includes(a);
  const required = range(N).filter(ownVisible).length;
  const allowed = (i: number): boolean =>
    v.terrain[i] === SNOW && !home.has(i) && (covered.has(i) || printsAt(i).includes(a));

  const out: number[][] = [];
  let overflow = false;
  const path: number[] = [];
  const seen = new Set<number>();

  const dfs = (got: number): void => {
    if (overflow) return;
    const last = path[path.length - 1] as number;
    for (const m of rawMoves(n, a, last, prevDirOf(n, path, a))) {
      if (seen.has(m.idx)) continue;
      if (home.has(m.idx)) {
        if (got === required) {
          out.push([...path, m.idx]);
          if (out.length > cap) {
            overflow = true;
            return;
          }
        }
        continue;
      }
      if (!allowed(m.idx)) continue;
      path.push(m.idx);
      seen.add(m.idx);
      dfs(got + (ownVisible(m.idx) ? 1 : 0));
      path.pop();
      seen.delete(m.idx);
      if (overflow) return;
    }
  };

  for (let s = 0; s < N; s++) {
    if (!isBorder(n, s) || !allowed(s)) continue;
    path.push(s);
    seen.add(s);
    dfs(ownVisible(s) ? 1 : 0);
    path.pop();
    seen.delete(s);
    if (overflow) return null;
  }
  return out;
}

/**
 * Up to `limit` solutions (each = one path per animal, in v.animals order, distinct homes).
 * Returns null when there are too many possibilities to count (treat as not unique).
 */
function solveView(v: View, covered: ReadonlySet<number>, limit: number): number[][][] | null {
  const lists = v.animals.map((a) => enumeratePaths(v, covered, a, 600));
  if (lists.some((l) => l === null)) return null;
  const sols: number[][][] = [];
  const used = new Set<number>();
  const chosen: number[][] = [];
  const rec = (i: number): void => {
    if (sols.length >= limit) return;
    if (i === lists.length) {
      sols.push(chosen.slice());
      return;
    }
    for (const path of lists[i] as number[][]) {
      const e = path[path.length - 1] as number;
      if (used.has(e)) continue;
      used.add(e);
      chosen.push(path);
      rec(i + 1);
      chosen.pop();
      used.delete(e);
      if (sols.length >= limit) return;
    }
  };
  rec(0);
  return sols;
}

function stoodKey(v: View, sol: number[][], cell: number): string {
  const who: AnimalId[] = [];
  sol.forEach((path, ai) => {
    if (path.slice(0, -1).includes(cell)) who.push(v.animals[ai] as AnimalId);
  });
  return who.sort().join();
}

function makeUnique(v: View, covered: Set<number>, rng: () => number): boolean {
  for (let iter = 0; iter < 60; iter++) {
    const sols = solveView(v, covered, 2);
    if (sols && sols.length === 1) return true;
    if (sols && sols.length === 0) return false;
    let candidates = [...covered];
    if (sols) {
      const [s0, s1] = sols as [number[][], number[][]];
      const diff = candidates.filter((i) => stoodKey(v, s0, i) !== stoodKey(v, s1, i));
      if (diff.length) candidates = diff;
    }
    if (candidates.length === 0) return false;
    covered.delete(pick(rng, candidates));
  }
  return false;
}

/**
 * Generate the puzzle for a seed (usually the date, "2027-01-18") and level.
 * The solution is returned separately and must never be sent to the browser.
 */
export function generatePuzzle(level: LevelId, seed: string): GeneratedPuzzle {
  return generateWithProfile(LEVELS[level], `${seed}:${level}`, level, seed);
}

/** Generate from any difficulty profile. rngKey makes it deterministic. */
export function generateWithProfile(L: LevelProfile, rngKey: string, level: LevelId | 'trek', seed: string): GeneratedPuzzle {
  const rng = rngFrom(rngKey);
  let best: { d: Draft; covered: Set<number> } | null = null;

  for (let attempt = 0; attempt < 120; attempt++) {
    const d = tryGenerate(L, rng);
    if (!d) continue;
    const N = d.n * d.n;
    const home = new Set(d.homes);
    const printed = range(N).filter((i) => (d.prints[i] ?? []).length > 0 && !home.has(i));
    const blank = range(N).filter((i) => (d.prints[i] ?? []).length === 0 && d.terrain[i] === SNOW && !home.has(i));
    const want = randInt(rng, L.cover[0], L.cover[1]);
    const covered = new Set<number>();
    shuffle(rng, printed).slice(0, Math.ceil(want * 0.6)).forEach((i) => covered.add(i));
    shuffle(rng, blank).slice(0, Math.max(0, want - covered.size)).forEach((i) => covered.add(i));
    if (!makeUnique(d, covered, rng)) continue;
    // Fairness: every animal leaves at least one visible print.
    if (d.animals.some((a) => !printed.some((i) => (d.prints[i] ?? []).includes(a) && !covered.has(i)))) continue;
    if (!best || covered.size > best.covered.size) best = { d, covered };
    if (covered.size >= L.cover[0]) break;
  }
  if (!best) throw new Error(`Could not generate a ${L.label} puzzle for seed "${seed}"`);

  const { d, covered } = best;
  return {
    puzzle: {
      n: d.n,
      level,
      seed,
      terrain: d.terrain,
      homes: d.homes,
      // Prints under a drift are part of the answer: the published puzzle never carries them.
      prints: d.prints.map((cell, i) => (covered.has(i) ? [] : cell)),
      animals: d.animals,
      covered: [...covered].sort((x, y) => x - y),
    },
    solution: d.paths,
  };
}

/** Number of solutions, stopping at `limit`. A published puzzle must return 1. */
export function countSolutions(p: Puzzle, limit = 2): number {
  const sols = solveView(p, new Set(p.covered), limit);
  return sols === null ? limit : sols.length;
}

/** Solve a puzzle from what the player can see (used for hints; no solution file needed). */
export function solve(p: Puzzle): Solution | null {
  const sols = solveView(p, new Set(p.covered), 2);
  if (!sols || sols.length !== 1) return null;
  const out: Solution = {};
  p.animals.forEach((a, i) => {
    out[a] = (sols[0] as number[][])[i] as number[];
  });
  return out;
}

// ---------- validation ----------
const where = (n: number, i: number): string => `row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}`;

function stepsLegal(p: Puzzle, a: AnimalId, path: readonly number[]): boolean {
  if (path.length === 0) return true;
  const first = path[0] as number;
  if (!isBorder(p.n, first) || p.terrain[first] !== SNOW) return false;
  for (let k = 1; k < path.length; k++) {
    const prev = path.slice(0, k);
    const next = path[k] as number;
    if (p.terrain[next] !== SNOW || prev.includes(next)) return false;
    if (!rawMoves(p.n, a, prev[prev.length - 1] as number, prevDirOf(p.n, prev, a)).some((m) => m.idx === next)) return false;
  }
  return true;
}

/** Problems with the player's paths, in plain words. Empty array = solved. */
export function checkPaths(p: Puzzle, state: PlayerPaths): RuleError[] {
  const n = p.n;
  const homes = new Set(p.homes);
  const covered = new Set(p.covered);
  const errs: RuleError[] = [];
  const ends = new Map<number, AnimalId>();

  for (const a of p.animals) {
    const path = state[a] ?? [];
    if (path.length === 0) {
      errs.push({ code: 'no-path', animal: a, message: `The ${a} has no path yet.` });
      continue;
    }
    if (!stepsLegal(p, a, path)) {
      errs.push({ code: 'no-path', animal: a, message: `The ${a}’s trail breaks its movement rule.` });
      continue;
    }
    const last = path[path.length - 1] as number;
    if (!homes.has(last)) {
      errs.push({ code: 'not-home', animal: a, message: `The ${a} isn’t home yet.` });
      continue;
    }
    if (path.slice(0, -1).some((i) => homes.has(i))) {
      errs.push({ code: 'no-path', animal: a, message: `The ${a} can only enter a home at the end of its trail.` });
      continue;
    }
    const other = ends.get(last);
    if (other) {
      errs.push({ code: 'shared-home', animal: a, cell: last, message: `The ${other} and the ${a} can’t share a home. Each home fits one animal.` });
    }
    ends.set(last, a);
    const stood = new Set(path.slice(0, -1));
    for (const i of stood) {
      if (!covered.has(i) && !(p.prints[i] ?? []).includes(a)) {
        errs.push({ code: 'no-print-here', animal: a, cell: i, message: `The ${a} can’t walk on ${where(n, i)}: there’s no ${a} print there.` });
        break;
      }
    }
    for (let i = 0; i < n * n; i++) {
      if (!covered.has(i) && (p.prints[i] ?? []).includes(a) && !stood.has(i)) {
        errs.push({ code: 'missed-print', animal: a, cell: i, message: `You missed a ${a} print at ${where(n, i)}. Every print must be on the trail.` });
        break;
      }
    }
  }
  return errs;
}

export const isSolved = (p: Puzzle, state: PlayerPaths): boolean => checkPaths(p, state).length === 0;

/**
 * Next hint: extends the first animal whose path differs from the unique solution by one
 * correct step (after cutting off any wrong part). Computed from the puzzle alone.
 */
export function hint(p: Puzzle, state: PlayerPaths): { animal: AnimalId; path: number[] } | null {
  const sol = solve(p);
  if (!sol) return null;
  for (const a of p.animals) {
    const target = sol[a] ?? [];
    const cur = state[a] ?? [];
    let k = 0;
    while (k < cur.length && k < target.length && cur[k] === target[k]) k++;
    if (k === target.length && cur.length === target.length) continue;
    return { animal: a, path: target.slice(0, k + 1) };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Trail Trek: a 60-stage campaign that teaches one animal at a time, then ramps up.
export interface TrekChapter { id: number; name: string; blurb: string; from: number; to: number }
export const TREK_CHAPTERS: readonly TrekChapter[] = [
  { id: 1, name: 'First Tracks', blurb: 'Meet the fox and the rabbit on small snowfields.', from: 1, to: 15 },
  { id: 2, name: 'Deer Valley', blurb: 'The deer joins in. Three animals, bigger fields.', from: 16, to: 30 },
  { id: 3, name: 'Deep Drifts', blurb: 'More drifts hide more prints. Think before you step.', from: 31, to: 45 },
  { id: 4, name: 'Night Forest', blurb: 'The biggest, trickiest snowfields of all.', from: 46, to: 60 },
];
export const TREK_STAGE_COUNT = 60;

/** Difficulty profile for a Trek stage (1–60). */
export function trekProfile(stage: number): LevelProfile {
  const s = Math.min(Math.max(Math.round(stage), 1), TREK_STAGE_COUNT);
  const ramp = (from: number, to: number, a: number, b: number): number => Math.round(a + ((b - a) * (s - from)) / Math.max(1, to - from));
  if (s <= 3) return { label: `Stage ${s}`, n: 5, animals: ['fox'], rocks: 0, trees: 1, len: [3, 4], cover: [0, s - 1] };
  if (s <= 6) return { label: `Stage ${s}`, n: 5, animals: ['rabbit'], rocks: 1, trees: 1, len: [3, 4], cover: [0, s - 4] };
  if (s <= 15) { const c = ramp(7, 15, 1, 3); return { label: `Stage ${s}`, n: 5, animals: ['fox', 'rabbit'], rocks: 1, trees: 2, len: [3, 5], cover: [c, c + 1] }; }
  if (s <= 18) return { label: `Stage ${s}`, n: 6, animals: ['deer'], rocks: 2, trees: 2, len: [4, 6], cover: [1, 2] };
  if (s <= 30) { const c = ramp(19, 30, 2, 5); return { label: `Stage ${s}`, n: 6, animals: ['fox', 'rabbit', 'deer'], rocks: 2, trees: 3, len: [3, 6], cover: [c, c + 1] }; }
  if (s <= 45) { const c = ramp(31, 45, 4, 7); return { label: `Stage ${s}`, n: 6, animals: ['fox', 'rabbit', 'deer'], rocks: 2, trees: 3, len: [4, 6], cover: [c, c + 2] }; }
  const c = ramp(46, 60, 6, 10);
  return { label: `Stage ${s}`, n: 7, animals: ['fox', 'rabbit', 'deer'], rocks: 3, trees: 4, len: [4, 7], cover: [c, c + 2] };
}
export const trekChapterOf = (stage: number): TrekChapter => TREK_CHAPTERS.find((c) => stage >= c.from && stage <= c.to) ?? (TREK_CHAPTERS[0] as TrekChapter);
/** Generate Trek stage `stage` (same puzzle for every player). */
export function generateTrekStage(stage: number): GeneratedPuzzle {
  return generateWithProfile(trekProfile(stage), `trek:${stage}`, 'trek', `trek-${stage}`);
}
