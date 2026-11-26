// Art helpers: return SVG markup that references the shared sprite (sprite.svg must be inlined once per page).
export type AnimalId = 'fox' | 'rabbit' | 'deer';
/** The wider cast in cast.svg (inlined only on pages that use them: see Base.astro's `cast` prop). */
export const CAST = ['moose', 'squirrel', 'bear', 'salmon'] as const;
export type CastId = (typeof CAST)[number];
/** Every full-body character with idle, happy and oops faces. */
export type CharacterId = AnimalId | CastId;
export type Mood = 'idle' | 'happy' | 'oops';

const label = (l?: string): string => (l ? `role="img" aria-label="${l}"` : 'aria-hidden="true"');

/** Any sprite symbol. `w` sets width; height follows the viewBox ratio. */
export function svgUse(id: string, viewBox: string, w?: number, cls?: string, l?: string): string {
  const [, , vw, vh] = viewBox.split(' ').map(Number);
  const size = w ? ` width="${w}" height="${Math.round((w * (vh ?? 1)) / (vw ?? 1))}"` : '';
  return `<svg${cls ? ` class="${cls}"` : ''} viewBox="${viewBox}"${size} ${label(l)}><use href="#${id}"></use></svg>`;
}

/** Full-body character in a mood (calm, happy, oops). */
export function character(a: CharacterId, mood: Mood, w?: number, cls?: string, l?: string): string {
  const size = w ? ` width="${w}" height="${w}"` : '';
  return `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 80 80"${size} ${label(l)}><use href="#ch-${a}-body"></use><use href="#ch-${a}-${mood}"></use></svg>`;
}

/** Animation class that matches a mood (and the rabbit's idle bounce). */
export const moodClass = (a: CharacterId, mood: Mood): string => (mood === 'happy' ? 'cheer' : mood === 'oops' ? 'shake' : a === 'rabbit' ? 'boing' : '');

export const tree = (w?: number): string => svgUse('i3-tree', '0 0 64 72', w);
export const rock = (w?: number): string => svgUse('i3-rock', '0 0 64 52', w);
export const burrow = (w?: number): string => svgUse('i3-home', '0 0 72 54', w);
export const drift = (w?: number): string => svgUse('i3-drift', '0 0 72 44', w);
/** Pressed footprint: fox, rabbit, deer, canid, hand, cat, bird, squirrel, hoof, skunk. */
export const print = (kind: string, w?: number): string => svgUse('p3-' + kind, '0 0 20 20', w);
export const bird = (color: string, w = 48): string =>
  `<svg viewBox="0 0 48 44" width="${w}" height="${Math.round((w * 44) / 48)}" aria-hidden="true" style="color:${color}"><use href="#n-bird"></use></svg>`;
export const chevron = (dir: 'left' | 'right'): string =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"></path></svg>`;

export const ANIMAL_NAME: Record<AnimalId, string> = { fox: 'Fox', rabbit: 'Rabbit', deer: 'Deer' };
export const ANIMAL_RULE: Record<AnimalId, string> = {
  fox: 'walks 1 square diagonally',
  rabbit: 'hops exactly 2 squares in a straight line',
  deer: 'walks 1 square straight and never turns back',
};
export const ANIMAL_SHORT: Record<AnimalId, string> = { fox: '1 step diagonally', rabbit: 'hops 2, straight', deer: '1 step, no turning back' };

export const escapeHtml = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);

export const nest = (w?: number): string => svgUse('n-nest', '0 0 40 30', w);
export const frog = (w?: number, cls?: string): string => svgUse('n-frog', '0 0 64 56', w, cls);
export const lilyPad = (w?: number): string => svgUse('n-pad', '0 0 62 46', w);
export const mushroom = (w?: number, cls?: string): string => svgUse('n-mush', '0 0 40 40', w, cls);
export const leaf = (w?: number): string => svgUse('n-leaf', '0 0 24 24', w);
export const stump = (w?: number): string => svgUse('n-stump', '0 0 38 30', w);
/** Paw rating: 1–3 filled paws out of 3. */
export function paws(stars: number, w = 20): string {
  return `<span class="paws" role="img" aria-label="${stars} of 3 paws">${[1, 2, 3].map((k) => `<svg viewBox="0 0 20 20" width="${w}" height="${w}" aria-hidden="true" class="${k <= stars ? 'on' : 'off'}"><use href="#i-paw"></use></svg>`).join('')}</span>`;
}
export { Mover, type Gait, type TokenSpec } from './mover.js';
export { cover, COVER_IDS } from './cover.js';
