import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { generateDawn, orderFits, permutations, toPublic } from './generator.js';

const isoDate = fc.integer({ min: 0, max: 365 * 30 }).map((d) => new Date(Date.UTC(2025, 0, 1 + d)).toISOString().slice(0, 10));
const seed = fc.oneof(isoDate, isoDate, fc.string({ maxLength: 12 }));

describe('Dawn Chorus uniqueness (property)', () => {
  it('the public clues fit exactly one bird order, the answer', () => {
    fc.assert(fc.property(seed, (s) => {
      const d = generateDawn(s), pub = toPublic(s, d);
      const fits = permutations(pub.birds).filter((o) => orderFits(pub, o));
      expect(fits, s).toEqual([d.answer]);
    }), { numRuns: 300, seed: 20261125 });
  });
});
