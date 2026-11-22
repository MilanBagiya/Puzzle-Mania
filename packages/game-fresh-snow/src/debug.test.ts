import { describe, it, expect } from 'vitest';
import { Board, generateBoardLayout } from './board';
import { getValidMoves } from './rules';
import { generate } from './generator';

function createSeededRNG(seed: string): () => number {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return function () {
    state = (state * 1103515245 + 12345) >>> 0;
    return ((state >>> 0) / 4294967296);
  };
}

describe('Debug board state', () => {
  it('shows morning board state', () => {
    const rng = createSeededRNG('debug-test');
    const board = generateBoardLayout(rng, 'morning');

    console.log('Board dimensions:', board.width, 'x', board.height);
    console.log('Hideouts:', JSON.stringify(board.hideouts));
    console.log('Entries:', JSON.stringify(board.entries));
    console.log('Terrain:');
    board.cells.forEach((row, r) => {
      const line = row.map(c => c.type[0] || '?').join('');
      console.log(r + ': ' + line);
    });

    // Count terrain types
    const terrainCounts: Record<string, number> = {};
    board.cells.forEach(row => {
      row.forEach(cell => {
        terrainCounts[cell.type] = (terrainCounts[cell.type] ?? 0) + 1;
      });
    });
    console.log('Terrain counts:', terrainCounts);

    expect(board.entries.length).toBe(2);
    expect(board.hideouts.length).toBe(2);
  });

  it('shows solve-test-try board state', () => {
    const seed = 'solve-test-try';

    const rng = createSeededRNG(seed);
    const board = generateBoardLayout(rng, 'morning');

    console.log('\n=== Board Layout ===');
    board.cells.forEach((row, r) => {
      const line = row.map(c => {
        if (c.type === 'entry') return 'e';
        if (c.type === 'hideout') return 'h';
        if (c.type === 'rock') return 'r';
        if (c.type === 'tree') return 't';
        return 's';
      }).join('');
      console.log(r + ': ' + line);
    });
    console.log('Entries:', JSON.stringify(board.entries));
    console.log('Hideouts:', JSON.stringify(board.hideouts));

    // Get animals for this level
    const animals = ['rabbit', 'fox'];

    // Check if paths are reachable
    console.log('\n=== Path reachability ===');
    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      const entry = board.entries[i]!;
      const hideout = board.hideouts[i]!;

      console.log(`${animal}: Entry (${entry.r},${entry.c}) -> Hideout (${hideout.r},${hideout.c})`);
      console.log(`  Direction: ${entry.direction}`);
    }
  });

  it('traces full generation process', () => {
    const seed = 'solve-test-try';

    // Import internal functions by importing the module
    const rng = createSeededRNG(seed);
    const board = generateBoardLayout(rng, 'morning');

    console.log('\n=== STEP 1: Board Layout ===');
    console.log('Dimensions: ' + board.width + 'x' + board.height);
    board.cells.forEach((row, r) => {
      const line = row.map(c => {
        if (c.type === 'entry') return 'e';
        if (c.type === 'hideout') return 'h';
        if (c.type === 'rock') return 'r';
        if (c.type === 'tree') return 't';
        if (c.type === 'covered') return 'c';
        return 's';
      }).join('');
      console.log(r + ': ' + line);
    });
    console.log('Entries:', JSON.stringify(board.entries));
    console.log('Hideouts:', JSON.stringify(board.hideouts));

    // Now let's manually trace what happens in generate()
    // We need to check what level profile params are used
    const { LEVEL_PROFILES } = require('./types');
    const profile = LEVEL_PROFILES['morning'];
    console.log('\n=== Level Profile ===');
    console.log('Profile:', JSON.stringify(profile, null, 2));

    // Now trace walkAnimals
    const animals = ['rabbit', 'fox'];
    console.log('\n=== STEP 2: Walk Animals ===');
    const paths: Record<string, { r: number; c: number }[]> = {} as any;
    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      const entry = board.entries[i];
      const hideout = board.hideouts[i];
      console.log(`\n${animal}: Entry (${entry.r},${entry.c}) dir=${entry.direction} -> Hideout (${hideout.r},${hideout.c})`);
    }
  });
});