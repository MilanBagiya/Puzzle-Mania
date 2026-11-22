import { describe, it, expect } from 'vitest';
import { Board, generateBoardLayout } from './board';
import { solvePuzzle, countSolutions } from './solver';
import { getValidMoves } from './rules';
import { posKey } from './board';

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

describe('Coverage Debug', () => {
  it('troubleshoots morning generation', () => {
    // First, let's understand what paths SHOULD be
    const seed = 'morning-troubleshoot';
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

    // Rabbit: entry (0,0) right -> hideout (0,2) - must jump to (0,1) then (0,2)
    // But wait! Rabbit jumps 2 cells. Entry at (0,0) with direction 'right'
    // Rabbit can jump from (0,0) to (0,2) in ONE move by going right 2 cells
    // The middle cell (0,1) must be snow (not blocked)

    console.log('\n=== Rabbit Path Analysis ===');
    console.log('Rabbit entry: (0,0), direction: right');
    console.log('Rabbit hideout: (0,2)');
    console.log('Rabbit jumps 2 cells horizontally');
    console.log('Rabbit path: (0,0) -> (0,2) - ONE JUMP');
    console.log('Cell (0,1) must be snow (landing cell)');

    // Let me check: is (0,1) snow?
    const cell01 = board.getCell(0, 1);
    console.log('Cell (0,1) type:', cell01?.type);

    // Fox: entry (4,4) up -> hideout (2,2) - diagonal
    // From (4,4), fox can go to (3,3) diagonal, then (2,2) diagonal
    console.log('\n=== Fox Path Analysis ===');
    console.log('Fox entry: (4,4), direction: up');
    console.log('Fox hideout: (2,2)');
    console.log('Fox moves diagonally 1 cell at a time');
    console.log('Fox path: (4,4) -> (3,3) -> (2,2)');

    // These paths DON'T cross!
    // Rabbit: (0,0) -> (0,2)
    // Fox: (4,4) -> (3,3) -> (2,2)

    // Now let's manually create a puzzle and see what happens
    console.log('\n=== Manual Puzzle Creation ===');

    // Stamp prints for rabbit at (0,0) and (0,2)
    // Stamp prints for fox at (4,4), (3,3), (2,2)

    // Let me manually build a valid puzzle
    const puzzle = {
      id: 'manual-test',
      date: '2027-01-18',
      level: 'morning' as const,
      width: 5,
      height: 5,
      terrain: board.cells.map(row => row.map(c => ({ ...c }))),
      animals: ['rabbit', 'fox'] as const,
      difficulty: 50,
      version: '0.1.0',
    };

    // Add prints
    // Rabbit: pair shape at entry and hideout
    // Fox: diagonal shape at entry, (3,3), and hideout
    puzzle.terrain[0]![0] = { ...puzzle.terrain[0]![0], print: { animal: 'rabbit', shape: 'pair' as const } };
    puzzle.terrain[0]![2] = { ...puzzle.terrain[0]![2], print: { animal: 'rabbit', shape: 'pair' as const } };
    puzzle.terrain[4]![4] = { ...puzzle.terrain[4]![4], print: { animal: 'fox', shape: 'diagonal' as const } };
    puzzle.terrain[3]![3] = { ...puzzle.terrain[3]![3], print: { animal: 'fox', shape: 'diagonal' as const } };
    puzzle.terrain[2]![2] = { ...puzzle.terrain[2]![2], print: { animal: 'fox', shape: 'diagonal' as const } };

    // Store for solution
    (puzzle.terrain as any)._hideouts = board.hideouts;
    (puzzle.terrain as any)._entries = board.entries;

    console.log('\n=== Manual Puzzle Terrain ===');
    puzzle.terrain.forEach((row, r) => {
      const line = row.map((c: any) => {
        if (c.type === 'covered') return 'c';
        if (c.type === 'entry') return 'e';
        if (c.type === 'hideout') return 'h';
        if (c.type === 'rock') return 'r';
        if (c.type === 'tree') return 't';
        if (c.print) return c.print.animal[0];
        return '.';
      }).join('');
      console.log(r + ': ' + line);
    });

    // Now let's solve this
    const solution = solvePuzzle(puzzle);
    console.log('\n=== Solution ===');
    if (solution) {
      console.log('Found solution!');
      console.log('Rabbit path:', solution.paths.rabbit);
      console.log('Fox path:', solution.paths.fox);
    } else {
      console.log('No solution found!');
    }

    const count = countSolutions(puzzle, 10);
    console.log('\nSolution count:', count);

    // Now let's try covering a cell with rabbit print
    console.log('\n=== After Covering Cell (0,1) ===');
    const coveredPuzzle = JSON.parse(JSON.stringify(puzzle));
    coveredPuzzle.terrain[0]![1] = {
      type: 'covered',
      prints: [{ animal: 'rabbit', shape: 'pair' }],
      r: 0,
      c: 1
    };

    const coveredSolution = solvePuzzle(coveredPuzzle);
    console.log('Solution after covering (0,1):', coveredSolution ? 'Found' : 'None');
    if (coveredSolution) {
      console.log('Rabbit path:', coveredSolution.paths.rabbit);
      console.log('Fox path:', coveredSolution.paths.fox);
    }
    const coveredCount = countSolutions(coveredPuzzle, 10);
    console.log('Solution count after covering:', coveredCount);

    // Can we have multiple solutions?
    console.log('\n=== Testing Multiple Valid Arrangements ===');
    console.log('Rabbit MUST go: entry (0,0) -> hideout (0,2)');
    console.log('Rabbit CAN go through (0,1) or jump directly to (0,2)');
    console.log('But with direction "right" from entry, rabbit must move right');
    console.log('So rabbit MUST visit (0,1) - no alternative path!');
    console.log('Actually wait - rabbit JUMPS 2 cells, so from (0,0) can go to (0,2) directly');
    console.log('(0,1) is just the landing cell that gets skipped');

    // The REAL issue: when we cover (0,1), the rabbit print is hidden
    // The solver doesn't know if there was a print at (0,1)
    // So multiple arrangements might satisfy the visible prints

    // Let me test: what if we cover the rabbit's entry print?
    console.log('\n=== Covering Rabbit Entry (0,0) ===');
    const coverEntryPuzzle = JSON.parse(JSON.stringify(puzzle));
    coverEntryPuzzle.terrain[0]![0] = {
      type: 'covered',
      prints: [{ animal: 'rabbit', shape: 'pair' }],
      r: 0,
      c: 0
    };

    const coverEntryCount = countSolutions(coverEntryPuzzle, 10);
    console.log('Solution count when rabbit entry covered:', coverEntryCount);
  });
});