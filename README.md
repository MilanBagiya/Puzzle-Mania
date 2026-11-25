# Wild Daily (working name)

A web-only daily puzzle hub built around **Fresh Snow**: rebuild animal paths from the tracks they
left in the snow. Plus Nests, Dawn Chorus, Stepping Stones, Mushroom Rings, Trail Trek (60 stages)
and a pack of 20 smaller daily games. Static site on Cloudflare Pages; ad-supported.

## Quick start (Windows, Node 20+, pnpm 9)
```
pnpm install
pnpm test                                   # unit tests (Vitest + fast-check)
pnpm gen                                    # write every puzzle into apps/web/public/puzzles (~40 s)
pnpm --filter @wild-daily/web dev           # http://localhost:4321
```

## Everyday commands
| Command | Does |
| --- | --- |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | The three checks CI runs on every PR |
| `pnpm gen` | Generate puzzles; fails if any puzzle breaks its fairness rule |
| `pnpm build` | Generate puzzles and build the site into `apps/web/dist` |
| `pnpm qa` | Build, then run browser checks (links, every page, smoke play) with Playwright |

## Where things are
| Path | What |
| --- | --- |
| `apps/web` | Astro site: pages, one script per page, game catalog |
| `apps/generator` | Puzzle generator (runs before every build) |
| `apps/api` | Cloudflare Worker for anonymous results (early) |
| `packages/core` | Dates, progress, streaks, badges, journal, seasons, animal guides |
| `packages/ui` | Design system, sprites, art helpers |
| `packages/game-*` | One package per game (engine + board UI) |
| `tools/qa` | Browser QA harness |
| `docs/` | Product plans: start with `docs/main-plan.md` |
| [ASTRO-SETUP.md](ASTRO-SETUP.md) | Release notes (v3–v6), deploy settings, where to change things |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents (CLAUDE.md imports it) |
| [docs/SETUP-AND-WORKFLOW.md](docs/SETUP-AND-WORKFLOW.md) | How the owner works with AI on this repo |

## Deploy (Cloudflare Pages)
Build command `pnpm --filter @wild-daily/web build`, output `apps/web/dist`, environment
`SITE_URL=https://<your-domain>` and `NODE_VERSION=22`. A nightly GitHub Action
(`.github/workflows/nightly-deploy.yml`) triggers a rebuild so new days keep appearing.
