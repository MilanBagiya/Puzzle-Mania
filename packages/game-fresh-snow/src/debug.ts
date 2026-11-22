import { Board, generateBoardLayout } from './board';
import { getValidMoves } from './rules';
import type { AnimalId, Pos } from './types';

// Create a simple seeded RNG
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

// Test rabbit from entry position
const entry = board.entries[0];
const hideout = board.hideouts[0];
console.log('\nRabbit path test:');
console.log('Entry:', entry);
console.log('Hideout:', hideout);

// Test if rabbit can reach hideout
if (entry && hideout) {
  const start: Pos = { r: entry.r, c: entry.c };
  const target: Pos = { r: hideout.r, c: hideout.c };
  console.log('Start:', start, 'Target:', target);

  // Calculate Manhattan distance for rabbit (each jump is 2 cells)
  const dist = Math.abs(start.r - target.r) + Math.abs(start.c - target.c);
  console.log('Distance:', dist);
  console.log('Rabbit can jump 2 cells, so need distance to be even');

  // Test getValidMoves for rabbit
  const visited = new Set<string>();
  const moves = getValidMoves('rabbit', start, board.width, board.height, visited, false,
    (r, c) => {
      const cell = board.getCell(r, c);
      if (!cell) return 'snow';
      return cell.type;
    }
  );
  console.log('\nValid rabbit moves from entry:', moves);
}