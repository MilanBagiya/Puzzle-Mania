/**
 * Validator for player solutions in the browser.
 * Checks that the player's paths follow all rules without revealing the answer.
 */

import type { AnimalId, Pos, PrintShape, RuleError } from './types';
import { getValidMoves } from './rules';
import { posKey } from './board';

export interface ValidateResult {
  valid: boolean;
  errors: RuleError[];
}

/**
 * Validate a player's solution against the puzzle rules.
 * Does not check if the solution is correct - only if rules are followed.
 */
export function validate(puzzle: any, state: any): ValidateResult {
  const errors: RuleError[] = [];

  // Check each animal has a path
  for (const animal of puzzle.animals as AnimalId[]) {
    const path = state.paths[animal];
    if (!path || path.length === 0) {
      errors.push({ type: 'missing-path', animal });
      continue;
    }

    validateAnimalPath(puzzle, animal, path, errors);
  }

  // Check all prints are explained
  validatePrints(puzzle, state, errors);

  // Check hideout placement
  validateHideouts(puzzle, state, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single animal's path follows its movement rules.
 */
function validateAnimalPath(
  puzzle: any,
  animal: AnimalId,
  path: Pos[],
  errors: RuleError[],
): void {
  if (path.length === 0) {
    errors.push({ type: 'missing-path', animal });
    return;
  }

  // Check first move is from an entry
  const firstPos = path[0];
  if (!firstPos) {
    errors.push({ type: 'missing-path', animal });
    return;
  }
  const firstCell = puzzle.terrain[firstPos.r]?.[firstPos.c];
  if (!firstCell || firstCell.type !== 'entry') {
    errors.push({ type: 'path-empty', animal: animal, pos: firstPos });
  }

  // Track visited cells for this animal
  const visited = new Set<string>();

  // Check each step
  for (let i = 0; i < path.length; i++) {
    const pos = path[i];
    if (!pos) {
      errors.push({ type: 'missing-path', animal });
      continue;
    }
    const key = posKey(pos.r, pos.c);

    // Check cell exists and is not blocked
    const cell = puzzle.terrain[pos.r]?.[pos.c];
    if (!cell) {
      errors.push({ type: 'path-empty', animal: animal, pos: pos });
      continue;
    }

    if (cell.type === 'rock') {
      errors.push({ type: 'path-blocked', animal, pos, reason: 'rock' });
      continue;
    }

    if (cell.type === 'tree') {
      errors.push({ type: 'path-blocked', animal, pos, reason: 'tree' });
      continue;
    }

    // Check for revisits (wolves are exception)
    if (!visited.has(key)) {
      visited.add(key);
    }

    // Check movement rules
    if (i > 0) {
      const prev = path[i - 1];
      if (!prev) {
        errors.push({ type: 'path-empty', animal: animal, pos: { r: 0, c: 0 } });
        continue;
      }
      const prevCell = puzzle.terrain[prev.r]?.[prev.c];

      // Check if move is valid for this animal
      // Get previous position for deer's "never turns back" rule
      const prevPrev = i > 2 ? path[i - 2] : null;
      const validMoves = getValidMoves(
        animal,
        prev,
        puzzle.width,
        puzzle.height,
        visited,
        i === 1,
        undefined,
        prevPrev,
      );

      const nextKey = posKey(pos.r, pos.c);
      const isValidMove = validMoves.some(m => m.r === pos.r && m.c === pos.c);

      if (!isValidMove) {
        // Could be revisiting for wolves
        errors.push({ type: 'path-empty', animal: animal, pos: pos });
      }
    }
  }
}

/**
 * Check all prints on snow cells are explained by player paths.
 */
function validatePrints(
  puzzle: any,
  state: any,
  errors: RuleError[],
): void {
  // Build set of all cells with prints
  const cellsWithPrints = new Map<string, { animal: AnimalId; shape: PrintShape }>();

  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      const cell = puzzle.terrain[r]?.[c];

      if (cell?.type === 'snow' && cell.print) {
        cellsWithPrints.set(posKey(r, c), cell.print);
      } else if (cell?.type === 'covered' && cell.prints) {
        for (const print of cell.prints) {
          cellsWithPrints.set(posKey(r, c), print);
        }
      }
    }
  }

  // Check each cell with a print has a path on it
  for (const [posStr, print] of cellsWithPrints) {
    const parts = posStr.split(',').map(Number);
    const r = parts[0]! ?? 0;
    const c = parts[1]! ?? 0;
    const pos: Pos = { r, c };

    let hasPath = false;
    for (const animal of puzzle.animals as AnimalId[]) {
      const path = state.paths[animal];
      if (path && path.some((p: Pos) => p.r === r && p.c === c)) {
        // Check if this animal's path explains this print
        const printPos = path.findIndex((p: Pos) => p.r === r && p.c === c);
        if (printPos >= 0) {
          hasPath = true;
          break;
        }
      }
    }

    if (!hasPath) {
      errors.push({
        type: 'print-unexplained',
        pos,
        print: { animal: print.animal, shape: print.shape as PrintShape },
      });
    }
  }
}

/**
 * Validate hideout placement - each animal ends in its hideout.
 */
function validateHideouts(
  puzzle: any,
  state: any,
  errors: RuleError[],
): void {
  // Build map of hideout positions
  const hideouts = new Map<string, { type: string; animal: AnimalId | null }>();

  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      const cell = puzzle.terrain[r]?.[c];
      if (cell?.type === 'hideout') {
        hideouts.set(posKey(r, c), { type: cell.hideoutType, animal: cell.animal });
      }
    }
  }

  // Check each animal is in a hideout
  for (const animal of puzzle.animals as AnimalId[]) {
    const path = state.paths[animal];
    if (!path || path.length === 0) {
      errors.push({ type: 'missing-path', animal });
      continue;
    }

    const lastPos = path[path.length - 1];
    if (!lastPos) {
      errors.push({ type: 'hideout-empty', animal: animal, pos: { r: 0, c: 0 } });
      continue;
    }
    const hideoutKey = posKey(lastPos.r, lastPos.c);
    const hideout = hideouts.get(hideoutKey);

    if (!hideout) {
      errors.push({ type: 'hideout-empty', animal: animal, pos: lastPos });
    } else if (hideout.animal && hideout.animal !== animal) {
      errors.push({ type: 'hideout-wrong-animal', animal: animal, pos: lastPos, expected: hideout.animal });
    }
  }
}