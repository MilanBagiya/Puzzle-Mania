import { describe, expect, it } from 'vitest';
import nutSort, { CAP, KINDS, canMove, isSorted, solveSort } from '../games/nut-sort.js';
import vineLinks, { solveVines } from '../games/vine-links.js';
import spot, { THINGS, changesOf, same } from '../games/spot-the-change.js';
import berry, { BERRIES, N as BN, adjacent, canSwap, greedy, matchesOf, play, search, startState, swapsOf } from '../games/berry-match.js';

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

describe('Spot the Change', () => {
  it('generates 120 days with exactly five changes, each a visible kind', () => {
    for (const d of dates(120)) {
      const p = spot.generate(d), c = changesOf(p);
      expect(c, d).toHaveLength(5);
      expect(p.left).toHaveLength(p.right.length);
      for (const i of c) {
        const a = p.left[i]!, b = p.right[i];
        const visible = !b || a.t !== b.t || Math.abs(a.w - b.w) >= 8 || a.c !== b.c;
        expect(visible, `${d} #${i}`).toBe(true);
      }
      for (const it of [...p.left, ...p.right]) if (it) { expect(THINGS[it.t], d).toBeTruthy(); expect(it.x).toBeGreaterThanOrEqual(-10); expect(it.x + it.w).toBeLessThanOrEqual(330); }
    }
  });
  it('things that did not change are identical in both scenes', () => {
    const p = spot.generate('2026-11-25'), c = new Set(changesOf(p));
    p.left.forEach((it, i) => { if (!c.has(i)) expect(same(it, p.right[i])).toBe(true); });
  });
  it('is deterministic and fast', () => {
    expect(spot.generate('2026-12-01')).toEqual(spot.generate('2026-12-01'));
    const t = Date.now(); for (const d of dates(100, Date.UTC(2027, 0, 1))) spot.generate(d);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe('Berry Match', () => {
  it('generates 30 days of fair boards whose goal is proven reachable within the swaps', () => {
    for (const d of dates(30)) {
      const p = berry.generate(d);
      expect(p.board).toHaveLength(BN * BN);
      expect(p.board.every((k) => k >= 0 && k < BERRIES.length)).toBe(true);
      expect(matchesOf(p.board).size, d).toBe(0); // no free lines at the start
      expect(swapsOf(p.board).length, d).toBeGreaterThan(0);
      expect(p.goal, d).toBeGreaterThanOrEqual(13);
      // Replay the greedy line with the real rules: every swap is legal and the goal is met within the par.
      const g = greedy(p); let s = startState(p), reached = 0;
      for (const sw of g.line) { const r = play(p, s, sw); expect(r, `${d} ${sw}`).not.toBeNull(); s = r!.state; reached++; if (s.got[p.target]! >= p.goal) break; }
      expect(s.got[p.target]!, d).toBeGreaterThanOrEqual(p.goal);
      expect(reached, d).toBe(p.best);
      expect(p.best, d).toBeLessThanOrEqual(p.swaps);
    }
  });
  it('is deterministic per date and differs between dates', () => {
    expect(berry.generate('2026-11-25')).toEqual(berry.generate('2026-11-25'));
    expect(berry.generate('2026-11-25')).not.toEqual(berry.generate('2026-11-26'));
  });
  it('only allows swaps between neighbours that make a line, then settles with refills from the queue', () => {
    const p = berry.generate('2026-11-25');
    expect(adjacent(0, 1)).toBe(true); expect(adjacent(6, 7)).toBe(false); expect(adjacent(0, BN)).toBe(true); expect(adjacent(0, BN + 1)).toBe(false);
    for (const [a, c] of swapsOf(p.board)) expect(canSwap(p.board, a, c)).toBe(true);
    expect(play(p, startState(p), [0, 2])).toBeNull();
    const [sw] = swapsOf(p.board), r = play(p, startState(p), sw!)!;
    expect(r.state.board.every((k) => k >= 0)).toBe(true);
    expect(matchesOf(r.state.board).size).toBe(0); // fully settled
    const picked = r.picked.reduce((a, b) => a + b, 0);
    expect(picked).toBeGreaterThanOrEqual(3);
    expect(r.state.ptr.reduce((a, b) => a + b, 0)).toBe(picked); // one new berry per berry picked
    expect(play(p, startState(p), sw!)).toEqual(r); // same swap, same result for everyone
  });
  it('the hint search finds a legal first swap', () => {
    const p = berry.generate('2026-12-01'), r = search(p, startState(p), 3, 6);
    expect(r.line.length).toBeGreaterThan(0);
    expect(canSwap(p.board, ...r.line[0]!)).toBe(true);
  });
  it('generates a puzzle quickly', () => {
    const t = Date.now(); for (const d of dates(10, Date.UTC(2027, 0, 1))) berry.generate(d);
    expect(Date.now() - t).toBeLessThan(5000);
  });
});
