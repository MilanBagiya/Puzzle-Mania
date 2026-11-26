// Nut Sort: move forest finds between baskets, one at a time, until every basket holds only one kind.
// A find can go into an empty basket or onto the same kind in a basket that is not full.
// Every puzzle is proven solvable by a breadth-first search, which also gives the fewest moves (three paws).
import { svgUse } from '@wild-daily/ui';
import { btn, clock, coach, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

/** The four kinds of finds: each has its own shape and colour. */
export const KINDS = [
  { name: 'acorn', art: () => svgUse('n-acorn', '0 0 30 36') },
  { name: 'mushroom', art: () => svgUse('n-mush', '0 0 40 40') },
  { name: 'leaf', art: () => svgUse('n-leaf', '0 0 24 24') },
  { name: 'daisy', art: () => svgUse('n-daisy', '0 0 30 40') },
] as const;
export const CAP = 4;
export interface SortPuzzle { seed: string; baskets: number[][]; best: number }
type Move = [from: number, to: number];

const key = (b: readonly (readonly number[])[]): string => b.map((t) => t.join('')).sort().join('|');
export const isSorted = (b: readonly (readonly number[])[]): boolean => b.every((t) => t.length === 0 || (t.length === CAP && t.every((x) => x === t[0])));
export function canMove(b: readonly (readonly number[])[], from: number, to: number): boolean {
  const s = b[from], d = b[to];
  if (!s || !d || from === to || !s.length || d.length >= CAP) return false;
  return !d.length || d[d.length - 1] === s[s.length - 1];
}
function movesOf(b: readonly (readonly number[])[]): Move[] {
  const out: Move[] = [];
  for (let f = 0; f < b.length; f++) {
    const s = b[f]!;
    if (!s.length || (s.length === CAP && s.every((x) => x === s[0]))) continue; // never break up a finished basket
    let emptyTried = false;
    for (let t = 0; t < b.length; t++) {
      if (!canMove(b, f, t)) continue;
      if (!b[t]!.length) { if (emptyTried || s.every((x) => x === s[0])) continue; emptyTried = true; } // empties are alike; pointless moves skipped
      out.push([f, t]);
    }
  }
  return out;
}
const apply = (b: readonly (readonly number[])[], [f, t]: Move): number[][] => { const n = b.map((x) => [...x]); n[t]!.push(n[f]!.pop()!); return n; };

/** Fewest moves from `start` to sorted (breadth-first), or null if none within the node limit. */
export function solveSort(start: readonly (readonly number[])[], limit = 400_000): Move[] | null {
  if (isSorted(start)) return [];
  const seen = new Map<string, null | { prev: string; move: Move }>([[key(start), null]]);
  let frontier: number[][][] = [start.map((t) => [...t])];
  while (frontier.length && seen.size < limit) {
    const next: number[][][] = [];
    for (const b of frontier) {
      const k = key(b);
      for (const m of movesOf(b)) {
        const n = apply(b, m), nk = key(n);
        if (seen.has(nk)) continue;
        seen.set(nk, { prev: k, move: m });
        if (isSorted(n)) {
          // Walk back to the start. Moves were recorded on the real basket order of each parent state, which is
          // the order the player sees as long as we replay them from `start` (we only use the first move for hints).
          const path: Move[] = []; let cur: string = nk;
          for (let s = seen.get(cur); s; s = seen.get(cur)) { path.unshift(s.move); cur = s.prev; }
          return path;
        }
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}
export function generate(seed: string): SortPuzzle {
  const rng = rngFrom('nutsort:' + seed), kinds = KINDS.length;
  for (let a = 0; a < 200; a++) {
    const items = shuffle(rng, range(kinds * CAP).map((i) => i % kinds));
    const baskets: number[][] = range(kinds).map((k) => items.slice(k * CAP, k * CAP + CAP));
    baskets.push([], []);
    if (baskets.some((t) => t.length === CAP && t.every((x) => x === t[0]))) continue;
    const sol = solveSort(baskets);
    if (sol && sol.length >= 12 && sol.length <= 30) return { seed, baskets, best: sol.length };
  }
  throw new Error('nut-sort: generation failed for ' + seed);
}

const def: GameDef<SortPuzzle> = {
  id: 'nut-sort', generate,
  mount(root, p, ctx) {
    let b = p.baskets.map((t) => [...t]), sel = -1, moves = 0, hints = 0, done = false, glow: Move | null = null, msg: string | null = null, kind = '';
    const hist: number[][][] = [];
    const t = clock(ctx);
    const render = (): void => {
      const baskets = b.map((items, i) => {
        const label = `Basket ${i + 1}: ${items.length ? items.map((k) => KINDS[k]!.name).join(', ') + ' (top: ' + KINDS[items[items.length - 1]!]!.name + ')' : 'empty'}`;
        const cls = ['nbasket', sel === i ? 'sel' : '', glow && glow[0] === i ? 'hint-from' : '', glow && glow[1] === i ? 'hint-to' : '', items.length === CAP && items.every((x) => x === items[0]) ? 'full' : ''].filter(Boolean).join(' ');
        const slots = range(CAP).map((s) => { const k = items[s]; return `<span class="nslot">${k === undefined ? '' : `<span class="nitem k${k}">${KINDS[k]!.art()}</span>`}</span>`; }).join('');
        return `<button type="button" class="${cls}" data-g="pick:${i}" aria-pressed="${sel === i}" aria-label="${label}">${slots}</button>`;
      }).join('');
      const text = done ? `Sorted in ${moves} moves!` : msg ?? (sel >= 0 ? 'Now tap the basket to move it to.' : 'Tap a basket to pick up its top find, then tap where it goes. Same kind on top, or an empty basket.');
      root.innerHTML = `${pills(`Moves: ${moves} (best ${p.best})`, `${b.filter((x) => x.length === CAP && x.every((y) => y === x[0])).length} of ${KINDS.length} sorted`)}${coach(text, done ? 'good' : kind)}<div class="boardwrap nsort" style="--bmax:520px"><div class="nbaskets" role="group" aria-label="Baskets">${baskets}</div></div>${tools(btn('undo', 'Undo', 'btn-w', done || !hist.length), btn('restart', 'Restart', 'btn-w', done || !moves), btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const finish = (): void => { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints, moves, stars: !hints && moves <= p.best ? 3 : moves <= p.best + 6 ? 2 : 1 }); };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = ''; glow = null;
      if (act === 'pick') {
        const i = Number(arg);
        if (sel < 0) { if (b[i]!.length) sel = i; else { msg = 'That basket is empty: pick one with something in it.'; kind = 'bad'; } }
        else if (sel === i) sel = -1;
        else if (canMove(b, sel, i)) { hist.push(b.map((x) => [...x])); b = apply(b, [sel, i]); sel = -1; moves++; if (isSorted(b)) return finish(); }
        else { msg = b[i]!.length >= CAP ? 'That basket is full.' : 'Only the same kind can go on top.'; kind = 'bad'; sel = -1; }
      } else if (act === 'undo') { const prev = hist.pop(); if (prev) { b = prev; moves = hist.length; } sel = -1; } // undo takes the move back
      else if (act === 'restart') { b = p.baskets.map((x) => [...x]); hist.length = 0; moves = 0; sel = -1; }
      else if (act === 'hint') {
        const s = solveSort(b, 150_000);
        if (s && s[0]) { glow = s[0]; hints++; sel = -1; msg = `Hint: move the top of the glowing basket to the outlined one. ${s.length} moves to go.`; }
        else { msg = 'No way to finish from here: try Undo or Restart.'; kind = 'bad'; }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
