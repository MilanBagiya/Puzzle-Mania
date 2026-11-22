/**
 * Puzzle generator for Fresh Snow.
 * Generates puzzles with exactly one solution using seeded RNG.
 */

import type { AnimalId, Entry, HideoutType, LevelId, Pos, PrintShape, Solution } from './types';
import { LEVEL_PROFILES } from './types';
import { Board, generateBoardLayout } from './board';
import { countSolutions, solvePuzzle } from './solver';
import { getValidMoves } from './rules';
import { posKey } from './board';

// Engine version for cache invalidation
const ENGINE_VERSION = '0.1.0';

/**
 * Create a seeded random number generator from a string seed.
 */
function createSeededRNG(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }

  return function () {
    state = (state * 1103515245 + 12345) >>> 0;
    // Use a proper seeded random
    return ((state >>> 0) / 4294967296);
  };
}

/**
 * Generate a puzzle for a given date and level.
 * Returns { puzzle, solution } or throws if generation fails.
 */
export function generate(seedString: string, level: LevelId, attempt: number = 0): { puzzle: any; solution: Solution } {
  // Create seeded RNG with attempt modifier to break infinite recursion
  const actualSeed = attempt > 0 ? `${seedString}-${attempt}` : seedString;
  const rng = createSeededRNG(actualSeed);

  // Generate board layout
  const board = generateBoardLayout(rng, level);

  // Determine animals for this level
  const animals = getAnimalsForLevel(level);

  // Walk each animal to generate its path
  const paths = walkAnimals(board, animals, rng);

  // Generate prints from paths
  stampPrints(board, paths);

  // Cover some cells to hide prints
  coverCells(board, level, rng);

  // Verify uniqueness
  const puzzle = createPuzzle(board, seedString, level, paths);

  let solutionCount = countSolutions(puzzle, 2);

  // If not unique, try uncovering cells
  const profile = LEVEL_PROFILES[level];
  let attempts = 0;
  const maxAttempts = 100;
  const maxRegens = 5; // Maximum times to regenerate the board

  while (solutionCount !== 1 && attempts < maxAttempts) {
    // If puzzle is unsolvable, try uncovering a covered cell
    if (solutionCount === 0) {
      // Find covered cells to potentially uncover
      const allCovered: Pos[] = [];
      for (let r = 0; r < board.height; r++) {
        for (let c = 0; c < board.width; c++) {
          const cell = board.getCell(r, c);
          if (cell?.type === 'covered') {
            allCovered.push({ r, c });
          }
        }
      }

      if (allCovered.length === 0) {
        // No covered cells to uncover - need to regenerate with different attempt
        if (attempt + 1 < maxRegens) {
          return generate(seedString, level, attempt + 1);
        } else {
          throw new Error(`Failed to generate solvable puzzle for ${seedString}/${level} after ${maxRegens} regenerations`);
        }
      }

      // Uncover a random covered cell
      const idx = Math.floor(rng() * allCovered.length);
      const pos = allCovered[idx]!;
      const cell = board.getCell(pos.r, pos.c);

      if (cell && cell.type === 'covered') {
        // Copy the prints to snow
        const coveredCell = cell as any;
        if (coveredCell.prints && coveredCell.prints.length > 0) {
          board.cells[pos.r]![pos.c] = {
            type: 'snow',
            print: coveredCell.prints[0],
            r: pos.r,
            c: pos.c,
          };
        }
      }

      attempts++;
      solutionCount = countSolutions(puzzle, 2);
      continue;
    }

    // solutionCount > 1: too many solutions, uncover a random covered cell
    const allCovered: Pos[] = [];
    for (let r = 0; r < board.height; r++) {
      for (let c = 0; c < board.width; c++) {
        const cell = board.getCell(r, c);
        if (cell?.type === 'covered') {
          allCovered.push({ r, c });
        }
      }
    }

    if (allCovered.length === 0) {
      // No covered cells left, but still multiple solutions
      if (attempt + 1 < maxRegens) {
        return generate(seedString, level, attempt + 1);
      } else {
        throw new Error(`Failed to generate unique puzzle for ${seedString}/${level} - multiple solutions could not be resolved`);
      }
    }

    const idx = Math.floor(rng() * allCovered.length);
    const pos = allCovered[idx]!;
    if (!pos) {
      attempts++;
      solutionCount = countSolutions(puzzle, 2);
      continue;
    }
    const cell = board.getCell(pos.r, pos.c);

    if (!cell || cell.type !== 'covered') {
      attempts++;
      solutionCount = countSolutions(puzzle, 2);
      continue;
    }

    // Copy the prints to snow
    const coveredCell = cell as any;
    if (coveredCell.prints && coveredCell.prints.length > 0) {
      board.cells[pos.r]![pos.c] = {
        type: 'snow',
        print: coveredCell.prints[0],
        r: pos.r,
        c: pos.c,
      };
    }

    attempts++;
    solutionCount = countSolutions(puzzle, 2);
  }

  if (solutionCount !== 1) {
    if (attempt + 1 < maxRegens) {
      return generate(seedString, level, attempt + 1);
    }
    throw new Error(`Failed to generate unique puzzle for ${seedString}/${level} after ${maxAttempts} attempts`);
  }

  // Solve to get the official solution
  const solution = solvePuzzle(puzzle);
  if (!solution) {
    throw new Error(`Solver failed to find solution for ${seedString}/${level}`);
  }

  // Score difficulty
  const difficultyScore = scoreDifficulty(puzzle, solution);

  // Add difficulty to puzzle
  puzzle.difficulty = difficultyScore;

  return { puzzle, solution: solution! };
}

/**
 * Get animals for a given level.
 */
function getAnimalsForLevel(level: LevelId): AnimalId[] {
  switch (level) {
    case 'morning':
      return ['rabbit', 'fox'];
    case 'noon':
      return ['rabbit', 'fox', 'deer'];
    case 'night':
      return ['rabbit', 'fox', 'deer', 'squirrel'];
    case 'sunday-blizzard':
      return ['rabbit', 'fox', 'deer', 'squirrel', 'bird'];
    default:
      throw new Error(`Unknown level: ${level}`);
  }
}

/**
 * Walk each animal from entry to hideout using the movement rules.
 */
function walkAnimals(
  board: Board,
  animals: AnimalId[],
  rng: () => number,
): Record<AnimalId, Pos[]> {
  const paths: Record<AnimalId, Pos[]> = {} as Record<AnimalId, Pos[]>;

  // Find entries and hideouts
  const entries = board.entries;
  const hideouts = board.hideouts;

  // Assign each animal an entry and a hideout
  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    if (!animal) continue;
    const entry = entries[i];
    const hideout = hideouts[i];

    if (!entry) {
      throw new Error(`Missing entry for ${animal}`);
    }
    if (!hideout) {
      throw new Error(`Missing hideout for ${animal}`);
    }

    // Walk from entry to hideout
    const targetPos: Pos = { r: hideout.r, c: hideout.c };
    const path = walkPath(board, animal, entry, targetPos, rng);
    if (!path) {
      throw new Error(`Could not find path for ${animal}`);
    }

    paths[animal] = path;
    (hideout as any).animal = animal;
  }

  return paths;
}

/**
 * Find a path from start to target using the animal's movement rules.
 */
function walkPath(
  board: Board,
  animal: AnimalId,
  start: Entry,
  target: Pos,
  rng: () => number,
): Pos[] | null {
  // Use iterative DFS with depth limit
  const path = dfsPath(board, animal, { r: start.r, c: start.c }, target, rng, 100);
  return path;
}

/**
 * DFS to find path from current position to target.
 * Uses iterative deepening with a depth limit to prevent stack overflow.
 */
function dfsPath(
  board: Board,
  animal: AnimalId,
  start: Pos,
  target: Pos,
  rng: () => number,
  maxDepth: number = 50,
): Pos[] | null {
  // Use iterative DFS with explicit stack to avoid stack overflow
  interface Frame {
    pos: Pos;
    path: Pos[];
    visited: Set<string>;
    prevPos: Pos | null;
    nextMoveIdx: number;
  }

  const startKey = posKey(start.r, start.c);

  // Check if start is blocked
  const startCell = board.getCell(start.r, start.c);
  if (!startCell || startCell.type === 'rock' || startCell.type === 'tree') {
    return null;
  }

  // Check if we're already at target
  if (start.r === target.r && start.c === target.c) {
    return [start];
  }

  // Iterative DFS
  const stack: Frame[] = [{
    pos: start,
    path: [start],
    visited: new Set([startKey]),
    prevPos: null,
    nextMoveIdx: 0,
  }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]!;

    // Check depth limit
    if (frame.path.length > maxDepth) {
      stack.pop();
      continue;
    }

    // Get valid moves from current position
    // isFirstMove is true when path length <= 1 (starting position only)
    const isFirstMove = frame.path.length <= 1;
    const validMoves = getValidMoves(
      animal,
      frame.pos,
      board.width,
      board.height,
      frame.visited,
      isFirstMove,
      (r, c) => {
        const cell = board.getCell(r, c);
        if (!cell) return 'snow';
        return cell.type;
      },
      frame.prevPos,
    );

    // Sort moves by distance to target (prefer closer moves)
    const sortedMoves = [...validMoves].sort((a, b) => {
      const distA = Math.abs(a.r - target.r) + Math.abs(a.c - target.c);
      const distB = Math.abs(b.r - target.r) + Math.abs(b.c - target.c);
      return distA - distB || (rng() - 0.5);
    });

    // Try next move
    if (frame.nextMoveIdx < sortedMoves.length) {
      const next = sortedMoves[frame.nextMoveIdx]!;
      frame.nextMoveIdx++;

      // Check if we reached target
      if (next.r === target.r && next.c === target.c) {
        return [...frame.path, next];
      }

      // Create new frame for this move
      const nextKey = posKey(next.r, next.c);
      if (!frame.visited.has(nextKey)) {
        const newVisited = new Set(frame.visited);
        newVisited.add(nextKey);
        stack.push({
          pos: next,
          path: [...frame.path, next],
          visited: newVisited,
          prevPos: frame.pos,
          nextMoveIdx: 0,
        });
      }
    } else {
      // All moves tried, pop this frame
      stack.pop();
    }
  }

  return null;
}

/**
 * Stamp prints on all cells that each animal's path touches.
 */
function stampPrints(board: Board, paths: Record<AnimalId, Pos[]>): void {
  for (const [animalKey, path] of Object.entries(paths)) {
    const animal = animalKey as AnimalId;
    for (const pos of path) {
      const cell = board.getCell(pos.r, pos.c);
      if (!cell) continue;
      if (cell.type === 'snow' && !cell.print) {
        const shape = getPrintShape(animal);
        board.cells[pos.r]![pos.c] = {
          type: 'snow',
          print: { animal, shape },
          r: pos.r,
          c: pos.c,
        };
      } else if (cell.type === 'covered') {
        // Add print to covered cell
        const shape = getPrintShape(animal);
        const coveredCell = cell as any;
        if (!coveredCell.prints) {
          coveredCell.prints = [];
        }
        coveredCell.prints.push({ animal, shape } as any);
      }
    }
  }
}

/**
 * Get print shape for an animal.
 */
function getPrintShape(animal: AnimalId): PrintShape {
  const shapes: Record<AnimalId, PrintShape> = {
    rabbit: 'pair',
    fox: 'diagonal',
    deer: 'cross',
    squirrel: 'circle',
    bird: 'triangle',
    wolf: 'wavy',
    'snow-leopard': 'triangle',
  };
  return shapes[animal];
}

/**
 * Cover some random snow cells with fresh snow.
 */
function coverCells(board: Board, level: LevelId, rng: () => number): void {
  const profile = LEVEL_PROFILES[level];
  const coverCount = profile.minCovered + Math.floor(rng() * (profile.maxCovered - profile.minCovered + 1));

  const snowCells: Pos[] = [];
  for (let r = 0; r < board.height; r++) {
    for (let c = 0; c < board.width; c++) {
      const cell = board.getCell(r, c);
      if (cell?.type === 'snow' && cell.print) {
        snowCells.push({ r, c });
      }
    }
  }

  // Randomly select cells to cover
  for (let i = 0; i < coverCount && i < snowCells.length; i++) {
    const idx = i + Math.floor(rng() * (snowCells.length - i));
    const tmp = snowCells[i]!;
    const selected = snowCells[idx]!;
    snowCells[i] = selected;
    snowCells[idx] = tmp;

    const coveredPos = snowCells[i];
    if (!coveredPos) continue;
    const cell = board.getCell(coveredPos.r, coveredPos.c);
    if (cell && cell.type === 'snow' && cell.print) {
      board.cells[coveredPos.r]![coveredPos.c] = {
        type: 'covered',
        prints: [cell.print],
        r: coveredPos.r,
        c: coveredPos.c,
      };
    }
  }
}

/**
 * Create puzzle object from board.
 */
function createPuzzle(
  board: Board,
  id: string,
  level: LevelId,
  paths: Record<AnimalId, Pos[]>,
): any {
  const animals = Object.keys(paths) as AnimalId[];

  return {
    id,
    date: id.split('-')[0] + '-' + id.split('-')[1] + '-' + id.split('-')[2],
    level,
    width: board.width,
    height: board.height,
    terrain: board.cells,
    animals,
    difficulty: 0, // Will be calculated
    version: ENGINE_VERSION,
    // Store for solution generation
    _hideouts: board.hideouts,
    _entries: board.entries,
  };
}

/**
 * Score difficulty based on solver statistics.
 */
function scoreDifficulty(puzzle: any, solution: Solution): number {
  // Simple heuristic: higher difficulty = more covered cells + more crossings
  let score = 50;

  // Count covered cells
  let covered = 0;
  for (const row of puzzle.terrain) {
    for (const cell of row) {
      if (cell.type === 'covered') covered++;
    }
  }

  // Normalize to 0-50 range
  const maxCovered = puzzle.width * puzzle.height * 0.5;
  score += (covered / maxCovered) * 25;

  // Complexity based on number of animals
  const animalCount = puzzle.animals.length;
  score += Math.max(0, (animalCount - 2) * 5);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate difficulty for a generated puzzle.
 */
export function difficulty(puzzle: any): number {
  return puzzle.difficulty || 50;
}