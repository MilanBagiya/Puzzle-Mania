# Technical Design

One TypeScript monorepo powers every game: a shared core handles the day, streaks, journal, ads and analytics, and each game is a small plug-in with its own rules, generator and solver.

## Principles and repository layout

Everything is web-only, static-first and shared: one rules engine per game runs in the generator and in the browser, and adding a game never touches another game's code.

**Principles**

1. **Web-only**: a Progressive Web App; no native apps, no app stores.
2. **Static first**: pages and puzzles are files on a CDN; the only server code is a small edge API.
3. **Same code everywhere**: rules, validator and solver are shared TypeScript used by generator, tests and browser.
4. **Private by default**: player progress stays on the device; the server stores only anonymous solve stats.
5. **Games are plug-ins**: each game implements one interface; the hub discovers them from a registry.

**Repository layout** (pnpm workspaces + Turborepo)

```
wild-daily/
  apps/
    web/          Astro site: hub, game pages, guides (static, PWA)
    api/          Cloudflare Workers: puzzles, results, stats
    generator/    nightly generation CLI + admin preview
  packages/
    core/         day/time zones, streaks, journal, share card, ads, analytics
    ui/           design tokens, buttons, board primitives, animal sprites
    game-fresh-snow/        rules, generator, solver, board UI
    game-nests/
    game-stepping-stones/
    game-who-was-here/
  content/
    animals/      guide markdown + facts with sources
```

## Tech stack

Use **Astro** with static output, hosted on Cloudflare Pages: every page ships as finished HTML with almost no JavaScript, and the games run as plain TypeScript inside those pages. Decided November 21, 2026, over Next.js (heavier, built around React) and hand-written HTML (unmanageable at hundreds of pages).

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Astro, static output | Every page pre-built as HTML that search engines and AI crawlers read instantly |
| Games | Plain TypeScript packages, mounted on the page by a small script | No framework lock-in; the engines work anywhere |
| Interactive extras (later) | Preact islands only where needed (friend leagues, journal) | Small and React-compatible |
| Styling | Plain CSS with the design tokens from the UX tab, scoped in `.astro` components | No CSS framework to learn or ship |
| Fonts | Nunito self-hosted (Fontsource), preloaded | No external font request; better LCP |
| Content | Astro content collections (Markdown/MDX) for animal guides and blog | Checked frontmatter; one template per page type |
| SEO | Shared `Seo.astro` head component, `@astrojs/sitemap`, static `robots.txt` | Titles, canonicals and sitemaps generated, never forgotten |
| Images | `astro:assets` optimisation at build time; SVG for illustrations | Optimised images without a server |
| Hosting | Cloudflare Pages; Workers for the API | Free tier, global CDN; Cloudflare also backs Astro |

**Scaling notes**

- Traffic: static pages on a CDN handle any number of visitors; the busy parts (puzzle API, stats) run on Workers whatever the framework.
- Pages: thousands of archive and guide pages build fine statically. If build times ever grow too long, render archive days on demand with Astro's Cloudflare adapter, with the same page code.
- Lock-in safeguard: the game packages (rules, generator, solver, validator, board drawing) never import Astro, so the site layer could be replaced without touching the games.
- Use the current stable Astro release and pin exact versions in `package.json`.

**Avoid**: a client-only single-page app (for example plain React + Vite without pre-rendering), where search engines first see an empty page.

## Game plug-in interface

Every game exports one object that tells the hub how to generate, validate, render and score it; the hub handles the day, streaks, journal, sharing and ads.

```ts
export interface DailyGame<Puzzle, PlayerState, Solution> {
  id: string;                        // "fresh-snow"
  name: string;                      // "Fresh Snow"
  levels: LevelId[];                 // ["morning", "noon", "night"]
  addedOn: string;                   // "2027-01-18" (Full Set counts it from this date)

  // Generator side (Node, nightly)
  generate(seed: string, level: LevelId): { puzzle: Puzzle; solution: Solution };
  countSolutions(puzzle: Puzzle, limit: 2): number;   // must return 1
  difficulty(puzzle: Puzzle): number;                 // 0 to 100

  // Browser side
  initialState(puzzle: Puzzle): PlayerState;
  applyMove(state: PlayerState, move: unknown): PlayerState | null; // null = illegal
  isSolved(puzzle: Puzzle, state: PlayerState): boolean;          // checks rules, no answer needed
  check(puzzle: Puzzle, state: PlayerState): RuleError[];          // for the Check button
  hint(puzzle: Puzzle, state: PlayerState, step: 1 | 2 | 3): Hint;
  mountBoard(el: HTMLElement, puzzle: Puzzle, state: PlayerState, onMove: (move: unknown) => void): BoardHandle; // plain DOM/SVG, no framework

  // Shared output
  shareLine(result: GameResult): string;  // "Fresh Snow Night ✅ 9:40"
  journalReward(date: string): AnimalId;
}
```

**Hint without the answer**: hints that need the solution (step 2 and 3) are computed in the browser by running the shared solver on the puzzle, so no solution file is ever downloaded.

**Adding a new game**: create `packages/game-<name>`, implement `DailyGame`, register it in `core/registry.ts` with its `addedOn` date, add its pages from the shared page template, and add generator tests. No other game changes.

## Shared core

The core package owns everything that is the same for every game: which day it is, the streak, the Journal and the share card.

**Daily schedule and time zones**

- The player's date = their device's local date (`Intl.DateTimeFormat().resolvedOptions().timeZone`).
- Puzzle number = days since launch day + 1 (January 18, 2027 = #1).
- The API serves a date's puzzles once that date has begun anywhere on Earth (from 10:00 UTC the day before, when UTC+14 reaches midnight), and refuses later dates, so nobody can read ahead.
- Midnight rollover while the page is open: the Today page shows "Fresh snow fell" and reloads the set.

**Streak engine** (runs after every solve)

```ts
function onSolve(s: StreakState, date: string, setComplete: boolean): StreakState {
  if (s.history[date]) return markHistory(s, date, setComplete); // already counted today
  const gap = daysBetween(s.lastPlayedDate, date);                // 1 = consecutive
  let current = s.current;
  let snowDays = refillWeekly(s, date).snowDays;
  if (gap === 1) current += 1;
  else if (gap > 1 && gap - 1 <= snowDays) { snowDays -= gap - 1; current += 1; }
  else current = 1;                                               // offer repair if eligible
  const next = { ...s, current, best: Math.max(s.best, current), snowDays, lastPlayedDate: date };
  return markHistory(updateFullSet(next, date, setComplete), date, setComplete);
}
```

Unit tests cover: consecutive days, one missed day with and without a Snow Day, two missed days, time-zone travel in both directions, archive play (never counts), repair within 48 hours, and the weekly refill.

**Share card**

- Text built from each game's `shareLine`, plus streak and link: works in any chat app.
- Uses the Web Share API on phones (native share sheet), with "Copy" as fallback on desktop.
- An auto-generated image version (board silhouette, no answers) for social posts, made at build time per day.

**Journal**: a fixed calendar maps each date to an animal card (rare animals on full moons and the 1st Sunday of the month); cards are stored on the device as a list of earned IDs.

## Data, storage and API

Puzzles are files in R2, anonymous results are rows in D1, and everything personal stays in the browser's IndexedDB.

**Storage**

| Data | Store | Key or table |
| --- | --- | --- |
| Daily puzzles | R2 | `puzzles/{game}/{date}/{level}.json` |
| Solutions (private) | R2, separate private bucket | `solutions/{game}/{date}/{level}.json` |
| Practice pool | R2 | `practice/{game}/{difficulty}/{n}.json` |
| Anonymous results | D1 | `results` |
| Daily percentile buckets | D1 (+ edge cache) | `daily_stats` |
| Friend league scores | D1 | `leagues`, `league_members`, `league_results` |
| Streak, journal, settings, history | Browser IndexedDB | `wild-daily` database |

```sql
CREATE TABLE results (
  id INTEGER PRIMARY KEY,
  game TEXT, date TEXT, level TEXT,
  player_id TEXT,        -- random UUID made on the device, no personal data
  time_ms INTEGER, hints INTEGER, checks INTEGER,
  country TEXT,          -- from the CDN header, for traffic-mix reporting
  created_at TEXT
);
CREATE INDEX idx_results_day ON results (game, date, level);
```

**API endpoints** (Cloudflare Workers)

| Method and path | Purpose |
| --- | --- |
| `GET /api/puzzle/{game}/{date}/{level}` | Today's or a past puzzle; refused for future dates |
| `POST /api/result` | Store one anonymous result |
| `GET /api/stats/{game}/{date}/{level}` | Percentile buckets, cached 5 min |
| `GET /api/practice/{game}?difficulty=` | One practice puzzle from the pool |
| `POST /api/league` / `POST /api/league/{code}/join` | Create or join a friend league by invite code |
| `GET /api/league/{code}/{date}` | League results for a day |
| `POST /api/backup` / `GET /api/backup/{code}` | Optional encrypted progress backup by code |

The classroom and Cub pages call only the puzzle endpoint; they never send results.

## Performance, security and fairness

The hub must feel instant on a mid-range phone, keep stored data minimal, and keep percentiles honest without heavy anti-cheat.

**Performance**

- Hub page JavaScript under 100 KB compressed; each game's code loads only when that game opens (code splitting).
- Service worker caches the app shell, today's puzzles and sprites, so a return visit loads from the device.
- Board drawn as SVG with memoised cells; target 60 fps when drawing paths.
- Ad scripts load after the first interaction or 2 s after load, whichever is first.

**Security and privacy**

- No accounts at launch; no emails, names or ages stored on the server.
- API rate limits per IP (for example 60 results per minute) and input validation on every field.
- Strict Content Security Policy that allows only your own scripts plus the ad and analytics hosts.
- Backups are encrypted on the device before upload; the server only stores the encrypted blob.
- Dependencies scanned weekly (Dependabot or Renovate); secrets only in Cloudflare and GitHub settings.

**Fairness**

- Because the solver ships to the browser for hints, a determined cheater could compute answers. This only affects their own percentile, so keep it simple: ignore results faster than a human floor (for example under 15 s for Night) and results with hints from the speed percentile.
- Friend leagues show hints used next to times, so players police each other naturally.

## Testing, CI/CD, monitoring and releases

Every push is tested and previewed automatically; the nightly generator alerts you before a puzzle problem ever reaches players.

**Tests**

| Type | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | Movement rules, validator, solver, streak engine, date logic |
| Property | fast-check | Thousands of random puzzles: every published one has exactly 1 solution |
| Component | Testing Library | Board input, hints, result screen |
| End-to-end | Playwright (mobile + desktop) | Play a full Daily Set, share, streak across simulated days |
| Performance | Lighthouse CI | Budgets for JS size, LCP, CLS on every pull request |
| Accessibility | axe in Playwright | No WCAG AA violations on key screens |

**Pipeline** (GitHub Actions)

1. On pull request: lint, type-check, unit and property tests, build, Lighthouse CI, deploy a preview URL.
2. On merge to main: same checks, then deploy web to Cloudflare Pages and API to Workers.
3. Nightly at 02:00 UTC: generate puzzles to keep 30 days ahead, verify each, upload to R2, rebuild sitemaps; alert by email if the buffer drops below 14 days or any check fails.

**Monitoring**

- Sentry for browser and Worker errors; alert on any new error type.
- Uptime check every 5 minutes on the hub and the puzzle endpoint.
- Daily dashboard: players, solves per game, quit rates, share rate, traffic by country, ad RPM.

**Releases**

- Ship small changes any weekday; never deploy within 2 hours of local midnight in the US (peak start-of-day play).
- New game launches go behind a feature flag, tested with beta players for a week, then added to the Daily Set on a Monday.
