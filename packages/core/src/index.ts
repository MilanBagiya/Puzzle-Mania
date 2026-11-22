/**
 * Core package for Wild Daily puzzle hub.
 * Handles day/timezones, streaks, journal, share card, ads, analytics.
 */

export * from './types';

import type { DailyGame } from './types';

// Game registry
const games = new Map<string, DailyGame<any, any, any>>();

/**
 * Register a game with the hub.
 */
export function registerGame(game: DailyGame<any, any, any>): void {
  games.set(game.id, game);
}

/**
 * Get all registered games.
 */
export function getGames(): DailyGame<any, any, any>[] {
  return Array.from(games.values());
}

/**
 * Get a specific game by ID.
 */
export function getGame(id: string): DailyGame<any, any, any> | undefined {
  return games.get(id);
}

/**
 * Get games added on or after a given date.
 */
export function getGamesAddedOnOrAfter(date: string): DailyGame<any, any, any>[] {
  return Array.from(games.values()).filter(g => g.addedOn >= date);
}

// Export a function to check solution uniqueness
export function verifyPuzzleSolutionCount(
  game: DailyGame<any, any, any>,
  puzzle: any,
): boolean {
  const count = game.countSolutions(puzzle, 2);
  return count === 1;
}