// Spot the Change: two forest scenes, five differences. Tap the changed thing in either scene.
// The puzzle file holds the two scenes exactly as the player sees them (no list of answers).
import { btn, clock, coach, escapeHtml, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

/** Things that can appear: sprite symbol, viewBox size and a readable name. */
export const THINGS = {
  tree: { id: 'i3-tree', vb: [64, 72], name: 'pine tree' }, rock: { id: 'i3-rock', vb: [64, 52], name: 'rock' },
  bush: { id: 'n-bush', vb: [36, 30], name: 'berry bush' }, mush: { id: 'n-mush', vb: [40, 40], name: 'mushroom' },
  daisy: { id: 'n-daisy', vb: [30, 40], name: 'daisy' }, tulip: { id: 'n-tulip', vb: [24, 40], name: 'tulip' },
  stump: { id: 'n-stump', vb: [38, 30], name: 'tree stump' }, acorn: { id: 'n-acorn', vb: [30, 36], name: 'acorn' },
  owl: { id: 'n-owl', vb: [40, 40], name: 'owl' }, frog: { id: 'n-frog', vb: [64, 56], name: 'frog' },
  bird: { id: 'n-bird', vb: [48, 44], name: 'bird' }, butterfly: { id: 'n-butterfly', vb: [30, 24], name: 'butterfly' },
} as const;
export type Thing = keyof typeof THINGS;
const GROUND: Thing[] = ['tree', 'rock', 'bush', 'mush', 'daisy', 'tulip', 'stump', 'acorn', 'owl', 'frog'];
const SKY: Thing[] = ['bird', 'butterfly'];
export const BIRD_COLORS = { red: '#E2594A', blue: '#3F86D3', yellow: '#F2B92B', green: '#4E9E4E' } as const;
export interface Item { t: Thing; x: number; y: number; w: number; c?: keyof typeof BIRD_COLORS }
export interface SpotPuzzle { seed: string; left: Item[]; right: (Item | null)[] }

export const same = (a: Item | null | undefined, b: Item | null | undefined): boolean =>
  !!a && !!b && a.t === b.t && a.x === b.x && a.y === b.y && a.w === b.w && a.c === b.c;
/** Indexes where the two scenes differ. */
export const changesOf = (p: SpotPuzzle): number[] => range(p.left.length).filter((i) => !same(p.left[i], p.right[i]));
const heightOf = (it: Item): number => Math.round((it.w * THINGS[it.t].vb[1]) / THINGS[it.t].vb[0]);

export function generate(seed: string): SpotPuzzle {
  const rng = rngFrom('spot:' + seed), pick = <T>(a: readonly T[]): T => a[Math.floor(rng() * a.length)]!;
  // Slots: 4 x 3 on the ground, 3 in the sky. 12 things in total, each centred in its own slot.
  const ground = range(12).map((k) => ({ cx: 46 + (k % 4) * 76, cy: 92 + Math.floor(k / 4) * 40 }));
  const sky = range(3).map((k) => ({ cx: 60 + k * 100, cy: 36 }));
  const left: Item[] = [];
  for (const s of shuffle(rng, ground).slice(0, 9)) {
    const t = pick(GROUND), w = t === 'tree' || t === 'frog' || t === 'rock' ? 34 : 26;
    left.push({ t, w, x: Math.round(s.cx - w / 2), y: Math.round(s.cy - heightOf({ t, w, x: 0, y: 0 }) / 2) });
  }
  for (const s of sky) { const t = pick(SKY), w = t === 'bird' ? 30 : 24; const it: Item = { t, w, x: Math.round(s.cx - w / 2), y: s.cy - 12 }; if (t === 'bird') it.c = pick(Object.keys(BIRD_COLORS) as (keyof typeof BIRD_COLORS)[]); left.push(it); }
  // Five changes, each on a different thing, each kind visible at a glance.
  const right: (Item | null)[] = left.map((it) => ({ ...it }));
  for (const i of shuffle(rng, range(left.length)).slice(0, 5)) {
    const it = left[i]!, kinds = ['gone', 'swap', 'size', ...(it.t === 'bird' ? ['color', 'color'] : [])];
    const k = pick(kinds);
    if (k === 'gone') right[i] = null;
    else if (k === 'size') { const w = Math.round(it.w * (rng() < 0.5 ? 1.45 : 0.6)); right[i] = { ...it, w, x: Math.round(it.x + it.w / 2 - w / 2), y: Math.round(it.y + heightOf(it) / 2 - heightOf({ ...it, w }) / 2) }; }
    else if (k === 'color') { const c = pick((Object.keys(BIRD_COLORS) as (keyof typeof BIRD_COLORS)[]).filter((x) => x !== it.c)); right[i] = { ...it, c }; }
    else { const pool = (SKY.includes(it.t) ? SKY : GROUND).filter((x) => x !== it.t); const t = pick(pool); const swapped: Item = { ...it, t }; if (t === 'bird') swapped.c = 'red'; else delete swapped.c; swapped.y = Math.round(it.y + heightOf(it) / 2 - heightOf(swapped) / 2); right[i] = swapped; }
  }
  return { seed, left, right };
}

const describe = (it: Item): string => `${it.c ? `${it.c} ` : ''}${THINGS[it.t].name}${it.w > 36 ? ' (big)' : it.w < 18 ? ' (small)' : ''}`;
const where = (it: Item): string => `${it.y < 60 ? 'in the sky' : it.y < 105 ? 'at the back' : it.y < 140 ? 'in the middle' : 'at the front'}, ${it.x < 110 ? 'left' : it.x < 210 ? 'centre' : 'right'}`;

const def: GameDef<SpotPuzzle> = {
  id: 'spot-the-change', generate,
  mount(root, p, ctx) {
    const diffs = changesOf(p), total = diffs.length;
    const found = new Set<number>(); let misses = 0, hints = 0, done = false, flash = -1, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const scene = (side: 'left' | 'right'): string => {
      const items = side === 'left' ? p.left : p.right;
      const art = items.map((it) => it ? `<use href="#${THINGS[it.t].id}" x="${it.x}" y="${it.y}" width="${it.w}" height="${heightOf(it)}"${it.c ? ` style="color:${BIRD_COLORS[it.c]}"` : ''}></use>` : '').join('');
      const rings = [...found, ...(flash >= 0 && !found.has(flash) ? [flash] : [])].map((i) => { const it = p.left[i]! ?? p.right[i]!; const r = Math.max(it.w, heightOf(it)) * 0.75 + 4; return `<circle class="${found.has(i) ? 'got' : 'hint'}" cx="${it.x + it.w / 2}" cy="${it.y + heightOf(it) / 2}" r="${r}"></circle>`; }).join('');
      // A button over every thing in this scene (and over the empty spot where a thing is missing).
      const hit = range(p.left.length).map((i) => {
        const it = items[i] ?? (side === 'right' ? p.left[i]! : null); if (!it) return '';
        const h = heightOf(it), size = Math.max(it.w, h, 26);
        const label = items[i] ? `${describe(items[i]!)}, ${where(it)}` : `empty spot, ${where(it)}`;
        return `<button type="button" class="spot-hit${found.has(i) ? ' got' : ''}" data-g="tap:${i}" style="left:${((it.x + it.w / 2 - size / 2) / 320) * 100}%; top:${((it.y + h / 2 - size / 2) / 200) * 100}%; width:${(size / 320) * 100}%; height:${(size / 200) * 100}%" aria-label="${escapeHtml(label)}${found.has(i) ? ', found' : ''}"></button>`;
      }).join('');
      return `<div class="spot-pane" role="group" aria-label="${side === 'left' ? 'First scene' : 'Second scene'}"><svg viewBox="0 0 320 200" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="spot-sky-${side}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFEBFA"></stop><stop offset="1" stop-color="#F0FAFF"></stop></linearGradient></defs><rect width="320" height="200" fill="url(#spot-sky-${side})"></rect><circle cx="280" cy="30" r="16" fill="#FFE48A"></circle><path d="M0 84 L70 58 L140 80 L210 52 L320 80 V200 H0 Z" fill="#BFE5A6"></path><path d="M0 120 Q90 100 170 116 T320 110 V200 H0 Z" fill="#93D46F"></path><path d="M0 160 Q120 146 230 156 T320 152 V200 H0 Z" fill="#6CBF57"></path>${art}<g class="spot-rings">${rings}</g></svg>${hit}</div>`;
    };
    const render = (): void => {
      const text = done ? `You found all ${total} changes!` : msg ?? 'Tap anything that is different in the second scene. You can tap it in either scene.';
      root.innerHTML = `${pills(`Found: ${found.size} of ${total}`, `Misses: ${misses}`)}${coach(text, done ? 'good' : kind)}<div class="spot-scenes">${scene('left')}${scene('right')}</div>${tools(btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = ''; flash = -1;
      if (act === 'tap') {
        const i = Number(arg);
        if (found.has(i)) msg = 'Already found: look for another change.';
        else if (diffs.includes(i)) {
          found.add(i); msg = `Found it! ${total - found.size} to go.`; kind = 'good';
          if (found.size === total) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints, moves: misses, stars: !hints && misses <= 1 ? 3 : hints + misses <= 3 ? 2 : 1 }); return; }
        } else { misses++; msg = 'That one is the same in both scenes.'; kind = 'bad'; }
      } else if (act === 'hint') { const i = diffs.find((d) => !found.has(d)); if (i !== undefined) { flash = i; hints++; msg = 'Hint: look inside the dashed circle.'; } }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
