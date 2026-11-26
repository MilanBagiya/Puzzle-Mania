// Markup shared by the stats page (built with empty progress) and stats.ts (filled with the player's progress),
// so the page is drawn at its final size and does not jump when the numbers arrive.
import { BADGES, GAMES, formatTime, type Badge, type GameKey, type GameResult } from '@wild-daily/core';

export function gameRow(g: GameKey, res: readonly GameResult[]): string {
  const avg = res.length ? Math.round(res.reduce((a, r) => a + r.time, 0) / res.length) : 0;
  const best = res.length ? Math.min(...res.map((r) => r.time)) : 0;
  const three = res.filter((r) => r.stars === 3).length;
  return `<tr style="border-top:2px solid var(--paper-line)"><th scope="row" style="text-align:left; padding:10px 12px">${GAMES[g].name}</th><td style="padding:10px 12px">${res.length}</td><td style="padding:10px 12px">${res.length ? formatTime(best) : '–'}</td><td class="hide-sm" style="padding:10px 12px">${res.length ? formatTime(avg) : '–'}</td><td style="padding:10px 12px">${three}</td></tr>`;
}
export const badgeTile = (b: Badge, earned: boolean): string =>
  `<div class="badge-tile${earned ? '' : ' locked'}"><span class="medal" style="font-size:26px" aria-hidden="true">${b.icon}</span><b>${b.name}</b><small>${b.desc}</small></div>`;
export const badgeTiles = (earned: ReadonlySet<string>): string => BADGES.map((b) => badgeTile(b, earned.has(b.id))).join('');
