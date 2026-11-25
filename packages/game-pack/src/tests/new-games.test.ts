import { describe, expect, it } from 'vitest';
import nutSort, { CAP, KINDS, canMove, isSorted, solveSort } from '../games/nut-sort.js';
import vineLinks, { solveVines } from '../games/vine-links.js';

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

describe('Vine Links', () => {
  it('generates 40 days of puzzles, each with exactly one solution that covers every square', () => {
    for (const d of dates(40)) {
      const p = vineLinks.generate(d);
      const ends = p.pairs.flat();
      expect(new Set(ends).size, d).toBe(ends.length); // no square holds two flowers
      const sols = solveVines(p, 3);
      expect(sols, d).toHaveLength(1);
      const cells = sols[0]!.flat();
      expect(new Set(cells).size, d).toBe(p.n * p.n); // every square covered exactly once
      expect(cells.length, d).toBe(p.n * p.n);
      sols[0]!.forEach((path, c) => { expect([path[0], path[path.length - 1]].sort(), d).toEqual([...p.pairs[c]!].sort()); });
    }
  });
  it('the puzzle file holds only the flowers (no vines)', () => {
    expect(Object.keys(vineLinks.generate('2026-11-25')).sort()).toEqual(['n', 'pairs', 'seed']);
  });
  it('the solver rejects a meadow with two answers', () => {
    // 2x... in a 3x3 with one pair in opposite corners and nothing else, many snake paths cover it.
    expect(solveVines({ seed: 'x', n: 3, pairs: [[0, 8]] }, 2).length).toBe(2);
  });
  it('generates quickly', () => {
    const t = Date.now(); for (const d of dates(20, Date.UTC(2027, 0, 1))) vineLinks.generate(d);
    expect(Date.now() - t).toBeLessThan(5000);
  });
});
