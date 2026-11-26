// Stats: streaks, totals, Trek progress and badges.
import { BADGES, DAILY_SET, BONUS, PACK_KEYS, earnedBadges, loadProgress, streakInfo, trekStars, trekUnlocked, type GameKey } from '@wild-daily/core';
import { TREK_STAGE_COUNT } from '@wild-daily/game-fresh-snow/engine';
import { today } from './daily';
import { badgeTiles, gameRow } from './stats-html';

const p = loadProgress();
// First visit: show a friendly start card instead of a wall of zeros.
if (!Object.keys(p.days).length && !Object.keys(p.trek ?? {}).length) document.getElementById('s-empty')?.removeAttribute('hidden');
const s = streakInfo(p, today);
const set = (id: string, v: string): void => { const el = document.getElementById(id); if (el) el.textContent = v; };
set('s-cur', String(s.current)); set('s-best', String(s.best));
set('s-snow', s.snowDays.length ? `Snow Days used in this streak: ${s.snowDays.length}. One missed day each week is forgiven.` : 'One missed day each week is forgiven automatically, so a busy day won’t end your streak.');
set('s-trek-n', String(Math.min(trekUnlocked(p) - 1, TREK_STAGE_COUNT)));
set('s-trek', `Trail Trek: ${Math.min(trekUnlocked(p) - 1, TREK_STAGE_COUNT)} of ${TREK_STAGE_COUNT} stages cleared, ${trekStars(p)} ${trekStars(p) === 1 ? 'paw' : 'paws'} earned.`);
const played = (g: GameKey): boolean => Object.values(p.days).some((d) => d[g]);
const rows = ([...DAILY_SET, ...BONUS, ...PACK_KEYS.filter(played)] as GameKey[]).map((g) => gameRow(g, Object.values(p.days).map((d) => d[g]).filter((x): x is NonNullable<typeof x> => !!x))).join('');
const tb = document.getElementById('s-table'); if (tb) tb.innerHTML = rows;
const earned = new Set(earnedBadges(p, today).map((b) => b.id));
set('s-badge-count', `${earned.size} of ${BADGES.length} earned`);
const grid = document.getElementById('s-badges');
if (grid) grid.innerHTML = badgeTiles(earned);
