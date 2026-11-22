/**
 * Core types for the Fresh Snow puzzle game.
 * Puzzle is generated and verified by code; solution is never sent to the browser.
 */

// Position on the board
export interface Pos {
  r: number;
  c: number;
}

// Terrain cell types
export type CellType = 'snow' | 'covered' | 'tree' | 'rock' | 'hideout' | 'entry';

export interface Cell {
  type: CellType;
}

// Hideout types (each animal ends in exactly one)
export type HideoutType = 'burrow' | 'log' | 'den' | 'hollow';

export interface Hideout extends Cell {
  type: 'hideout';
  hideoutType: HideoutType;
  animal: AnimalId | null;
  r: number;
  c: number;
}

// Edge entries (where animals enter from)
export interface Entry extends Cell {
  type: 'entry';
  direction: 'up' | 'down' | 'left' | 'right';
  r: number;
  c: number;
}

// Print on a cell (each cell can have 0-2 prints, each from a different animal)
export interface Print {
  animal: AnimalId;
  shape: PrintShape;
}

// Covered cell (fresh snow hides prints)
export interface CoveredCell extends Cell {
  type: 'covered';
  prints: Print[];
  r: number;
  c: number;
}

// Snow cell (walkable, may show prints)
export interface SnowCell extends Cell {
  type: 'snow';
  print: Print | null;
  r: number;
  c: number;
}

// Tree cell (blocks rabbits, foxes, deer, wolves; birds can use)
export interface TreeCell extends Cell {
  type: 'tree';
  r: number;
  c: number;
}

// Rock cell (blocks all animals)
export interface RockCell extends Cell {
  type: 'rock';
  r: number;
  c: number;
}

// All cells
export type TerrainCell = Cell | Hideout | Entry;

// Animal IDs and colors
export type AnimalId = 'rabbit' | 'fox' | 'deer' | 'squirrel' | 'bird' | 'wolf' | 'snow-leopard';

// Animal colors (used for accessibility - each has unique color AND shape)
export const ANIMAL_COLORS: Record<AnimalId, string> = {
  rabbit: '#E6B87F', // tan
  fox: '#D16A2F', // orange
  deer: '#C2C2C2', // gray
  squirrel: '#8B4513', // brown
  bird: '#4A7023', // green
  wolf: '#6E7681', // gray-blue
  'snow-leopard': '#A591A5', // light gray/purple
};

// Animal print shapes (unique for each animal)
export type PrintShape = 'pair' | 'diagonal' | 'cross' | 'circle' | 'triangle' | 'wavy';

export const ANIMAL_PRINTS: Record<AnimalId, PrintShape> = {
  rabbit: 'pair',
  fox: 'diagonal',
  deer: 'cross',
  squirrel: 'circle',
  bird: 'triangle',
  wolf: 'wavy',
  'snow-leopard': 'triangle',
};

// Direction
export type Direction = 'up' | 'down' | 'left' | 'right' | 'upRight' | 'upLeft' | 'downRight' | 'downLeft';

// Movement direction as Pos delta
export const DIR_DELTA: Record<Direction, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
  upRight: [-1, 1],
  upLeft: [-1, -1],
  downRight: [1, 1],
  downLeft: [1, -1],
};

// Union type for terrain - all cells with their coordinates
export type BoardCell = SnowCell | CoveredCell | Hideout | Entry | TreeCell | RockCell;

// Level profiles
export const LEVEL_PROFILES = {
  morning: {
    grid: [5, 5] as [number, number],
    minAnimals: 2 as number,
    maxAnimals: 2,
    minCovered: 0,
    maxCovered: 2,
    minCrossings: 0,
    maxCrossings: 1,
    minClearPrints: 'many' as const,
  },
  noon: {
    grid: [6, 6] as [number, number],
    minAnimals: 3,
    maxAnimals: 3,
    minCovered: 3,
    maxCovered: 5,
    minCrossings: 1,
    maxCrossings: 2,
    minClearPrints: 'some' as const,
  },
  night: {
    grid: [7, 7] as [number, number],
    minAnimals: 4,
    maxAnimals: 4,
    minCovered: 5,
    maxCovered: 9,
    minCrossings: 2,
    maxCrossings: 4,
    minClearPrints: 'few' as const,
  },
  'sunday-blizzard': {
    grid: [8, 8] as [number, number],
    minAnimals: 5,
    maxAnimals: 6,
    minCovered: 9,
    maxCovered: 14,
    minCrossings: 4,
    maxCrossings: 6,
    minClearPrints: 'very-few' as const,
  },
} as const;

export type LevelId = 'morning' | 'noon' | 'night' | 'sunday-blizzard';

// Animal to starting level mapping (Day 1)
export const ANIMALS_BY_LEVEL: Record<LevelId, AnimalId[]> = {
  morning: ['rabbit', 'fox'],
  noon: ['rabbit', 'fox', 'deer'],
  night: ['rabbit', 'fox', 'deer', 'squirrel'],
  'sunday-blizzard': ['rabbit', 'fox', 'deer', 'squirrel', 'bird'],
};

// Puzzle definition (public, sent to browser)
export interface Puzzle {
  id: string; // date-level like "2027-01-18-morning"
  date: string; // ISO date
  level: LevelId;
  width: number;
  height: number;
  terrain: BoardCell[][];
  animals: AnimalId[];
  difficulty: number; // 0 to 100
  version: string; // engine version for cache busting
}

// Solution (private, never sent to browser)
export interface Solution {
  puzzleId: string;
  paths: Record<AnimalId, Pos[]>; // each animal's full path
  hideouts: Record<AnimalId, Pos>; // where each animal ended
}

// Player state (in browser)
export interface PlayerState {
  paths: Record<AnimalId, Pos[] | null>; // null = not started/touched
}

// Move for validation
export interface Move {
  animal: AnimalId;
  target: Pos;
}

// Rule error for validation - defined here to avoid export conflicts
export type RuleError =
  | { type: 'path-blocked'; animal: AnimalId; pos: Pos; reason: 'rock' | 'tree' }
  | { type: 'path-empty'; animal: AnimalId; pos: Pos }
  | { type: 'path-revisit'; animal: AnimalId; pos: Pos }
  | { type: 'print-mismatch'; animal: AnimalId; pos: Pos }
  | { type: 'hideout-empty'; animal: AnimalId; pos: Pos }
  | { type: 'hideout-wrong-animal'; animal: AnimalId; pos: Pos; expected: AnimalId }
  | { type: 'print-unexplained'; pos: Pos; print: { animal: AnimalId; shape: PrintShape } }
  | { type: 'missing-path'; animal: AnimalId };

// Hint types
export type HintStep = 1 | 2 | 3;

export interface Hint {
  type: 'cell' | 'step' | 'path';
  animal: AnimalId;
  pos: Pos;
  message: string;
}