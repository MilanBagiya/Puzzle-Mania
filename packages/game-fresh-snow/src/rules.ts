/**
 * Animal movement rules for Fresh Snow.
 * Each animal has a specific movement pattern that must be followed.
 */

import type { AnimalId, Direction, Pos } from './types';

/**
 * Position key for visited set
 */
function posKey(pos: Pos): string {
  return `${pos.r},${pos.c}`;
}

// Terrain type for move validation
export type TerrainType = 'snow' | 'covered' | 'tree' | 'rock' | 'hideout' | 'entry';

/**
 * Get all valid next positions for an animal from a given position.
 * Returns positions the animal can legally move to.
 * @param getCellType - Optional callback to get terrain type at a position
 * @param prevPos - Previous position in path (used for deer's "never turns back" rule)
 */
export function getValidMoves(
  animal: AnimalId,
  pos: Pos,
  boardWidth: number,
  boardHeight: number,
  visited: Set<string>, // cells already visited by this animal
  isFirstMove: boolean,
  getCellType?: (r: number, c: number) => TerrainType,
  prevPos?: Pos | null,
): Pos[] {
  switch (animal) {
    case 'rabbit':
      return getRabbitMoves(pos, boardWidth, boardHeight, visited, isFirstMove, getCellType);
    case 'fox':
      return getFoxMoves(pos, boardWidth, boardHeight, visited, getCellType);
    case 'deer':
      return getDeerMoves(pos, boardWidth, boardHeight, visited, prevPos ?? null, getCellType);
    case 'squirrel':
      return getSquirrelMoves(pos, boardWidth, boardHeight, visited, getCellType);
    case 'bird':
      return getBirdMoves(pos, boardWidth, boardHeight, visited, getCellType);
    case 'wolf':
      return getWolfMoves(pos, boardWidth, boardHeight, visited, getCellType);
    case 'snow-leopard':
      return getSnowLeopardMoves(pos, boardWidth, boardHeight, visited, getCellType);
    default:
      throw new Error(`Unknown animal: ${animal}`);
  }
}

/**
 * Rabbit: Jumps exactly 2 cells in a straight line; prints only where it lands.
 * Cannot jump over rocks or trees. Can land on snow, hideout, or entry.
 * Cannot revisit cells already visited by this rabbit.
 */
function getRabbitMoves(
  pos: Pos,
  w: number,
  h: number,
  visited: Set<string>,
  _isFirstMove: boolean,
  getCellType?: (r: number, c: number) => TerrainType,
): Pos[] {
  const result: Pos[] = [];

  // Straight line jumps: 2 cells in each direction
  const jumps: Direction[] = ['up', 'down', 'left', 'right'];

  for (const dir of jumps) {
    const [dr, dc] = dirToDelta(dir);
    const midR = pos.r + dr;
    const midC = pos.c + dc;
    const newR = pos.r + dr * 2;
    const newC = pos.c + dc * 2;

    // Check bounds
    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Cannot jump over blocked cells (rock or tree)
    const midType = getCellType ? getCellType(midR, midC) : 'snow';
    if (midType === 'rock' || midType === 'tree') continue;

    // Check if already visited (rabbits cannot revisit cells)
    const key = posKey({ r: newR, c: newC });
    if (visited.has(key)) continue;

    // Landing cell must be snow, hideout, or entry (not rock or tree)
    const landingType = getCellType ? getCellType(newR, newC) : 'snow';
    if (landingType === 'rock' || landingType === 'tree') continue;

    result.push({ r: newR, c: newC });
  }

  return result;
}

/**
 * Fox: Moves 1 cell diagonally.
 */
function getFoxMoves(pos: Pos, w: number, h: number, visited: Set<string>, getCellType?: (r: number, c: number) => TerrainType): Pos[] {
  const diagonals: Direction[] = ['upRight', 'upLeft', 'downRight', 'downLeft'];
  const result: Pos[] = [];

  for (const dir of diagonals) {
    const [dr, dc] = dirToDelta(dir);
    const newR = pos.r + dr;
    const newC = pos.c + dc;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check if target cell is blocked
    const cellType = getCellType ? getCellType(newR, newC) : 'snow';
    if (cellType === 'rock' || cellType === 'tree') continue;

    const key = posKey({ r: newR, c: newC });
    if (!visited.has(key)) {
      result.push({ r: newR, c: newC });
    }
  }

  return result;
}

/**
 * Deer: Moves 1 cell up, down, left or right; never turns back.
 * "Never turns back" means it cannot immediately reverse direction (180 degree turn).
 * prevPos is the previous position in the path (or null for first move).
 */
function getDeerMoves(
  pos: Pos,
  w: number,
  h: number,
  visited: Set<string>,
  prevPos: Pos | null,
  getCellType?: (r: number, c: number) => TerrainType,
): Pos[] {
  const ortho: Direction[] = ['up', 'down', 'left', 'right'];
  const result: Pos[] = [];

  for (const dir of ortho) {
    const [dr, dc] = dirToDelta(dir);
    const newR = pos.r + dr;
    const newC = pos.c + dc;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check if target cell is blocked
    const cellType = getCellType ? getCellType(newR, newC) : 'snow';
    if (cellType === 'rock' || cellType === 'tree') continue;

    const key = posKey({ r: newR, c: newC });
    if (!visited.has(key)) {
      // Check "never turns back" rule: don't allow going back to prevPos
      // The deer cannot immediately reverse direction (180-degree turn)
      if (prevPos && newR === prevPos.r && newC === prevPos.c) {
        continue;
      }
      result.push({ r: newR, c: newC });
    }
  }

  return result;
}

/**
 * Squirrel: Moves 1 cell in any direction; starts and ends at a tree.
 */
function getSquirrelMoves(pos: Pos, w: number, h: number, visited: Set<string>, getCellType?: (r: number, c: number) => TerrainType): Pos[] {
  const allDirs: Direction[] = ['up', 'down', 'left', 'right', 'upRight', 'upLeft', 'downRight', 'downLeft'];
  const result: Pos[] = [];

  for (const dir of allDirs) {
    const [dr, dc] = dirToDelta(dir);
    const newR = pos.r + dr;
    const newC = pos.c + dc;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check if target cell is blocked
    const cellType = getCellType ? getCellType(newR, newC) : 'snow';
    if (cellType === 'rock' || cellType === 'tree') continue;

    const key = posKey({ r: newR, c: newC });
    if (!visited.has(key)) {
      result.push({ r: newR, c: newC });
    }
  }

  return result;
}

/**
 * Bird: Hops up to 2 cells; lands only next to a tree or bush (edge gap).
 */
function getBirdMoves(pos: Pos, w: number, h: number, visited: Set<string>, getCellType?: (r: number, c: number) => TerrainType): Pos[] {
  const ortho: Direction[] = ['up', 'down', 'left', 'right'];
  const diagonal: Direction[] = ['upRight', 'upLeft', 'downRight', 'downLeft'];
  const result: Pos[] = [];

  // 1 cell moves
  for (const dir of [...ortho, ...diagonal]) {
    const [dr, dc] = dirToDelta(dir);
    const newR = pos.r + dr;
    const newC = pos.c + dc;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check if target cell is blocked
    const cellType = getCellType ? getCellType(newR, newC) : 'snow';
    if (cellType === 'rock' || cellType === 'tree') continue;

    const key = posKey({ r: newR, c: newC });
    if (!visited.has(key)) {
      result.push({ r: newR, c: newC });
    }
  }

  // 2 cell orthogonal moves - must land next to tree/bush
  for (const dir of ortho) {
    const [dr, dc] = dirToDelta(dir);
    const newR = pos.r + dr * 2;
    const newC = pos.c + dc * 2;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check landing cell is not blocked
    const landingCell = getCellType ? getCellType(newR, newC) : 'snow';
    if (landingCell === 'tree' || landingCell === 'rock') continue; // cannot land on these

    const key = posKey({ r: newR, c: newC });
    if (!visited.has(key)) {
      result.push({ r: newR, c: newC });
    }
  }

  return result;
}

/**
 * Wolf pack: Three wolves walk single file - they share movements.
 * For generation, treat as a single path that can revisit cells.
 */
function getWolfMoves(pos: Pos, w: number, h: number, _visited: Set<string>, getCellType?: (r: number, c: number) => TerrainType): Pos[] {
  // Wolves can revisit cells (single file formation)
  const allDirs: Direction[] = ['up', 'down', 'left', 'right', 'upRight', 'upLeft', 'downRight', 'downLeft'];
  const result: Pos[] = [];

  for (const dir of allDirs) {
    const [dr, dc] = dirToDelta(dir);
    const newR = pos.r + dr;
    const newC = pos.c + dc;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check if target cell is blocked
    const cellType = getCellType ? getCellType(newR, newC) : 'snow';
    if (cellType === 'rock' || cellType === 'tree') continue;

    result.push({ r: newR, c: newC });
  }

  return result;
}

/**
 * Snow Leopard: Moves like a chess knight (L-shape: 2 in one direction, 1 perpendicular).
 */
function getSnowLeopardMoves(pos: Pos, w: number, h: number, visited: Set<string>, getCellType?: (r: number, c: number) => TerrainType): Pos[] {
  const knightMoves: [number, number][] = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];

  const result: Pos[] = [];

  for (const [dr, dc] of knightMoves) {
    const newR = pos.r + dr;
    const newC = pos.c + dc;

    if (newR < 0 || newR >= h || newC < 0 || newC >= w) continue;

    // Check if target cell is blocked
    const cellType = getCellType ? getCellType(newR, newC) : 'snow';
    if (cellType === 'rock' || cellType === 'tree') continue;

    const key = posKey({ r: newR, c: newC });
    if (!visited.has(key)) {
      result.push({ r: newR, c: newC });
    }
  }

  return result;
}

// Helper functions

function dirToDelta(dir: Direction): [number, number] {
  switch (dir) {
    case 'up': return [-1, 0];
    case 'down': return [1, 0];
    case 'left': return [0, -1];
    case 'right': return [0, 1];
    case 'upRight': return [-1, 1];
    case 'upLeft': return [-1, -1];
    case 'downRight': return [1, 1];
    case 'downLeft': return [1, -1];
  }
}