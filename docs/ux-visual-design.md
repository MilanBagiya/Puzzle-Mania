# UX and Visual Design

The look is calm, flat and wintry, built mobile-first for one-thumb play, with ads kept away from the puzzle board.

## Brand

The brand should feel like a quiet winter morning walk: calm, curious and a little playful, never loud or arcade-like.

**Name direction**: short, easy to spell, available as a .com or .game domain and free of trademarks. "Wild Daily" is a working name; shortlist 5 to 10 options and check domains, trademarks and social handles before choosing. Each game keeps its own simple name (Fresh Snow, Nests, Stepping Stones) so it can rank for its own name.

**Voice**

| Do | Don't |
| --- | --- |
| "Fresh snow fell overnight." | "NEW PUZZLE!!! PLAY NOW!" |
| "Nice tracking. The fox hid in the hollow log." | "WRONG! Try again." |
| "Take a break; your Snow Day has you covered." | "You're about to lose your streak!" |
| Short sentences, warm and plain | Jargon, puns in every line, exclamation marks everywhere |

**Logo idea**: a single paw print made of a snowflake's six points, readable at 16 px as a favicon, in one colour.

## Visual system

A soft snow-white and deep-pine palette with one accent, flat shapes, and animal colours chosen to stay distinct for colour-blind players. Every colour is a design token with a light and a dark value.

**Colour tokens**

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | #F7F9FB (snow) | #0F1A20 (night) | Page background |
| `--surface` | #FFFFFF | #16242C | Cards, board cells |
| `--text` | #13242C | #E8EEF2 | Main text |
| `--text-muted` | #5B6B73 | #9AAAB2 | Secondary text |
| `--pine` | #1F4D3A | #6FB394 | Brand colour, buttons |
| `--accent` | #E07A2E (fox orange) | #F2A061 | Highlights, streak icon |
| `--line` | #D6DEE3 | #2A3A43 | Grid lines, borders |

**Animal colours** (Okabe-Ito colour-blind-safe set, always paired with a unique print shape)

| Animal | Colour | Print shape |
| --- | --- | --- |
| Fox | Vermillion #D55E00 | Four toes, narrow oval |
| Rabbit | Sky blue #56B4E9 | Two long ovals side by side |
| Deer | Bluish green #009E73 | Split heart |
| Squirrel | Reddish purple #CC79A7 | Small hand with five fingers |
| Bird | Blue #0072B2 | Three-line arrow |
| Wolf | Orange #E69F00 | Large four-toe print with claws |

**Typography**

- UI and headings: one rounded sans-serif web font (for example Nunito or DM Sans), weights 400 and 700 only, with a system-font fallback.
- Numbers (timers, streaks): tabular figures so digits don't jump.
- Sizes: 16 px body minimum on mobile, 20 px puzzle labels, 28 px page titles.

**Illustration style**: flat vector animals with 2 to 3 tones each, no outlines, gentle shapes; drawn once as an SVG sprite and reused across games and the Journal.

## Screen specs

Seven core screens cover the whole experience; the game screen gives the board most of the space, with animal cards above it and tools below.

| Screen | Key elements | Primary action |
| --- | --- | --- |
| Today (hub) | Daily Set list with status per game, both streaks, countdown to next snow, Journal teaser | Start next unsolved game |
| Game | Header, animal cards, board, tools, timer | Solve |
| Between games | Result of the game just played, next game preview, ad slot | Next game |
| Result (set done) | Times, paw ratings, percentile, Journal card, one share card for the set, "done for today" message | Share |
| Forest Journal | Grid of collected cards, locked silhouettes for missing ones, filters by biome and rarity | Open a card |
| Stats | Streak calendar, best times, weekly summary, backup code | Review progress |
| Classroom | Large board for projectors, animal fact, discussion question, print button | Solve together |

&#91;embedded content: game screen wireframe · mobile\]

The tinted cells are trees or rocks; coloured dots are prints, one colour and shape per animal.

## Interaction, motion, sound and haptics

Every action gives instant, gentle feedback; motion explains what happened and never slows the player down.

**Input**

- Mobile: tap an animal card, then tap cells; long-press a cell for pencil marks. Minimum touch target 44 x 44 px.
- Desktop: click or drag to draw; number keys 1 to 6 pick animals; arrow keys move a cursor; Enter places a step; Z / Ctrl+Z undo.
- Illegal moves are simply not placed, with a short shake of the target cell (no error pop-up).

**Motion** (all under 300 ms, all disabled with "reduce motion")

| Moment | Animation |
| --- | --- |
| Step placed | Print stamps in with a soft scale from 80% to 100% |
| Path complete | The animal icon walks the path once and settles in its hideout |
| Puzzle solved | Light snowfall over the board for 1.5 s, then the result card slides up |
| Journal card earned | Card flips over |
| Streak milestone | Paw icon glows once |

**Sound** (off by default, one toggle): soft crunch per step, a short chime on solve, wind on Sunday Blizzard. Never autoplay music.

**Haptics** (mobile browsers that support vibration): 10 ms tap per step, a double tap on solve.

## Accessibility and responsive rules

The hub meets WCAG 2.2 AA, so more people can play daily, and the board always fits the screen without scrolling.

**Accessibility**

- Text contrast at least 4.5:1; board lines and prints at least 3:1 against the cell.
- Animals differ by shape and colour, never colour alone.
- Full keyboard play with a visible focus ring.
- Screen readers: each cell announces its contents ("Row 3, column 4: fox print, covered: no"); a text list of placed steps is available.
- Respect system settings: dark mode, reduce motion, larger text (layout reflows to 200% zoom).
- No time pressure: timers are informational only.

**Responsive layout**

| Screen width | Layout |
| --- | --- |
| Under 400 px (small phones) | Board fills width minus 16 px margins; animal cards in one scrollable row under the board |
| 400 to 767 px (phones) | Same, with larger cells (up to 56 px) |
| 768 to 1199 px (tablets) | Board centred, cards in a column to the right |
| 1200 px and up (desktop) | Board centred, cards on the left, a 300 px ad rail on the right |

- The board is square and sized as `min(viewport width − 32 px, viewport height − header − cards − 24 px)`.
- Safe areas respected on phones with notches; no horizontal scrolling anywhere.

## Ad layout rules

Ads live in fixed, reserved slots on pause screens and side rails; the puzzle board and animal cards are always ad-free.

| Screen | Mobile slot | Desktop slot | Notes |
| --- | --- | --- | --- |
| Today (hub) | 300 x 250 below the Daily Set list | 728 x 90 under header + 300 x 600 right rail | Never above the set |
| Game screen | None | 300 x 600 right rail only | Never beside the board on mobile |
| Between games | 300 x 250 on the transition card | 300 x 250 centred | Player taps "Next game" to continue; no forced wait |
| Result screen | 300 x 250 below share button | 300 x 250 + right rail | Highest-viewability slot |
| Journal, archive, stats | 300 x 250 every 6 cards / rows | Right rail |  |
| Animal guide pages | In-content 300 x 250 after paragraph 2 and 6 | Right rail | SEO pages |
| Classroom and Cub pages | None, or non-personalized only | None | Tagged child-directed |

**Hard rules**

- Every slot has a fixed reserved height so nothing jumps (CLS under 0.1).
- No pop-up or full-screen ads during play; an optional rewarded video only when the player chooses it (streak repair).
- No sticky ad over the board on mobile.
- At most 3 ad slots visible per screen; review retention after any new placement.
