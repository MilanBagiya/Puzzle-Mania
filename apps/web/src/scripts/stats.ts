// Stats: streaks, totals, Trek progress and badges.
import { BADGES, DAILY_SET, BONUS, GAMES, PACK_KEYS, earnedBadges, formatTime, loadProgress, streakInfo, trekStars, trekUnlocked, type GameKey } from '@wild-daily/core';
import { TREK_STAGE_COUNT } from '@wild-daily/game-fresh-snow/engine';
import { today } from './daily';

const p = loadProgress();
const s = streakInfo(p, today);
const set = (id: string, v: string): void => { const el = document.getElementById(id); if (el) el.textContent = v; };
set('s-cur', String(s.current)); set('s-best', String(s.best));
set('s-snow', s.snowDays.length ? `Snow Days used in this streak: ${s.snowDays.length}. One missed day each week is forgiven.` : 'One missed day each week is forgiven automatically, so a busy day won’t end your streak.');
set('s-trek-n', String(Math.min(trekUnlocked(p) - 1, TREK_STAGE_COUNT)));
set('s-trek', `Trail Trek: ${Math.min(trekUnlocked(p) - 1, TREK_STAGE_COUNT)} of ${TREK_STAGE_COUNT} stages cleared, ${trekStars(p)} ${trekStars(p) === 1 ? 'paw' : 'paws'} earned.`);
const played = (g: GameKey): boolean => Object.values(p.days).some((d) => d[g]);
const rows = ([...DAILY_SET, ...BONUS, ...PACK_KEYS.filter(played)] as GameKey[]).map((g) => {
  const res = Object.values(p.days).map((d) => d[g]).filter((x): x is NonNullable<typeof x> => !!x);
  const avg = res.length ? Math.round(res.reduce((a, r) => a + r.time, 0) / res.length) : 0;
  const best = res.length ? Math.min(...res.map((r) => r.time)) : 0;
  const three = res.filter((r) => r.stars === 3).length;
  return `<tr style="border-top:2px solid var(--paper-line)"><th scope="row" style="text-align:left; padding:10px 12px">${GAMES[g].name}</th><td style="padding:10px 12px">${res.length}</td><td style="padding:10px 12px">${res.length ? formatTime(best) : '–'}</td><td class="hide-sm" style="padding:10px 12px">${res.length ? formatTime(avg) : '–'}</td><td style="padding:10px 12px">${three}</td></tr>`;
}).join('');
const tb = document.getElementById('s-table'); if (tb) tb.innerHTML = rows;
const earned = new Set(earnedBadges(p, today).map((b) => b.id));
set('s-badge-count', `${earned.size} of ${BADGES.length} earned`);
const grid = document.getElementById('s-badges');
if (grid) grid.innerHTML = BADGES.map((b) => `<div class="badge-tile${earned.has(b.id) ? '' : ' locked'}"><span class="medal" style="font-size:26px" aria-hidden="true">${b.icon}</span><b>${b.name}</b><small>${b.desc}</small></div>`).join('');
