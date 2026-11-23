// Seasons: meteorological months, flipped for the Southern Hemisphere (Australia, New Zealand…).
import { fromIso } from './dates.js';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Hemisphere = 'north' | 'south';
export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Season for a date. North: Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter. South is six months on. */
export function seasonFor(date: string, hemisphere: Hemisphere = 'north'): Season {
  const m = fromIso(date).getMonth(); // 0 = January
  const north: Season = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
  if (hemisphere === 'north') return north;
  return ({ spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' } as const)[north];
}
/** Time zones in the Southern Hemisphere (also used by the page's early inline script). */
export const SOUTH_TZ = /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Noumea|Efate)$|^America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|Punta_Arenas)|^Africa\/(Johannesburg|Maputo|Harare|Windhoek|Gaborone|Maseru|Mbabane)$|^Indian\/(Mauritius|Reunion)$/;
/** Guess the hemisphere from an IANA time zone (e.g. "Australia/Sydney"). */
export function hemisphereFromTimeZone(tz: string | undefined): Hemisphere {
  return tz && SOUTH_TZ.test(tz) ? 'south' : 'north';
}
/** The season to show: the player's choice, or the calendar season for their hemisphere. */
export function activeSeason(pref: { season?: string; hemisphere?: string }, date: string, tz?: string): Season {
  if (pref.season && pref.season !== 'auto' && (SEASONS as readonly string[]).includes(pref.season)) return pref.season as Season;
  const h: Hemisphere = pref.hemisphere === 'north' || pref.hemisphere === 'south' ? pref.hemisphere : hemisphereFromTimeZone(tz);
  return seasonFor(date, h);
}
export interface SeasonInfo { name: string; title: string; lead: string; short: string }
export const SEASON_INFO: Record<Season, SeasonInfo> = {
  winter: { name: 'Winter', title: 'Fresh snow fell overnight.', lead: 'Animals crossed the snowy forest while you slept. Five short puzzles are waiting: solve one to keep your streak, all five to complete the Daily Set.', short: 'Snow on the ground, tracks everywhere.' },
  spring: { name: 'Spring', title: 'The forest is waking up.', lead: 'Birds are singing and the meadow is in bloom. Five short puzzles are waiting: solve one to keep your streak, all five to complete the Daily Set.', short: 'Birdsong, blossoms and busy burrows.' },
  summer: { name: 'Summer', title: 'Long days at the pond.', lead: 'Frogs, fireflies and otters are out in the warm evenings. Five short puzzles are waiting: solve one to keep your streak, all five to complete the Daily Set.', short: 'Ponds, fireflies and warm evenings.' },
  autumn: { name: 'Autumn', title: 'Leaves fell overnight.', lead: 'Squirrels are stashing acorns and the first frost is near. Five short puzzles are waiting: solve one to keep your streak, all five to complete the Daily Set.', short: 'Falling leaves, acorns and mushrooms.' },
};
