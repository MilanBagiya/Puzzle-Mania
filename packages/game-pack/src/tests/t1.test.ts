import { describe, expect, it } from 'vitest';
import { solveCount } from '../shared.js';
import owl from '../games/owl-watch.js'; import acorn from '../games/acorn-stash.js'; import hive from '../games/beehive.js';
describe('counting games', () => {
  for (const g of [owl, acorn, hive]) it(g.id + ' unique for 40 days', () => {
    const t0 = Date.now();
    for (let d = 0; d < 40; d++) expect(solveCount(g.generate('d' + d), 2)).toHaveLength(1);
    console.log(g.id, Date.now() - t0, 'ms');
  });
});
