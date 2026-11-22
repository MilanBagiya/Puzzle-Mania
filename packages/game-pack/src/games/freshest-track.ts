// Freshest Track: five trails crossed the snow at different times. Put them in order from oldest to freshest
// using the clues. Exactly one order; checked against the clues.
import { print } from '@wild-daily/ui';
import { btn, clock, coach, onAct, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export const TRAILS = [{ id: 'fox', name: 'Fox' }, { id: 'rabbit', name: 'Rabbit' }, { id: 'deer', name: 'Deer' }, { id: 'squirrel', name: 'Squirrel' }, { id: 'hand', name: 'Raccoon' }, { id: 'cat', name: 'Bobcat' }] as const;
export type OClue = { t: 'pos' | 'notpos'; a: number; k: number } | { t: 'after' | 'before' | 'apart'; a: number; b: number };
export interface TrackPuzzle { seed: string; items: number[]; clues: OClue[]; text: string[] }
const ORD = ['made first', 'second', 'third', 'fourth', 'the freshest'];
export const holds = (c: OClue, o: number[]): boolean => { const p = (x: number): number => o.indexOf(x); switch (c.t) { case 'pos': return p(c.a) === c.k; case 'notpos': return p(c.a) !== c.k; case 'after': return p(c.a) === p(c.b) + 1; case 'before': return p(c.a) < p(c.b); case 'apart': return Math.abs(p(c.a) - p(c.b)) > 1; } };
const nm = (i: number): string => `the ${TRAILS[i]!.name.toLowerCase()} trail`;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
export const text = (c: OClue): string => { switch (c.t) { case 'pos': return `${cap(nm(c.a))} was ${ORD[c.k]}.`; case 'notpos': return `${cap(nm(c.a))} wasn’t ${ORD[c.k]}.`; case 'after': return `${cap(nm(c.a))} was made right after ${nm(c.b)}.`; case 'before': return `${cap(nm(c.a))} is older than ${nm(c.b)}.`; case 'apart': return `${cap(nm(c.a))} and ${nm(c.b)} weren’t made one after the other.`; } };
const perms = (a: number[]): number[][] => (a.length <= 1 ? [a.slice()] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
export const solveTrack = (p: Pick<TrackPuzzle, 'items' | 'clues'>): number[] | null => { const f = perms(p.items).filter((o) => p.clues.every((c) => holds(c, o))); return f.length === 1 ? f[0]! : null; };
export function generate(seed: string): TrackPuzzle {
  const rng = rngFrom('fresh:' + seed);
  for (let a = 0; a < 100; a++) {
    const items = shuffle(rng, range(TRAILS.length)).slice(0, 5), ans = shuffle(rng, items.slice()), all = perms(items);
    let cand = all.slice(), clues: OClue[] = [];
    for (let g = 0; g < 400 && cand.length > 1; g++) {
      const r = rng(), A = items[Math.floor(rng() * 5)]!, B = items[Math.floor(rng() * 5)]!;
      let c: OClue;
      if (r < 0.12) c = { t: 'pos', a: A, k: ans.indexOf(A) }; else if (r < 0.3) c = { t: 'notpos', a: A, k: Math.floor(rng() * 5) };
      else if (r < 0.55) { const i = ans.indexOf(A); if (!i) continue; c = { t: 'after', a: A, b: ans[i - 1]! }; }
      else if (r < 0.8) { if (A === B) continue; c = { t: 'before', a: A, b: B }; } else { if (A === B) continue; c = { t: 'apart', a: A, b: B }; }
      if (!holds(c, ans)) continue;
      const next = cand.filter((o) => holds(c, o)); if (next.length === cand.length) continue;
      cand = next; clues.push(c);
    }
    if (cand.length !== 1) continue;
    for (let i = clues.length - 1; i >= 0; i--) { const rest = clues.filter((_, j) => j !== i); if (all.filter((o) => rest.every((c) => holds(c, o))).length === 1) clues = rest; }
    if (clues.length >= 3 && clues.length <= 6) return { seed, items, clues, text: clues.map(text) };
  }
  throw new Error('freshest-track: generation failed for ' + seed);
}
const def: GameDef<TrackPuzzle> = {
  id: 'freshest-track', generate,
  mount(root, p, ctx) {
    let order: number[] = [], hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const chip = (i: number, act: string): string => `<button type="button" class="dc-bird" data-g="${act}:${i}" aria-label="${TRAILS[i]!.name} trail">${print(TRAILS[i]!.id, 40)}<span>${TRAILS[i]!.name}</span></button>`;
    const render = (): void => {
      const slots = range(5).map((k) => order[k] !== undefined ? chip(order[k]!, 'out') : `<div class="dc-bird" style="opacity:.5; justify-content:center"><b class="display">${k + 1}</b></div>`).join('');
      const text2 = done ? 'You read the snow like a real tracker!' : msg ?? 'Tap the trails in order, from the oldest (made first) to the freshest. Tap a placed trail to remove it.';
      root.innerHTML = `<div class="card stack"><b>Clues</b><ul style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px">${p.text.map((c) => `<li>${c}</li>`).join('')}</ul></div>${coach(text2, done ? 'good' : kind)}
<div class="card stack"><div class="row" style="justify-content:space-between; font-weight:800; font-size:13px"><span>Oldest</span><span>Freshest</span></div><div class="dc-tray">${slots}</div>${done ? '' : `<div class="dc-tray">${p.items.filter((i) => !order.includes(i)).map((i) => chip(i, 'in')).join('')}</div>`}</div>
${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done || order.length < 5))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      const i = Number(arg);
      if (act === 'in' && order.length < 5) order.push(i);
      else if (act === 'out') order = order.filter((x) => x !== i);
      else if (act === 'clear') order = [];
      else if (act === 'hint') { const s = solveTrack(p)!; const k = s.findIndex((x, j) => order[j] !== x); if (k >= 0) { order = [...s.slice(0, k + 1)]; hints++; msg = `Hint: the first ${k + 1} ${k ? 'trails are' : 'trail is'} in place.`; } }
      else if (act === 'check') {
        if (p.clues.every((c) => holds(c, order))) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
        msg = 'At least one clue isn’t true for this order.'; kind = 'bad';
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
