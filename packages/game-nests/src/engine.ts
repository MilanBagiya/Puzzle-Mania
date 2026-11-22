// Nests: hide the nests so every tree's number equals how many nests it can see
// along its row and column (a tree blocks the view). Nests never touch, not even
// diagonally, and never sit on a tree. Every published puzzle has exactly one answer.
import { rngFrom } from '@wild-daily/game-fresh-snow/engine';

export interface NestsPuzzle {
  n: number;
  seed: string;
  /** Tree cells (index = row * n + col) and the number shown on each. */
  trees: number[];
  clues: number[];
  /** How many nests are hidden. */
  nests: number;
}
export type Mark = 0 | 1 | 2; // 0 empty, 1 nest, 2 marked "no nest"

const rc = (n: number, i: number): [number, number] => [Math.floor(i / n), i % n];
export function neighbours8(n: number, i: number): number[] {
  const [r, c] = rc(n, i), out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < n && cc < n) out.push(rr * n + cc);
  }
  return out;
}
/** Cells a tree can see, in all four directions until the edge or another tree. */
export function viewOf(n: number, treeSet: ReadonlySet<number>, t: number): number[] {
  const [r, c] = rc(n, t), out: number[] = [];
  for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && cc >= 0 && rr < n && cc < n && !treeSet.has(rr * n + cc)) { out.push(rr * n + cc); rr += dr; cc += dc; }
  }
  return out;
}

/** All solutions (as sorted nest-cell lists), stopping at `limit`. */
export function solveNests(p: NestsPuzzle, limit = 2): number[][] {
  const { n } = p, N = n * n, treeSet = new Set(p.trees);
  const views = p.trees.map((t) => viewOf(n, treeSet, t));
  const watchers: number[][] = Array.from({ length: N }, () => []);
  views.forEach((v, k) => v.forEach((cell) => watchers[cell]!.push(k)));
  const cells = [...Array(N).keys()].filter((i) => !treeSet.has(i));
  const state = new Int8Array(N).fill(-1); // -1 undecided, 0 no, 1 nest
  const seen = new Int16Array(p.trees.length), open = new Int16Array(p.trees.length);
  views.forEach((v, k) => { open[k] = v.length; });
  let placed = 0, undecided = cells.length;
  const out: number[][] = [];
  function feasible(): boolean {
    for (let k = 0; k < p.trees.length; k++) { const need = p.clues[k]!; if (seen[k]! > need || seen[k]! + open[k]! < need) return false; }
    return placed <= p.nests && placed + undecided >= p.nests;
  }
  function set(i: number, v: 0 | 1): void { state[i] = v; undecided--; if (v) placed++; for (const k of watchers[i]!) { open[k]!--; if (v) seen[k]!++; } }
  function unset(i: number): void { const v = state[i]; state[i] = -1; undecided++; if (v === 1) placed--; for (const k of watchers[i]!) { open[k]!++; if (v === 1) seen[k]!--; } }
  function rec(idx: number): void {
    if (out.length >= limit) return;
    if (idx === cells.length) { if (placed === p.nests && p.trees.every((_, k) => seen[k] === p.clues[k])) out.push(cells.filter((i) => state[i] === 1)); return; }
    const i = cells[idx]!;
    const canNest = neighbours8(n, i).every((j) => state[j] !== 1);
    if (canNest) { set(i, 1); if (feasible()) rec(idx + 1); unset(i); }
    set(i, 0); if (feasible()) rec(idx + 1); unset(i);
  }
  rec(0);
  return out;
}

export function generateNests(seed: string, n = 6): { puzzle: NestsPuzzle; solution: number[] } {
  const rng = rngFrom('nests:' + seed);
  const N = n * n;
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)] as T;
  for (let attempt = 0; attempt < 400; attempt++) {
    const treeCount = n + Math.floor(rng() * 3) - 1;
    const trees = new Set<number>();
    while (trees.size < treeCount) trees.add(Math.floor(rng() * N));
    const want = n - 1 + Math.floor(rng() * 2);
    const nests = new Set<number>();
    for (let guard = 0; guard < 200 && nests.size < want; guard++) {
      const free = [...Array(N).keys()].filter((i) => !trees.has(i) && !nests.has(i) && neighbours8(n, i).every((j) => !nests.has(j)));
      if (!free.length) break;
      nests.add(pick(free));
    }
    if (nests.size < want) continue;
    const t = [...trees].sort((a, b) => a - b);
    const clues = t.map((tr) => viewOf(n, trees, tr).filter((c) => nests.has(c)).length);
    // every nest must be seen by some tree, and at least one tree shows 0 (a gentle way in)
    if ([...nests].some((x) => !t.some((tr) => viewOf(n, trees, tr).includes(x)))) continue;
    const puzzle: NestsPuzzle = { n, seed, trees: t, clues, nests: nests.size };
    if (solveNests(puzzle, 2).length === 1) return { puzzle, solution: [...nests].sort((a, b) => a - b) };
  }
  throw new Error(`Could not generate a Nests puzzle for ${seed}`);
}

export interface NestsCheck { solved: boolean; touching: number[]; treeState: ('ok' | 'under' | 'over')[]; placed: number }
/** Rule check on the player's marks. Needs no stored answer: a full, rule-perfect board is the answer. */
export function checkNests(p: NestsPuzzle, marks: readonly Mark[]): NestsCheck {
  const { n } = p, treeSet = new Set(p.trees);
  const nestCells = marks.map((m, i) => (m === 1 ? i : -1)).filter((i) => i >= 0);
  const nestSet = new Set(nestCells);
  const touching = nestCells.filter((i) => neighbours8(n, i).some((j) => nestSet.has(j)));
  const treeState = p.trees.map((t, k) => { const s = viewOf(n, treeSet, t).filter((c) => nestSet.has(c)).length; const need = p.clues[k]!; return s === need ? 'ok' : s > need ? 'over' : 'under'; }) as NestsCheck['treeState'];
  const solved = touching.length === 0 && nestCells.length === p.nests && treeState.every((s) => s === 'ok') && nestCells.every((i) => !treeSet.has(i));
  return { solved, touching, treeState, placed: nestCells.length };
}
