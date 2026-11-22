// Beehive: on a honeycomb, each hive's number counts the flowers in the 6 cells around it. Exactly one answer.
import { svgUse } from '@wild-daily/ui';
import { mountCount } from '../count-ui.js';
import { nbHex, range, rngFrom, shuffle, solveCount, type CountPuzzle, type GameDef } from '../shared.js';

export function generate(seed: string): CountPuzzle {
  const rng = rngFrom('hive:' + seed), n = 6, N = n * n;
  for (let a = 0; a < 3000; a++) {
    // Place clue cells until every free square touches at least one, then add a couple more.
    const blocked = new Set<number>();
    const covered = (i: number): boolean => blocked.has(i) || nbHex(n, i).some((j) => blocked.has(j));
    for (const i of shuffle(rng, range(N))) { if (!covered(i) || rng() < 0.08) blocked.add(i); }
    for (const i of shuffle(rng, range(N)).slice(0, 2)) blocked.add(i);
    const free = range(N).filter((i) => !blocked.has(i));
    if (free.some((i) => !nbHex(n, i).some((j) => blocked.has(j)))) continue;
    const items = new Set(shuffle(rng, free.slice()).slice(0, Math.max(4, Math.round(free.length * (0.22 + rng() * 0.1)))));
    const b = [...blocked].sort((x, y) => x - y), sets = b.map((t) => nbHex(n, t).filter((c) => !blocked.has(c)));
    const p: CountPuzzle = { n, blocked: b, sets, clues: sets.map((s) => s.filter((c) => items.has(c)).length), total: items.size, noTouch: false, hex: true };
    if (solveCount(p, 2).length === 1) return p;
  }
  throw new Error('hive: generation failed for ' + seed);
}
const def: GameDef<CountPuzzle> = {
  id: 'beehive', generate,
  mount: (root, p, ctx) => mountCount(root, p, ctx, { item: svgUse('n-daisy', '0 0 30 40'), itemName: 'flower', clueArt: svgUse('n-hive', '0 0 36 36'), clueName: 'hive touching', tile: 'meadow', hex: true, intro: 'Tap a cell to plant a flower. Each hive’s number counts the flowers in the 6 cells around it.' }),
};
export default def;
