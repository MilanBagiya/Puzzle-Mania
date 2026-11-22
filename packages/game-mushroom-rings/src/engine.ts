// Mushroom Rings: a spore landed on the moss. Each night its ring of mushrooms moved one step outward
// (walking around stumps), and old mushrooms faded. Tonight's ring is shown; fallen leaves hide some squares.
// Find where the spore landed. Every puzzle has exactly one possible spore square.
import { rngFrom } from '@wild-daily/game-fresh-snow/engine';

export interface RingsPuzzle {
  n: number; seed: string; nights: number;
  stumps: number[];
  /** Squares showing a mushroom tonight. */
  mushrooms: number[];
  /** Squares under leaves: they may or may not hide a mushroom. */
  leaves: number[];
}
/** Squares at exactly `nights` steps from `spore`, walking up/down/left/right around stumps. */
export function ringOf(n: number, stumps: ReadonlySet<number>, spore: number, nights: number): Set<number> {
  const dist = new Map<number, number>([[spore, 0]]);
  const queue = [spore];
  while (queue.length) {
    const i = queue.shift()!, d = dist.get(i)!;
    if (d === nights) continue;
    const r = Math.floor(i / n), c = i % n;
    for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
      const rr = r + dr, cc = c + dc, j = rr * n + cc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || stumps.has(j) || dist.has(j)) continue;
      dist.set(j, d + 1); queue.push(j);
    }
  }
  return new Set([...dist].filter(([, d]) => d === nights).map(([i]) => i));
}
/** Every spore square that fits what the player can see. */
export function candidates(p: RingsPuzzle): number[] {
  const stumps = new Set(p.stumps), mush = new Set(p.mushrooms), leaves = new Set(p.leaves);
  const out: number[] = [];
  for (let s = 0; s < p.n * p.n; s++) {
    if (stumps.has(s)) continue;
    const ring = ringOf(p.n, stumps, s, p.nights);
    let ok = true;
    for (let i = 0; i < p.n * p.n && ok; i++) if (!stumps.has(i) && !leaves.has(i) && ring.has(i) !== mush.has(i)) ok = false;
    if (ok) out.push(s);
  }
  return out;
}
export function generateRings(seed: string, n = 7): { puzzle: RingsPuzzle; spore: number } {
  const rng = rngFrom('rings:' + seed);
  for (let attempt = 0; attempt < 600; attempt++) {
    const nights = 2 + Math.floor(rng() * 2);
    const stumps = new Set<number>();
    const sc = 4 + Math.floor(rng() * 4);
    while (stumps.size < sc) stumps.add(Math.floor(rng() * n * n));
    const free = [...Array(n * n).keys()].filter((i) => !stumps.has(i));
    const spore = free[Math.floor(rng() * free.length)]!;
    const ring = ringOf(n, stumps, spore, nights);
    if (ring.size < 4) continue;
    const leafCount = 2 + Math.floor(rng() * 3);
    const leafPool = free.filter((i) => i !== spore);
    const leaves = new Set<number>();
    while (leaves.size < leafCount) leaves.add(leafPool[Math.floor(rng() * leafPool.length)]!);
    const mushrooms = [...ring].filter((i) => !leaves.has(i)).sort((a, b) => a - b);
    if (mushrooms.length < 3) continue;
    const puzzle: RingsPuzzle = { n, seed, nights, stumps: [...stumps].sort((a, b) => a - b), mushrooms, leaves: [...leaves].sort((a, b) => a - b) };
    const cands = candidates(puzzle);
    if (cands.length === 1 && cands[0] === spore) return { puzzle, spore };
  }
  throw new Error(`Could not generate Mushroom Rings for ${seed}`);
}
