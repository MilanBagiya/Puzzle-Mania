// Dawn Chorus: put five birds in the order they sang. Seeded by date; every puzzle has exactly one answer.
import { rngFrom } from '@wild-daily/game-fresh-snow/engine';

export type BirdId = 'robin' | 'wren' | 'bluebird' | 'goldfinch' | 'chickadee' | 'warbler';
export const BIRDS: Readonly<Record<BirdId, { name: string; color: string }>> = {
  robin: { name: 'Robin', color: '#E2594A' }, wren: { name: 'Wren', color: '#A8743F' },
  bluebird: { name: 'Bluebird', color: '#3F86D3' }, goldfinch: { name: 'Goldfinch', color: '#E9A800' },
  chickadee: { name: 'Chickadee', color: '#5B6875' }, warbler: { name: 'Warbler', color: '#5E9E3A' },
};
const ORD = ['first', 'second', 'third', 'fourth', 'last'] as const;

export type Clue =
  | { t: 'pos' | 'notpos'; a: BirdId; k: number }
  | { t: 'after' | 'before' | 'apart'; a: BirdId; b: BirdId };
export interface DawnPuzzle { birds: BirdId[]; answer: BirdId[]; clues: Clue[]; text: string[] }
/** What the browser receives: no answer. */
export interface DawnPublic { seed: string; birds: BirdId[]; clues: Clue[]; text: string[] }
export const toPublic = (seed: string, d: DawnPuzzle): DawnPublic => ({ seed, birds: d.birds, clues: d.clues, text: d.text });
/** An order is correct when every clue holds (exactly one order does). */
export const orderFits = (p: Pick<DawnPublic, 'clues'>, order: readonly BirdId[]): boolean => p.clues.every((c) => clueHolds(c, order));
/** Solve from the clues alone (for hints). */
export const solveDawn = (p: DawnPublic): BirdId[] | null => permutations(p.birds).find((o) => orderFits(p, o)) ?? null;

export function permutations<T>(arr: readonly T[]): T[][] {
  if (arr.length <= 1) return [arr.slice()];
  const out: T[][] = [];
  arr.forEach((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p])));
  return out;
}
export function clueHolds(c: Clue, order: readonly BirdId[]): boolean {
  const pos = (b: BirdId): number => order.indexOf(b);
  switch (c.t) {
    case 'pos': return pos(c.a) === c.k;
    case 'notpos': return pos(c.a) !== c.k;
    case 'after': return pos(c.a) === pos(c.b) + 1;
    case 'before': return pos(c.a) < pos(c.b);
    case 'apart': return Math.abs(pos(c.a) - pos(c.b)) > 1;
  }
}
export function clueText(c: Clue): string {
  const N = (b: BirdId): string => 'the ' + BIRDS[b].name.toLowerCase();
  const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  switch (c.t) {
    case 'pos': return `${cap(N(c.a))} sang ${ORD[c.k]}.`;
    case 'notpos': return `${cap(N(c.a))} didn’t sing ${ORD[c.k]}.`;
    case 'after': return `${cap(N(c.a))} sang right after ${N(c.b)}.`;
    case 'before': return `${cap(N(c.a))} sang before ${N(c.b)}.`;
    case 'apart': return `${cap(N(c.a))} and ${N(c.b)} didn’t sing next to each other.`;
  }
}
function shuffle<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = arr[i] as T; arr[i] = arr[j] as T; arr[j] = t; }
  return arr;
}
export function generateDawn(seed: string): DawnPuzzle {
  const rng = rngFrom('dawn:' + seed);
  const pool = shuffle(rng, Object.keys(BIRDS) as BirdId[]).slice(0, 5);
  const answer = shuffle(rng, pool.slice());
  const all = permutations(pool);
  for (let attempt = 0; attempt < 50; attempt++) {
    let cand = all.slice();
    let clues: Clue[] = [];
    for (let guard = 0; guard < 400 && cand.length > 1; guard++) {
      const r = rng(), a = pool[Math.floor(rng() * 5)] as BirdId, b = pool[Math.floor(rng() * 5)] as BirdId;
      let c: Clue;
      if (r < 0.12) c = { t: 'pos', a, k: answer.indexOf(a) };
      else if (r < 0.3) c = { t: 'notpos', a, k: Math.floor(rng() * 5) };
      else if (r < 0.55) { const i = answer.indexOf(a); if (i === 0) continue; c = { t: 'after', a, b: answer[i - 1] as BirdId }; }
      else if (r < 0.8) { if (a === b) continue; c = { t: 'before', a, b }; }
      else { if (a === b) continue; c = { t: 'apart', a, b }; }
      if (!clueHolds(c, answer)) continue;
      const next = cand.filter((p) => clueHolds(c, p));
      if (next.length === cand.length) continue;
      cand = next; clues.push(c);
    }
    if (cand.length !== 1) continue;
    for (let i = clues.length - 1; i >= 0; i--) {
      const rest = clues.filter((_, j) => j !== i);
      if (all.filter((p) => rest.every((c) => clueHolds(c, p))).length === 1) clues = rest;
    }
    if (clues.length < 3 || clues.length > 6) continue;
    // The tray must not start already in the answer order (reshuffling only changes the days where it did).
    let birds = shuffle(rng, pool.slice());
    while (birds.every((b, i) => b === answer[i])) birds = shuffle(rng, birds);
    return { birds, answer, clues, text: clues.map(clueText) };
  }
  throw new Error(`Could not generate a Dawn Chorus puzzle for ${seed}`);
}
