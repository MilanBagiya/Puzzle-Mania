import { describe, expect, it } from 'vitest';
import { candidates, generateRings } from './engine.js';
describe('Mushroom Rings', () => {
  it('every daily puzzle has exactly one possible spore square', () => {
    for (let d = 0; d < 200; d++) {
      const { puzzle, spore } = generateRings('day-' + d);
      expect(candidates(puzzle)).toEqual([spore]);
      expect(puzzle.leaves.includes(spore)).toBe(false);
    }
  });
});
