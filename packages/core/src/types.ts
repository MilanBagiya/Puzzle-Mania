/**
 * Core types for the Wild Daily puzzle hub.
 */

export type LevelId = 'morning' | 'noon' | 'night' | 'sunday-blizzard';

/// <reference types="dom" />

export interface DailyGame<Puzzle, PlayerState, Solution> {
  id: string;                        // "fresh-snow"
  name: string;                      // "Fresh Snow"
  levels: LevelId[];                 // ["morning", "noon", "night"]
  addedOn: string;                   // "2027-01-18" (Full Set counts it from this date)

  // Generator side (Node, nightly)
  generate(seed: string, level: LevelId): { puzzle: Puzzle; solution: Solution };
  countSolutions(puzzle: Puzzle, limit: number): number;   // must return 1
  difficulty(puzzle: Puzzle): number;                 // 0 to 100

  // Browser side
  initialState(puzzle: Puzzle): PlayerState;
  applyMove(state: PlayerState, move: unknown): PlayerState | null; // null = illegal
  isSolved(puzzle: Puzzle, state: PlayerState): boolean;          // checks rules, no answer needed
  check(puzzle: Puzzle, state: PlayerState): unknown[];          // for the Check button
  hint(puzzle: Puzzle, state: PlayerState, step: 1 | 2 | 3): unknown;
  mountBoard(el: HTMLElement, puzzle: Puzzle, state: PlayerState, onMove: (move: unknown) => void): unknown; // plain DOM/SVG, no framework

  // Shared output
  shareLine(result: unknown): string;  // "Fresh Snow Night ✅ 9:40"
  journalReward(date: string): string;
}