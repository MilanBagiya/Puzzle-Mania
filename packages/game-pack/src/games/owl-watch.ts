// Owl Watch: each owl's number is how many mice it can see along its diagonals (another owl blocks the view).
// Mice never touch. Exactly one answer.
import { svgUse } from '@wild-daily/ui';
import { mountCount } from '../count-ui.js';
import { range, rngFrom, shuffle, solveCount, nb8, type CountPuzzle, type GameDef } from '../shared.js';

function diagView(n: number, blocked: Set<number>, t: number): number[] {
  const r = Math.floor(t / n), c = t % n, out: number[] = [];
  for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && cc >= 0 && rr < n && cc < n && !blocked.has(rr * n + cc)) { out.push(rr * n + cc); rr += dr; cc += dc; }
  }
  return out;
}
export function generate(seed: string): CountPuzzle {
  const rng = rngFrom('owl:' + seed), n = 6, N = n * n;
  // 500 tries was too few for a few dates (e.g. 2028-11-17); more tries keep the same random stream,
  // so every date that already generated keeps exactly the same puzzle.
  for (let a = 0; a < 5000; a++) {
    const blocked = new Set(shuffle(rng, range(N)).slice(0, 6 + Math.floor(rng() * 3)));
    const items = new Set<number>();
    for (const i of shuffle(rng, range(N).filter((x) => !blocked.has(x)))) { if (items.size >= 5) break; if (nb8(n, i).every((j) => !items.has(j))) items.add(i); }
    const b = [...blocked].sort((x, y) => x - y), sets = b.map((t) => diagView(n, blocked, t));
    if ([...items].some((i) => !sets.some((s) => s.includes(i)))) continue;
    const p: CountPuzzle = { n, blocked: b, sets, clues: sets.map((s) => s.filter((c) => items.has(c)).length), total: items.size, noTouch: true };
    if (solveCount(p, 2).length === 1) return p;
  }
  throw new Error('owl-watch: generation failed for ' + seed);
}
const def: GameDef<CountPuzzle> = {
  id: 'owl-watch', generate,
  mount: (root, p, ctx) => mountCount(root, p, ctx, { item: svgUse('n-mouse', '0 0 40 30'), itemName: 'mouse', clueArt: svgUse('n-owl', '0 0 40 40'), clueName: 'owl that sees', tile: 'night', intro: 'Tap a square to hide a mouse. Each owl’s number is how many mice it can see along its diagonals. Mice never touch.' }),
};
export default def;
