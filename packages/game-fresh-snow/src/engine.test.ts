import { describe, expect, it } from 'vitest';
import {
  LEVELS, checkPaths, countSolutions, generatePuzzle, hint, isBorder, isSolved, legalNextCells,
  rawMoves, solve, type LevelId, type PlayerPaths, type Puzzle,
} from './engine.js';

const LEVEL_IDS: LevelId[] = ['morning', 'noon', 'night'];
const idx = (n: number, r: number, c: number): number => r * n + c;
const movesFrom = (n: number, a: 'fox' | 'rabbit' | 'deer', i: number, prev: readonly [number, number] | null = null): number[] =>
  rawMoves(n, a, i, prev).map((m) => m.idx).sort((x, y) => x - y);

describe('movement rules', () => {
  it('fox moves 1 square diagonally', () => {
    expect(movesFrom(5, 'fox', idx(5, 2, 2))).toEqual([idx(5, 1, 1), idx(5, 1, 3), idx(5, 3, 1), idx(5, 3, 3)].sort((a, b) => a - b));
  });
  it('fox stays on the board at a corner', () => {
    expect(movesFrom(5, 'fox', idx(5, 0, 0))).toEqual([idx(5, 1, 1)]);
  });
  it('rabbit hops exactly 2 squares in a straight line', () => {
    expect(movesFrom(5, 'rabbit', idx(5, 2, 2))).toEqual([idx(5, 0, 2), idx(5, 2, 0), idx(5, 2, 4), idx(5, 4, 2)].sort((a, b) => a - b));
  });
  it('rabbit stays on the board near an edge', () => {
    expect(movesFrom(5, 'rabbit', idx(5, 0, 1))).toEqual([idx(5, 0, 3), idx(5, 2, 1)].sort((a, b) => a - b));
  });
  it('deer moves 1 square straight', () => {
    expect(movesFrom(5, 'deer', idx(5, 2, 2))).toHaveLength(4);
  });
  it('deer never reverses its previous direction', () => {
    // came in moving right ([0, 1]); moving left ([0, -1]) is not allowed
    const m = movesFrom(5, 'deer', idx(5, 2, 2), [0, 1]);
    expect(m).not.toContain(idx(5, 2, 1));
    expect(m).toHaveLength(3);
  });
  it('isBorder detects edge cells', () => {
    expect(isBorder(5, idx(5, 0, 3))).toBe(true);
    expect(isBorder(5, idx(5, 2, 2))).toBe(false);
  });
});

describe('generator', () => {
  it('is deterministic: same seed and level give the same puzzle', () => {
    const a = generatePuzzle('night', '2027-01-18');
    const b = generatePuzzle('night', '2027-01-18');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('different dates give different puzzles', () => {
    const a = generatePuzzle('noon', '2027-01-18');
    const b = generatePuzzle('noon', '2027-01-19');
    expect(JSON.stringify(a.puzzle)).not.toBe(JSON.stringify(b.puzzle));
  });
  it.each(LEVEL_IDS)('%s puzzles match the level profile', (level) => {
    const { puzzle } = generatePuzzle(level, '2027-02-01');
    const L = LEVELS[level];
    expect(puzzle.n).toBe(L.n);
    expect(puzzle.terrain).toHaveLength(L.n * L.n);
    expect(puzzle.animals).toEqual([...L.animals]);
    expect(puzzle.homes).toHaveLength(L.animals.length);
  });
  it('the puzzle object contains no solution data', () => {
    const { puzzle } = generatePuzzle('night', '2027-01-18');
    expect(Object.keys(puzzle).sort()).toEqual(['animals', 'covered', 'homes', 'level', 'n', 'prints', 'seed', 'terrain']);
  });
  it('never publishes the prints hidden under a drift (daily levels and Trek stages)', () => {
    const puzzles = [
      ...LEVEL_IDS.flatMap((l) => Array.from({ length: 40 }, (_, d) => generatePuzzle(l, `2027-01-${String(d + 1).padStart(2, '0')}`).puzzle)),
      ...Array.from({ length: TREK_STAGE_COUNT }, (_, s) => generateTrekStage(s + 1).puzzle),
    ];
    expect(puzzles.reduce((n, p) => n + p.covered.length, 0)).toBeGreaterThan(500); // the check is not vacuous
    for (const p of puzzles) {
      for (const i of p.covered) expect(p.prints[i], `${p.seed}/${p.level} cell ${i}`).toEqual([]);
    }
  });
  it.each(LEVEL_IDS)('%s: 300 puzzles all have exactly 1 solution, and it passes the validator', (level) => {
    for (let d = 0; d < 300; d++) {
      const { puzzle, solution } = generatePuzzle(level, `seed-${d}`);
      expect(countSolutions(puzzle, 3)).toBe(1);
      expect(checkPaths(puzzle, solution)).toEqual([]);
      expect(solve(puzzle)).toEqual(solution);
    }
  });
  it('every animal leaves at least one visible print', () => {
    for (let d = 0; d < 100; d++) {
      const { puzzle } = generatePuzzle('night', `fair-${d}`);
      const covered = new Set(puzzle.covered);
      for (const a of puzzle.animals) {
        expect(puzzle.prints.some((pr, i) => pr.includes(a) && !covered.has(i))).toBe(true);
      }
    }
  });
  it('a night puzzle generates in under 2 seconds', () => {
    const t0 = Date.now();
    generatePuzzle('night', 'speed-test');
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});

describe('validator', () => {
  const g = generatePuzzle('noon', '2027-01-18');
  const p: Puzzle = g.puzzle;
  const sol = g.solution as Required<PlayerPaths>;
  const fox = sol.fox;

  it('accepts the correct solution', () => {
    expect(isSolved(p, sol)).toBe(true);
  });
  it('reports a missing path', () => {
    expect(checkPaths(p, { ...sol, fox: [] })[0]?.code).toBe('no-path');
  });
  it('reports a path that is not home yet', () => {
    expect(checkPaths(p, { ...sol, fox: fox.slice(0, -1) })[0]?.code).toBe('not-home');
  });
  it('reports two animals sharing a home', () => {
    // 5x5 open snow: fox 0 -> 6 -> 12 and deer 2 -> 7 -> 12 both end in home 12
    const prints: Puzzle['prints'] = Array.from({ length: 25 }, () => []);
    prints[0] = ['fox']; prints[6] = ['fox']; prints[2] = ['deer']; prints[7] = ['deer'];
    const tiny: Puzzle = {
      n: 5, level: 'morning', seed: 'tiny', terrain: new Array(25).fill(0), homes: [12, 24],
      prints, animals: ['fox', 'deer'], covered: [],
    };
    const errs = checkPaths(tiny, { fox: [0, 6, 12], deer: [2, 7, 12] });
    expect(errs.map((e) => e.code)).toContain('shared-home');
  });
  it('reports standing on a visible cell without that animal\'s print, and a missed print', () => {
    const prints: Puzzle['prints'] = Array.from({ length: 25 }, () => []);
    prints[0] = ['fox']; prints[6] = ['fox']; prints[12] = ['fox'];
    const tiny: Puzzle = {
      n: 5, level: 'morning', seed: 'tiny2', terrain: new Array(25).fill(0), homes: [18, 2],
      prints, animals: ['fox'], covered: [],
    };
    expect(checkPaths(tiny, { fox: [0, 6, 12, 18] }).map((e) => e.code)).toEqual([]);
    expect(checkPaths(tiny, { fox: [0, 6, 2] }).map((e) => e.code)).toContain('missed-print');
    expect(checkPaths(tiny, { fox: [4, 8, 12, 18] }).map((e) => e.code)).toContain('no-print-here');
  });
  it('reports a trail that breaks the movement rule', () => {
    const broken = [fox[0] as number, fox[0] as number];
    expect(checkPaths(p, { ...sol, fox: broken })[0]?.code).toBe('no-path');
  });
  it('legalNextCells starts on open border cells and follows the rule', () => {
    const start = legalNextCells(p, 'fox', []);
    expect(start.every((i) => isBorder(p.n, i))).toBe(true);
    const next = legalNextCells(p, 'fox', [fox[0] as number]);
    expect(next).toContain(fox[1] as number);
  });
});

describe('hint', () => {
  it('gives the first correct step on an empty board', () => {
    const { puzzle, solution } = generatePuzzle('morning', '2027-01-18');
    const h = hint(puzzle, {});
    expect(h).not.toBeNull();
    expect(h?.path).toEqual((solution[h!.animal] ?? []).slice(0, 1));
  });
  it('cuts off a wrong step and adds the correct one', () => {
    const { puzzle, solution } = generatePuzzle('noon', '2027-01-20');
    const a = puzzle.animals[0]!;
    const right = solution[a]!;
    const h = hint(puzzle, { [a]: [right[0] as number, -1] });
    expect(h?.path).toEqual(right.slice(0, 2));
  });
  it('returns null when everything is solved', () => {
    const { puzzle, solution } = generatePuzzle('morning', '2027-01-21');
    expect(hint(puzzle, solution)).toBeNull();
  });
});

import { generateTrekStage, trekProfile, TREK_STAGE_COUNT } from './engine.js';
describe('Trail Trek', () => {
  it('generates all 60 stages with exactly one solution, getting harder', () => {
    let lastN = 0;
    for (let s = 1; s <= TREK_STAGE_COUNT; s++) {
      const { puzzle } = generateTrekStage(s);
      expect(countSolutions(puzzle, 2)).toBe(1);
      expect(puzzle.n).toBeGreaterThanOrEqual(lastN);
      expect(puzzle.animals).toEqual([...trekProfile(s).animals]);
      lastN = puzzle.n;
    }
  });
  it('is deterministic', () => {
    expect(generateTrekStage(37).puzzle).toEqual(generateTrekStage(37).puzzle);
  });
});
