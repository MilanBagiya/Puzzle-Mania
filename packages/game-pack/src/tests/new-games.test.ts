import { describe, expect, it } from 'vitest';
import nutSort, { CAP, KINDS, canMove, isSorted, solveSort } from '../games/nut-sort.js';

// Real seeds are 'YYYY-MM-DD' dates.
const dates = (n: number, from = Date.UTC(2026, 0, 1)): string[] => Array.from({ length: n }, (_, d) => new Date(from + d * 86_400_000 * 5).toISOString().slice(0, 10));

describe('Nut Sort', () => {
  it('generates 60 days of solvable puzzles, each with its fewest-move count', () => {
    for (const d of dates(60)) {
      const p = nutSort.generate(d);
      expect(p.baskets).toHaveLength(KINDS.length + 2);
      expect(p.baskets.flat().sort()).toEqual(Array.from({ length: KINDS.length * CAP }, (_, i) => Math.floor(i / CAP)));
      expect(isSorted(p.baskets), d).toBe(false);
      // Replaying the solver's moves (each one legal) really sorts the baskets, in exactly `best` moves.
      const b = p.baskets.map((t) => [...t]), sol = solveSort(b)!;
      expect(sol, d).toHaveLength(p.best);
      for (const [f, t] of sol) { expect(canMove(b, f, t), `${d} ${f}->${t}`).toBe(true); b[t]!.push(b[f]!.pop()!); }
      expect(isSorted(b), d).toBe(true);
    }
  });
  it('is deterministic per date and differs between dates', () => {
    expect(nutSort.generate('2026-11-25')).toEqual(nutSort.generate('2026-11-25'));
    expect(nutSort.generate('2026-11-25')).not.toEqual(nutSort.generate('2026-11-26'));
  });
  it('only allows legal moves', () => {
    const b = [[0, 1], [1], [], [2, 2, 2, 2]];
    expect(canMove(b, 0, 1)).toBe(true); // 1 onto 1
    expect(canMove(b, 1, 0)).toBe(true);
    expect(canMove(b, 0, 2)).toBe(true); // onto empty
    expect(canMove(b, 2, 0)).toBe(false); // from empty
    expect(canMove(b, 0, 3)).toBe(false); // full
    expect(canMove([[0], [1]], 0, 1)).toBe(false); // different kind
  });
  it('generates a puzzle in well under a second', () => {
    const t = Date.now(); for (const d of dates(20, Date.UTC(2027, 0, 1))) nutSort.generate(d);
    expect(Date.now() - t).toBeLessThan(3000);
  });
});
