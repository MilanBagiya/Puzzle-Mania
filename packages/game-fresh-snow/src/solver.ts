/**
 * Constraint propagation solver for Fresh Snow.
 * Uses backtracking with constraint propagation to find all solutions.
 */

import type { AnimalId, Entry, Pos, Solution } from './types';
import { getValidMoves } from './rules';
import { posKey } from './board';

interface SolverContext {
  paths: Record<AnimalId, Pos[]>;
  hideouts: Record<AnimalId, Pos>;
  visited: Set<string>[]; // per animal, indexed by position in animals array
  placedPrints: Map<string, AnimalId>; // posKey -> animal that has a print there
  animalInHideout: Map<string, AnimalId>; // hideout pos -> animal
  animalToIdx: Map<AnimalId, number>; // animal -> index in visited array
}

/**
 * Count solutions for a puzzle. Returns up to the limit.
 * Returns 0 if no solutions, 1 if exactly one, 2+ if multiple.
 */
export function countSolutions(
  puzzle: any,
  limit: number = 2,
): number {
  const ctx = initializeContext(puzzle);
  const animals = puzzle.animals as AnimalId[];
  let count = 0;

  solve(ctx, animals, puzzle, () => {
    count++;
    return count >= limit;
  });

  return count;
}

/**
 * Check if a puzzle state has a valid solution.
 */
export function solvePuzzle(puzzle: any): Solution | null {
  const ctx = initializeContext(puzzle);
  const animals = puzzle.animals as AnimalId[];
  const found = solve(ctx, animals, puzzle, () => false);
  return found ? ctxToSolution(ctx, puzzle) : null;
}

/**
 * Get hint for current puzzle state.
 */
export function getHint(puzzle: any, state: any, step: 1 | 2 | 3): any {
  // This will be implemented based on the solver state
  return null;
}

// Initialize solver context from puzzle
function initializeContext(puzzle: any): SolverContext {
  const paths: Record<AnimalId, Pos[]> = {} as Record<AnimalId, Pos[]>;
  const hideouts: Record<AnimalId, Pos> = {} as Record<AnimalId, Pos>;
  const visited: Set<string>[] = [];
  const placedPrints: Map<string, AnimalId> = new Map();
  const animalInHideout: Map<string, AnimalId> = new Map();
  const animalToIdx = new Map<AnimalId, number>();

  const animals = puzzle.animals as AnimalId[];
  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    if (!animal) continue;
    paths[animal] = [];
    visited[i] = new Set();
    animalToIdx.set(animal, i);
  }

  // Track hideouts - populate both animalInHideout map and hideouts record
  // During generation, hideouts may not have animal assigned yet, so use index-based lookup
  const hideoutCells = puzzle.terrain.flat().filter((c: any) => c.type === 'hideout');
  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    if (!animal) continue;
    const hideoutCell = hideoutCells[i]!;
    if (hideoutCell) {
      // Store index-based mapping for solve()
      hideouts[animal] = { r: hideoutCell.r, c: hideoutCell.c };
      // Also track in animalInHideout if animal is assigned
      if (hideoutCell.animal !== undefined && hideoutCell.animal !== null) {
        animalInHideout.set(posKey(hideoutCell.r, hideoutCell.c), hideoutCell.animal as AnimalId);
      }
    }
  }

  // Track prints on snow cells
  for (const row of puzzle.terrain) {
    for (const cell of row) {
      if (cell.type === 'snow' && cell.print) {
        placedPrints.set(posKey(cell.r, cell.c), cell.print.animal);
      }
      if (cell.type === 'covered' && cell.prints) {
        for (const print of cell.prints) {
          placedPrints.set(posKey(cell.r, cell.c), print.animal);
        }
      }
    }
  }

  return { paths, hideouts, visited, placedPrints, animalInHideout, animalToIdx };
}

// Iterative backtracking solver using explicit stack
interface SolveFrame {
  animalIndex: number;
  animal: AnimalId;
  moveIndex: number;
  positionIndex: number; // current depth in path for this animal
}

function solve(
  ctx: SolverContext,
  animals: AnimalId[],
  puzzle: any,
  shouldStop: () => boolean,
): boolean {
  const stack: SolveFrame[] = [];

  // Initialize: start with first animal at its entry
  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    if (!animal) continue;

    const visitedSet = ctx.visited[i];
    if (!visitedSet) continue;

    const entry = findEntryForAnimal(puzzle, animal, i);
    if (entry) {
      const startPos: Pos = { r: entry.r, c: entry.c };
      ctx.paths[animal].push(startPos);
      visitedSet.add(posKey(entry.r, entry.c));
    }

    stack.push({ animalIndex: i, animal, moveIndex: 0, positionIndex: 0 });
  }

  while (stack.length > 0) {
    if (shouldStop()) return true;

    const frame = stack[stack.length - 1]!;
    const animal = frame.animal;
    const animalIndex = frame.animalIndex;

    // Get the visited set and current path
    const visitedSet = ctx.visited[animalIndex];
    if (!visitedSet) {
      stack.pop();
      continue;
    }

    const currentPath = ctx.paths[animal];
    if (!currentPath) {
      stack.pop();
      continue;
    }

    // Find hideout for this animal
    const hideout = findHideoutForAnimal(puzzle, animal, animalIndex);

    // Check if this animal's path is complete (reached hideout)
    if (currentPath.length > 0) {
      const lastPos = currentPath[currentPath.length - 1];
      if (hideout && lastPos && isAtHideout(lastPos, hideout)) {
        // Move to next animal
        if (animalIndex + 1 >= animals.length) {
          // All animals done, check complete solution
          if (isCompleteSolution(ctx, puzzle)) {
            return true;
          }
        } else {
          // Find next frame in stack and push it
          const nextFrame = stack.find(f => f.animalIndex > animalIndex);
          if (nextFrame) {
            stack.push(nextFrame);
          }
        }
        stack.pop();
        continue;
      }
    }

    // Get current position
    const currentPos = currentPath[currentPath.length - 1];
    if (!currentPos) {
      stack.pop();
      continue;
    }

    // Get previous position for deer's "never turns back" rule
    const prevPos = currentPath.length > 1 ? currentPath[currentPath.length - 2] : null;

    // Get valid moves
    const validMoves = getValidMoves(
      animal,
      currentPos,
      puzzle.width,
      puzzle.height,
      visitedSet,
      currentPath.length <= 1,
      (r, c) => {
        const cell = puzzle.terrain?.[r]?.[c];
        if (!cell) return 'snow'; // treat out of bounds or missing cells as snow
        return cell.type;
      },
      prevPos,
    );

    // Try next move
    if (frame.moveIndex < validMoves.length) {
      const nextPos = validMoves[frame.moveIndex]!;
      frame.moveIndex++;

      // Check if we can reach a hideout from here
      if (hideout) {
        const canReach = canReachHideoutFrom(puzzle, animal, nextPos, hideout, visitedSet);
        if (!canReach) {
          // Skip this move, try next
          continue;
        }
      }

      // Try this move
      ctx.paths[animal].push(nextPos);
      visitedSet.add(posKey(nextPos.r, nextPos.c));

      // Continue with this animal (stay on same frame, will try next move on next iteration)
      continue;
    } else {
      // All moves tried for this frame, backtrack
      frame.moveIndex = 0;

      if (currentPath.length > 0) {
        const lastPos = currentPath[currentPath.length - 1];
        if (lastPos) {
          currentPath.pop();
          visitedSet.delete(posKey(lastPos.r, lastPos.c));
        }
      }

      // If path is now empty, we need to backtrack to previous animal
      // But we're already at the top of stack for this animal
      // Pop and let outer loop continue
      stack.pop();
    }
  }

  return false;
}

// Check if current state is a valid complete solution
function isCompleteSolution(ctx: SolverContext, puzzle: any): boolean {
  const animals = puzzle.animals as AnimalId[];

  // All animals must have paths
  for (const animal of animals) {
    if (!animal) continue;
    const path = ctx.paths[animal];
    if (!path || path.length === 0) return false;
    const hideoutPos = ctx.hideouts[animal];
    if (!hideoutPos) return false;

    const lastPos = path[path.length - 1];
    if (!isAtHideout(lastPos, hideoutPos)) return false;
  }

  // Only one animal per hideout
  const hideoutOccupants = new Set<string>();
  for (const [posStr, animal] of ctx.animalInHideout.entries()) {
    if (hideoutOccupants.has(posStr)) return false;
    hideoutOccupants.add(posStr);
  }

  // Rule 5: A path never stands on a visible cell that does not show that animal's print
  // This means: every non-home, non-entry cell on a path must have that animal's print
  for (const animal of animals) {
    if (!animal) continue;
    const path = ctx.paths[animal];
    if (!path) continue;

    for (const pos of path) {
      const cell = puzzle.terrain?.[pos.r]?.[pos.c];
      if (!cell) continue;

      // Skip home cells and entry cells - these don't need prints
      if (cell.type === 'hideout' || cell.type === 'entry') continue;

      // For snow cells, check that if there's a print, it matches this animal
      if (cell.type === 'snow' && cell.print) {
        if (cell.print.animal !== animal) {
          // This cell has a print for a different animal - invalid
          return false;
        }
      }
    }
  }

  // All prints must be explained by the specific animal shown in the print
  // Rule 4: Every visible (uncovered) print of an animal lies on that animal's path
  for (const row of puzzle.terrain) {
    for (const cell of row) {
      if (cell.type === 'snow' && cell.print) {
        const posStr = posKey(cell.r, cell.c);
        const expectedAnimal = cell.print.animal;
        const path = ctx.paths[expectedAnimal];

        if (!path) return false;

        // Check that the expected animal's path covers this print
        const hasPrint = path.some(p => posKey(p.r, p.c) === posStr);
        if (!hasPrint) return false;
      }
      if (cell.type === 'covered' && cell.prints) {
        // Handle covered cells with prints (can have multiple prints from different animals)
        for (const print of cell.prints) {
          const posStr = posKey(cell.r, cell.c);
          const expectedAnimal = print.animal;
          const path = ctx.paths[expectedAnimal];

          if (!path) return false;

          const hasPrint = path.some(p => posKey(p.r, p.c) === posStr);
          if (!hasPrint) return false;
        }
      }
    }
  }

  return true;
}

// Helper functions
function findEntryForAnimal(puzzle: any, animal: AnimalId, index: number): Entry | null {
  // For simplicity, assign entries in order
  // The generator will ensure proper entry distribution
  const animalEntries = puzzle.terrain.flat().filter((c: any) => c.type === 'entry') as Entry[];
  if (index < animalEntries.length) {
    return animalEntries[index]!;
  }
  return animalEntries[0] || null;
}

function findHideoutForAnimal(puzzle: any, animal: AnimalId, index: number): Pos | null {
  // During generation, hideouts may not have animal assigned yet
  // Use index-based lookup as fallback
  const hideoutCells = puzzle.terrain.flat().filter((c: any) => c.type === 'hideout');
  if (index < hideoutCells.length) {
    const hideoutCell = hideoutCells[index]!;
    return { r: hideoutCell.r, c: hideoutCell.c };
  }
  return hideoutCells[0] || null;
}

function isAtHideout(pos: Pos | undefined, hideout: Pos): boolean {
  if (!pos) return false;
  return pos.r === hideout.r && pos.c === hideout.c;
}

function canReachHideoutFrom(
  puzzle: any,
  animal: AnimalId,
  startPos: Pos,
  targetHideout: Pos,
  forbidden: Set<string>,
): boolean {
  // BFS to check if hideout is reachable
  const visited = new Set<string>();
  const queue: Pos[] = [startPos];

  while (queue.length > 0) {
    const pos = queue.shift()!;
    const key = posKey(pos.r, pos.c);

    if (visited.has(key)) continue;
    visited.add(key);

    if (pos.r === targetHideout.r && pos.c === targetHideout.c) {
      return true;
    }

    const moves = getValidMoves(animal, pos, puzzle.width, puzzle.height, visited, false, (r, c) => {
      const cell = puzzle.terrain?.[r]?.[c];
      if (!cell) return 'snow';
      return cell.type;
    });
    for (const move of moves) {
      if (!forbidden.has(posKey(move.r, move.c))) {
        queue.push(move);
      }
    }
  }

  return false;
}

function ctxToSolution(ctx: SolverContext, puzzle: any): Solution {
  return {
    puzzleId: puzzle.id,
    paths: ctx.paths,
    hideouts: ctx.hideouts,
  };
}