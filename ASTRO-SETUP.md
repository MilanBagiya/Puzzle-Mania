# Wild Daily — full site (Astro + all games)

Drop-in code for `D:/Projects/Puzzle-Mania`. Installed, type-checked (strict), unit-tested (50 tests),
built (27 pages + 1,380 puzzle files) and played end to end in a browser before packaging.

## Games

| Game | Type | URL | Fairness check (in tests and in the generator) |
| --- | --- | --- | --- |
| Fresh Snow · Morning, Noon, Night | Daily Set | `/fresh-snow` | exactly one solution |
| Nests | Daily Set | `/nests` | exactly one solution (backtracking solver) |
| Dawn Chorus | Daily Set | `/dawn-chorus` | exactly one bird order |
| Stepping Stones | Daily bonus | `/stepping-stones` | solvable in 6–10 jumps |
| Mushroom Rings | Daily bonus | `/mushroom-rings` | exactly one possible spore square |
| Trail Trek (60 stages, 4 chapters) | Campaign, any time | `/trek` | every stage has exactly one solution |

Puzzle files never contain answers. The browser checks moves against the rules, and hints come from
solvers that work on the visible puzzle only.

## What keeps players coming back

- **Daily Set of 5** with a progress bar, a "Next" button after every solve, and a completion banner.
- **Countdown** to the next fresh snow (local midnight) on the hub and result screens.
- **Paw ratings (1–3)** on every solve; best result is kept, so replays have a goal.
- **Streaks with Snow Days**: one missed day per calendar week is forgiven automatically. Only puzzles
  played on their own day count toward streaks (archive play can't backfill), and the **best streak** is tracked.
- **19 badges** (first solve, full set, 3/7/30-day streaks, no-hint Night, quick Morning, each game,
  each Trek chapter, 30 Trek paws, archive explorer, naturalist…) with a "New badge!" moment.
- **Forest Journal**: a new animal card with a real fact on each day played.
- **Trail Trek**: 60 stages that teach one animal at a time, unlock in order, and award paws.
- **Archive**: every past day for every game. **Stats page**: streaks, totals, best and average times, badges.

## Folder map

```
apps/web/              Astro site (static). Pages in src/pages, one script per page in src/scripts.
                       src/scripts/daily.ts = shared date, loading, result screen, badges, journal, countdown.
apps/generator/        Writes all puzzle files into apps/web/public/puzzles (run before every build).
packages/ui/           Design system: styles.css, sprite.svg (icons, characters, nature, nests, frog), art helpers.
packages/core/         Dates, progress, streaks + Snow Days, paws, badges, Trek progress, Journal, guides.
packages/game-fresh-snow/       Engine + Trail Trek profiles + board UI.
packages/game-nests/            Rules, solver, generator, board UI.
packages/game-dawn-chorus/      Clue generator + rule check.
packages/game-stepping-stones/  Rules, route solver, generator, board UI.
packages/game-mushroom-rings/   Rules, candidate solver, generator, board UI.
.github/workflows/nightly-deploy.yml   Nightly rebuild trigger for Cloudflare Pages.
```

## Install (Windows)

1. Commit your current work: `git add -A && git commit -m "before games update"`.
2. Delete the old folders this kit replaces: `apps/web/src`, `apps/generator/src`, and the `src` folder of every
   package under `packages/` (new packages are added automatically).
3. Unzip into `D:/Projects/Puzzle-Mania` and allow it to replace files.
4. Add `apps/web/public/puzzles/` to `.gitignore` (generated at build time).
5. Run:
   ```
   pnpm install
   pnpm -r run test                          # 50 tests
   pnpm --filter @wild-daily/web puzzles     # writes ~1,380 puzzle files
   pnpm --filter @wild-daily/web dev         # http://localhost:4321
   ```

Progress saved by the earlier demo or kit is upgraded automatically (same storage key).

## Deploy on Cloudflare Pages

- Build command: `pnpm --filter @wild-daily/web build` · Output directory: `apps/web/dist`
- Environment: `SITE_URL=https://your-domain.com`, `NODE_VERSION=22`
- Add the deploy hook from `.github/workflows/nightly-deploy.yml` so new days appear every night.

## Where to change things

| Change | File |
| --- | --- |
| Which games are in the Daily Set, par times, game names | `packages/core/src/progress.ts` (`DAILY_SET`, `BONUS`, `GAMES`) |
| Paw rules | `starsFor` in `packages/core/src/progress.ts` |
| Badges | `packages/core/src/badges.ts` |
| Trail Trek difficulty curve and chapters | `trekProfile`, `TREK_CHAPTERS` in `packages/game-fresh-snow/src/engine.ts` |
| Nests size / difficulty | `generateNests` in `packages/game-nests/src/engine.ts` |
| Colours, spacing, animations / art | `packages/ui/src/styles.css` / `packages/ui/src/sprite.svg` |

Run `pnpm -r run test` after changing any engine or generator.
