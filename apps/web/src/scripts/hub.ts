// Today page: Daily Set progress, streak with Snow Days, countdown, Trek, bonus games, badges, journal.
import { activeSeason, addDays, BADGES, BONUS, DAILY_SET, GAMES, SEASON_INFO, packSeason, todaysPicks, type Season, JOURNAL, daysPlayed, earnedBadges, formatDate, formatTime, loadProgress, nextInSet, playedDay, setCount, streakInfo, trekStars, trekUnlocked, type GameKey } from '@wild-daily/core';
import { TREK_STAGE_COUNT } from '@wild-daily/game-fresh-snow/engine';
import { bird, character, frog, mushroom, paws, print, svgUse } from '@wild-daily/ui';
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
  const el = document.querySelector<HTMLElement>(`.lvrow[data-game="${g}"]`); if (!el) return;
  const r = p.days[today]?.[g];
  el.classList.toggle('done', !!r);
  const small = el.querySelector('small'), btn = el.querySelector<HTMLAnchorElement>('a');
  if (r && small) small.innerHTML = `${paws(r.stars, 14)} Solved in ${formatTime(r.time)}`;
  if (btn) { btn.textContent = r ? 'Replay' : 'Play'; btn.classList.toggle('btn-w', !!r); btn.classList.toggle('btn-p', !r); }
};
/** A small picture for every pack game (Today's picks rows). */
const PACK_ICON: Record<string, () => string> = {
  'frog-pond': () => frog(40), 'firefly-night': () => svgUse('n-firefly', '0 0 20 20', 34), 'owl-watch': () => svgUse('n-owl', '0 0 40 40', 40),
  'acorn-stash': () => svgUse('n-acorn', '0 0 30 36', 32), beehive: () => svgUse('n-hive', '0 0 36 36', 38), 'beaver-lodges': () => svgUse('n-beaver', '0 0 80 80', 42),
  'snow-picture': () => svgUse('i3-drift', '0 0 72 44', 44), 'otter-slide': () => svgUse('n-otter', '0 0 40 30', 42), 'moose-crossing': () => character('deer', 'idle', 42),
  'burrow-escape': () => character('rabbit', 'idle', 42), 'salmon-run': () => svgUse('n-fish', '0 0 40 22', 42), 'bears-last-snack': () => svgUse('n-bear', '0 0 40 36', 40),
  'who-ate': () => character('fox', 'idle', 42), 'freshest-track': () => print('fox', 32), 'egg-match': () => bird('#7FC4E8', 40), 'track-word': () => print('rabbit', 32),
  'whose-print': () => print('deer', 32), 'feather-pairs': () => bird('#E2594A', 40), 'leaf-pile': () => svgUse('n-leaf', '0 0 24 24', 32), 'who-was-here': () => mushroom(36),
};
const tz = (): string => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; } };
function renderSeason(season: Season): void {
  const info = SEASON_INFO[season];
  set('hub-title', info.title); set('hub-lead', info.lead); set('hub-season', info.name);
  const s = info.name.toLowerCase();
  set('hub-picks-note', `Three games from the pack, chosen fresh every day, led by ${/^[aeiou]/.test(s) ? 'an' : 'a'} ${s} game. Solve all three for a badge.`);
  const picksEl = $('hub-picks');
  if (picksEl) picksEl.innerHTML = todaysPicks(today, 3, season).map((g) => {
    const r = p.days[today]?.[g], fits = packSeason(g) === season;
    return `<div class="lvrow${r ? ' done' : ''}" data-game="${g}"><div class="row" style="flex-wrap:nowrap; gap:10px">${PACK_ICON[g]?.() ?? ''}<div><b>${GAMES[g].name}</b><small>${r ? `${paws(r.stars, 14)} Solved in ${formatTime(r.time)}` : fits ? `In season: ${info.name.toLowerCase()}` : 'Daily puzzle'}</small></div></div><a class="btn ${r ? 'btn-w' : 'btn-p'}" href="${GAMES[g].href}">${r ? 'Replay' : 'Play'}</a></div>`;
  }).join('');
}
renderSeason(activeSeason(p, today, tz()));
document.addEventListener('wd:season', (e) => renderSeason((e as CustomEvent<Season>).detail));
[...DAILY_SET, ...BONUS].forEach(row);
const s = streakInfo(p, today);
set('hub-streak', s.current ? `${s.current}-day streak` : 'Start a streak today');
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
