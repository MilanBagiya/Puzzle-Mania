---
name: astro-page
description: How to build any page in apps/web (Astro) for the Fresh Snow / Wild Daily site, including SEO head tags, URLs, structured data, noindex rules, ad slots and how to mount a game. Use it whenever creating or editing an .astro page, layout or component, adding a route, sitemap, robots.txt, metadata, Open Graph tags or JSON-LD.
---

# Astro pages

## Rules
- Static output. Pages ship no JavaScript unless they contain a game or approved island.
- Every page uses the shared layout and `Seo.astro` head component with: `title`
  (under ~60 characters), `description` (under ~155), canonical URL built from SITE_URL,
  Open Graph + Twitter card tags, `max-image-preview:large` robots meta.
- Never hard-code the domain: read SITE_URL from configuration (placeholder until bought).
- Personal pages (/journal, /stats, /settings) get `noindex`; /admin is blocked in robots.txt.
- JSON-LD only with true data: WebSite, Organization, WebApplication (games),
  BreadcrumbList, Article (guides). NEVER add aggregateRating or reviews.
- Sitemap via @astrojs/sitemap; never list noindex pages.

## URL map (from the SEO Plan)
| URL | Page |
| --- | --- |
| / | Hub: today's Daily Set |
| /fresh-snow | Game landing + today's puzzle |
| /fresh-snow/how-to-play | Rules |
| /fresh-snow/archive and /fresh-snow/archive/YYYY-MM-DD | Past puzzles |
| /fresh-snow/practice | Unlimited practice |
| /animals and /animals/<animal> | Track guides (content collection) |
| /classroom | Teacher page (child-directed: no personalised ads) |
| /about, /privacy, /terms, 404 | Trust pages |

## Mounting a game
The page renders readable HTML (title, short rules, links) first, then a small
`<script>` imports the game package and calls its `mountBoard(element, ...)`.
The game must still make sense to search engines with JavaScript off (text is in the HTML).

## Ad slots
Use the AdSlot component with a fixed reserved height; never beside the board on mobile.

## Check before reporting
`pnpm build` passes; view page source shows title, description, canonical and content.
