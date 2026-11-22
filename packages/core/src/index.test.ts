import { describe, it, expect } from 'vitest';
import { getGames, registerGame, type DailyGame } from './index';

describe('core', () => {
  it('exports registerGame and getGames', () => {
    // Create a minimal test game
    const testGame: DailyGame<any, any, any> = {
      id: 'test-game',
      name: 'Test Game',
      levels: ['morning'],
      addedOn: '2027-01-18',
      generate: () => ({ puzzle: {}, solution: {} }),
      countSolutions: () => 1,
      difficulty: () => 50,
      initialState: () => ({}),
      applyMove: () => null,
      isSolved: () => false,
      check: () => [],
      hint: () => ({}),
      mountBoard: () => ({}),
      shareLine: () => '',
      journalReward: () => '',
    };

    registerGame(testGame);
    const games = getGames();
    expect(games.some(g => g.id === 'test-game')).toBe(true);
  });
});