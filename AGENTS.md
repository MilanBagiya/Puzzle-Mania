# Wild Daily (working name): project context

Read this whole file before every task. The full plan is in docs/ (exported from the
project documents). If anything here conflicts with docs/, ask before acting.

## What this is
A web-only daily puzzle hub. Flagship game: Fresh Snow (players rebuild animal
paths from tracks in snow). Companion games later: Nests, Stepping Stones, Who Was Here?
Revenue: display ads only. Audience: English-speaking adults and families
(US, UK, Canada, Australia). Kids play only via Family/Classroom modes.

## Project folder
D:/Projects/Puzzle-Mania  (never write files anywhere else)

## Stack (decided November 21, 2026 — do not change without asking)
- TypeScript everywhere (strict mode), pnpm workspaces
- apps/web: Astro (static output), deployed to Cloudflare Pages
- Games: plain TypeScript, no UI framework (Preact islands only if ever approved)
- apps/api (later): Cloudflare Workers + D1 + R2
- apps/generator (later): Node CLI run nightly by GitHub Actions
- packages/core, packages/ui, packages/game-fresh-snow
- Tests: Vitest (+ fast-check for property tests), Playwright later

## Hard rules
- Every puzzle must have exactly one solution (verified by the solver).
- Solutions are never sent to the browser; the browser validates rules only.
- Player progress stays on the device; the server stores only anonymous results.
- No ads on or beside the puzzle board; every ad slot has a fixed reserved size.
- Hub page JavaScript under 100 KB gzipped; LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on mobile.
- WCAG 2.2 AA: keyboard play; animals differ by shape AND colour.
- Never invent data: no fake ratings, reviews, statistics or search volumes.
- Never hard-code a domain name; use the SITE_URL setting (placeholder until bought).
- No new dependency without explaining why and its size, and getting approval.

## Conventions
- Engine code in packages/game-* (rules, generator, solver, validator) is pure:
  no DOM, no randomness without a seed. Board drawing is plain DOM/SVG.
- Nothing in packages/ imports Astro; only apps/web does.
- Dates as ISO strings 'YYYY-MM-DD' in the player's local time zone.
- Every function in core and game packages has unit tests.
- Small commits, one task at a time.

## How to work (important)
Use the skill "small-task" for every task: plan first, wait for approval, make the
smallest change, run the checks, then report in the fixed report format.
