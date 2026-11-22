// Stepping Stones: the frog starts on the bottom-left pad and must reach the far bank (top-right).
// Each pad's number is exactly how far the frog must jump next, in a straight line (up, down, left, right).
// Pads sink after one use. Every puzzle is checked to be solvable with a fair minimum number of jumps.
import { rngFrom } from '@wild-daily/game-fresh-snow/engine';

export interface StonesPuzzle { n: number; seed: string; pads: number[]; start: number; goal: number; best: number }

export function jumpsFrom(p: Pick<StonesPuzzle, 'n' | 'pads'>, i: number, used: ReadonlySet<number>): number[] {
  const n = p.n, r = Math.floor(i / n), c = i % n, k = p.pads[i] ?? 0, out: number[] = [];
  if (k <= 0) return out;
  for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]] as const) {
    const rr = r + dr * k, cc = c + dc * k;
    if (rr >= 0 && cc >= 0 && rr < n && cc < n && !used.has(rr * n + cc)) out.push(rr * n + cc);
  }
  return out;
}
/** Shortest route from `from` to the goal with the given sunk pads (depth-limited search). */
export function shortestRoute(p: StonesPuzzle, from: number, used: ReadonlySet<number>, maxDepth = 16): number[] | null {
  let best: number[] | null = null;
  const path = [from];
  const sunk = new Set(used); sunk.add(from);
  function dfs(at: number): void {
    if (best && path.length >= best.length) return;
    if (path.length - 1 > maxDepth) return;
    for (const nx of jumpsFrom(p, at, sunk)) {
      path.push(nx);
      if (nx === p.goal) { if (!best || path.length < best.length) best = path.slice(); }
      else { sunk.add(nx); dfs(nx); sunk.delete(nx); }
      path.pop();
    }
  }
  dfs(from);
  return best;
}
export function generateStones(seed: string, n = 6): StonesPuzzle {
  const rng = rngFrom('stones:' + seed);
  const start = (n - 1) * n, goal = n - 1;
  for (let attempt = 0; attempt < 500; attempt++) {
    const pads = Array.from({ length: n * n }, () => 1 + Math.floor(rng() * 3));
    pads[goal] = 0;
    const base = { n, seed, pads, start, goal, best: 0 };
    const route = shortestRoute(base, start, new Set());
    if (!route) continue;
    const jumps = route.length - 1;
    if (jumps < 6 || jumps > 10) continue;
    return { ...base, best: jumps };
  }
  throw new Error(`Could not generate Stepping Stones for ${seed}`);
}
/** Rule check: a route is valid if every jump is legal, no pad is reused, and it ends on the bank. */
export function checkRoute(p: StonesPuzzle, route: readonly number[]): boolean {
  if (route[0] !== p.start) return false;
  const used = new Set<number>([p.start]);
  for (let k = 1; k < route.length; k++) {
    const a = route[k - 1]!, b = route[k]!;
    if (!jumpsFrom(p, a, used).includes(b)) return false;
    used.add(b);
  }
  return route[route.length - 1] === p.goal;
}
