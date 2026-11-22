import { describe, expect, it } from 'vitest';
import otter, { flow, solveOtter } from '../games/otter-slide.js';
import moose, { bestRoute } from '../games/moose-crossing.js';
import burrow, { solveBurrow } from '../games/burrow-escape.js';
import salmon, { bestLeaps } from '../games/salmon-run.js';
import bear, { checkRoute, solveBear } from '../games/bears-last-snack.js';
const T = (name: string, f: () => void): void => { it(name, () => { const t = Date.now(); f(); console.log(name, Date.now() - t, 'ms'); }); };
describe('movement games', () => {
  T('otter', () => { for (let d = 0; d < 30; d++) { const p = otter.generate('d' + d); const s = solveOtter(p)!; expect(flow(p, s).solved).toBe(true); expect(flow(p, p.tiles).solved).toBe(false); } });
  T('moose', () => { for (let d = 0; d < 30; d++) { const p = moose.generate('d' + d); expect(bestRoute(p, p.start)!.length - 1).toBe(p.best); } });
  T('burrow', () => { for (let d = 0; d < 15; d++) { const p = burrow.generate('d' + d); expect(solveBurrow(p)!.length - 1).toBe(p.best); } });
  T('salmon', () => { for (let d = 0; d < 30; d++) { const p = salmon.generate('d' + d); expect(bestLeaps(p, p.start)!.length - 1).toBe(p.best); } });
  T('bear', () => { for (let d = 0; d < 30; d++) { const p = bear.generate('d' + d); const r = solveBear(p, [p.start]); expect(r && checkRoute(p, r)).toBe(true); } });
});
