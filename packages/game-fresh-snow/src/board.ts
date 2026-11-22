/**
 * Board model for Fresh Snow puzzle.
 * Handles board generation, terrain placement, and cell queries.
 */

import type { BoardCell, CoveredCell, Entry, Hideout, HideoutType, LevelId, Pos } from './types';
import { LEVEL_PROFILES } from './types';

/**
 * Board representation for puzzle generation and solving.
 */
export class Board {
  readonly cells: BoardCell[][];
  readonly width: number;
  readonly height: number;
  readonly hideouts: Hideout[] = [];
  readonly entries: Entry[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Array(height);
    for (let r = 0; r < height; r++) {
      this.cells[r] = new Array(width);
      for (let c = 0; c < width; c++) {
        this.cells[r]![c] = { type: 'snow', print: null, r, c };
      }
    }
  }

  getCell(r: number, c: number): BoardCell | undefined {
    if (r < 0 || r >= this.height || c < 0 || c >= this.width) return undefined;
    return this.cells[r]?.[c];
  }

  getCellType(r: number, c: number): 'snow' | 'covered' | 'tree' | 'rock' | 'hideout' | 'entry' | null {
    const cell = this.getCell(r, c);
    if (!cell) return null;
    return cell.type;
  }

  setCell(r: number, c: number, cell: BoardCell): void {
    if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
      this.cells[r]![c] = cell;
    }
  }

  addHideout(r: number, c: number, hideoutType: HideoutType): Hideout {
    const hideout: Hideout = {
      type: 'hideout',
      hideoutType,
      animal: null,
      r,
      c,
    };
    this.hideouts.push(hideout);
    this.setCell(r, c, hideout);
    return hideout;
  }

  addEntry(r: number, c: number, direction: 'up' | 'down' | 'left' | 'right'): Entry {
    const entry: Entry = {
      type: 'entry',
      direction,
      r,
      c,
    };
    this.entries.push(entry);
    this.setCell(r, c, entry);
    return entry;
  }

  addTree(r: number, c: number): void {
    this.setCell(r, c, { type: 'tree', r, c });
  }

  addRock(r: number, c: number): void {
    this.setCell(r, c, { type: 'rock', r, c });
  }

  coverCell(r: number, c: number, print: { animal: string; shape: string } | null = null): void {
    const cell = this.getCell(r, c);
    if (cell && cell.type === 'snow' && cell.print) {
      this.setCell(r, c, {
        type: 'covered',
        prints: cell.print ? [cell.print] : [],
        r,
        c,
      });
    }
  }
}

/**
 * Position key for visited set
 */
export function posKey(r: number, c: number): string {
  return `${r},${c}`;
}

/**
 * Generate a board layout from level profile.
 * Places entries and hideouts intelligently to ensure reachable paths for all animals.
 */
export function generateBoardLayout(rng: () => number, level: LevelId): Board {
  const profile = LEVEL_PROFILES[level];
  const board = new Board(profile.grid[0], profile.grid[1]);

  // Use seeded random for deterministic placement
  let random = rng;

  const numAnimals = profile.minAnimals;
  const hideoutTypes: HideoutType[] = ['burrow', 'log', 'den', 'hollow'];

  // All animals that can jump 2 cells: rabbit, bird (if using 2-cell hop)
  // These need special placement consideration
  const jumpers: AnimalId[] = ['rabbit'];

  // For morning level (5x5), place entries and hideouts in fixed valid positions
  // to guarantee reachable paths for rabbit (2-cell jumps) and fox (diagonal)
  const protectedCells: Set<string> = new Set();
  if (level === 'morning') {
    // Rabbit: entry at (0, 0), hideout at (0, 2) - 2-cell horizontal jump
    // Rabbit jumps from (0,0) to (0,2) in one move, landing via (0,1) which must be snow
    board.addEntry(0, 0, 'right');
    board.addHideout(0, 2, 'burrow');
    // Protect the mid-cell for rabbit's jump
    protectedCells.add('0,1');

    // Fox: entry at (4, 4), hideout at (2, 2) - diagonal movement
    // From (4,4) fox can reach (2,2) in two diagonal moves: (4,4) -> (3,3) -> (2,2)
    board.addEntry(4, 4, 'up');
    board.addHideout(2, 2, 'log');
    // Protect fox's path cells
    protectedCells.add('3,3');
  } else {
    // For larger boards (noon+), we need to ensure rabbits can reach hideouts
    // Strategy: Place rabbit entry on one edge, hideout reachable via 2-cell jumps
    // Fox/deer/squirrel/bird have more flexible movement

    for (let i = 0; i < numAnimals; i++) {
      const animal = i < 3 ? 'rabbit' : i < 4 ? 'fox' : i < 5 ? 'deer' : i < 6 ? 'squirrel' : 'bird';
      const hideoutType = hideoutTypes[i % hideoutTypes.length] as HideoutType;

      // Place hideout - for rabbits, place in a position reachable from edge
      let placed = false;
      if (animal === 'rabbit') {
        // Rabbit hideout: place in column 2 or 4 from a row entry, or row 2 or 4 from a column entry
        // For 6x6: hideout at (0, 4) reachable from (0, 2) by jumping right to (0, 4)
        // Or hideout at (3, 0) reachable from (3, 2) by jumping left
        const hideoutCol = i % 2 === 0 ? 4 : 2; // alternate between col 4 and col 2
        const hideoutRow = 3; // middle row
        board.addHideout(hideoutRow, hideoutCol, hideoutType);
        placed = true;
        // Also place rabbit entry on same row at a position that can reach
        const entryCol = hideoutCol === 4 ? 2 : 0;
        board.addEntry(hideoutRow, entryCol, hideoutCol === 4 ? 'right' : 'right');
        protectedCells.add(posKey(hideoutRow, entryCol + 1)); // protect mid-jump cell
      } else {
        // For other animals, place hideout in inner area
        for (let attempts = 0; attempts < 100 && !placed; attempts++) {
          const r = 1 + Math.floor(random() * (board.height - 2));
          const c = 1 + Math.floor(random() * (board.width - 2));
          if (board.getCellType(r, c) === 'snow') {
            board.addHideout(r, c, hideoutType);
            placed = true;
          }
        }
        if (!placed) {
          for (let r = 0; r < board.height && !placed; r++) {
            for (let c = 0; c < board.width && !placed; c++) {
              if (board.getCellType(r, c) === 'snow') {
                board.addHideout(r, c, hideoutType);
                placed = true;
              }
            }
          }
        }
      }
    }

    // Place entries for non-rabbits on edges
    let entryIdx = 0;
    for (let i = 0; i < numAnimals; i++) {
      const animal = i < 3 ? 'rabbit' : i < 4 ? 'fox' : i < 5 ? 'deer' : i < 6 ? 'squirrel' : 'bird';
      if (animal === 'rabbit') {
        entryIdx++;
        continue; // rabbit entry already placed
      }

      // Choose an edge that's not too close to another entry
      const edges = ['top', 'bottom', 'left', 'right'];
      const edge = edges[(entryIdx + i) % edges.length];
      let placed = false;

      for (let attempts = 0; attempts < 50 && !placed; attempts++) {
        let r = 0, c = 0, dir: 'up' | 'down' | 'left' | 'right' = 'down';

        if (edge === 'top') {
          r = 0;
          c = Math.floor(random() * board.width);
          dir = 'down';
        } else if (edge === 'bottom') {
          r = board.height - 1;
          c = Math.floor(random() * board.width);
          dir = 'up';
        } else if (edge === 'left') {
          c = 0;
          r = Math.floor(random() * board.height);
          dir = 'right';
        } else {
          c = board.width - 1;
          r = Math.floor(random() * board.height);
          dir = 'left';
        }

        if (board.getCellType(r, c) === 'snow') {
          board.addEntry(r, c, dir);
          placed = true;
        }
      }
      if (!placed) {
        // Fallback: try any edge
        for (const fallbackEdge of edges) {
          for (let attempts = 0; attempts < 50 && !placed; attempts++) {
            let r = 0, c = 0, dir: 'up' | 'down' | 'left' | 'right' = 'down';
            if (fallbackEdge === 'top') {
              r = 0;
              c = Math.floor(random() * board.width);
              dir = 'down';
            } else if (fallbackEdge === 'bottom') {
              r = board.height - 1;
              c = Math.floor(random() * board.width);
              dir = 'up';
            } else if (fallbackEdge === 'left') {
              c = 0;
              r = Math.floor(random() * board.height);
              dir = 'right';
            } else {
              c = board.width - 1;
              r = Math.floor(random() * board.height);
              dir = 'left';
            }
            if (board.getCellType(r, c) === 'snow') {
              board.addEntry(r, c, dir);
              placed = true;
            }
          }
        }
      }
      entryIdx++;
    }
  }

  // Place trees (block animals, birds/squirrels can use)
  const treeCount = Math.floor(board.width * board.height * 0.08); // ~8%
  for (let i = 0; i < treeCount; i++) {
    const r = Math.floor(random() * board.height);
    const c = Math.floor(random() * board.width);
    const key = posKey(r, c);
    if (board.getCellType(r, c) === 'snow' && !protectedCells.has(key)) {
      board.addTree(r, c);
    }
  }

  // Place rocks (block all walking animals)
  const rockCount = Math.floor(board.width * board.height * 0.05); // ~5%
  for (let i = 0; i < rockCount; i++) {
    const r = Math.floor(random() * board.height);
    const c = Math.floor(random() * board.width);
    const key = posKey(r, c);
    if (board.getCellType(r, c) === 'snow' && !protectedCells.has(key)) {
      board.addRock(r, c);
    }
  }

  // Fill remaining snow with snow cells
  for (let r = 0; r < board.height; r++) {
    for (let c = 0; c < board.width; c++) {
      if (board.getCellType(r, c) === null) {
        board.setCell(r, c, { type: 'snow', print: null, r, c });
      }
    }
  }

  return board;
}

/**
 * Check if a position is valid for an animal to move to.
 */
export function isValidPosition(
  board: Board,
  r: number,
  c: number,
  animal: string,
  visited: Set<string>,
): boolean {
  const cell = board.getCell(r, c);
  if (!cell) return false;

  // Cannot move onto rocks
  if (cell.type === 'rock') return false;

  // Deer and similar cannot turn back (will be checked by movement rules)

  return true;
}