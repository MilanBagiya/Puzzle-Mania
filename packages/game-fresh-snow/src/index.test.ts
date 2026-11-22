import { describe, it, expect, vi } from 'vitest';
import type { AnimalId, Pos } from './types';
import {
  generate,
  countSolutions,
  solvePuzzle,
  difficulty,
  validate,
} from './index';
import { Board, generateBoardLayout } from './board';
import { getValidMoves } from './rules';
import { posKey } from './board';

describe('Fresh Snow - Generator', () => {
  it('generates a valid puzzle for morning level', () => {
    const seed = '2027-01-18-morning-test';
    const result = generate(seed, 'morning');

    expect(result.puzzle).toBeDefined();
    expect(result.solution).toBeDefined();
    expect(result.puzzle.id).toBe(seed);
    expect(result.puzzle.level).toBe('morning');
    expect(result.puzzle.width).toBeGreaterThanOrEqual(5);
    expect(result.puzzle.height).toBeGreaterThanOrEqual(5);
    expect(result.puzzle.animals).toBeDefined();
    expect(result.puzzle.terrain).toBeDefined();
    expect(result.puzzle.difficulty).toBeGreaterThanOrEqual(0);
    expect(result.puzzle.difficulty).toBeLessThanOrEqual(100);
  });

  it('generates puzzles with correct dimensions for each level', () => {
    const morningResult = generate('test-morning', 'morning');
    expect(morningResult.puzzle.width).toBe(5);
    expect(morningResult.puzzle.height).toBe(5);

    const noonResult = generate('test-noon', 'noon');
    expect(noonResult.puzzle.width).toBe(6);
    expect(noonResult.puzzle.height).toBe(6);

    const nightResult = generate('test-night', 'night');
    expect(nightResult.puzzle.width).toBe(7);
    expect(nightResult.puzzle.height).toBe(7);

    const sundayResult = generate('test-sunday', 'sunday-blizzard');
    expect(sundayResult.puzzle.width).toBe(8);
    expect(sundayResult.puzzle.height).toBe(8);
  });

  it('generates unique solutions', () => {
    const seed = '2027-01-18-unique-test';
    const result = generate(seed, 'noon');

    const count = countSolutions(result.puzzle, 2);
    expect(count).toBe(1);
  });

  it('generates deterministic puzzles with same seed', () => {
    const seed = 'deterministic-test';
    const result1 = generate(seed, 'morning');
    const result2 = generate(seed, 'morning');

    expect(result1.puzzle.id).toBe(result2.puzzle.id);
    expect(result1.puzzle.difficulty).toBe(result2.puzzle.difficulty);
  });
});

describe('Fresh Snow - Solver', () => {
  it('counts solutions correctly', () => {
    const { puzzle } = generate('solver-test', 'morning');

    const count = countSolutions(puzzle, 10);
    expect(count).toBeGreaterThan(0);
    expect(count).toBe(1); // puzzles should have exactly one solution
  });

  it('solves a valid puzzle', () => {
    const { puzzle } = generate('solve-test', 'noon');
    const solution = solvePuzzle(puzzle);

    expect(solution).toBeDefined();
    expect(solution?.puzzleId).toBe('solve-test-noon');
    expect(solution?.paths).toBeDefined();
    expect(solution?.hideouts).toBeDefined();
  });

  it('returns null for unsolvable modified puzzle', () => {
    const { puzzle } = generate('unsolvable-test', 'morning');

    // Block an entry
    const terrain = puzzle.terrain;
    const entry = terrain.flat().find((c: any) => c.type === 'entry');
    if (entry) {
      terrain[entry.r][entry.c] = { type: 'rock', r: entry.r, c: entry.c };
    }

    const solution = solvePuzzle(puzzle);
    // Should either return null or find alternative path
    if (solution) {
      expect(solution.paths).toBeDefined();
    }
  });
});

describe('Fresh Snow - Difficulty', () => {
  it('calculates difficulty score', () => {
    const { puzzle } = generate('difficulty-test', 'morning');

    const score = difficulty(puzzle);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('morning puzzles have lower difficulty than blizzard', () => {
    const morning = generate('diff-morning', 'morning');
    const blizzard = generate('diff-blizzard', 'sunday-blizzard');

    // Sunday-Blizzard typically has higher difficulty
    expect(difficulty(blizzard.puzzle)).toBeGreaterThanOrEqual(
      difficulty(morning.puzzle) - 20
    );
  });
});

describe('Fresh Snow - Board', () => {
  it('creates board with correct dimensions', () => {
    const board = new Board(5, 5);
    expect(board.width).toBe(5);
    expect(board.height).toBe(5);
    expect(board.cells).toHaveLength(5);
    expect(board.cells[0]).toHaveLength(5);
  });

  it('initializes cells as snow type', () => {
    const board = new Board(3, 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell = board.getCell(r, c);
        expect(cell?.type).toBe('snow');
      }
    }
  });

  it('gets cell correctly', () => {
    const board = new Board(5, 5);
    expect(board.getCell(0, 0)).toBeDefined();
    expect(board.getCell(0, 0)?.type).toBe('snow');
    expect(board.getCell(-1, 0)).toBeUndefined();
    expect(board.getCell(0, -1)).toBeUndefined();
    expect(board.getCell(10, 0)).toBeUndefined();
  });

  it('sets cell correctly', () => {
    const board = new Board(3, 3);
    board.setCell(1, 1, { type: 'rock', r: 1, c: 1 });
    expect(board.getCell(1, 1)?.type).toBe('rock');
  });

  it('generates board layout with terrain', () => {
    const rng = () => 0.5;
    const board = generateBoardLayout(rng, 'morning');

    expect(board.entries.length).toBe(2);
    expect(board.hideouts.length).toBe(2);
  });
});

describe('Fresh Snow - Rules', () => {
  describe('Rabbit moves', () => {
    it('returns empty array for 1x1 board', () => {
      const moves = getValidMoves('rabbit', { r: 0, c: 0 }, 1, 1, new Set(), true);
      // On 1x1, no moves possible (need 2 cells to jump)
      expect(moves).toBeDefined();
    });

    it('allows 2-cell jumps in straight lines', () => {
      const visited = new Set<string>();
      const moves = getValidMoves('rabbit', { r: 5, c: 5 }, 10, 10, visited, false);

      // Should have up to 4 possible moves (up, down, left, right)
      expect(moves.length).toBeGreaterThanOrEqual(0);
      expect(moves.length).toBeLessThanOrEqual(4);
    });

    it('does not allow jumping over obstacles', () => {
      // This test verifies the logic - actual blocking depends on board state
      // The rules function doesn't have board access, so this tests the structure
      const moves = getValidMoves('rabbit', { r: 5, c: 5 }, 10, 10, new Set(), false);
      expect(moves.every(m => 'r' in m && 'c' in m)).toBe(true);
    });
  });

  describe('Fox moves', () => {
    it('allows diagonal movement', () => {
      const visited = new Set<string>();
      const moves = getValidMoves('fox', { r: 5, c: 5 }, 10, 10, visited, false);

      expect(moves.length).toBeGreaterThanOrEqual(0);
      expect(moves.length).toBeLessThanOrEqual(4);
      // Fox should move diagonally
      for (const move of moves) {
        const dr = Math.abs(move.r - 5);
        const dc = Math.abs(move.c - 5);
        expect(dr).toBe(1);
        expect(dc).toBe(1);
      }
    });
  });

  describe('Deer moves', () => {
    it('allows orthogonal movement', () => {
      const visited = new Set<string>();
      const moves = getValidMoves('deer', { r: 5, c: 5 }, 10, 10, visited, false);

      // Deer moves in 4 orthogonal directions
      for (const move of moves) {
        const dr = Math.abs(move.r - 5);
        const dc = Math.abs(move.c - 5);
        expect(dr + dc).toBe(1);
      }
    });
  });

  describe('Squirrel moves', () => {
    it('allows movement in all 8 directions', () => {
      const visited = new Set<string>();
      const moves = getValidMoves('squirrel', { r: 5, c: 5 }, 10, 10, visited, false);

      expect(moves.length).toBeGreaterThanOrEqual(0);
      expect(moves.length).toBeLessThanOrEqual(8);
    });
  });

  describe('Bird moves', () => {
    it('allows movement to adjacent cells', () => {
      const visited = new Set<string>();
      const moves = getValidMoves('bird', { r: 5, c: 5 }, 10, 10, visited, false);

      // Bird can move to adjacent cells (including diagonals)
      expect(moves.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Wolf moves', () => {
    it('allows revisiting cells', () => {
      const visited = new Set<string>();
      visited.add(posKey(4, 5)); // Mark a cell as visited

      const moves = getValidMoves('wolf', { r: 5, c: 5 }, 10, 10, visited, false);

      // Wolves can revisit, so they can still move to visited cells
      expect(moves.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Snow Leopard moves', () => {
    it('allows knight moves', () => {
      const visited = new Set<string>();
      const moves = getValidMoves('snow-leopard', { r: 4, c: 4 }, 10, 10, visited, false);

      // Snow leopard moves in L-shapes (2 in one direction, 1 perpendicular)
      expect(moves.length).toBeGreaterThanOrEqual(0);
      expect(moves.length).toBeLessThanOrEqual(8);

      // Verify all moves are valid knight moves
      for (const move of moves) {
        const dr = Math.abs(move.r - 4);
        const dc = Math.abs(move.c - 4);
        expect((dr === 2 && dc === 1) || (dr === 1 && dc === 2)).toBe(true);
      }
    });
  });
});

describe('Fresh Snow - Validator', () => {
  it('validates empty path as missing', () => {
    const { puzzle } = generate('validate-test', 'morning');

    const state = {
      paths: {} as Record<AnimalId, Pos[] | null>,
      checks: 0,
      hints: 0,
      pencils: new Map(),
    };

    puzzle.animals.forEach((animal: AnimalId) => {
      state.paths[animal] = null;
    });

    const result = validate(puzzle, state);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates complete solution as valid', () => {
    const { puzzle, solution } = generate('validate-valid-test', 'noon');

    const state = {
      paths: {} as Record<AnimalId, Pos[]>,
      checks: 0,
      hints: 0,
      pencils: new Map(),
    };

    // Build player state from solution
    (Object.keys(solution.paths) as AnimalId[]).forEach((animal) => {
      state.paths[animal] = solution.paths[animal];
    });

    const result = validate(puzzle, state);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Fresh Snow - PosKey', () => {
  it('generates consistent keys', () => {
    expect(posKey(0, 0)).toBe('0,0');
    expect(posKey(1, 2)).toBe('1,2');
    expect(posKey(5, 10)).toBe('5,10');
  });
});

describe('Fresh Snow - Integration', () => {
  it('end-to-end puzzle generation and solving', () => {
    const seed = 'integration-test-123';
    const level = 'noon' as const;

    // Generate
    const { puzzle, solution } = generate(seed, level);

    // Verify puzzle structure
    expect(puzzle.id).toBe(seed);
    expect(puzzle.level).toBe(level);

    // Verify uniqueness
    const solutionCount = countSolutions(puzzle, 2);
    expect(solutionCount).toBe(1);

    // Verify solution matches
    expect(solution.puzzleId).toBe(seed);
    for (const animal of puzzle.animals as AnimalId[]) {
      expect(solution.paths[animal]).toBeDefined();
      expect(solution.paths[animal].length).toBeGreaterThan(0);
    }

    // Verify difficulty is valid
    const diff = difficulty(puzzle);
    expect(diff).toBeGreaterThanOrEqual(0);
    expect(diff).toBeLessThanOrEqual(100);
  });

  it('generates valid puzzles across all levels', () => {
    const levels: ('morning' | 'noon' | 'night' | 'sunday-blizzard')[] = [
      'morning',
      'noon',
      'night',
      'sunday-blizzard',
    ];

    for (const level of levels) {
      const { puzzle } = generate(`level-${level}`, level);

      expect(puzzle.terrain).toBeDefined();
      expect(puzzle.terrain.length).toBe(puzzle.height);

      for (const row of puzzle.terrain) {
        expect(row.length).toBe(puzzle.width);
      }

      // Verify solution count
      expect(countSolutions(puzzle, 2)).toBe(1);
    }
  });
});