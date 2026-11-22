# Growth Playbook

Maximum users come from three engines working together: search and AI assistants that send new players, communities and sharing that spread the game, and daily habit that brings them back. This tab covers every channel, how to set it up, and when.

## Channel map

In the first months most players will come from communities, directories and sharing; search and AI assistants grow slowly underneath and become steady sources by month 6 to 12.

| Channel | What it brings | Effort | Start |
| --- | --- | --- | --- |
| Sharing and friend leagues | Friends of players; the strongest daily-game engine | Built once | Launch |
| Reddit, Hacker News, Product Hunt | First big spikes of puzzle fans | Medium, launch week | Launch |
| Daily-game directories and list articles | Steady discovery traffic from puzzle fans | Low | Launch |
| Google Search | Brand searches, animal-guide visitors, long-tail | Ongoing | Before launch |
| Google Discover | Bursts of mobile readers for guides and posts | Low once set up | Month 2 |
| Bing (+ Yahoo, DuckDuckGo, Ecosia) | Extra search traffic, strong on desktop | Low | Before launch |
| AI assistants (ChatGPT, Copilot, Perplexity, Claude, Gemini) | Recommendations when people ask for daily puzzles | Low setup, slow growth | Before launch |
| Short video (TikTok, Shorts, Reels) | Large casual audience; viral potential | Medium, weekly | Month 1 |
| Pinterest | Evergreen visitors to animal guides | Low, weekly | Month 2 |
| Newsletters and press | Large one-off spikes (Actorle's first growth came from one newsletter) | Medium | Month 1 onward |
| Teachers and nature organisations | Classes, families, quality links | Medium | Back-to-school and January |
| Game portals (itch.io; CrazyGames/Poki only for spin-offs) | Portal audiences | Medium | Month 3 onward |

Rule of thumb: spend 70% of growth time on what already works for you (check the Tracking section monthly) and 30% testing one new channel at a time.

## Google

Set up Search Console before launch, give every indexed page a large share image, and treat Discover as a bonus channel for animal guides and seasonal posts.

**Search Console setup**

- [ ] Verify the whole domain (DNS record in Cloudflare), not just one URL prefix.
- [ ] Submit the sitemap index; check "Pages" weekly for anything not indexed and why.
- [ ] Use URL Inspection → "Request indexing" for the homepage, each game page and each new guide.
- [ ] Test structured data with the Rich Results Test; fix all errors before launch.
- [ ] Watch Core Web Vitals (mobile) and fix any "poor" URLs first.
- [ ] Add a second owner (backup Google account) so you never lose access.

**Brand presence in results**

- `Organization` structured data with logo and `sameAs` links to your social profiles helps Google connect your brand.
- Clear page titles and a logical site structure (hub → game → how-to-play / archive) help Google show sitelinks under brand searches.
- A favicon at 48 x 48 px or larger, visible in results next to your name.

**Google Discover** (mobile feed; best for animal guides, seasonal posts, new-game announcements)

- [ ] Add `<meta name="robots" content="max-image-preview:large">` to every indexed page.
- [ ] Give each guide and post a real, relevant image at least 1,200 px wide, about 16:9, high resolution; never the logo or a text-heavy image ([Google Search Central](https://developers.google.com/search/docs/appearance/google-discover?authuser=1), [SEJ](https://www.searchenginejournal.com/google-clarifies-how-it-picks-thumbnails-for-search-discover/568628)).
- [ ] Honest, non-clickbait titles; Google says clickbait and misleading previews hurt eligibility.

Google's own case study saw a 30% higher click-through rate and 332% more clicks over 6 months after a publisher enabled large image previews ([Google](https://developers.google.com/search/case-studies/large-images-case-study)).

**Image search**: descriptive file names (`fox-tracks-in-snow.svg`), alt text, and images near the text they illustrate; your original track drawings can rank on their own.

**AI Overviews and AI Mode**: there is no separate setting to opt in. Pages that answer one question clearly in their first paragraph ("Fox tracks are...") and carry original drawings and facts are the ones AI answers cite and link.

## Bing and its partners

One Bing setup reaches several search engines at once: Bing's index also powers Yahoo, DuckDuckGo and Ecosia, and Bing feeds Microsoft Copilot answers. Bing holds roughly 3.5% of global search and about 6.5% of US desktop search ([x-cmd, citing StatCounter Q2 2026](https://www.x-cmd.com/ja/seo/bing-indexnow)), small but free to capture.

**Bing Webmaster Tools**

- [ ] Sign in with a Microsoft account → Add site → "Import your sites from GSC" (copies verification and sitemaps; allow about 24 hours) ([Practical Ecommerce](https://www.practicalecommerce.com/?p=1564581)).
- [ ] Check Site Explorer and Search Performance weekly for errors and queries.
- [ ] Open the **AI Performance** report monthly: it shows how often your pages are cited in Copilot and Bing's AI summaries, which pages, and for which "grounding queries" ([Bing blog](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview?utm_source)). It shows citations, not clicks.

**IndexNow** (instant indexing for new pages)

- [ ] Generate a key, host it at `/{key}.txt`, and have the nightly build send every new or changed URL (new archive days, guides, posts) to the IndexNow endpoint.
- [ ] One submission is shared with every participating engine: Bing, Yandex, Naver, Seznam and Yep ([Wikipedia](https://wikipedia.com/wiki/Draft:IndexNow), [Ahrefs](https://ahrefs.com/blog/?p=172548)). Google does not participate, so keep the sitemap for Google.

* Limits to respect: up to 10,000 URLs per request, about 1 request per second ([x-cmd](https://www.x-cmd.com/ja/seo/bing-indexnow)).

## AI assistants and other search engines

More people now ask ChatGPT, Copilot, Perplexity, Claude or Gemini "what are good daily puzzle games?"; to be recommended, their search crawlers must be able to read your pages and your pages must state clearly what the game is.

**Each assistant's search crawler** (allow all of these for maximum reach)

| Assistant | Crawler to allow | If blocked |
| --- | --- | --- |
| ChatGPT search | `OAI-SearchBot` (and `ChatGPT-User` for live page reads) | Not shown in ChatGPT search answers |
| Claude | `Claude-SearchBot` (and `Claude-User`) | Not shown in Claude's search answers |
| Perplexity | `PerplexityBot` (and `Perplexity-User`) | Not shown in Perplexity answers |
| Copilot | `Bingbot` | Not in Bing or Copilot |
| Google AI Overviews / AI Mode / Gemini | `Googlebot` | Not in Google at all |

Training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`) are separate; blocking them does not remove you from AI search answers ([DEV Community](https://dev.to/saaswithalex/why-chatgpt-ignores-your-website-5ckg)). For maximum visibility, allow them too; it's your choice.

**Cloudflare check**: Cloudflare's AI Crawl Control can block AI crawlers at the network level, which overrides robots.txt. Open it after adding the domain and make sure the AI *search* crawlers above are allowed ([Cloudflare bot list](https://developers.cloudflare.com/ai-crawl-control/reference/bots/index.md)).

**Make pages easy for AI to cite**

- Pages must show their content in the first HTML response; AI crawlers often don't run JavaScript (the static Astro setup already does this).
- An About page and game pages that say plainly: what it is, who it's for, that it's free, works in the browser, new puzzle daily.
- Animal guides open with a one-sentence answer, then detail.
- Be listed on the third-party pages AI answers draw from: daily-game directories, "games like Wordle" lists, Reddit threads.

**Other search engines**

- **Brave Search** runs its own index; it finds you through normal crawling and links.
- **Apple** (Siri and Safari suggestions) uses `Applebot`; keep it allowed.
- **Yandex, Naver, Seznam**: covered automatically by IndexNow; low priority for an English audience.

**robots.txt template**

```
User-agent: *
Allow: /
Disallow: /admin

Sitemap: https://yourdomain.com/sitemap.xml
```

Journal, stats and settings stay crawlable but carry `noindex`; blocking them in robots.txt would stop crawlers from seeing that tag.

A single `User-agent: *` group with `Allow: /` lets every search and AI crawler in; add named `Disallow` groups only if you later decide to block training crawlers.

## Social and video

Show the game being played, not described: short clips of a puzzle clicking into place spread far better than links. Post where puzzle fans, nature lovers and teachers already gather.

| Platform | What to post | How often | Notes |
| --- | --- | --- | --- |
| Reddit | Launch posts; new games; occasional "I made this" updates | Launch, then each new game | Follow each community's self-promotion rules; reply to every comment |
| TikTok, YouTube Shorts, Instagram Reels | 15 to 30 s clip: today's board → solving → snowfall finish; "Can you find where the fox hid?" | 3 to 5 a week | Same clip on all three; hook in the first 2 seconds; link in bio |
| Pinterest | Tall pins of each animal-track drawing linking to its guide | 3 to 5 pins a week | Evergreen: pins keep sending visitors for months |
| X, Threads, Bluesky | Daily puzzle number + one-line teaser; Sunday story teasers | Daily or a few times a week | Puzzle fans share their own results here; reply and repost |
| Facebook groups | Classroom mode for teacher groups; guides for wildlife and tracking groups | Monthly | Ask admins before posting |
| YouTube (long) | Monthly "how to solve a Sunday Blizzard" walkthrough | Monthly | Also ranks in Google video results |
| Discord | Community server once players ask for one | Later | Channels for daily results and Sunday Blizzard |

**Content ideas that travel well**

- "Only 12% solved today's Night puzzle. Can you?" (real stats from the API).
- Real animal-track photos (yours or licensed) side by side with the game's print icons.
- Timelapse of a hard puzzle being solved in 20 seconds.
- Rare-animal day announcements (full-moon wolf pack).

## Game portals and directories

List the hub everywhere puzzle fans look for new games, but keep the daily games themselves on your own site: portal deals can require exclusivity, and players who play elsewhere never see your ads or build your streak.

**Directories and launch sites** (free, link back to you)

- [ ] Daily-game directories: Listdle, wordlelike.games, and similar "games like Wordle" lists.
- [ ] Room Escape Artist's daily puzzle guide (submit in the comments).
- [ ] Product Hunt, Hacker News ("Show HN"), Indie Hackers, AlternativeTo (as an alternative to Wordle and Queens).
- [ ] Email authors of ranking "best daily puzzle games" articles each time a new game launches.

**Game portals**

| Portal | How it works | Use it for |
| --- | --- | --- |
| itch.io | Free page you control; links allowed | A page for the hub with GIFs and a "Play free in your browser" link |
| CrazyGames | Developer portal, QA review, ad revenue share; 2026 jam terms listed 60% of ad revenue to developers ([Cinevva](https://app.cinevva.com/guides/publish-game-crazygames)) | Only a spin-off (for example an endless practice version), never the daily games |
| Poki | Curated; web exclusive by default for 5 years unless a non-exclusive deal is agreed ([Playgama](https://playgama.com/blog/business-faqs/where-can-i-publish-my-html5-game/)) | Avoid for the daily games; consider only a standalone spin-off |
| YouTube Playables | Web games playable inside YouTube; apply-only | Watch for an opening later; check terms first |

**Rule**: never sign an exclusive deal for a daily game; read every portal agreement for exclusivity, revenue share and payout terms before uploading.

## Partnerships, press and education

One well-placed mention can bring thousands of players in a day; Actorle's first surge came from a single quirky newsletter, then Twitter and Mashable ([hey.gg](https://www.hey.gg/blog/actorle)).

**Newsletters and press**

- [ ] Build a list of 20 newsletters covering fun websites, puzzles, indie games and nature.
- [ ] Pitch in 4 sentences: what it is, why it's different (animal tracks, not words), one striking stat or GIF, link.
- [ ] Once past \~1,000 daily players, pitch game and culture writers at tech and lifestyle sites with real numbers.
- [ ] Keep a simple press page: logo, screenshots, GIFs, one-paragraph description, your contact.

**Cross-promotion with other daily-game makers**

- [ ] Add a small "More daily games we love" section and offer the same to friendly indie daily-game developers; swaps send engaged players both ways.
- [ ] Join daily-game developer communities and share what you learn.

**Education**

- [ ] Share Classroom mode with teacher communities, school newsletters and education blogs in January and August to September.
- [ ] Offer free printable worksheets; each printed sheet carries the hub's address.

**Nature organisations**

- [ ] Offer wildlife trusts, nature centres and parks the animal guides and the embeddable "puzzle of the day" widget for their sites.
- [ ] Ask to credit them for fact-checking a guide; experts often share pages they helped with.

## Built-in viral loops

The cheapest users are friends of existing players; build sharing into the moments when players feel proud or curious.

| Loop | How it works | Where it lives |
| --- | --- | --- |
| Share card | Spoiler-free emoji result with puzzle number, streak and link; one tap via the phone's share sheet | Result screen |
| Challenge a friend | "I solved Night in 9:40, can you beat me?" link that opens the same puzzle and shows both times after | Result screen |
| Friend leagues | Invite code for a private group (family, office, friends); daily times side by side | Stats and result screens |
| Rich link previews | Each shared link shows a 1,200 x 630 board image, game name and day | Open Graph images |
| Embed widget | "Today's puzzle" card other sites paste in; links back | Nature, school and blog sites |
| Sunday cliffhanger | Story ends "to be continued"; players share their guess before Monday | Sunday result screen |
| Milestone moments | 30- and 100-day streak cards designed to be screenshotted | Streak milestones |

**Measure it**: track `share_click` and new visitors arriving from shared links (UTM `utm_source=share`). A share rate above 10% of solves means the loop is working; below 5%, simplify the share text and move the button higher.

## Channel calendar, year one

Add channels in waves so each gets proper attention; every new game or biome is a fresh reason to return to all earlier channels.

| When | Focus | Key actions |
| --- | --- | --- |
| Before launch (Dec 2026) | Search and AI setup | Search Console, Bing Webmaster (import), IndexNow, robots.txt, Cloudflare AI crawler check, 12 guides live |
| Launch week (Jan 18, 2027) | Communities and directories | Reddit, Hacker News, Product Hunt, directories, newsletters |
| Feb 2027 | Short video + sharing | 3 to 5 clips a week; tune share card; friend leagues |
| Mar 2027 | Stepping Stones + mud biome | Re-announce on all launch channels; Pinterest pins for spring guides |
| Apr 2027 | Press | Pitch writers with growth numbers; cross-promotion swaps |
| May 2027 | Who Was Here? | Launch posts; animal-art clips for video and Pinterest |
| Jun to Jul 2027 | Summer biome, evergreen content | Beach-tracks guides; Discover-ready images |
| Aug to Sep 2027 | Back to school | Classroom mode to teacher groups and education sites |
| Oct to Nov 2027 | Autumn biome, portals | itch.io page; consider a spin-off on CrazyGames |
| Dec 2027 | Year in review | "Year in the Wild" stats post and shareable cards; first-snow guide |

## Tracking

Judge every channel by **returning players**, not visits: a channel that brings 500 visitors who come back daily beats one that brings 5,000 who never return.

**UTM rules** (add to every link you post yourself)

| Channel | utm\_source | utm\_medium | Example utm\_campaign |
| --- | --- | --- | --- |
| Reddit | reddit | community | launch-2027-01 |
| Hacker News | hackernews | community | show-hn |
| Product Hunt | producthunt | launch | launch-2027-01 |
| TikTok / Shorts / Reels | tiktok / youtube / instagram | video | fox-clip-01 |
| Pinterest | pinterest | social | fox-tracks-guide |
| Newsletters | newsletter name | email | pitch-2027-02 |
| Share card | share | referral | daily-share |
| Embed widget | embed | referral | site name |

Search engines and AI assistants show up on their own as referrers (google, bing, chatgpt.com, perplexity.ai, copilot), so no UTM is needed there.

**Monthly channel review**

- [ ] For each channel: new visitors, day-7 return rate, solves per visitor, share rate.
- [ ] Rank channels by returning players brought; put 70% of next month's growth time into the top two.
- [ ] Drop or pause any channel that brought fewer than 50 returning players after 2 honest months.
- [ ] Check Bing's AI Performance report and AI referrers in analytics to see if AI assistants are recommending the hub.
