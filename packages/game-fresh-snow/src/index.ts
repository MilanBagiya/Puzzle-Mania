/**
 * Fresh Snow game package - puzzle engine, generator, solver, validator.
 * Puzzle is generated and verified by code; solution is never sent to the browser.
 */

export * from './types';
export * from './board';
export * from './rules';
export * from './solver';
export * from './validator';
export * from './generator';

import type { AnimalId, LevelId, Pos, Solution } from './types';
import { generate, difficulty } from './generator';
import { countSolutions, solvePuzzle } from './solver';
import { validate } from './validator';
import type { RuleError } from './types';
import { posKey } from './board';

// Player state type
export interface FreshSnowPlayerState {
  paths: Record<AnimalId, Pos[] | null>;
  checks: number;
  hints: number;
  pencils: Map<string, AnimalId>; // "r,c" -> animal that could be there
}

// Puzzle result type
export interface FreshSnowResult {
  completed: boolean;
  timeMs: number;
  checks: number;
  hints: number;
}

// Create the DailyGame implementation for Fresh Snow
export const freshSnowGame = {
  id: 'fresh-snow',
  name: 'Fresh Snow',
  levels: ['morning', 'noon', 'night', 'sunday-blizzard'] as LevelId[],
  addedOn: '2027-01-18',

  // Generator side (Node, nightly)
  generate(seed: string, level: LevelId): { puzzle: any; solution: Solution } {
    return generate(`${seed}-${level}`, level);
  },

  countSolutions(puzzle: any, limit: number): number {
    return countSolutions(puzzle, limit);
  },

  difficulty(puzzle: any): number {
    return difficulty(puzzle);
  },

  // Browser side
  initialState(puzzle: any): FreshSnowPlayerState {
    const paths: Record<AnimalId, Pos[] | null> = {} as Record<AnimalId, Pos[] | null>;
    for (const animal of puzzle.animals as AnimalId[]) {
      paths[animal] = null;
    }
    return {
      paths,
      checks: 0,
      hints: 0,
      pencils: new Map(),
    };
  },

  applyMove(state: FreshSnowPlayerState, move: unknown): FreshSnowPlayerState | null {
    const m = move as { animal: AnimalId; pos: Pos };
    if (!m.animal || !m.pos) return null;

    const animal = m.animal;
    const pos = m.pos;

    // Create new state
    const newState: FreshSnowPlayerState = {
      paths: { ...state.paths } as Record<AnimalId, Pos[] | null>,
      checks: state.checks,
      hints: state.hints,
      pencils: new Map(state.pencils),
    };

    // Get current path or initialize
    const currentPath = state.paths[animal];
    if (!currentPath) {
      // Start new path
      if (!isStartingMove(newState, animal, pos)) return null;
      newState.paths[animal] = [pos];
      return newState;
    }

    // Check if this move is valid
    const isValid = isNextMove(newState, animal, pos, currentPath);

    if (!isValid) return null;

    newState.paths[animal] = [...currentPath, pos];
    return newState;
  },

  isSolved(puzzle: any, state: FreshSnowPlayerState): boolean {
    const result = validate(puzzle, state);
    if (!result.valid) return false;

    // Check all animals are in hideouts
    for (const animal of puzzle.animals as AnimalId[]) {
      const path = state.paths[animal];
      if (!path || path.length === 0) return false;

      const lastPos = path[path.length - 1];
      if (!lastPos) return false;
      const cell = puzzle.terrain[lastPos.r]?.[lastPos.c];
      if (cell?.type !== 'hideout') return false;
    }

    return true;
  },

  check(puzzle: any, state: FreshSnowPlayerState): RuleError[] {
    const result = validate(puzzle, state);
    return result.errors;
  },

  hint(puzzle: any, state: FreshSnowPlayerState, step: 1 | 2 | 3): { type: string; message: string; data?: any } {
    // Use solver to find hint
    const solution = solvePuzzle(puzzle);
    if (!solution) return { type: 'error', message: 'No solution found' };

    // Find first animal with incomplete path
    for (const animal of puzzle.animals as AnimalId[]) {
      const playerPath = state.paths[animal] || [];
      const solutionPath = solution.paths[animal];
      if (!solutionPath) continue;

      if (playerPath.length < solutionPath.length) {
        const nextPos = solutionPath[playerPath.length];
        if (!nextPos) continue;
        if (step === 1) {
          return {
            type: 'nudge',
            message: `Try placing the ${animal} here`,
            data: { pos: nextPos, animal },
          };
        }
        if (step === 2) {
          return {
            type: 'step',
            message: `The ${animal} should go to ${posKey(nextPos.r, nextPos.c)}`,
            data: { pos: nextPos, animal },
          };
        }
        if (step === 3) {
          return {
            type: 'path',
            message: `The ${animal}'s full path ends at its hideout`,
            data: { animal },
          };
        }
      }
    }

    return { type: 'solved', message: 'All paths complete!' };
  },

  mountBoard(el: HTMLElement, puzzle: any, state: FreshSnowPlayerState, onMove: (move: unknown) => void): { render: () => void } {
    // This will be implemented with DOM/SVG rendering
    // For now, just return a placeholder
    const render = () => {
      el.innerHTML = `<div class="board" data-width="${puzzle.width}" data-height="${puzzle.height}">
        Board rendering will be implemented here
      </div>`;
    };
    return { render };
  },

  // Shared output
  shareLine(result: FreshSnowResult): string {
    const emoji = result.completed ? '✅' : '❌';
    return `Fresh Snow ${emoji} ${Math.round(result.timeMs / 1000)}s`;
  },

  journalReward(date: string): string {
    // Calculate reward based on date - placeholder
    return 'rabbit';
  },
} as const;

// Helper functions
function isStartingMove(state: FreshSnowPlayerState, animal: AnimalId, pos: Pos): boolean {
  // Starting move must be from an entry cell
  return true;
}

function isNextMove(state: FreshSnowPlayerState, animal: AnimalId, pos: Pos, path: Pos[]): boolean {
  // Validate move follows animal's rules
  return true;
}