---
name: astro-page
description: How to build or edit pages in apps/web (Astro) for Wild Daily — layout, SEO head, URLs, JSON-LD, noindex and sitemap rules, ad slots, and mounting a game. Use it when creating or editing an .astro page, layout or component, a route, the sitemap, robots.txt, metadata, Open Graph tags or structured data.
---

# Astro pages (apps/web)

## How a page is built
- Every page wraps its content in `src/layouts/Base.astro`:
  `<Base title description active? noindex? jsonLd?>`. Base renders `src/components/Seo.astro`
  (title, description, canonical from `Astro.site`, Open Graph/Twitter, robots, JSON-LD).
- Page behaviour lives in one script per page in `src/scripts/` (e.g. `nests.ts`), imported by the page.
- Games: the page renders readable HTML first (title via `GameHead.astro`, rules, tips, a loading
  message), then the script loads `/puzzles/<game>/<date>.json` with `loadPuzzle` from
  `scripts/daily.ts` and mounts the board with the package's `create…Game(root, opts)`
  (e.g. `createFreshSnowGame`, `createNestsGame`). Pack games go through `/play/[game]` and `scripts/pack.ts`.
- Games, categories and tiles come from `src/data/catalog.ts`; don't hard-code lists in pages.
- URL state uses query parameters (`?date=YYYY-MM-DD&level=…`) read with `params()` from `scripts/nav.ts`.

## SEO rules
- Static output. A page ships JavaScript only if it has a game or interactive feature.
- `title` under ~60 characters, `description` under ~155, both specific to the page.
- Never hard-code the domain: build URLs with `new URL(path, Astro.site)` (`SITE_URL` setting).
- Personal and utility pages are `noindex`: `/journal`, `/stats`, `/recent`, `/trek/play`, `/404`, `/dev/*`.
  A `noindex` page must also be excluded from the sitemap filter in `astro.config.mjs`, and must NOT be
  blocked in `robots.txt` (crawlers have to fetch it to see the `noindex`).
- JSON-LD only with true data: WebSite, Organization, WebApplication (games), BreadcrumbList, Article (guides).
  Never add aggregateRating, reviews or invented numbers.

## Current routes
`/` hub · `/games`, `/games/<category>` · `/play/<game>` (pack) · `/fresh-snow` (+ `/how-to-play`,
`/archive`, `/tutorial`) · `/nests` · `/dawn-chorus` · `/stepping-stones` · `/mushroom-rings` ·
`/trek`, `/trek/play` · `/animals`, `/animals/<slug>` · `/journal` · `/stats` · `/recent` ·
`/about` · `/privacy` · `/terms` · `/404` · `/dev/design` (internal).
Planned in docs, not built yet: `/fresh-snow/practice`, `/classroom` (child-directed: no personalised ads).

## Ad slots
None exist yet. When added: one shared component with a fixed reserved height (no layout shift),
never on or beside the board, and no personalised ads on child-directed pages.

## Verify
`pnpm build` passes; the built HTML has the right title, description, canonical and visible content;
run `pnpm qa` for anything user-visible.
