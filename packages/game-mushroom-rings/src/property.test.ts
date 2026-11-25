import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { candidates, generateRings } from './engine.js';

const isoDate = fc.integer({ min: 0, max: 365 * 30 }).map((d) => new Date(Date.UTC(2025, 0, 1 + d)).toISOString().slice(0, 10));
const seed = fc.oneof(isoDate, isoDate, fc.string({ maxLength: 12 }));

describe('Mushroom Rings uniqueness (property)', () => {
  it('every generated puzzle leaves exactly one possible spore square, the real one', () => {
    fc.assert(fc.property(seed, (s) => {
      const { puzzle, spore } = generateRings(s);
      expect(candidates(puzzle), s).toEqual([spore]);
    }), { numRuns: 300, seed: 20261125 });
  });
});
