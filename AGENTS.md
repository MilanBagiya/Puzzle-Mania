# Wild Daily (working name): project rules for AI agents

This is the single source of rules for any AI working in this repo (CLAUDE.md imports it).
Product plans live in `docs/`. If this file and `docs/` disagree, ask the owner before acting.

## What this is
A web-only daily puzzle hub. Flagship game: Fresh Snow (rebuild animal paths from tracks in snow),
plus Nests, Dawn Chorus, Stepping Stones, Mushroom Rings, Trail Trek and a 20-game pack.
Revenue: display ads only. Audience: English-speaking adults and families (US, UK, CA, AU).
Kids play only through Family/Classroom modes.

## Repo map
| Path | What |
| --- | --- |
| `apps/web` | Astro static site (Cloudflare Pages). Pages in `src/pages`, one script per page in `src/scripts`, catalog in `src/data/catalog.ts` |
| `apps/generator` | Node CLI that writes every puzzle file to `apps/web/public/puzzles/` (git-ignored); runs before every web build |
| `apps/api` | Cloudflare Worker (D1 + R2), early stage |
| `packages/core` | Dates, progress, streaks, badges, journal, seasons, animal guides |
| `packages/ui` | Design system: `styles.css`, `sprite.svg`, art helpers, cover art, animal mover |
| `packages/game-*` | One package per game: engine (rules, generator, solver, validator) + `ui.ts` (board) |
| `packages/game-pack` | 20 smaller games; registry test keeps `PACK`, `ALL_GAMES`, `PACK_META` and the web loader map in sync |
| `tools/qa` | `pnpm qa`: builds the site and runs Playwright checks (links, pages, smoke) |
| `docs/` | Product plans (main plan, game, technical, UX, SEO, growth, research) |
| `reference/` | Original Fresh Snow prototype |

`tools/Blender` and `tools/art-sources` are local art tools, git-ignored. Never commit them.

## Commands
| Command | Does |
| --- | --- |
| `pnpm install --frozen-lockfile` | Install (same as CI) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Must all pass before a task is done |
| `pnpm gen` | Generate all puzzles (~40 s); fails loudly if a puzzle breaks its fairness rule |
| `pnpm build` | Full build (runs the generator first) |
| `pnpm qa` | Build + browser checks; use after page, layout or navigation changes |
| `pnpm --filter @wild-daily/web dev` | Local site at http://localhost:4321 |

## Stack (decided 2026-11-21; ask before changing)
TypeScript strict everywhere, pnpm workspaces + Turborepo, Astro (static output), plain TypeScript
games with DOM/SVG boards (no UI framework; Preact islands only if approved), Vitest + fast-check,
Playwright for QA, Cloudflare Pages / Workers / D1 / R2.

## Hard rules
- **One solution:** every puzzle has exactly one solution, verified by a solver in tests AND in the generator.
- **No answers in the browser:** puzzle files hold only what the player sees; the browser checks rules,
  and hints come from solvers working on the visible puzzle.
- **Privacy:** player progress stays on the device; the server stores only anonymous results.
- **Ads:** never on or beside the puzzle board; every ad slot has a fixed reserved size (no layout shift).
- **Performance:** hub JavaScript < 100 KB gzipped; mobile LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
  Heavy libraries load lazily, only when needed.
- **Accessibility:** WCAG 2.2 AA, full keyboard play, animals differ by shape AND colour.
- **Truth:** never invent data (ratings, reviews, statistics, search volumes, animal facts).
- **Domain:** never hard-code it; use `SITE_URL` (placeholder `https://example.com` until bought).
- **Dependencies:** no new dependency without saying why, its size, and getting approval.

### Known gaps in the hard rules (owner decision pending; do not extend, do not "fix" unasked)
- Stepping Stones and the move games (Otter Slide, Moose Crossing, Burrow Escape, Salmon Run,
  Bear's Last Snack) are checked as *solvable* with a known best move count, not *unique*.
- Guessing games (Egg Match, Track Word, Who Was Here?, Whose Print?) ship a scrambled answer, and
  Feather Pairs ships its card layout, because a guess game must check guesses somewhere.

## Conventions
- Engine code is pure: no DOM, no `Date.now()`, no `Math.random()`; randomness comes from a seeded RNG
  (`rngFrom` in game-fresh-snow). Visual-only randomness in UI code is fine.
- Nothing in `packages/` imports Astro.
- Dates are `'YYYY-MM-DD'` strings in the player's local time zone (`packages/core/src/dates.ts`).
- Every exported function in core and game packages has unit tests; engines also get a fast-check
  property test that many generated puzzles are unique.
- Match the surrounding code style. Keep diffs minimal; don't reformat files you aren't changing.

## How to work
Follow `.claude/skills/small-task/SKILL.md` (the workflow) and `.claude/skills/code-review/SKILL.md`
(the self-review before calling anything done). In short: act directly on clear tasks, ask first only
for decisions that are genuinely the owner's, verify with the real checks, and report briefly.
