// Nightly puzzle generator (run by Cloudflare Pages on every build, or locally).
// Writes one JSON file per game and day WITHOUT any answers, after checking each puzzle is fair:
// Fresh Snow, Nests and Mushroom Rings have exactly one answer; Dawn Chorus exactly one order;
// Stepping Stones is solvable in 6–10 jumps. Also writes the 60 Trail Trek stages.
// Usage: tsx src/index.ts --back 60 --days 120 --out ../web/public/puzzles [--from 2027-01-18]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { addDays, todayIso, isIsoDate, LEVELS } from '@wild-daily/core';
import { countSolutions, generatePuzzle, generateTrekStage, TREK_STAGE_COUNT } from '@wild-daily/game-fresh-snow';
import { generateNests, solveNests } from '@wild-daily/game-nests';
import { generateDawn, orderFits, permutations, toPublic } from '@wild-daily/game-dawn-chorus';
import { generateStones } from '@wild-daily/game-stepping-stones';
import { candidates, generateRings } from '@wild-daily/game-mushroom-rings';
import { ALL_GAMES } from '@wild-daily/game-pack/all';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] ? (process.argv[i + 1] as string) : fallback;
}
const back = Number(arg('back', '60'));
const days = Number(arg('days', '120'));
const out = arg('out', 'dist/puzzles');
const fromArg = arg('from', '');
const from = isIsoDate(fromArg) ? fromArg : addDays(todayIso(), -back);
const write = (rel: string, data: unknown): void => { const f = join(out, rel); mkdirSync(join(f, '..'), { recursive: true }); writeFileSync(f, JSON.stringify(data)); };
const fail = (msg: string): never => { throw new Error(msg); };

const t0 = Date.now();
// Start clean: files from days that left the window (or from older generator versions) must not linger.
// Only the folders this script writes are removed, never anything else under --out.
for (const owned of ['fresh-snow', 'nests', 'dawn', 'stones', 'rings', 'pack', 'trek', 'index.json']) rmSync(join(out, owned), { recursive: true, force: true });
let files = 0;
for (let k = 0; k < back + days; k++) {
  const date = addDays(from, k);
  for (const level of LEVELS) {
    const { puzzle } = generatePuzzle(level, date);
    if (countSolutions(puzzle, 2) !== 1) fail(`Fresh Snow ${date}/${level} is not unique`);
    write(`fresh-snow/${date}/${level}.json`, puzzle); files++;
  }
  const nests = generateNests(date).puzzle;
  if (solveNests(nests, 2).length !== 1) fail(`Nests ${date} is not unique`);
  write(`nests/${date}.json`, nests); files++;
  const dawn = toPublic(date, generateDawn(date));
  if (permutations(dawn.birds).filter((o) => orderFits(dawn, o)).length !== 1) fail(`Dawn Chorus ${date} is not unique`);
  write(`dawn/${date}.json`, dawn); files++;
  write(`stones/${date}.json`, generateStones(date)); files++;
  const rings = generateRings(date).puzzle;
  if (candidates(rings).length !== 1) fail(`Mushroom Rings ${date} is not unique`);
  write(`rings/${date}.json`, rings); files++;
  // Game pack: each generator already checks fairness (one answer, or solvable) before returning.
  for (const [id, game] of Object.entries(ALL_GAMES)) { write(`pack/${id}/${date}.json`, game.generate(date)); files++; }
}
for (let s = 1; s <= TREK_STAGE_COUNT; s++) {
  const { puzzle } = generateTrekStage(s);
  if (countSolutions(puzzle, 2) !== 1) fail(`Trek stage ${s} is not unique`);
  write(`trek/${s}.json`, puzzle); files++;
}
write('index.json', { from, to: addDays(from, back + days - 1), trekStages: TREK_STAGE_COUNT, generatedAt: new Date().toISOString() });
console.log(`Wrote ${files} puzzle files (${from} to ${addDays(from, back + days - 1)}, plus ${TREK_STAGE_COUNT} Trek stages) in ${Date.now() - t0} ms`);
