---
name: fresh-snow-engine
description: Exact rules and the proven reference implementation of the Fresh Snow puzzle engine (animal movement, prints, drifts, homes, generator, solver, uniqueness check, validator). Use it for ANY work on packages/game-fresh-snow, puzzle generation, solving, hints, checking a player's answer, difficulty levels, or when porting the prototype's game logic to TypeScript.
---

# Fresh Snow engine

The engine is implemented in `packages/game-fresh-snow/src/engine.ts` (rules, generator, solver
`solve`/`countSolutions`, validator `checkPaths`, seeded `rngFrom`, Trail Trek profiles) with tests in
`engine.test.ts`; the board UI is `src/ui.ts`. The original prototype logic is kept in
`references/engine-reference.js` (+ `engine-test-reference.js`) as the behavioural reference:
the TypeScript engine must keep the same rules. Don't redesign the algorithm unless the owner asks,
and run `pnpm gen` after any engine change (it re-checks uniqueness for every day and Trek stage).

## Board
- Square grid, n x n. Cell index i = row * n + col.
- Terrain: 0 snow, 1 rock, 2 tree. Rocks and trees block all three animals.
- Homes (burrows) are special snow cells; each animal ends in exactly one, one animal per home.
- Covered cells (snow drifts) hide whatever prints are under them.

## Animals (movement rules)
| Animal | Move | Notes |
| --- | --- | --- |
| fox | 1 square diagonally | |
| rabbit | exactly 2 squares in a straight line (up/down/left/right) | jumps over anything; prints only where it lands |
| deer | 1 square up/down/left/right | may never reverse its previous direction |

## A valid solution
1. Every animal has a path that starts on a border cell and ends on a home.
2. Every step follows that animal's movement rule; no cell repeated within a path.
3. A path never stands on rock/tree, and never passes through a home except as its last cell.
4. Every visible (uncovered) print of an animal lies on that animal's path (excluding the home).
5. A path never stands on a visible cell that does not show that animal's print.
6. No two animals end in the same home.
Paths of different animals may cross; a crossing cell shows both prints.

## Generation (per puzzle)
Seeded RNG from `seed + ':' + level` (mulberry32 + string hash), so the same date always
gives the same puzzle. Steps: place rocks/trees, random-walk each animal from a border cell
to a target length, make its last cell a home, stamp prints, cover some cells, then run the
solver: while there are 2+ solutions, uncover a covered cell where the two solutions differ.
Reject puzzles where any animal has no visible print.

## Levels
| Level | n | animals | rocks | trees | path length | covered cells |
| --- | --- | --- | --- | --- | --- | --- |
| morning | 5 | fox, rabbit | 1 | 2 | 3–5 | 2–3 |
| noon | 6 | fox, rabbit, deer | 2 | 3 | 3–6 | 3–5 |
| night | 7 | fox, rabbit, deer | 3 | 4 | 4–7 | 6–9 |

## Required tests (Vitest + fast-check)
- Each movement rule, including board edges and the deer no-reverse rule.
- Validator: each of the 6 rules above has a passing and a failing case.
- Determinism: same seed → identical puzzle.
- Property: 1,000 puzzles per level all have exactly 1 solution, and the generator's own
  paths pass the validator.
- Speed: one night puzzle generates in under 2 seconds.
