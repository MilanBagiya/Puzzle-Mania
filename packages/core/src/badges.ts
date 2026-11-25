// Badges: earned from progress (nothing extra to store except which ones the player has already seen).
import { JOURNAL } from './journal.js';
import { SEASONS, seasonFor } from './season.js';
import { DAILY_SET, PACK_KEYS, daysPlayed, playedDay, streakInfo, todaysPicks, trekStars, type GameKey, type Progress } from './progress.js';

export interface Badge { id: string; name: string; desc: string; icon: string; earned: (p: Progress, today: string) => boolean }
const anyDay = (p: Progress, f: (d: NonNullable<Progress['days'][string]>) => boolean): boolean => Object.values(p.days).some(f);
const trekDone = (p: Progress, upTo: number): boolean => { for (let s = 1; s <= upTo; s++) if (!p.trek?.[String(s)]) return false; return true; };

export const BADGES: readonly Badge[] = [
  { id: 'first-tracks', name: 'First steps', desc: 'Solve your first puzzle.', icon: '🐾', earned: (p) => daysPlayed(p) > 0 },
  { id: 'tutorial', name: 'Quick learner', desc: 'Finish the tutorial.', icon: '🎓', earned: (p) => !!p.tutorialDone },
  { id: 'daily-set', name: 'Full set', desc: 'Finish all five Daily Set puzzles in one day.', icon: '⭐', earned: (p) => anyDay(p, (d) => DAILY_SET.every((g) => d[g])) },
  { id: 'streak-3', name: 'Warming up', desc: 'Reach a 3-day streak.', icon: '🔥', earned: (p, t) => streakInfo(p, t).best >= 3 },
  { id: 'streak-7', name: 'One whole week', desc: 'Reach a 7-day streak.', icon: '🌙', earned: (p, t) => streakInfo(p, t).best >= 7 },
  { id: 'streak-30', name: 'Snow season', desc: 'Reach a 30-day streak.', icon: '❄️', earned: (p, t) => streakInfo(p, t).best >= 30 },
  { id: 'night-clean', name: 'Night owl', desc: 'Solve a Night puzzle with no hints.', icon: '🦉', earned: (p) => anyDay(p, (d) => !!d.night && d.night.hints === 0) },
  { id: 'speedy', name: 'Quick paws', desc: 'Solve Morning in under 45 seconds.', icon: '⚡', earned: (p) => anyDay(p, (d) => !!d.morning && d.morning.time < 45) },
  { id: 'nests', name: 'Nest finder', desc: 'Solve your first Nests puzzle.', icon: '🪺', earned: (p) => anyDay(p, (d) => !!d.nests) },
  { id: 'dawn', name: 'Early bird', desc: 'Solve your first Dawn Chorus.', icon: '🐦', earned: (p) => anyDay(p, (d) => !!d.dawn) },
  { id: 'stones', name: 'Pond hopper', desc: 'Get the frog across Stepping Stones.', icon: '🐸', earned: (p) => anyDay(p, (d) => !!d.stones) },
  { id: 'rings', name: 'Fairy ring', desc: 'Find the spore in Mushroom Rings.', icon: '🍄', earned: (p) => anyDay(p, (d) => !!d.rings) },
  { id: 'trek-1', name: 'First Tracks', desc: 'Finish Trail Trek chapter 1.', icon: '🦊', earned: (p) => trekDone(p, 15) },
  { id: 'trek-2', name: 'Deer Valley', desc: 'Finish Trail Trek chapter 2.', icon: '🦌', earned: (p) => trekDone(p, 30) },
  { id: 'trek-3', name: 'Deep Drifts', desc: 'Finish Trail Trek chapter 3.', icon: '🌨️', earned: (p) => trekDone(p, 45) },
  { id: 'trek-4', name: 'Night Forest', desc: 'Finish all 60 Trail Trek stages.', icon: '🌲', earned: (p) => trekDone(p, 60) },
  { id: 'paws-30', name: 'Paw collector', desc: 'Earn 30 paws in Trail Trek.', icon: '🏅', earned: (p) => trekStars(p) >= 30 },
  // Archive plays are the results saved with live: false (older saves have no flag, so they never count).
  { id: 'archive-5', name: 'Time traveller', desc: 'Play 5 days from the archive.', icon: '📅', earned: (p) => Object.values(p.days).filter((d) => Object.values(d).some((r) => r?.live === false)).length >= 5 },
  { id: 'explorer', name: 'Explorer', desc: 'Solve 10 different games.', icon: '🧭', earned: (p) => new Set(Object.values(p.days).flatMap((d) => Object.keys(d))).size >= 10 },
  { id: 'picks', name: 'Pick of the day', desc: 'Solve all three of Today’s picks in one day.', icon: '🎯', earned: (p) => Object.entries(p.days).some(([date, d]) => SEASONS.some((season) => todaysPicks(date, 3, season).every((g) => d[g as GameKey]))) },
  { id: 'arcade', name: 'Arcade master', desc: 'Solve every game in the pack at least once.', icon: '🏆', earned: (p) => PACK_KEYS.every((g) => Object.values(p.days).some((d) => d[g])) },
  { id: 'four-seasons', name: 'Four seasons', desc: 'Play in spring, summer, autumn and winter.', icon: '🍂', earned: (p) => new Set(Object.keys(p.days).filter((d) => playedDay(p, d)).map((d) => seasonFor(d, p.hemisphere === 'south' ? 'south' : 'north'))).size === 4 },
  { id: 'journal-6', name: 'Naturalist', desc: 'Collect 6 Forest Journal cards.', icon: '📔', earned: (p) => Math.min(daysPlayed(p), JOURNAL.length) >= 6 },
];
export const earnedBadges = (p: Progress, today: string): Badge[] => BADGES.filter((b) => b.earned(p, today));
/** Badges earned but not yet celebrated; marks them as seen (caller saves progress). */
export function takeNewBadges(p: Progress, today: string): Badge[] {
  const seen = new Set(p.badges ?? []);
  const fresh = earnedBadges(p, today).filter((b) => !seen.has(b.id));
  p.badges = [...seen, ...fresh.map((b) => b.id)];
  return fresh;
}
