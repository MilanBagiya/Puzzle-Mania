// Today page: Daily Set progress, streak with Snow Days, countdown, Trek, bonus games, badges, journal.
import { activeSeason, addDays, BADGES, DAILY_SET, GAMES, SEASON_INFO, todaysPicks, type Season, JOURNAL, daysPlayed, earnedBadges, formatDate, formatTime, loadProgress, nextInSet, playedDay, setCount, streakInfo, trekStars, trekUnlocked, type GameKey } from '@wild-daily/core';
import { TREK_STAGE_COUNT } from '@wild-daily/game-fresh-snow/engine';
import { paws, print } from '@wild-daily/ui';
import { CATALOG, entryById } from '../data/catalog';
import { tileHtml } from './tiles';
import { markSolved } from './portal';
import { startCountdowns, today } from './daily';

const p = loadProgress();
const $ = (id: string): HTMLElement | null => document.getElementById(id);
const set = (id: string, text: string): void => { const el = $(id); if (el) el.textContent = text; };
set('hub-date', formatDate(today));
const next = nextInSet(p, today);
const play = $('hub-play') as HTMLAnchorElement | null;
if (play) { if (next) { play.href = GAMES[next].href; play.textContent = `Play ${GAMES[next].name.replace('Fresh Snow · ', '')}`; } else { play.href = '/trek'; play.textContent = 'Play Trail Trek'; } }
const n = setCount(p, today);
set('hub-set', `${n} of ${DAILY_SET.length} solved`);
const bar = $('hub-setbar'); if (bar) bar.style.width = `${(n / DAILY_SET.length) * 100}%`;
if (n === DAILY_SET.length) $('hub-setdone')?.removeAttribute('hidden');
const row = (g: GameKey): void => {
  const el = document.querySelector<HTMLElement>(`#hub-levels .tile[data-keys="${g}"]`); if (!el) return;
  const r = p.days[today]?.[g]; if (!r) return;
  const small = el.querySelector('.tile-time'); if (small) small.innerHTML = `${paws(r.stars, 14)} ${formatTime(r.time)}`;
};

const tz = (): string => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; } };
function renderSeason(season: Season): void {
  const info = SEASON_INFO[season];
  set('hub-title', info.title); set('hub-lead', info.lead); set('hub-season', info.name);
  const s = info.name.toLowerCase();
  set('hub-picks-note', `Three games from the pack, chosen fresh every day, led by ${/^[aeiou]/.test(s) ? 'an' : 'a'} ${s} game. Solve all three for a badge.`);
  const picksEl = $('hub-picks');
  if (picksEl) { picksEl.innerHTML = todaysPicks(today, 3, season).map((g) => { const e = entryById(g); return e ? tileHtml(e) : ''; }).join(''); markSolved(picksEl); }
  const seasonEl = $('hub-inseason');
  set('hub-season-title', `In season: ${info.name.toLowerCase()}`);
  if (seasonEl) { seasonEl.innerHTML = CATALOG.filter((e) => e.season === season).sort((a, b) => a.featured - b.featured).map((e) => tileHtml(e)).join(''); markSolved(seasonEl); }
}
renderSeason(activeSeason(p, today, tz()));
document.addEventListener('wd:season', (e) => renderSeason((e as CustomEvent<Season>).detail));
DAILY_SET.forEach(row);
// Continue playing: games played in the last two weeks, newest first.
{
  const seen = new Map<string, string>();
  Object.entries(p.days).sort(([a], [b]) => (a < b ? 1 : -1)).forEach(([date, day]) => Object.keys(day).forEach((k) => {
    const e = CATALOG.find((x) => x.keys.includes(k as GameKey)); if (e && !seen.has(e.id) && date >= addDays(today, -14)) seen.set(e.id, date);
  }));
  const wrap = $('hub-continue-wrap'), el = $('hub-continue');
  if (wrap && el && seen.size) { el.innerHTML = [...seen.keys()].slice(0, 8).map((id) => tileHtml(entryById(id)!)).join(''); markSolved(el); wrap.hidden = false; }
}
const s = streakInfo(p, today);
set('hub-streak', s.current ? `🔥 ${s.current}-day streak` : 'Start a streak today');
set('hub-best', `Best: ${s.best} ${s.best === 1 ? 'day' : 'days'}${s.snowDays.length ? ` · ${s.snowDays.length} Snow Day used` : ''}`);
const unlocked = Math.min(trekUnlocked(p), TREK_STAGE_COUNT + 1);
set('hub-trek', unlocked > TREK_STAGE_COUNT ? 'All 60 stages cleared!' : `Stage ${unlocked} of ${TREK_STAGE_COUNT} · ${trekStars(p)} ${trekStars(p) === 1 ? 'paw' : 'paws'} earned`);
const tb = $('hub-trek-btn') as HTMLAnchorElement | null; if (tb && unlocked <= TREK_STAGE_COUNT) { tb.href = `/trek/play?stage=${unlocked}`; tb.textContent = unlocked === 1 ? 'Start the trek' : `Continue stage ${unlocked}`; }
set('hub-badges', `${earnedBadges(p, today).length} of ${BADGES.length} badges`);
set('hub-journal', `${Math.min(daysPlayed(p), JOURNAL.length)} of ${JOURNAL.length} animals found. Each day you play adds one.`);
if (p.tutorialDone) set('hub-tut', 'Replay the tutorial');
const week = $('hub-week');
if (week) week.innerHTML = [...Array(7).keys()].map((i) => {
  const d = addDays(today, i - 6), on = playedDay(p, d), snow = s.snowDays.includes(d);
  return `<div class="stack" style="gap:4px; align-items:center"><span class="muted" style="font-size:12px; font-weight:800">${formatDate(d, { weekday: 'narrow' })}</span><span style="width:100%; height:34px; border-radius:3px; display:grid; place-items:center; font-size:11px; font-weight:800; background:${on ? 'var(--fox-t)' : snow ? 'var(--rabbit-t)' : 'var(--soft)'}; box-shadow:0 3px 0 ${on ? 'var(--fox-e)' : snow ? 'var(--rabbit-e)' : 'var(--soft-e)'}${d === today ? '; outline:2px solid var(--coral)' : ''}" aria-label="${formatDate(d)}${on ? ', played' : snow ? ', Snow Day' : ''}">${on ? print('fox', 16) : snow ? '❄' : ''}</span></div>`;
}).join('');
startCountdowns();
