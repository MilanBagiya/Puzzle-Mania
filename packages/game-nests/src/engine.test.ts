import { describe, expect, it } from 'vitest';
import { checkNests, generateNests, solveNests, type Mark } from './engine.js';

describe('Nests', () => {
  it('generates a year of unique daily puzzles quickly', () => {
    const t0 = Date.now();
    for (let d = 0; d < 120; d++) {
      const { puzzle, solution } = generateNests('day-' + d);
      expect(solveNests(puzzle, 2)).toEqual([solution]);
    }
    expect(Date.now() - t0).toBeLessThan(20000);
  });
  it('accepts the answer and rejects a wrong board', () => {
    const { puzzle, solution } = generateNests('2027-01-18');
    const marks: Mark[] = Array(36).fill(0);
    solution.forEach((i) => { marks[i] = 1; });
    expect(checkNests(puzzle, marks).solved).toBe(true);
    marks[solution[0]!] = 0;
    expect(checkNests(puzzle, marks).solved).toBe(false);
  });
  it('is deterministic', () => { expect(generateNests('x')).toEqual(generateNests('x')); });
});
