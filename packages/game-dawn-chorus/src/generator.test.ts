import { describe, expect, it } from 'vitest';
import { clueHolds, generateDawn, orderFits, permutations, solveDawn, toPublic } from './generator.js';

describe('Dawn Chorus generator', () => {
  it('is deterministic per date', () => {
    expect(generateDawn('2027-01-18')).toEqual(generateDawn('2027-01-18'));
  });
  it('gives every puzzle in a year exactly one answer with 3–6 clues', () => {
    for (let d = 0; d < 365; d++) {
      const g = generateDawn('day-' + d);
      const fits = permutations(g.birds).filter((order) => g.clues.every((c) => clueHolds(c, order)));
      expect(fits).toEqual([g.answer]);
      expect(g.clues.length).toBeGreaterThanOrEqual(3);
      expect(g.clues.length).toBeLessThanOrEqual(6);
      expect(g.text).toHaveLength(g.clues.length);
      const pub = toPublic('day-' + d, g);
      expect('answer' in pub).toBe(false);
      expect(solveDawn(pub)).toEqual(g.answer);
      expect(orderFits(pub, g.answer)).toBe(true);
    }
  });
});
