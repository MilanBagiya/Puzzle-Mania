import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { generateNests, solveNests } from './engine.js';

// Seeds are the generator's real seeds: 'YYYY-MM-DD' dates (plus some arbitrary strings).
const isoDate = fc.integer({ min: 0, max: 365 * 30 }).map((d) => new Date(Date.UTC(2025, 0, 1 + d)).toISOString().slice(0, 10));
const seed = fc.oneof(isoDate, isoDate, fc.string({ maxLength: 12 }));

describe('Nests uniqueness (property)', () => {
  it('every generated puzzle has exactly one solution, the generator’s own', () => {
    fc.assert(fc.property(seed, (s) => {
      const { puzzle, solution } = generateNests(s);
      const found = solveNests(puzzle, 2);
      expect(found, s).toHaveLength(1);
      expect([...found[0]!].sort((a, b) => a - b)).toEqual([...solution].sort((a, b) => a - b));
    }), { numRuns: 100, seed: 20261125 });
  });
});
