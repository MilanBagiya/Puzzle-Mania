// Shared logic for every daily game page: which date, loading the puzzle file, recording the result,
// paws, badges, Journal cards, streak, countdown and the "next in your Daily Set" step.
import {
  addDays, DAILY_SET, GAMES, JOURNAL, daysPlayed, formatCountdown, formatDate, formatTime, isIsoDate, loadProgress, msUntilMidnight,
  nextInSet, recordGame, saveProgress, setCount, streakInfo, takeNewBadges, todayIso, todaysPicks, type Season, type Badge, type GameKey, type GameResult, type JournalCard,
} from '@wild-daily/core';
import { arrowNav, bird, character, paws, print } from '@wild-daily/ui';
import { toast } from './toast';
import './juice';
import { params } from './nav';

// Every game page loads this module: arrow keys move between a board's buttons. (Focus after a redraw is kept by scripts/focus.ts.)
const gameMain = document.querySelector('main');
if (gameMain) arrowNav(gameMain);

export const today = todayIso();
/** ?date=YYYY-MM-DD for archive play; never a future day. */
export function pageDate(): string {
  const d = params().get('date');
  return isIsoDate(d) && d <= today ? d : today;
}
export async function loadPuzzle<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
export function showLoadError(root: HTMLElement, what: string, date: string): void {
  root.innerHTML = `<div class="card stack" style="align-items:center; text-align:center">${character('fox', 'oops', 110, 'shake')}<h2 class="h-m">This puzzle isn’t ready yet</h2><p class="muted" style="margin:0">We couldn’t load ${what} for ${formatDate(date)}. Check your connection, or play today’s puzzle instead.</p><a class="btn btn-p" href="/">Back to today</a></div>`;
}
export function setDateLabel(id: string, date: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = `${date === today ? 'Today · ' : ''}${formatDate(date)}`;
}

export const cardArt = (j: JournalCard, w: number): string =>
  j.art.kind === 'character' ? character(j.art.animal, 'happy', w, 'cheer') : j.art.kind === 'bird' ? bird(j.art.color, w) : print(j.art.print, Math.round(w * 0.75));

export interface Finish { game: GameKey; date: string; time: number; hints: number; moves?: number; stars?: number }
export interface Recorded { result: GameResult; card: JournalCard | null; badges: Badge[]; streak: number; setDone: boolean }
/** Save a solve and work out everything it unlocked. */
export function recordFinish(f: Finish): Recorded {
  const p = loadProgress(), now = todayIso(); // the page may have stayed open past midnight
  // A puzzle started on its own day still counts as live when it is finished just after midnight (the next day only).
  const live = f.date === now || (f.date === today && addDays(today, 1) === now);
  const { firstPlayOfDay, result } = recordGame(p, f.date, f.game, { time: f.time, hints: f.hints, live, ...(f.moves !== undefined ? { moves: f.moves } : {}), ...(f.stars !== undefined ? { stars: f.stars } : {}) });
  const count = daysPlayed(p);
  const card = firstPlayOfDay && count <= JOURNAL.length ? JOURNAL[count - 1] ?? null : null;
  const badges = takeNewBadges(p, now);
  saveProgress(p);
  return { result, card, badges, streak: streakInfo(p, now).current, setDone: setCount(p, f.date) === DAILY_SET.length };
}

/** Pages show the day they were opened. When local midnight passes, offer today's puzzles (once). */
function watchMidnight(): void {
  if (!document.querySelector('main [id$="-game"], main #dc, #hub-levels')) return; // not on stats and other pages
  if (params().get('date')) return; // archive play: a new day changes nothing here
  const check = (): boolean => {
    if (todayIso() === today || document.querySelector('.newday')) return false;
    const el = document.createElement('div');
    el.className = 'toast newday'; el.setAttribute('role', 'status');
    el.innerHTML = '<span>A new day has started: today’s puzzles are ready.</span><button type="button" class="btn btn-c">Load today</button>';
    el.querySelector('button')!.addEventListener('click', () => location.reload());
    document.body.appendChild(el);
    return true;
  };
  const wait = (): void => { window.setTimeout(() => { if (!check()) wait(); }, msUntilMidnight() + 1000); };
  wait();
  // Timers pause while a laptop sleeps or a tab is hidden, so check again whenever the page comes back.
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
}
watchMidnight();

export interface ResultView {
  el: HTMLElement; title: string; subtitle: string; art: string;
  stats: { value: string; label: string; tint: string }[];
  share: string; rec: Recorded; date: string; game: GameKey;
}
/** The shared result screen. */
export function showResult(v: ResultView): void {
  const p = loadProgress();
  const now = todayIso(), live = v.date === today; // the page may have stayed open past midnight
  const next = live ? nextInSet(p, v.date) : undefined;
  const primary = next
    ? `<a class="btn btn-c big" href="${GAMES[next].href}${v.date !== now ? `&date=${v.date}` : ''}">Next: ${GAMES[next].name}</a>`
    : `<a class="btn btn-c big" href="/">Back to today</a>`;
  const setBanner = v.rec.setDone && v.date === now
    ? `<section class="card banner" style="background:var(--good)">${character('deer', 'happy', 80, 'cheer')}<div class="grow"><h2 class="h-s">Daily Set complete!</h2><p style="margin:4px 0 0" class="muted">New puzzles in <b class="countdown" data-countdown>${formatCountdown(msUntilMidnight())}</b>. Try a bonus game or the Trail Trek while you wait.</p></div><a class="btn btn-w" href="/trek">Trail Trek</a></section>` : '';
  // Coming back tomorrow: the streak, big, with what it becomes tomorrow and tomorrow's picks (names only, no spoilers).
  const st = streakInfo(p, now), playedNow = v.date === now;
  const season = (document.documentElement.getAttribute('data-season') ?? undefined) as Season | undefined;
  const tomorrow = todaysPicks(addDays(now, 1), 3, season).map((g) => GAMES[g].name);
  const streakCard = playedNow && st.current > 0 ? `<section class="card streak-card" aria-label="Your streak">
<div class="streak-num"><b class="display">${st.current}</b><span>day${st.current === 1 ? '' : 's'} in a row</span></div>
<div class="grow stack" style="gap:6px"><h2 class="h-s">${st.current >= st.best && st.current > 1 ? 'Your best streak yet!' : st.current === 1 ? 'Day one of a new streak' : `Best streak: ${st.best} days`}</h2>
<p class="muted" style="margin:0">Come back tomorrow to make it <b>${st.current + 1}</b>. New puzzles in <b class="countdown" data-countdown>${formatCountdown(msUntilMidnight())}</b>.${st.snowDays.length ? ' A Snow Day covered a missed day this week.' : ''}</p>
${daysPlayed(p) < JOURNAL.length ? `<p style="margin:0"><b>Tomorrow’s Journal card:</b> a new animal (${daysPlayed(p) + 1} of ${JOURNAL.length}). <a href="/journal">See who’s hiding</a></p>` : ''}
<p style="margin:0"><b>Tomorrow’s picks:</b> ${tomorrow.join(' · ')}</p></div></section>` : '';
  const setNote = playedNow && setCount(p, now) > 0 ? ` Daily Set ${setCount(p, now)}/${DAILY_SET.length}.` : '';
  // The streak card shows the streak, so its stat tile shows Daily Set progress instead (no number twice).
  const stats = streakCard ? v.stats.map((x) => (x.label === 'day streak' ? { ...x, value: `${setCount(p, now)}/${DAILY_SET.length}`, label: 'Daily Set' } : x)) : v.stats;
  const shareText = `${v.share}${playedNow && st.current > 1 ? ` 🔥 ${st.current}-day streak.` : ''}${setNote}`;
  v.el.innerHTML = `<section class="card stack" style="align-items:center; text-align:center; padding:26px">
<div class="row" style="justify-content:center; gap:4px">${v.art}</div>
<h2 class="h-l">${v.title}</h2>
<p class="muted" style="margin:0; font-weight:800">${v.subtitle}</p>
${paws(v.rec.result.stars, 30)}
<div class="stats">${stats.map((s) => `<div class="sheet" style="padding:10px; background:${s.tint}"><b class="display" style="font-size:26px">${s.value}</b><div style="font-size:13px; font-weight:800">${s.label}</div></div>`).join('')}</div>
<div class="row" style="justify-content:center"><button class="btn btn-p big" data-share>Share result</button>${primary}</div>
${next ? '<a href="/" style="font-weight:800">Back to today</a>' : ''}</section>
${streakCard ? `<div style="margin-top:20px">${streakCard}</div>` : ''}
${v.rec.badges.length ? `<section class="card stack new-badges" style="margin-top:20px; background:var(--note)"><span class="pill p-y" style="align-self:flex-start">${v.rec.badges.length === 1 ? 'New badge!' : `${v.rec.badges.length} new badges!`}</span>${v.rec.badges.map((b) => `<div class="row new-badge"><span class="medal" style="font-size:28px">${b.icon}</span><div class="grow"><h2 class="h-s">${b.name}</h2><p class="muted" style="margin:2px 0 0">${b.desc}</p></div></div>`).join('')}<a class="btn btn-w" href="/stats" style="align-self:flex-start">See all badges</a></section>` : ''}
${v.rec.card ? `<section class="card stack tilt-l" style="background:var(--note); align-items:center; text-align:center; margin-top:20px"><span class="pill p-y" style="align-self:flex-start">New Journal card!</span><div style="min-height:110px; display:flex; align-items:flex-end">${cardArt(v.rec.card, 96)}</div><h2 class="h-m">${v.rec.card.name}</h2><p style="margin:0; max-width:40ch">${v.rec.card.fact}</p><a class="btn btn-w" href="/animals/${v.rec.card.guide}">Read the ${v.rec.card.name.toLowerCase()} guide</a></section>` : ''}
${setBanner ? `<div style="margin-top:20px">${setBanner}</div>` : ''}`;
  v.el.hidden = false;
  v.el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  v.el.querySelector('[data-share]')?.addEventListener('click', () => share(shareText));
  if (v.rec.badges.length) toast(`Badge earned: ${v.rec.badges[0]!.name}!`);
  startCountdowns();
}
export function share(text: string): void {
  const full = `${text} ${location.origin}`;
  if (navigator.share) { navigator.share({ text: full }).catch(() => undefined); return; }
  navigator.clipboard?.writeText(full).then(() => toast('Result copied. Paste it anywhere to share.'), () => toast(full));
}
export const shareLine = (name: string, date: string, r: GameResult, extra = ''): string =>
  `${name}, ${formatDate(date, { month: 'short', day: 'numeric' })}: ${'🐾'.repeat(r.stars)}${'·'.repeat(3 - r.stars)} in ${formatTime(r.time)}${extra}.`;
/** Keeps every [data-countdown] element ticking. */
export function startCountdowns(): void {
  const tick = (): void => document.querySelectorAll<HTMLElement>('[data-countdown]').forEach((el) => { el.textContent = formatCountdown(msUntilMidnight()); });
  tick();
  window.setInterval(tick, 30000);
}
