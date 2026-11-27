// Seasonal backdrops: a soft landscape along the bottom of every page (our own art, drawn here as SVG).
// apps/web turns these into /bg/<season>-<light|dark>.svg at build time; CSS shows the one for the current season.
// Colours stay close to the page's sky colour so text over them keeps its contrast.
export type BackdropSeason = 'winter' | 'spring' | 'summer' | 'autumn';
export type BackdropTheme = 'light' | 'dark';
export const BACKDROP_SEASONS: readonly BackdropSeason[] = ['winter', 'spring', 'summer', 'autumn'];

interface Palette { far: string; mid: string; near: string; ground: string; tree: string; tree2: string; accent: string; cap: string }
const PALETTES: Record<BackdropTheme, Record<BackdropSeason, Palette>> = {
  light: {
    winter: { far: '#D6EAF6', mid: '#E6F2FA', near: '#F4F9FD', ground: '#FFFFFF', tree: '#9DBDD3', tree2: '#B5CFE0', accent: '#FFFFFF', cap: '#FFFFFF' },
    spring: { far: '#C4E6E9', mid: '#C9EBB4', near: '#B6E39C', ground: '#A8DC8C', tree: '#8CCB78', tree2: '#F4C6D3', accent: '#FBE3EA', cap: '#E7F4FB' },
    summer: { far: '#F3DDB6', mid: '#C7E6A4', near: '#ACDA8C', ground: '#9FD4E8', tree: '#86C47A', tree2: '#6FB56A', accent: '#FFF4D6', cap: '#FFF1DA' },
    autumn: { far: '#F1D8B8', mid: '#EFC896', near: '#E8B97E', ground: '#E2AC6C', tree: '#E39A52', tree2: '#D07A3E', accent: '#F6CF84', cap: '#FAEBD5' },
  },
  dark: {
    winter: { far: '#142250', mid: '#17275A', near: '#1B2C63', ground: '#22356A', tree: '#0F1A42', tree2: '#13204C', accent: '#2C4280', cap: '#3A5290' },
    spring: { far: '#142350', mid: '#173046', near: '#1A3A42', ground: '#1F4440', tree: '#11283A', tree2: '#3A3156', accent: '#4A3C66', cap: '#22356A' },
    summer: { far: '#142350', mid: '#163045', near: '#183A48', ground: '#1C4155', tree: '#10283A', tree2: '#123044', accent: '#3A4C70', cap: '#22356A' },
    autumn: { far: '#16224E', mid: '#2A2640', near: '#33293A', ground: '#3A2C34', tree: '#241C30', tree2: '#3E2A2E', accent: '#5A3E3A', cap: '#2C3560' },
  },
};

/** Small seeded random numbers, so every build draws the same picture. */
function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0; return (s >>> 8) / 16777216; };
}
const W = 1600, H = 420;
/** A smooth ridge line across the picture: y values around `base`, wobbling by `amp`. */
function ridge(r: () => number, base: number, amp: number, step: number): string {
  let d = `M0 ${H} L0 ${base}`;
  let prevX = 0, prevY = base;
  for (let x = step; x <= W + step; x += step) {
    const y = base - amp / 2 + r() * amp, cx = (prevX + x) / 2;
    d += ` Q${cx.toFixed(0)} ${prevY.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)}`;
    prevX = x; prevY = y;
  }
  return `${d} L${W} ${H} Z`;
}
/** Jagged mountains for winter (with snow caps), gentle ones for other seasons. */
function mountains(r: () => number, p: Palette, snowy: boolean): string {
  let out = '';
  for (let x = -100; x < W + 100; x += 220 + r() * 160) {
    const h = 120 + r() * 110, w = 170 + r() * 120, top = 300 - h;
    out += `<path d="M${x - w} 320 L${x} ${top} L${x + w} 320 Z" fill="${p.far}"/>`;
    if (snowy) out += `<path d="M${x - w * 0.28} ${top + h * 0.3} L${x} ${top} L${x + w * 0.28} ${top + h * 0.3} L${x + w * 0.12} ${top + h * 0.24} L${x} ${top + h * 0.33} L${x - w * 0.12} ${top + h * 0.24} Z" fill="${p.cap}"/>`;
  }
  return out;
}
const pine = (x: number, y: number, s: number, c: string): string =>
  `<path d="M${x} ${y - 70 * s} L${x + 22 * s} ${y - 28 * s} L${x + 12 * s} ${y - 28 * s} L${x + 30 * s} ${y} L${x - 30 * s} ${y} L${x - 12 * s} ${y - 28 * s} L${x - 22 * s} ${y - 28 * s} Z" fill="${c}"/><rect x="${x - 4 * s}" y="${y}" width="${8 * s}" height="${10 * s}" fill="${c}"/>`;
const round = (x: number, y: number, s: number, c: string, trunk: string): string =>
  `<rect x="${x - 4 * s}" y="${y - 18 * s}" width="${8 * s}" height="${24 * s}" fill="${trunk}"/><circle cx="${x}" cy="${y - 38 * s}" r="${26 * s}" fill="${c}"/><circle cx="${x - 16 * s}" cy="${y - 28 * s}" r="${16 * s}" fill="${c}"/><circle cx="${x + 17 * s}" cy="${y - 27 * s}" r="${15 * s}" fill="${c}"/>`;

/** The backdrop picture for a season and theme, as a standalone SVG file. */
export function backdropSvg(season: BackdropSeason, theme: BackdropTheme): string {
  const p = PALETTES[theme][season], r = rand(BACKDROP_SEASONS.indexOf(season) * 97 + (theme === 'dark' ? 13 : 1));
  let trees = '';
  for (let x = 20; x < W; x += 60 + r() * 120) {
    const s = 0.7 + r() * 0.6, y = 330 + r() * 24;
    if (season === 'winter') trees += pine(x, y, s, r() < 0.5 ? p.tree : p.tree2);
    else if (season === 'spring') trees += r() < 0.45 ? round(x, y, s, p.tree2, p.tree) : round(x, y, s, p.tree, p.tree);
    else if (season === 'summer') trees += r() < 0.3 ? pine(x, y, s, p.tree2) : round(x, y, s, r() < 0.5 ? p.tree : p.tree2, p.tree2);
    else trees += r() < 0.25 ? pine(x, y, s, p.tree2) : round(x, y, s, r() < 0.5 ? p.tree : p.accent, p.tree2);
  }
  // A few small details in the foreground: snow mounds, flowers, lily pads or fallen leaves.
  let bits = '';
  for (let k = 0; k < 26; k++) {
    const x = r() * W, y = 382 + r() * 30;
    if (season === 'winter') bits += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(18 + r() * 30).toFixed(0)}" ry="7" fill="${p.accent}" opacity=".8"/>`;
    else if (season === 'spring') bits += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="4" fill="${p.accent}"/>`;
    else if (season === 'summer') bits += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="12" ry="5" fill="${p.tree}"/>`;
    else bits += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="7" ry="4" fill="${p.accent}" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">`
    + mountains(r, p, season === 'winter')
    + `<path d="${ridge(r, 300, 50, 200)}" fill="${p.mid}"/>`
    + trees
    + `<path d="${ridge(r, 350, 26, 160)}" fill="${p.near}"/>`
    + `<path d="${ridge(r, 386, 14, 240)}" fill="${p.ground}"/>`
    + bits + '</svg>';
}
