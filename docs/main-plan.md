# Fresh Snow — End-to-End Project Plan

Nov 21, 2026 · @Jimish Shah

**Scope update:** the project is now a web-only daily puzzle hub, Wild Daily (working name), with Fresh Snow as the flagship and companion games added over time. Detailed docs: Game Design · UX and Visual Design · SEO Plan · Technical Design

Market, competitor and keyword research behind this plan: Research

Step-by-step build checklist for an AI coding assistant: AI Build Checklist

Your own phase-by-phase checklist: My Checklist

Every channel for getting users, from Google and Bing to AI assistants and communities: Growth Playbook

## Overview

Wild Daily (working name) is a free, web-only daily puzzle hub; its flagship, Fresh Snow, is a logic game where each morning players read animal tracks in fresh snow and deduce which animal made each trail and where it is hiding now. The goal is $1,000/month from display ads within 9 to 12 months of launch, from about 150,000 pageviews a month at an $8 page RPM.

**Who it is for:** English-speaking adults and families in the US, UK, Canada and Australia who already play daily puzzles (Wordle, Queens, Clues by Sam). These countries pay several times more per ad view than Indian traffic, so the game is built for them from day one.

**Why it can work:** daily logic games with long sessions already earn well. Clues by Sam reached about 2.13M visits a month with \~10-minute visits and 59% US traffic within 18 months of launch. No daily web game built on reading animal tracks turned up in research.

**Success metrics** (planning targets, not guarantees):

| Metric | Month 1 after launch | At $1,000/month |
| --- | --- | --- |
| Daily active players | 500 | 5,000 to 7,000 |
| Pageviews per month | 20,000 | 120,000 to 180,000 |
| Average visit length | 6 min | 10+ min |
| Day-7 return rate | 20% | 30%+ |
| Share of US/UK/CA/AU traffic | 60% | 70%+ |
| Page RPM | $3 to $5 (AdSense) | $8 to $12 (premium network) |

## Game design spec

Every puzzle is a snowy grid with trees, rocks and hiding spots; the player rebuilds each animal's overnight path from its prints and names where it hid. Each puzzle has exactly one correct answer, so any path set that fits the prints and the rules is the solution.

**Core rules**

- Each animal enters from a grid edge or a den and ends in a hiding spot (burrow, hollow log, tree, den).
- Each animal moves by its own rule, shown on its card at all times.
- Some cells are covered by later snowfall, so their prints are hidden.
- Trails may cross; a crossing cell shows both prints.
- The player taps an animal card, then taps cells to draw its path. Undo, clear and pencil marks ("maybe fox") are always available.

**Animals and movement rules**

| Animal | Movement rule | Appears from |
| --- | --- | --- |
| Rabbit | Jumps exactly 2 cells in a straight line; prints only where it lands | Day 1 |
| Fox | Moves 1 cell diagonally | Day 1 |
| Deer | Moves 1 cell up, down, left or right; never turns back | Day 1 |
| Squirrel | Moves 1 cell in any direction; starts and ends at a tree | Week 2 |
| Bird | Hops up to 2 cells; lands only next to a tree or bush | Week 2 |
| Wolf pack | Three wolves walk one path in single file | Full-moon days |
| Snow leopard | Moves like a chess knight | Once a month (rare) |

**Daily structure**

| Puzzle | Grid | Animals | Target time |
| --- | --- | --- | --- |
| Morning | 5 x 5 | 2 | 1 to 2 min |
| Noon | 6 x 6 | 3 | 3 to 5 min |
| Night | 7 x 7 | 4 | 8 to 12 min |
| Sunday Blizzard (replaces Night) | 8 x 8 | 5 to 6 | 15 to 25 min |

Difficulty rises Monday to Sunday, so players come back to test themselves on the weekend.

**Retention features**

- **Streak** with one free skip day per week, so missing one day doesn't end it.
- **Forest Journal**: each solved day adds an animal card with art and a real fact; rare animals appear on rare days.
- **Seasonal biomes**: snow (winter), mud (spring), beach sand (summer), forest leaves (autumn).
- **Sunday stories**: the tracks tell a small story, revealed after solving ("Did the rabbit escape the fox?").
- **Percentile**: "You solved faster than 78% of players today."
- **Archive** of past days and an **unlimited practice** mode.
- **Hints** in three steps (highlight a cell, reveal an animal's next step, reveal its hideout). Hints show in the share result, never block progress.

**Share format** (spoiler-free):

```
Fresh Snow #42 ❄️
Morning ✅ 0:48
Noon ✅ 3:12
Night ✅ 9:40 (1 hint)
freshsnow.example
```

## System design

The system is mostly static and serverless, so it costs almost nothing to run and handles traffic spikes from Reddit or press without effort. The browser checks the player's paths with the same rules engine the generator uses, so no answer ever leaves the server.

&#91;embedded content: system architecture · 8 components\]

The player's browser loads static pages from a CDN and asks a small edge API only for today's puzzle and anonymous stats; a nightly job fills the puzzle store 30 days ahead.

**Tech stack**

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript everywhere | One rules engine shared by generator, solver and browser |
| Web app | Astro (static output) + PWA; games in plain TypeScript | Built for fast content sites, ships almost no JavaScript, backed by Cloudflare |
| Board rendering | SVG | Sharp on every screen, easy to animate |
| Hosting | Cloudflare Pages | Free tier, global CDN |
| API | Cloudflare Workers | Runs at the edge, free tier covers early traffic |
| Puzzle storage | Cloudflare R2 | Cheap file storage for puzzle JSON |
| Stats storage | Cloudflare D1 (SQLite) | Simple SQL for solve times and percentiles |
| Generator | Node script on GitHub Actions (nightly) | Free scheduled runs, logs and alerts |
| Errors | Sentry free tier | Catch crashes on real phones |

**Code structure** (one repository):

- `packages/engine`: board model, animal movement rules, path validator, solver, difficulty scorer.
- `apps/web`: the Astro site (hub, game pages, guides).
- `apps/api`: the Workers API.
- `apps/generator`: the nightly generation script and admin preview page.

**API**

| Endpoint | Returns | Notes |
| --- | --- | --- |
| `GET /api/puzzle/:date/:level` | Puzzle JSON | Refused for dates not yet started in the player's time zone |
| `POST /api/result` | OK | Level, solve time, hints, checks, random player id |
| `GET /api/stats/:date/:level` | Percentile buckets | Cached for 5 minutes at the edge |
| `GET /api/practice?difficulty=` | A generated practice puzzle | Taken from a pre-built pool |

**Data model**

| Record | Fields | Stored in |
| --- | --- | --- |
| Puzzle | id (date + level), biome, width, height, terrain cells, visible prints, covered cells, animals in play, difficulty score, engine version | R2 (public by date) |
| Solution | puzzle id, each animal's full path and hideout | Private archive only |
| Result | puzzle id, random player id, time, hints, checks, country (from CDN header), timestamp | D1 |
| Player state | streak, skip days left, journal cards, settings, past results | The player's device |

## Puzzle generation engine

Puzzles are generated by code and checked by a solver, so you never write puzzles by hand and every published puzzle is guaranteed to have exactly one solution. The generator runs nightly and keeps a 30-day buffer of ready puzzles.

**Generation steps** (one run per puzzle):

1. **Seed** a random generator from the date and level (`2027-01-18-night`), so any puzzle can be rebuilt exactly.
2. **Lay out the map** from the level's difficulty profile: grid size, trees, rocks, hiding spots.
3. **Walk the animals**: pick entry points, then random-walk each animal under its movement rule until it reaches a hiding spot.
4. **Stamp prints** on every cell each animal touched, including crossings.
5. **Cover cells** with fresh snow to hide some prints (more cells on harder days).
6. **Solve** with a constraint solver (backtracking with constraint propagation) and count solutions, stopping at 2.
7. **Fix ambiguity**: if there are 2+ solutions, uncover one covered cell and solve again; repeat until exactly one remains. If it can't be made unique, discard and regenerate.
8. **Score difficulty** from the solver's log: how many deduction steps, how deep it had to search, how many crossings it untangled. Keep the puzzle only if the score fits the day's target band.
9. **Save** the puzzle JSON (without the solution) to storage, and the solution to a private archive.

**Why the answer never reaches the browser:** because each puzzle has one solution, the browser only checks that the player's paths follow the rules and match every visible print. No answer file exists on the client, so nobody can peek at it.

**Quality checks before a puzzle goes live**

- Automated tests: every buffered puzzle has exactly one solution; difficulty is within its band; solve time by the solver stays under a set limit.
- Weekly human playtest: you play the coming Sunday Blizzard and one random weekday puzzle.
- An admin preview page shows the next 30 days, with a button to regenerate any day.
- Future puzzles are served only once their date has started in the player's time zone, so the buffer can't be scraped early.

## Frontend and UX

The game is a fast, mobile-first web app (most daily-puzzle traffic is on phones) that loads in under 2 seconds and never shows an ad on top of the puzzle board.

**Screens**

| Screen | URL | Purpose |
| --- | --- | --- |
| Today | `/` | The three puzzles of the day, streak, countdown to next snow |
| Puzzle | `/play/2027-01-18/morning` (and `/noon`, `/night`) | The board, animal cards, hints, check button |
| Result | `/play/2027-01-18/done` | Times, percentile, share button, Journal card unlocked |
| Forest Journal | `/journal` | Collected animal cards with facts |
| Archive | `/archive` | Calendar of past days to play |
| Practice | `/practice` | Endless generated puzzles by difficulty |
| How to play | `/how-to-play` | Rules with a 30-second interactive tutorial |
| Animal pages | `/animals/fox` | Real facts about each animal and its tracks |
| Stats, settings, privacy, about | `/stats`, `/settings`, `/privacy`, `/about` | The basics |

Each screen is its own URL, so returning players can bookmark it, search engines can index it, and each view counts as a real pageview.

**Interaction rules**

- Tap-to-draw on phones, drag-to-draw on desktop, full keyboard play (arrow keys + Enter).
- Every animal has its own colour **and** its own print shape, so colour-blind players can play.
- A first-time tutorial teaches by playing a tiny 3 x 3 puzzle, not by reading text.
- Haptic tap on mobile when a step is placed; a gentle snowfall animation on solve (respects "reduce motion").

**Performance budget**

- Under 100 KB of JavaScript (compressed) for the first load.
- Page appears (LCP) in under 1.8 s on a mid-range phone on 4G.
- No layout jumps (CLS under 0.1): every ad slot has a fixed reserved size.
- The board is drawn as SVG; switch to canvas only if 8 x 8 boards feel slow.

**Installable app (PWA)**

- Players can add Fresh Snow to their home screen; today's puzzles work offline once loaded.
- Optional opt-in notification each morning: "Fresh snow fell overnight." Ask only after a player's 3rd solved day, never on first visit.
- Progress (streak, journal, settings) is saved on the device; an optional account to sync devices comes later.

## Monetization and ads

Revenue comes only from display ads, placed where players pause, never while they are solving. Start with AdSense on day one and move to a premium network as soon as traffic qualifies, because premium networks pay noticeably more per view.

**Ad placements**

| Placement | Where | Why it works |
| --- | --- | --- |
| Result screen | Below the share button after each solve | Player is relaxed and looking at the screen |
| Between puzzles | Morning → Noon → Night transition screen | Natural pause, high viewability |
| Today page | Below the puzzle list | Seen on every visit |
| Desktop sidebar | Right rail on wide screens only | Extra revenue without touching the board |
| Journal, archive, animal pages | Inside content | Extra pageviews from engaged players |

Never: ads over or beside the board on mobile, pop-ups mid-puzzle, or ads that move the board.

**Ad network roadmap**

1. **Google AdSense** from launch (no traffic minimum).
2. **Journey by Mediavine** once you pass 1,000 monthly sessions; it pays a 70% revenue share and upgrades to full Mediavine at $5,000 yearly ad revenue ([source](https://www.jupiter.co/blog/mediavine-requirements-2026-how-to-qualify)).
3. **Raptive** (entry bar lowered to 25,000 pageviews, [source](https://www.eneba.com/hub/play-to-earn/how-do-i-make-money-with-a-blog/)) or **Playwire**, which already works with daily puzzle sites like Flagdoku ([source](https://www.playwire.com/case-studies/flagdoku)). Apply to both, keep the better RPM.

**Revenue path** (illustrative; real RPM depends on country mix and season):

| Month after launch | Pageviews | Page RPM | Monthly revenue |
| --- | --- | --- | --- |
| 1 | 20,000 | $4 | $80 |
| 3 | 50,000 | $5 | $250 |
| 6 | 100,000 | $7 | $700 |
| 9 to 12 | 150,000 | $8 | $1,200 |

For reference, US gaming and entertainment traffic earns about $5 to $12 page RPM ([source](https://weforads.com/blog/ad-revenue-benchmarks-2026/)), while Indian traffic earns about $1 to $3 ([source](https://www.ranktracker.com/blog/how-much-does-adsense-pay-for-1-000-views-in-india)). That gap is why the game targets US, UK, Canadian and Australian players.

## Analytics, SEO and legal

Measure retention from day one, treat search as a later bonus driven by the game's own name, and have consent and privacy in place before the first ad loads.

**Analytics events to track**

| Event | Data captured | What it tells you |
| --- | --- | --- |
| `puzzle_start` | date, level | Which puzzles people try |
| `puzzle_solve` | level, time, hints, checks | Difficulty is right or not |
| `puzzle_quit` | level, time spent | Where players give up |
| `share_click` | level, platform | Is the growth loop working |
| `journal_open`, `archive_play`, `practice_play` | count | Extra pageviews and engagement |
| `streak_day` | streak length | Habit strength |

Use GA4 (premium ad networks verify traffic through it) plus a privacy-friendly tool such as Plausible or Umami for daily checks. Review weekly: daily players, day-1/7/30 return rate, visit length, solves per visitor, share rate, share of US/UK/CA/AU traffic, and page RPM.

**SEO plan**

- The game's name is the main keyword. Competitors' Google traffic is mostly people searching their name ("clues by sam" brings \~65% of that site's search visits), so pick a short, unique, easy-to-spell name.
- Build one helpful page per animal ("How to read fox tracks in snow") with real facts; these can rank and attract teachers and nature sites.
- Index archive pages per date, the how-to-play page and a sitemap.
- Add structured data (WebApplication / VideoGame) and keep pages fast.
- Skip daily "answer" pages: AI Overviews cut clicks by roughly 40% on queries where they appear ([source](https://aigrowthagent.co/articles/ai-overviews-traffic-impact/)), and big publishers own those results.

**Legal and compliance checklist**

- [ ] Check the game name and domain for existing trademarks before buying.
- [ ] Privacy policy and terms of service pages.
- [ ] Cookie consent: Google requires a Google-certified consent tool (CMP) for ads shown in the EEA, UK and Switzerland; Google's free Privacy & messaging tool qualifies.
- [ ] US state privacy: a "Do not sell or share my info" link (CCPA).
- [ ] Audience: position the hub for adults and families, not as directed at children, so normal ads can run; tag /classroom and Cub pages as child-directed for Google ads, with no or only non-personalized ads (see the Game Design tab's Family and Classroom modes).
- [ ] Animal facts checked against reliable sources (wildlife agencies, park services).
- [ ] Ask a chartered accountant how to declare AdSense income, whether GST registration applies to you, and how to submit US tax information (form W-8BEN) in AdSense to claim treaty benefits on earnings from US viewers.

## Launch and growth plan

Launch in mid-January 2027, while it is winter and snowy across the US, UK and Canada, so the theme matches what players see outside. First players come from communities and puzzle lists, not Google; this matches how Waffle and Actorle grew.

**Before launch (2 weeks)**

- Private beta with 30 to 50 testers (friends, puzzle fans you find online). Ask one question daily: "Did you want tomorrow's puzzle?"
- Fix confusing rules, tune difficulty from real solve times.
- Collect early emails on a simple waitlist page.

**Launch week channels**

| Channel | What to post | Notes |
| --- | --- | --- |
| Reddit (r/WebGames, r/puzzles and similar) | "I made a daily puzzle where you read animal tracks in snow" + a GIF | Read each community's self-promotion rules first |
| Hacker News | "Show HN" with how the generator and solver work | Developers love the unique-solution engine story |
| Product Hunt | Launch page with GIF and share example | Ask beta testers to try it on the day |
| Puzzle directories | Submit to Listdle, wordlelike.games, Room Escape Artist's daily puzzle guide | Each brings steady discovery traffic |
| Newsletters | Pitch quirky-web newsletters (Actorle's first spike came from b3ta.com) | Short, friendly email with a GIF |
| Nature communities | Wildlife tracking groups, nature educators, teachers | The real animal facts are the hook |

**Growth loops after launch**

- Share result → friends try it → they share. Make the share text short and the link prominent.
- Sunday stories as social posts every week ("Did the rabbit escape? Play to find out").
- Each new biome (mud in March, sand in June) is a fresh announcement to the same channels.
- Once you pass about 1,000 daily players, pitch game columns at tech and culture sites with your numbers.
- Later: a small Discord or subreddit where players discuss the Sunday Blizzard.

## Timeline and phases

The MVP launches on January 18, 2027, eight weeks from now, so the snow theme lands in mid-winter across the US, UK and Canada. Each phase ends at a gate; don't move on until it is met.

&#91;embedded content: roadmap · 5 phases, 4 gates\]

If a gate fails, stay in that phase and fix the cause; a late launch in February still works, but past March the snow theme loses its seasonal hook.

## Budget, risks and launch checklist

The project can launch for under $100 in cash; the real cost is your time, roughly 8 weeks of evenings and weekends to reach launch.

**Budget** (approximate)

| Item | Cost | Notes |
| --- | --- | --- |
| Domain | \~$12 to $20 per year | Short .com or .game preferred |
| Hosting, edge API, storage | $0 to start | Cloudflare free tiers; \~$5/month if usage grows |
| Analytics | $0 to $9 per month | Umami self-hosted free, or Plausible paid |
| Consent tool (CMP) | $0 | Google Privacy & messaging |
| Animal art and print icons | $0 to $300 one-time | Draw simple flat icons yourself or commission a set |
| Sound effects | $0 | Free licensed packs |

**Risks**

| Risk | Early warning sign | What to do |
| --- | --- | --- |
| Game isn't fun | Beta testers don't come back day 2 | Change rules before launch; try a different core rule set |
| Puzzles feel unfair or confusing | Many quits on Noon/Night | Better tutorial, softer difficulty bands, clearer print icons |
| A bigger site copies the idea | Clones appear after launch | Move fast, build the brand name, Journal and seasonal content |
| Too much low-paying traffic | Under 60% US/UK/CA/AU visitors | Focus promotion on those communities, English only |
| Ads hurt retention | Visit length or day-7 return drops after ads go live | Remove the weakest placement; never ads mid-puzzle |
| Little Google traffic | Search under 10% of visits | Expected early; growth comes from sharing and direct visits |
| Burnout from daily upkeep | Buffer drops below 14 days | Fully automated generator with 30-day buffer and alerts |

**Final launch checklist**

- [ ] Generator buffer holds 30+ days, all with exactly one solution
- [ ] Tutorial tested by 5 people who never saw the game
- [ ] Pages load under 2 s on a mid-range phone
- [ ] Share text tested on WhatsApp, X, iMessage, Reddit
- [ ] GA4 + privacy-friendly analytics live, events firing
- [ ] Consent banner shows in EU/UK; privacy policy, terms live
- [ ] AdSense approved, ad slots reserved and tested
- [ ] Error tracking (e.g., Sentry free tier) and uptime alerts on
- [ ] Launch posts drafted for each channel, with GIFs
- [ ] Backup: puzzle store and solutions archive backed up

## Open items

The plan is complete except for these items: three decisions only you can make, six gaps still to close, and deliverables that can be created next. The playable Fresh Snow prototype comes first, because everything else depends on the game being fun.

**Decisions (you)**

- [ ] Final name and domain: availability is not yet confirmed; run the 5-minute check (SEO Plan tab) and buy one.
- [ ] Paper test of Fresh Snow: the Phase 0 gate (4 of 5 testers want another puzzle).
- [ ] Art route: draw the animals yourself or commission them. Launch art is budgeted at up to $300; the 120+ illustrations for Who Was Here? still need quotes (price per illustration x 120) before May 2027.

**Gaps to close**

- [ ] AdSense tax setup: submit US tax information (form W-8BEN) with your accountant's help; claiming treaty benefits can reduce withholding on earnings from US viewers.
- [ ] Check Nests and Stepping Stones against existing games before building them.
- [ ] Financial model: a spreadsheet of month-by-month players, pageviews, RPM, revenue and costs, updated with real numbers monthly.
- [ ] Support and moderation: a contact email (for example hello@ your domain via Cloudflare email forwarding), a feedback form linked from every result screen, and simple community rules before opening a Discord.
- [ ] Other languages (after English works): the puzzles are mostly visual, so Spanish, German, French or Portuguese versions can reach many more players; plan translated UI text, animal facts and separate URLs per language.
- [ ] Phase names: My Checklist splits launch week into its own phase, so its phase numbers run one higher than this tab's roadmap after Phase 2.

**Deliverables to create next** (can be produced with Claude)

- [ ] Playable Fresh Snow prototype: built and published November 21, 2026 (Morning, Noon, Night daily puzzles, practice mode, hints, streak, share) at https://claude.ai/artifact/KoWRhvRkYfsnkGQxvgaNsH. Next: test with 5 people for the Phase 0 gate.
- [ ] Visual designs of the hub, game screen and result screen.
- [ ] Drafts of the 12 launch animal guides: all 12 drafted November 21, 2026 (overview, fox, rabbit, deer, squirrel, turkey and birds, coyote, wolf, raccoon, skunk, bobcat, moose), each with a drawing, SEO page details and wildlife-agency sources, at https://claude.ai/artifact/8vSkR723V14U4pVtpbTCQy; next: your fact check before publishing.
- [ ] Launch posts, newsletter pitches and a press kit.
- [ ] Privacy policy and terms drafts for a lawyer to review.
- [ ] Revenue and cost spreadsheet.

**Sources**

- [Clues by Sam traffic, Semrush (October 2026)](https://ko.semrush.com/website/cluesbysam.com/overview)
- [Mediavine Journey requirements, 2026](https://www.jupiter.co/blog/mediavine-requirements-2026-how-to-qualify)
- [Raptive's 25,000-pageview entry bar](https://www.eneba.com/hub/play-to-earn/how-do-i-make-money-with-a-blog/)
- [Playwire Flagdoku case study](https://www.playwire.com/case-studies/flagdoku)
- [Ad revenue benchmarks 2026](https://weforads.com/blog/ad-revenue-benchmarks-2026/)
- [AdSense pay for Indian traffic](https://www.ranktracker.com/blog/how-much-does-adsense-pay-for-1-000-views-in-india)
- [AI Overviews traffic impact 2026](https://aigrowthagent.co/articles/ai-overviews-traffic-impact/)
- [Actorle growth story](https://www.hey.gg/blog/actorle)
- [Waffle growth story](https://mobilegamer.biz/daily-word-game-studio-waffle-is-the-latest-small-dev-to-find-a-big-audience)
