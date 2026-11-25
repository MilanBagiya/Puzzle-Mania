// One catalog of every game: used by the sidebar, search, tiles, category pages and the home rows.
import { PACK } from '@wild-daily/game-pack';
import type { GameKey } from '@wild-daily/core';

export type CatId = 'snow' | 'logic' | 'path' | 'order' | 'guess' | 'quick';
export interface Category { id: CatId; name: string; title: string; blurb: string; more: string; icon: string }
export interface Entry {
  id: string; name: string; href: string; cat: CatId; blurb: string; /** Short card text (at most 60 characters); cards fall back to blurb. */ hook?: string; time: string; minutes: number;
  daily: boolean; isNew: boolean; season: string; featured: number;
  /** Progress keys that count as "solved today" for this game. */
  keys: GameKey[];
}
/** Simple stroke icons (24×24 paths). */
export const ICON: Record<string, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  recent: 'M12 7v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v4h-4',
  new: 'M12 3l2.2 5.6L20 10l-4.6 3.7L17 20l-5-3.2L7 20l1.6-6.3L4 10l5.8-1.4z',
  daily: 'M5 5h14v15H5zM5 9h14M9 3v4M15 3v4',
  trek: 'M5 21V4m0 0h11l-2 4 2 4H5',
  archive: 'M4 5h16v4H4zM6 9v10h12V9M10 13h4',
  journal: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  stats: 'M5 20V11M12 20V5M19 20v-7',
  snow: 'M12 2v20M4.9 6.5l14.2 11M19.1 6.5L4.9 17.5M9 4l3 2 3-2M9 20l3-2 3 2',
  logic: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM15 15l4 4M19 15l-4 4',
  path: 'M5 19c3 0 3-6 7-6s4-8 7-8M5 19a2 2 0 1 0 0 .01M19 5a2 2 0 1 0 0 .01',
  order: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  guess: 'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 18h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  quick: 'M13 2L4 14h7l-1 8 9-12h-7z',
  guides: 'M12 21s-6-4.5-6-10a6 6 0 0 1 12 0c0 5.5-6 10-6 10zM12 9.5h.01',
  howto: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01',
  menu: 'M4 6h16M4 12h16M4 18h16',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  mygames: 'M7 4h10v16l-5-3-5 3z',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 2 1.5 3 2.5 3-.5-3 .5-6 .5-8.5z',
};
export const CATS: Category[] = [
  { id: 'snow', name: 'Snow trails', title: 'Snow trail games', icon: 'snow', blurb: 'Read animal tracks in fresh snow and guide every animal home.', more: 'Fresh Snow has three daily levels (Morning, Noon and Night), and Trail Trek turns it into a 60-stage campaign that teaches one animal at a time.' },
  { id: 'logic', name: 'Logic', title: 'Logic puzzles', icon: 'logic', blurb: 'Grid puzzles with exactly one answer, solved by pure reasoning.', more: 'Every logic puzzle is checked by a solver before it is published, so you never need to guess. Numbers, patches, lights and hidden pictures, from two-minute warm-ups to five-minute thinkers.' },
  { id: 'path', name: 'Paths and moves', title: 'Path and move puzzles', icon: 'path', blurb: 'Plan routes, slide pieces and leap across ponds, rivers and ice.', more: 'Each puzzle is guaranteed solvable, and most know the fewest moves possible, so you can chase three paws.' },
  { id: 'order', name: 'Clues and order', title: 'Clue puzzles', icon: 'order', blurb: 'Read the clues and work out who did what, and in which order.', more: 'Every clue is true, and only one answer fits them all.' },
  { id: 'guess', name: 'Guessing', title: 'Guessing games', icon: 'guess', blurb: 'Words, eggs, spores and close-ups: six tries to crack today’s answer.', more: 'Quick daily guessing games with clear feedback after every try.' },
  { id: 'quick', name: 'Quick games', title: 'Quick one-minute games', icon: 'quick', blurb: 'Fast games for a short break: quizzes, memory and flips.', more: 'Each takes about a minute, and everyone gets the same puzzle each day.' },
];
const minutesOf = (t: string): number => { const m = t.match(/(\d+)/); return m ? Number(m[1]) : 3; };
const KIND_TO_CAT: Record<string, CatId> = { logic: 'logic', path: 'path', order: 'order', guess: 'guess', quick: 'quick' };
const MAIN: Entry[] = [
  { id: 'fresh-snow', name: 'Fresh Snow', href: '/fresh-snow', cat: 'snow', blurb: 'Follow animal footprints through the snow and guide each one home.', hook: 'Follow the tracks and guide every animal home.', time: '1–12 min', minutes: 1, daily: true, isNew: false, season: 'winter', featured: 1, keys: ['morning', 'noon', 'night'] },
  { id: 'trek', name: 'Trail Trek', href: '/trek', cat: 'snow', blurb: 'A 60-stage Fresh Snow campaign. Earn three paws on every stage.', hook: '60 Fresh Snow stages. Earn three paws on each.', time: 'Any time', minutes: 2, daily: false, isNew: false, season: 'winter', featured: 2, keys: [] },
  { id: 'nests', name: 'Nests', href: '/nests', cat: 'logic', blurb: 'Each tree’s number is how many nests it can see along its row and column.', hook: 'Each tree counts the nests it can see.', time: '2–4 min', minutes: 2, daily: true, isNew: false, season: 'spring', featured: 3, keys: ['nests'] },
  { id: 'dawn', name: 'Dawn Chorus', href: '/dawn-chorus', cat: 'order', blurb: 'Read the clues and put five birds in the order they sang at sunrise.', hook: 'Put five birds in the order they sang.', time: '1–3 min', minutes: 1, daily: true, isNew: false, season: 'spring', featured: 4, keys: ['dawn'] },
  { id: 'stones', name: 'Stepping Stones', href: '/stepping-stones', cat: 'path', blurb: 'Help the frog across the pond: each lily pad says exactly how far to jump.', hook: 'Each lily pad says how far the frog jumps.', time: '1–4 min', minutes: 1, daily: true, isNew: false, season: 'summer', featured: 5, keys: ['stones'] },
  { id: 'rings', name: 'Mushroom Rings', href: '/mushroom-rings', cat: 'guess', blurb: 'Read a ring of mushrooms and find where the spore landed, in three guesses.', hook: 'Find where the spore landed in three guesses.', time: 'About 1 min', minutes: 1, daily: true, isNew: false, season: 'autumn', featured: 6, keys: ['rings'] },
];
export const CATALOG: Entry[] = [
  ...MAIN,
  ...PACK.map((g, k) => ({ id: g.id, name: g.name, href: `/play/${g.id}`, cat: KIND_TO_CAT[g.kind] ?? 'quick', blurb: g.blurb, hook: g.hook, time: g.time, minutes: minutesOf(g.time), daily: true, isNew: true, season: g.season, featured: 10 + k, keys: [g.id as GameKey] })),
];
export const byCat = (c: CatId): Entry[] => CATALOG.filter((e) => e.cat === c).sort((a, b) => a.featured - b.featured);
export const entryById = (id: string): Entry | undefined => CATALOG.find((e) => e.id === id);
/** Sidebar item for a game page: its category (`cat-<id>`), so the menu shows where the player is. */
export const activeFor = (id: string): string => { const e = entryById(id); return e ? `cat-${e.cat}` : 'games'; };
/** Small data for client-side search (no artwork). */
export const SEARCH_INDEX = CATALOG.map((e) => ({ id: e.id, n: e.name, h: e.href, c: CATS.find((c) => c.id === e.cat)!.name, b: e.blurb }));
