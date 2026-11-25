---
name: animal-guide
description: Content and fact rules for the animal-track guides (/animals/<slug>), stored in packages/core/src/guides.ts. Use it whenever asked to write, improve, check or add an animal guide, a tracking article, journal facts, or SEO text about animal footprints.
---

# Animal track guides

## Where they live
- Data: `GUIDES` in `packages/core/src/guides.ts` (one object per animal: `slug`, `name`, `group`,
  `size`, `clue`, `body` paragraphs, `lookAlike`, `art`, `title`, `description`).
- Pages: `apps/web/src/pages/animals/index.astro` and `animals/[slug].astro` (Article + BreadcrumbList JSON-LD).
- Source drafts with references: `docs/` (see `main-plan.md` and `research.md`).

## Content shape
1. `title` under 60 characters (e.g. "Fox Tracks in Snow: How to Identify Them"); `description` under 155.
2. First paragraph answers the question in one sentence.
3. What the tracks look like (size in inches and cm, toes, claws, shape), how the animal moves,
   what its trail looks like, look-alikes, where and when to find tracks.
4. A link to practise in Fresh Snow when the animal appears in a game.

## Fact rules (strict)
- Every number and fact must come from a wildlife agency, park service, university or similar source
  in the `docs/` drafts. Don't add facts that aren't there.
- If unsure, mark the sentence `[CHECK]` and list it in your report instead of guessing.
- Write in your own plain words; never copy sentences from sources. Short sentences, no filler.
- `Guide` has no `sources` field yet. Adding one (and showing sources on the page) is a good
  improvement, but it changes the data shape, so propose it first.
