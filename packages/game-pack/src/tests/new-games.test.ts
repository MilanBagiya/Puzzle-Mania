import { describe, expect, it } from 'vitest';
import nutSort, { CAP, KINDS, canMove, isSorted, solveSort } from '../games/nut-sort.js';
import vineLinks, { solveVines, vineHint } from '../games/vine-links.js';
import spot, { THINGS, changesOf, same } from '../games/spot-the-change.js';
import burrow, { HINT_CAP, movesOf as burrowMoves, solveBurrow } from '../games/burrow-escape.js';
import { coach, nb4, rngFrom } from '../shared.js';
import moose, { bestRoute, mooseHint, slide as mooseSlide } from '../games/moose-crossing.js';
import bear, { bearHint, checkRoute, solveBear } from '../games/bears-last-snack.js';
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
  it('a hint extends a vine by one square and cuts any other vine on those squares', () => {
    // 3×3 board; solution vine 0 runs along the top row, vine 1 down the right column and so on.
    const sol = [[0, 1, 2], [5, 8], [3, 4], [6, 7]];
    const h = vineHint(sol, [[0], [5, 4, 1], [], []])!;
    expect(h.vine).toBe(0);
    expect(h.paths[0]).toEqual([0, 1]);
    expect(h.paths[1]).toEqual([5, 4]); // cut where it crossed square 1
    expect(h.paths[1]!.some((i) => h.paths[0]!.includes(i))).toBe(false);
  });
  it('a hint starts from whichever end the player began at, and is null when all vines are right', () => {
    const sol = [[0, 1, 2], [3, 4, 5]];
    expect(vineHint(sol, [[2], []])!.paths[0]).toEqual([2, 1]);
    expect(vineHint(sol, [[0, 1, 2], [5, 4, 3]])).toBeNull();
  });
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

describe('Burrow Escape hints', () => {
  // Boards scrambled far from the start used to need more search than the hint allowed, so Hint did nothing.
  it('finds a hint from deeply scrambled boards that the old 30k-state cap could not solve', () => {
    for (const [seed, steps] of [['2026-02-11', 60], ['2026-10-18', 300], ['2026-11-21', 300]] as const) {
      const p = burrow.generate(seed), rng = rngFrom('y' + seed);
      // Random legal slides (never the winning one): a 60-slide scramble, then a fresh 300-slide one from the same stream.
      const scramble = (n: number): typeof p.pieces => {
        let ps = p.pieces;
        for (let k = 0; k < n; k++) {
          const ms = burrowMoves(p.n, ps).filter((m) => m.to.c + m.to.len < p.n || m.k !== 0);
          const m = ms[Math.floor(rng() * ms.length)]!; ps = ps.map((x, i) => (i === m.k ? m.to : x));
        }
        return ps;
      };
      let ps = scramble(60);
      if (steps === 300) ps = scramble(300);
      expect(solveBurrow({ n: p.n, pieces: ps }), `${seed} old cap`).toBeNull();
      const sol = solveBurrow({ n: p.n, pieces: ps }, HINT_CAP);
      expect(sol, seed).not.toBeNull();
      expect(sol!.at(-1)![0]!.c + 2, seed).toBe(p.n); // the rabbit reaches the exit
    }
  });
});

describe('Moose Crossing hints', () => {
  it('from a trapped square, the hint says how many slides to undo (it used to do nothing)', () => {
    let trapped = 0;
    for (const seed of dates(120)) {
      const p = moose.generate(seed);
      // Every square the moose can reach from the start, with the slides that get it there.
      const via = new Map<number, number[]>([[p.start, [p.start]]]), q = [p.start];
      for (let h = 0; h < q.length; h++) for (let d = 0; d < 4; d++) { const j = mooseSlide(p, q[h]!, d); if (!via.has(j)) { via.set(j, [...via.get(q[h]!)!, j]); q.push(j); } }
      for (const [sq, path] of via) {
        if (sq === p.lake || bestRoute(p, sq)) continue;
        trapped++;
        const h = mooseHint(p, path);
        expect(h && 'undo' in h, `${seed} square ${sq}`).toBe(true);
        const back = path.slice(0, path.length - (h as { undo: number }).undo);
        expect(bestRoute(p, back.at(-1)!), `${seed}: undoing reaches a square that can still win`).not.toBeNull();
        expect(mooseHint(p, back) && 'dir' in mooseHint(p, back)!, seed).toBe(true);
      }
    }
    expect(trapped).toBeGreaterThan(0); // the case really occurs
  });
  it('from a normal square the hint names the first slide of a shortest route', () => {
    for (const seed of dates(30)) {
      const p = moose.generate(seed), h = mooseHint(p, [p.start]) as { dir: number };
      expect(bestRoute(p, mooseSlide(p, p.start, h.dir))!.length, seed).toBe(p.best);
    }
  });
});

describe("Bear's Last Snack hints", () => {
  it('a route that visits a numbered bush at the wrong step is cut back to where it can still win', () => {
    let tested = 0;
    for (const seed of dates(60)) {
      const p = bear.generate(seed), rng = rngFrom('wrong:' + seed);
      for (let trial = 0; trial < 20; trial++) {
        // Walk randomly until the bear steps on a numbered bush at the wrong step.
        const route = [p.start];
        for (;;) {
          const opts = nb4(p.n, route.at(-1)!).filter((j) => !route.includes(j));
          if (!opts.length) break;
          route.push(opts[Math.floor(rng() * opts.length)]!);
          const g = p.given[String(route.at(-1))];
          if (g && g !== route.length) break;
        }
        const g = p.given[String(route.at(-1))];
        if (!g || g === route.length) continue;
        tested++;
        expect(solveBear(p, route), `${seed}: a broken route never counts as solvable`).toBeNull();
        const next = bearHint(p, route)!;
        expect(next.length, seed).toBeLessThanOrEqual(route.length); // shortened, then one step added
        expect(next.slice(0, -1), seed).toEqual(route.slice(0, next.length - 1));
        expect(checkRoute(p, solveBear(p, next)!), seed).toBe(true); // and it can still be finished
      }
    }
    expect(tested).toBeGreaterThan(20);
  });
  it('on a good route the hint adds exactly one step', () => {
    for (const seed of dates(20)) {
      const p = bear.generate(seed), next = bearHint(p, [p.start])!;
      expect(next).toHaveLength(2);
      expect(next[0]).toBe(p.start);
    }
  });
});

describe('message host', () => {
  it("the host animal's face follows the message: happy, oops or calm", () => {
    expect(coach('Yes!', 'good', 'bear')).toContain('#ch-bear-happy');
    expect(coach('Not there.', 'bad', 'bear')).toContain('#ch-bear-oops');
    expect(coach('Tap a bush.', '', 'bear')).toContain('#ch-bear-idle');
    expect(coach('Tap a bush.')).not.toContain('coach-host'); // games without a host are unchanged
  });
});

describe('review fixes', () => {
  it('Spot the Change never makes a colour-only change (colour-blind players must see every change)', () => {
    for (const d of dates(120)) {
      const p = spot.generate(d);
      for (const i of changesOf(p)) {
        const a = p.left[i]!, b = p.right[i];
        if (b) expect(b.t !== a.t || b.w !== a.w, `${d} #${i}`).toBe(true);
      }
    }
  });
});
