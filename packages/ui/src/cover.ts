// Cover illustrations for every game: a seasonal Papercraft scene composed from the shared sprite.
// Pure SVG (sharp on every screen, a few hundred bytes each). Needs the sprite on the page.

type Item = [string, number, number, number, string?]; // symbol (or 'ch:fox:happy'), x, y, width, extra style
const VB: Record<string, [number, number]> = {
  'i3-tree': [64, 72], 'i3-rock': [64, 52], 'i3-home': [72, 54], 'i3-drift': [72, 44], 'p3-fox': [20, 20], 'p3-rabbit': [20, 20], 'p3-deer': [20, 20],
  'p3-canid': [20, 20], 'p3-hand': [20, 20], 'p3-cat': [20, 20], 'p3-bird': [20, 20], 'p3-squirrel': [20, 20], 'p3-hoof': [20, 20], 'p3-skunk': [20, 20],
  'n-tuft': [40, 30], 'n-daisy': [30, 40], 'n-tulip': [24, 40], 'n-reed': [20, 60], 'n-pad': [62, 46], 'n-leaf': [24, 24], 'n-mush': [40, 40],
  'n-firefly': [20, 20], 'n-butterfly': [30, 24], 'n-bird': [48, 44], 'n-beaver': [80, 80], 'n-crab': [80, 64], 'n-log': [60, 20], 'n-shell': [24, 20],
  'n-nest': [40, 30], 'n-frog': [64, 56], 'n-stump': [38, 30], 'n-owl': [40, 40], 'n-mouse': [40, 30], 'n-acorn': [30, 36], 'n-hive': [36, 36],
  'n-fish': [40, 22], 'n-otter': [40, 30], 'n-bear': [40, 36], 'n-bush': [36, 30],
};
type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'night';
const SKY: Record<Season, { a: string; b: string; far: string; mid: string; ground: string; sun: string }> = {
  winter: { a: '#CDE7F6', b: '#EEF7FC', far: '#D6EAF6', mid: '#EDF6FB', ground: '#FFFFFF', sun: '#FFE9A8' },
  spring: { a: '#CFEBFA', b: '#F0FAFF', far: '#BFE5A6', mid: '#93D46F', ground: '#6CBF57', sun: '#FFE48A' },
  summer: { a: '#FFE3B8', b: '#FFF5E2', far: '#A6D98A', mid: '#66BF73', ground: '#5DB6E0', sun: '#FFB56B' },
  autumn: { a: '#FADFC0', b: '#FFF2E0', far: '#EDB46C', mid: '#D99B57', ground: '#B9793E', sun: '#FFD07A' },
  night: { a: '#22346A', b: '#3A4F8E', far: '#2D4581', mid: '#253A70', ground: '#1B2B57', sun: '#F3E7C3' },
};
const egg = (x: number, y: number, c: string): string => `<ellipse cx="${x}" cy="${y}" rx="9" ry="12" fill="${c}" stroke="rgba(35,49,66,.18)"></ellipse><ellipse cx="${x - 3}" cy="${y - 4}" rx="2.5" ry="4" fill="#fff" fill-opacity=".5"></ellipse>`;
// Letter tile. Size s (default 30) scales the corner, letter and baseline together.
const tile = (x: number, y: number, ch: string, c: string, s = 30): string => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${Math.round(s / 5)}" fill="${c}"></rect><text x="${x + s / 2}" y="${y + Math.round(s * 0.7)}" text-anchor="middle" font-size="${Math.round(s * 0.6)}" font-weight="800" fill="#fff" style="font-family:var(--font-ui)">${ch}</text>`;
const card = (x: number, y: number, r: number): string => `<g transform="rotate(${r} ${x + 22} ${y + 28})"><rect x="${x}" y="${y}" width="44" height="56" rx="7" fill="#fff" stroke="#E2D6C4" stroke-width="2"></rect></g>`;
const star = (x: number, y: number): string => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff" fill-opacity=".85"></circle>`;

// Rule for every scene: anything with text or letters stays in the top 55% (y <= 110 of 200), because the tile
// name overlay covers the bottom of the cover. cover.test.ts checks this.
const SCENES: Record<string, { s: Season; items: Item[]; extra?: string; extraTop?: string }> = {
  'fresh-snow': { s: 'winter', items: [['i3-tree', 236, 54, 52], ['i3-tree', 276, 70, 40], ['i3-drift', 30, 140, 70], ['i3-home', 250, 132, 56], ['p3-fox', 96, 168, 14], ['p3-fox', 118, 154, 14], ['p3-fox', 140, 168, 14], ['p3-fox', 162, 154, 14], ['ch:fox:happy', 170, 92, 78]] },
  trek: { s: 'winter', items: [['i3-tree', 20, 66, 44], ['i3-tree', 262, 58, 50], ['p3-rabbit', 70, 170, 14], ['p3-rabbit', 98, 160, 14], ['p3-deer', 200, 168, 14], ['p3-deer', 222, 158, 14], ['ch:rabbit:happy', 92, 92, 70], ['ch:deer:happy', 160, 86, 76]] },
  nests: { s: 'spring', items: [['i3-tree', 30, 44, 78], ['n-nest', 160, 128, 56], ['n-nest', 238, 140, 46], ['n-bird', 168, 92, 46, 'color:#E2594A'], ['n-bird', 250, 40, 34, 'color:#3F86D3'], ['n-daisy', 120, 150, 22], ['n-tulip', 290, 146, 18]] },
  dawn: { s: 'spring', items: [['n-reed', 40, 96, 20], ['n-reed', 280, 92, 20], ['n-bird', 60, 104, 44, 'color:#E2594A'], ['n-bird', 116, 96, 44, 'color:#3F86D3'], ['n-bird', 172, 104, 44, 'color:#F2B92B'], ['n-bird', 228, 96, 44, 'color:#5BAE5B'], ['n-tulip', 22, 152, 20], ['n-daisy', 296, 150, 20]], extraTop: '<path d="M30 132 Q160 116 290 132" stroke="#8A5A3B" stroke-width="7" fill="none" stroke-linecap="round"></path>' },
  stones: { s: 'summer', items: [['n-pad', 22, 160, 54], ['n-pad', 96, 146, 50], ['n-pad', 168, 160, 52], ['n-pad', 240, 146, 50], ['n-reed', 290, 96, 18], ['n-reed', 8, 104, 16], ['n-frog', 104, 86, 60]] },
  rings: { s: 'autumn', items: [['n-mush', 70, 128, 34], ['n-mush', 118, 108, 34], ['n-mush', 170, 104, 34], ['n-mush', 222, 112, 34], ['n-mush', 250, 140, 34], ['n-mush', 40, 152, 30], ['n-stump', 144, 150, 46], ['n-leaf', 280, 70, 20], ['n-leaf', 30, 80, 18]] },
  'frog-pond': { s: 'summer', items: [['n-pad', 30, 150, 60], ['n-pad', 136, 160, 56], ['n-pad', 232, 148, 60], ['n-frog', 40, 112, 52], ['n-frog', 238, 110, 52], ['n-reed', 120, 92, 18], ['n-butterfly', 170, 60, 34]] },
  'firefly-night': { s: 'night', items: [['n-bush', 30, 134, 72], ['n-bush', 220, 130, 80], ['n-tuft', 140, 160, 44], ['n-firefly', 90, 70, 22], ['n-firefly', 150, 50, 18], ['n-firefly', 200, 84, 22], ['n-firefly', 250, 56, 18], ['n-firefly', 120, 110, 16], ['n-firefly', 180, 120, 14]] },
  'owl-watch': { s: 'night', items: [['i3-tree', 24, 50, 70], ['n-stump', 140, 136, 60], ['n-owl', 148, 70, 66], ['n-mouse', 238, 162, 40], ['n-mouse', 70, 168, 34], ['n-tuft', 270, 150, 34]] },
  'acorn-stash': { s: 'autumn', items: [['n-stump', 30, 140, 56], ['n-stump', 230, 136, 60], ['n-acorn', 110, 140, 28], ['n-acorn', 150, 154, 26], ['n-acorn', 186, 138, 28], ['p3-squirrel', 124, 104, 18], ['p3-squirrel', 162, 94, 18], ['n-leaf', 60, 60, 22], ['n-leaf', 250, 70, 20]] },
  beehive: { s: 'spring', items: [['i3-tree', 220, 46, 72], ['n-hive', 140, 96, 56], ['n-daisy', 40, 140, 26], ['n-daisy', 80, 150, 24], ['n-tulip', 112, 146, 20], ['n-daisy', 200, 152, 24], ['n-butterfly', 70, 70, 32]] },
  'beaver-lodges': { s: 'summer', items: [['n-log', 140, 150, 80], ['n-log', 160, 134, 64], ['n-reed', 30, 96, 20], ['n-reed', 52, 108, 18], ['n-beaver', 60, 90, 82], ['n-reed', 280, 100, 18]] },
  'snow-picture': { s: 'winter', items: [['i3-drift', 210, 140, 80], ['i3-tree', 40, 60, 54], ['ch:rabbit:idle', 130, 100, 70]], extraTop: '<g fill="#233142" opacity=".85">' + [0, 1, 2].map((r) => [0, 1, 2].map((c) => ((r + c) % 2 === 0 ? `<rect x="${236 + c * 16}" y="${40 + r * 16}" width="14" height="14" rx="3"></rect>` : '')).join('')).join('') + '</g>' },
  'otter-slide': { s: 'summer', items: [['n-log', 30, 150, 70], ['n-otter', 120, 120, 80], ['n-fish', 230, 150, 44], ['n-reed', 280, 90, 18]] },
  'moose-crossing': { s: 'winter', items: [['i3-tree', 26, 56, 52], ['i3-tree', 258, 62, 48], ['i3-drift', 220, 150, 60], ['ch:deer:happy', 120, 90, 84]], extraTop: '<path d="M60 180 L130 180" stroke="#BFE0F2" stroke-width="5" stroke-linecap="round" opacity=".9"></path><path d="M40 168 L100 168" stroke="#BFE0F2" stroke-width="4" stroke-linecap="round" opacity=".7"></path>' },
  'burrow-escape': { s: 'winter', items: [['n-log', 30, 120, 90], ['n-log', 210, 138, 90], ['i3-home', 240, 80, 60], ['ch:rabbit:happy', 120, 100, 74]] },
  'salmon-run': { s: 'autumn', items: [['i3-rock', 30, 150, 56], ['i3-rock', 236, 146, 60], ['n-fish', 110, 90, 56, 'transform:rotate(-24deg); transform-box:fill-box; transform-origin:center'], ['n-fish', 180, 120, 48, 'transform:rotate(-16deg); transform-box:fill-box; transform-origin:center'], ['n-reed', 290, 100, 16]] },
  'bears-last-snack': { s: 'autumn', items: [['n-bush', 30, 140, 60], ['n-bush', 240, 140, 60], ['i3-home', 232, 82, 64], ['n-bear', 110, 96, 84]] },
  'who-ate': { s: 'autumn', items: [['ch:fox:idle', 30, 92, 76], ['ch:rabbit:idle', 120, 98, 70], ['ch:deer:idle', 204, 88, 80], ['n-acorn', 100, 160, 20], ['n-mush', 186, 160, 26]], extraTop: '<g><circle cx="170" cy="56" r="16" fill="#fff"></circle><text x="170" y="63" text-anchor="middle" font-size="20" font-weight="800" fill="#C9412A" style="font-family:var(--font-ui)">?</text></g>' },
  'freshest-track': { s: 'winter', items: [['p3-fox', 30, 150, 16], ['p3-fox', 60, 140, 16], ['p3-fox', 90, 150, 16], ['p3-rabbit', 130, 120, 16], ['p3-rabbit', 160, 110, 16], ['p3-deer', 200, 160, 16], ['p3-deer', 226, 148, 16], ['p3-deer', 252, 136, 16], ['i3-tree', 260, 50, 44], ['i3-drift', 20, 80, 60]] },
  'egg-match': { s: 'spring', items: [['n-nest', 100, 120, 120], ['n-bird', 240, 54, 44, 'color:#3F86D3'], ['n-tulip', 30, 140, 22]], extraTop: egg(132, 128, '#7FC4E8') + egg(156, 124, '#F6C445') + egg(180, 128, '#E8A3B0') },
  'track-word': { s: 'spring', items: [['p3-canid', 40, 60, 22], ['p3-bird', 270, 64, 22]], extraTop: tile(87, 80, 'O', '#2F7D5B', 26) + tile(117, 80, 'T', '#F6C445', 26) + tile(147, 80, 'T', '#2F7D5B', 26) + tile(177, 80, 'E', '#9AA9B8', 26) + tile(207, 80, 'R', '#2F7D5B', 26) },
  'whose-print': { s: 'spring', items: [['p3-fox', 60, 100, 40], ['p3-deer', 140, 120, 40], ['p3-hand', 220, 96, 40], ['n-daisy', 20, 150, 22], ['n-tulip', 290, 150, 18]], extraTop: '<g><circle cx="190" cy="70" r="15" fill="#fff"></circle><text x="190" y="77" text-anchor="middle" font-size="19" font-weight="800" fill="#2F6FC0" style="font-family:var(--font-ui)">?</text></g>' },
  'feather-pairs': { s: 'spring', items: [['n-bird', 66, 94, 32, 'color:#E2594A'], ['n-bird', 214, 94, 32, 'color:#E2594A'], ['n-bird', 140, 104, 32, 'color:#3F86D3']], extraTop: '', extra: card(60, 80, -8) + card(136, 90, 2) + card(208, 80, 8) },
  'leaf-pile': { s: 'autumn', items: [['n-leaf', 110, 140, 30], ['n-leaf', 140, 130, 30], ['n-leaf', 170, 142, 30], ['n-leaf', 126, 114, 28], ['n-leaf', 158, 110, 28], ['n-leaf', 196, 124, 28], ['n-leaf', 92, 120, 26], ['n-leaf', 60, 60, 22], ['n-leaf', 250, 72, 20], ['i3-tree', 250, 96, 40]] },
  'who-was-here': { s: 'spring', items: [['ch:deer:idle', 110, 82, 100], ['n-daisy', 30, 150, 22], ['n-tulip', 284, 148, 18]], extraTop: '<g><circle cx="200" cy="100" r="34" fill="#fff" fill-opacity=".25" stroke="#233142" stroke-width="7"></circle><path d="M224 124 L258 158" stroke="#233142" stroke-width="10" stroke-linecap="round"></path></g>' },
  'nut-sort': { s: 'autumn', items: [['n-stump', 40, 120, 70], ['n-acorn', 120, 92, 30], ['n-acorn', 150, 100, 30], ['n-mush', 196, 96, 40], ['n-leaf', 246, 104, 28], ['n-daisy', 276, 92, 24]], extraTop: '' },
  'vine-links': { s: 'spring', items: [['n-daisy', 50, 118, 26], ['n-daisy', 250, 70, 26], ['n-tulip', 70, 60, 22], ['n-tulip', 226, 128, 22], ['n-butterfly', 150, 54, 30]], extraTop: '<path d="M63 140 C 110 140, 120 100, 170 100 S 240 96, 263 92" stroke="#2F8F5B" stroke-width="7" fill="none" stroke-linecap="round"></path><path d="M81 82 C 120 84, 150 150, 237 150" stroke="#D9463B" stroke-width="7" fill="none" stroke-linecap="round"></path>' },
  'spot-the-change': { s: 'spring', items: [['i3-tree', 30, 70, 40], ['n-bird', 70, 40, 30, 'color:#E2594A'], ['n-mush', 100, 130, 26], ['i3-tree', 190, 70, 40], ['n-bird', 230, 40, 30, 'color:#3F86D3'], ['n-mush', 260, 124, 38]], extraTop: '<g fill="none" stroke="#233142" stroke-width="3" stroke-dasharray="6 5"><circle cx="245" cy="54" r="22"></circle><circle cx="279" cy="143" r="26"></circle></g><path d="M160 20 V190" stroke="#fff" stroke-width="4"></path>' },
};
export const COVER_IDS = Object.keys(SCENES);

function useItem([id, x, y, w, style]: Item): string {
  if (id.startsWith('ch:')) {
    const [, a, mood] = id.split(':');
    return `<use href="#ch-${a}-body" x="${x}" y="${y}" width="${w}" height="${w}"></use><use href="#ch-${a}-${mood}" x="${x}" y="${y}" width="${w}" height="${w}"></use>`;
  }
  const [vw, vh] = VB[id] ?? [40, 40];
  return `<use href="#${id}" x="${x}" y="${y}" width="${w}" height="${Math.round((w * vh) / vw)}"${style ? ` style="${style}"` : ''}></use>`;
}

/** A seasonal cover scene for a game (320×200). */
export function cover(id: string, label = ''): string {
  const sc = SCENES[id]; if (!sc) return '';
  const p = SKY[sc.s], g = `cv-${id}`;
  const night = sc.s === 'night';
  // Trees only wear snow in winter scenes (--snowcap is read by the i3-tree sprite's snow layers).
  const snow = sc.s === 'winter' ? '' : ' style="--snowcap:0"';
  return `<svg class="cover" viewBox="0 0 320 200" role="img" aria-label="${label || id}" preserveAspectRatio="xMidYMid slice"${snow}>
<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.a}"></stop><stop offset="1" stop-color="${p.b}"></stop></linearGradient></defs>
<rect width="320" height="200" fill="url(#${g})"></rect>
${night ? [24, 70, 120, 200, 260, 300, 46, 160, 230].map((x, k) => star(x, 18 + ((k * 23) % 60))).join('') : ''}
<circle cx="${night ? 270 : 262}" cy="40" r="${night ? 16 : 20}" fill="${p.sun}"></circle>
<path d="M0 120 L60 84 L120 112 L190 72 L260 110 L320 86 V200 H0 Z" fill="${p.far}"></path>
<path d="M0 150 Q90 126 170 146 T320 140 V200 H0 Z" fill="${p.mid}"></path>
<path d="M0 176 Q120 160 230 172 T320 168 V200 H0 Z" fill="${p.ground}"></path>
${sc.extra ?? ''}${sc.items.map(useItem).join('')}${sc.extraTop ?? ''}
</svg>`;
}
