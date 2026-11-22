# SEO Plan

Search is a slow, supporting channel: win your own brand and game names first, then rank helpful animal-track guides, and skip daily answer pages.

## Strategy

Target about 10 to 20% of visits from search within a year; most traffic will come direct, from habit and sharing, as it does for every successful daily game.

**What competitors show**: Clues by Sam's search visits come mostly from people typing its own name ("clues by sam", 33,100 US searches a month, brings about 65% of its search traffic) ([source](https://ko.semrush.com/website/cluesbysam.com/overview)); Globle and Betweenle look the same. The brand is the keyword.

**Target, in priority order**

1. **Brand and game names**: the hub name, "fresh snow game", "nests puzzle", "stepping stones puzzle". Win these on day one by owning the exact-match pages.
2. **Animal-track guides**: "fox tracks in snow", "rabbit tracks", "deer tracks vs dog tracks". Helpful, evergreen and linked by teachers and nature sites.
3. **Discovery searches**: "games like wordle", "daily logic puzzle", "daily puzzle games". Hard to rank, so get listed on the pages that already rank.
4. **Unlimited / practice**: "fresh snow unlimited", "logic puzzle unlimited" via the practice pages.
5. **Education**: "logic puzzles for kids", "puzzle of the day for classroom" via Classroom pages.

**Skip**: daily answer and hint pages for other companies' games (owned by big publishers and eaten by AI Overviews), thin auto-generated pages, and keyword-stuffed text.

## Site architecture and URL map

Every page that can answer a search has its own clean, permanent URL, no more than two clicks from the homepage; game state pages that shouldn't be indexed are marked noindex.

| URL | Page | Target search | Index |
| --- | --- | --- | --- |
| `/` | Hub: today's Daily Set | Hub name, "daily puzzle games" | Yes |
| `/fresh-snow` | Fresh Snow landing + today's puzzle | "fresh snow game", "animal tracks puzzle" | Yes |
| `/fresh-snow/how-to-play` | Rules with interactive tutorial | "how to play fresh snow" | Yes |
| `/fresh-snow/archive` | Calendar of past puzzles | "fresh snow archive" | Yes |
| `/fresh-snow/archive/2027-01-18` | One past day's puzzles | Long-tail date searches | Yes |
| `/fresh-snow/practice` | Unlimited practice | "fresh snow unlimited" | Yes |
| `/nests`, `/stepping-stones`, `/who-was-here` | Each companion game, same sub-pages | Each game's name | Yes |
| `/animals` | Index of animal guides | "animal tracks identification" | Yes |
| `/animals/fox` (one per animal) | Track guide with drawings and facts | "fox tracks in snow" | Yes |
| `/classroom` | Puzzle of the Day for teachers | "logic puzzle of the day for classroom" | Yes |
| `/journal`, `/stats`, `/settings` | Personal pages | — | No (noindex) |
| `/blog` | Seasonal and update posts | Event and season searches | Yes |
| `/about`, `/privacy`, `/terms` | Trust pages | Brand | Yes |

**Internal linking**: every game page links to the hub, its how-to-play, archive and two related animal guides; every animal guide links to today's Fresh Snow puzzle with "Practise reading fox tracks".

## On-page templates

Each page type follows one template so titles stay under about 60 characters and descriptions under about 155, with the main search phrase near the start.

| Page type | Title tag | Meta description | H1 |
| --- | --- | --- | --- |
| Hub | `Wild Daily: Free Daily Logic Puzzles` | `A new set of nature logic puzzles every day. Read animal tracks, find nests and more. Free, in your browser, no sign-up.` | Today's puzzles |
| Game landing | `Fresh Snow: Daily Animal Tracks Puzzle` | `Read the tracks in fresh snow and find where every animal is hiding. A new puzzle every morning, free in your browser.` | Fresh Snow |
| How to play | `How to Play Fresh Snow: Rules and Tips` | `Learn the Fresh Snow rules in 30 seconds: how foxes, rabbits and deer move, and tips for harder days.` | How to play Fresh Snow |
| Archive day | `Fresh Snow #42, January 18, 2027` | `Play the Fresh Snow puzzles from January 18, 2027: Morning, Noon and Night.` | Fresh Snow, January 18, 2027 |
| Animal guide | `Fox Tracks in Snow: How to Identify Them` | `What fox tracks look like, how they differ from dog tracks, and how foxes move. With drawings and a puzzle to practise.` | Fox tracks in snow |
| Classroom | `Logic Puzzle of the Day for the Classroom` | `A free daily nature logic puzzle to solve together on the board, with an animal fact and a discussion question.` | Puzzle of the Day for your class |

**Each indexed page also has**: a unique 1200 x 630 social image (today's board with prints, auto-generated), a canonical URL, at least 150 words of real explanatory text below the game (rules summary, animal fact, links), and descriptive alt text on every image.

## Technical SEO checklist

Pages are pre-rendered as static HTML, so search engines see real content without running the game's JavaScript.

**Rendering and crawling**

- [ ] Astro static output for every indexed page; the game loads on top of readable HTML (title, rules summary, links).
- [ ] `robots.txt` allows all public pages and points to the sitemap; personal pages carry `noindex`.
- [ ] XML sitemap index split by type (games, archive days, animals, blog), regenerated nightly with new archive days.
- [ ] Ping IndexNow (Bing, Yandex) when new pages publish; submit the sitemap in Google Search Console and Bing Webmaster Tools.
- [ ] One canonical URL per page; `https` only; no trailing-slash duplicates; 301 redirects for any renamed URL.
- [ ] Custom 404 page that links to today's puzzles.

**Structured data (JSON-LD)**

- [ ] `WebSite` and `Organization` on the homepage.
- [ ] `WebApplication` (or `VideoGame`) on each game landing page: name, description, free price, browser requirements.
- [ ] `BreadcrumbList` on archive days and animal guides.
- [ ] `Article` on animal guides and blog posts, with author and dates.

**Speed (Core Web Vitals)**

- [ ] LCP under 2.5 s, INP under 200 ms, CLS under 0.1 on mobile, checked weekly in Search Console.
- [ ] Ads load after the board is interactive; every ad slot has reserved space.
- [ ] Fonts preloaded and subset; illustrations as inline SVG sprites; images in AVIF/WebP with set sizes.

**Social and sharing**

- [ ] Open Graph and Twitter card tags on every page; auto-generated share images per day and per game.
- [ ] Share links include the game and day (`/fresh-snow/archive/2027-01-18`), never a tracking-only URL.

## Stack and SEO

Google doesn't rank frameworks; it ranks pages that arrive as finished HTML, load fast on phones, link well and are genuinely useful. The chosen stack (Astro static output on Cloudflare Pages, see the Technical Design tab) covers the technical part; the rest is content and links.

What moves ranking, in order of impact:

1. Unique, helpful content: the animal guides with original drawings.
2. Links from real sites: directories, teachers, nature organisations, press.
3. Brand searches: people searching the hub's name.
4. Fast mobile pages: hub under 100 KB of JavaScript; ads load after the board.

## Domain and name

Buy a .com for about $10 a year at an at-cost registrar; it is trusted everywhere and Google treats it as global. Availability below is not yet confirmed: check each name before deciding.

**Endings to avoid**: .in (Google treats country endings as targeting that country, which works against US/UK/AU players) and .io (pricier, and its future is uncertain as the UK transfers the territory's sovereignty). If the .com is taken, add a word (`playtracklore.com`) rather than switching endings.

**Registrars** (prices as reported in 2026)

| Registrar | .com first year | Renewal | Notes |
| --- | --- | --- | --- |
| [Cloudflare Registrar](https://domaindetails.com/registrars/cheapest) | \~$10.44 | Same | At cost, no markup; fits Cloudflare hosting |
| [Spaceship](https://domaindetails.com/registrars/best-2025) | \~$9.98 | Same | Lowest 5-year cost of major registrars |
| [Porkbun](https://allaboutcookies.org/cheap-domain-registration) | \~$11.08 | Same | Friendly, phone support |
| [GoDaddy](https://allaboutcookies.org/cheap-domain-registration) | \~$12.99 | \~$22.99 | Avoid: high renewal |

**Name shortlist** (avoid "Pawprint": already used by game company Pawprint Studios)

| Name | Domain to check | Why |
| --- | --- | --- |
| Tracklore (first pick) | tracklore.com | Tracks + stories; covers every future game |
| Hollowlog | hollowlog.com | A hideout from the game; cozy |
| Pinewit | pinewit.com | Forest + cleverness; very short |
| Wildwisp | wildwisp.com | Soft, easy to say anywhere |
| Fernpaw | fernpaw.com | Gentle, family-friendly |
| Daily Den | dailyden.com | Says "daily"; animal den theme |
| Trailtrick | trailtrick.com | Trails + puzzles |

**5-minute check before buying**

- [ ] Availability and standard price in the Cloudflare or Spaceship search (skip names marked "premium").
- [ ] Same-name games: Google, App Store, Google Play, Steam, itch.io.
- [ ] Trademarks: WIPO Global Brand Database (covers the US, EU, India and more).
- [ ] Social handles: X, Instagram, TikTok, Reddit.
- [ ] At purchase: auto-renew, free WHOIS privacy, two-factor login, registrar lock.

## Content plan

Publish 12 animal-track guides before launch and add 2 a month after; each guide doubles as a gentle entry point into today's puzzle.

**Animal guide template** (800 to 1,200 words, original drawings)

1. What the tracks look like (drawing with measurements: print size, stride).
2. How the animal moves and why its trail looks that way.
3. Look-alikes and how to tell them apart ("fox vs dog tracks").
4. Where and when you're likely to see them.
5. Three quick facts, with sources from wildlife agencies or park services.
6. "Practise reading fox tracks" box linking to today's Fresh Snow.

**Launch set (12 guides)**: fox, rabbit (cottontail and hare), deer, squirrel, wild turkey and common birds, coyote, wolf, raccoon, skunk, bobcat, moose, "how to identify animal tracks in snow" overview.

**Ongoing calendar**

| Month | Content |
| --- | --- |
| January | Winter tracking guide; launch post |
| March | Mud-season tracks guide; Stepping Stones launch post |
| May | "Who Was Here?" launch; spring animal babies feature |
| June | Beach and sand tracks guide; summer biome |
| September | Autumn forest tracks; back-to-school Classroom update |
| December | First snow guide; "Year in the Wild" stats post |

**Rules**: every page written for people first; no AI-spun filler; facts checked against reliable sources and dated; update guides once a year.

## Links and listings

Earn links by being listed where puzzle fans already look and by giving teachers and nature sites something worth linking to; never buy links.

| Target | How | When |
| --- | --- | --- |
| Daily-game directories (Listdle, wordlelike.games and similar) | Submit each game with a GIF and one-line description | Launch week, and each new game |
| "Games like Wordle" list articles | Email the authors a short note and a GIF | Month 1 onward |
| Room Escape Artist daily puzzle guide | Submit in the comments as other developers do | Launch week |
| Reddit, Hacker News, Product Hunt | Launch posts (see the plan's launch section) | Launch week |
| Teachers and education sites | Share the Classroom page and printable worksheets | Back-to-school (Aug to Sept) and January |
| Nature and wildlife organisations, parks | Offer the animal guides and an embeddable "puzzle of the day" widget | Month 2 onward |
| Game and culture writers | Pitch with real numbers once past \~1,000 daily players | Month 3 onward |

**Embeddable widget**: a small "Today's Fresh Snow" card other sites can paste in, linking back to the hub; this reuses the embed idea already proven on CleverTools.

## Measurement and monthly routine

Judge SEO by branded search growth and animal-guide clicks, checked once a month in Google Search Console, not by daily rank checks.

**Monthly SEO metrics**

| Metric | Where | 6-month goal |
| --- | --- | --- |
| Branded searches (hub + game names) | Search Console, queries containing the names | Growing every month |
| Search share of all visits | Analytics | 10 to 20% |
| Clicks to animal guides | Search Console, `/animals/` pages | 1,000+ a month |
| Pages indexed vs submitted | Search Console | Over 90% |
| Core Web Vitals "good" URLs | Search Console | 100% on mobile |
| Referring domains | Search Console links report | 50+ |

**Monthly routine (about 2 hours)**

- [ ] Check Search Console for coverage errors and Core Web Vitals.
- [ ] Find pages ranking 8 to 20 and improve their titles and content.
- [ ] Publish 2 animal guides; update one older guide.
- [ ] Submit any new game to directories; send 5 outreach emails.
- [ ] Note what changed and the results in a simple log.
