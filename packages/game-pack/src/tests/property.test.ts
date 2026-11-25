import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { solveCount } from '../shared.js';
import owl from '../games/owl-watch.js';
import acorn from '../games/acorn-stash.js';
import hive from '../games/beehive.js';
import pond, { solvePond } from '../games/frog-pond.js';
import fire, { solveFireflies } from '../games/firefly-night.js';
import lodge, { solveLodges } from '../games/beaver-lodges.js';
import picture, { lineSolve } from '../games/snow-picture.js';
import { PACK } from '../index.js';

// Seeds are the generator's real seeds: 'YYYY-MM-DD' dates (plus some arbitrary strings).
const isoDate = fc.integer({ min: 0, max: 365 * 30 }).map((d) => new Date(Date.UTC(2025, 0, 1 + d)).toISOString().slice(0, 10));
const seed = fc.oneof(isoDate, isoDate, fc.string({ maxLength: 12 }));
const opts = (numRuns: number) => ({ numRuns, seed: 20261125 });

describe('pack logic games: exactly one solution (property)', () => {
  it('covers every logic game in the pack', () => {
    expect(PACK.filter((g) => g.kind === 'logic').map((g) => g.id).sort()).toEqual(['acorn-stash', 'beaver-lodges', 'beehive', 'firefly-night', 'frog-pond', 'owl-watch', 'snow-picture']);
  });
  it('owl-watch generates a unique puzzle on dates that used to fail', () => {
    for (const d of ['2025-01-30', '2025-05-22', '2025-06-21', '2025-09-27', '2026-01-08', '2028-11-17']) expect(solveCount(owl.generate(d), 2), d).toHaveLength(1);
  });
  for (const g of [owl, acorn, hive]) {
    it(g.id, () => { fc.assert(fc.property(seed, (s) => { expect(solveCount(g.generate(s), 2), s).toHaveLength(1); }), opts(100)); });
  }
  it('frog-pond', () => { fc.assert(fc.property(seed, (s) => { expect(solvePond(pond.generate(s), 2), s).toHaveLength(1); }), opts(100)); });
  it('firefly-night', () => { fc.assert(fc.property(seed, (s) => { expect(solveFireflies(fire.generate(s), 2), s).toHaveLength(1); }), opts(100)); });
  it('beaver-lodges', () => { fc.assert(fc.property(seed, (s) => { expect(solveLodges(lodge.generate(s), 2), s).toHaveLength(1); }), opts(100)); });
  // Snow Picture is line-solvable: solving line by line with no guessing proves the picture is the only one.
  it('snow-picture', () => { fc.assert(fc.property(seed, (s) => { const p = picture.generate(s); expect(lineSolve(p.rows, p.cols, p.n), s).not.toBeNull(); }), opts(100)); });
});
