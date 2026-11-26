// Acorn Stash: each stump's number counts acorns in the 8 squares around it. Logic only: exactly one answer.
import { svgUse } from '@wild-daily/ui';
import { mountCount } from '../count-ui.js';
import { nb8, range, rngFrom, shuffle, solveCount, type CountPuzzle, type GameDef } from '../shared.js';

export function generate(seed: string): CountPuzzle {
  const rng = rngFrom('acorn:' + seed), n = 6, N = n * n;
  for (let a = 0; a < 3000; a++) {
    // Place clue cells until every free square touches at least one, then add a couple more.
    const blocked = new Set<number>();
    const covered = (i: number): boolean => blocked.has(i) || nb8(n, i).some((j) => blocked.has(j));
    for (const i of shuffle(rng, range(N))) { if (!covered(i) || rng() < 0.08) blocked.add(i); }
    for (const i of shuffle(rng, range(N)).slice(0, 2)) blocked.add(i);
    const free = range(N).filter((i) => !blocked.has(i));
    if (free.some((i) => !nb8(n, i).some((j) => blocked.has(j)))) continue;
    const items = new Set(shuffle(rng, free.slice()).slice(0, Math.max(4, Math.round(free.length * (0.22 + rng() * 0.1)))));
    const b = [...blocked].sort((x, y) => x - y), sets = b.map((t) => nb8(n, t).filter((c) => !blocked.has(c)));
    const p: CountPuzzle = { n, blocked: b, sets, clues: sets.map((s) => s.filter((c) => items.has(c)).length), total: items.size, noTouch: false };
    if (solveCount(p, 2).length === 1) return p;
  }
  throw new Error('acorn: generation failed for ' + seed);
}
const def: GameDef<CountPuzzle> = {
  id: 'acorn-stash', generate,
  mount: (root, p, ctx) => mountCount(root, p, ctx, { host: 'squirrel', item: svgUse('n-acorn', '0 0 30 36'), itemName: 'acorn', clueArt: svgUse('n-stump', '0 0 38 30'), clueName: 'stump touching', tile: 'autumn', intro: 'Tap a square to dig up an acorn. Each stump’s number counts the acorns in the 8 squares around it.' }),
};
export default def;
