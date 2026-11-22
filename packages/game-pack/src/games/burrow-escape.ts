// Burrow Escape: slide logs (only along their length) so the rabbit can hop out of the exit on the right.
// Tap a piece, then tap an empty square in line with it to slide it there. Solvable in 5–14 moves.
import { character } from '@wild-daily/ui';
import { btn, clock, coach, onAct, pills, range, rngFrom, tools, type GameDef } from '../shared.js';

export interface Piece { r: number; c: number; len: number; horiz: boolean }
export interface BurrowPuzzle { n: number; seed: string; pieces: Piece[]; best: number } // pieces[0] is the rabbit (row 2, horizontal)
const key = (ps: Piece[]): string => ps.map((p) => `${p.r},${p.c}`).join(';');
function occupancy(n: number, ps: Piece[], skip = -1): Int8Array {
  const g = new Int8Array(n * n).fill(-1);
  ps.forEach((p, k) => { if (k === skip) return; for (let x = 0; x < p.len; x++) g[(p.r + (p.horiz ? 0 : x)) * n + p.c + (p.horiz ? x : 0)] = k; });
  return g;
}
export function movesOf(n: number, ps: Piece[]): { k: number; to: Piece }[] {
  const g = occupancy(n, ps), out: { k: number; to: Piece }[] = [];
  ps.forEach((p, k) => {
    for (const s of [-1, 1]) for (let d = 1; d < n; d++) {
      const nr = p.horiz ? p.r : p.r + s * d, nc = p.horiz ? p.c + s * d : p.c;
      const lead = s < 0 ? (p.horiz ? nr * n + nc : nr * n + nc) : (p.horiz ? nr * n + nc + p.len - 1 : (nr + p.len - 1) * n + nc);
      const lr = Math.floor(lead / n), lc = lead % n;
      if (nr < 0 || nc < 0 || (p.horiz ? nc + p.len > n : nr + p.len > n) || lr >= n || lc >= n) break;
      if (g[lead] !== -1 && g[lead] !== k) break;
      out.push({ k, to: { ...p, r: nr, c: nc } });
    }
  });
  return out;
}
export function solveBurrow(p: BurrowPuzzle | { n: number; pieces: Piece[] }, cap = 30000): Piece[][] | null {
  const { n } = p, start = p.pieces, prev = new Map<string, string | null>([[key(start), null]]), states = new Map<string, Piece[]>([[key(start), start]]), q = [start];
  while (q.length && prev.size < cap) {
    const s = q.shift()!;
    if (s[0]!.c + s[0]!.len === n) { const out: Piece[][] = []; let k: string | null = key(s); while (k) { out.unshift(states.get(k)!); k = prev.get(k) ?? null; } return out; }
    for (const m of movesOf(n, s)) { const ns = s.map((x, i) => (i === m.k ? m.to : x)); const kk = key(ns); if (!prev.has(kk)) { prev.set(kk, key(s)); states.set(kk, ns); q.push(ns); } }
  }
  return null;
}
export function generate(seed: string): BurrowPuzzle {
  const rng = rngFrom('burrow:' + seed), n = 6;
  for (let a = 0; a < 2500; a++) {
    const pieces: Piece[] = [{ r: 2, c: Math.floor(rng() * 2), len: 2, horiz: true }];
    const count = 7 + Math.floor(rng() * 5);
    for (let t = 0; t < 80 && pieces.length < count; t++) {
      const horiz = rng() < 0.45, len = rng() < 0.75 ? 2 : 3;
      const r = Math.floor(rng() * (horiz ? n : n - len + 1)), c = Math.floor(rng() * (horiz ? n - len + 1 : n));
      if (horiz && r === 2) continue;
      const cand = { r, c, len, horiz }, g = occupancy(n, pieces);
      let free = true; for (let x = 0; x < len; x++) if (g[(r + (horiz ? 0 : x)) * n + c + (horiz ? x : 0)] !== -1) free = false;
      if (free) pieces.push(cand);
    }
    const sol = solveBurrow({ n, pieces });
    if (!sol) continue;
    const best = sol.length - 1;
    if (best < 5 || best > 14) continue;
    return { n, seed, pieces, best };
  }
  throw new Error('burrow-escape: generation failed for ' + seed);
}
const LOGS = ['#C9915E', '#B07A51', '#D9AE7E', '#A86E43', '#C08A5A', '#9A6A42'];
const def: GameDef<BurrowPuzzle> = {
  id: 'burrow-escape', generate,
  mount(root, p, ctx) {
    const n = p.n;
    let ps = p.pieces.map((x) => ({ ...x })), sel = 0, moves = 0, hints = 0, done = false, msg: string | null = null, kind = '', hist: Piece[][] = [];
    const t = clock(ctx);
    const render = (): void => {
      const g = occupancy(n, ps), targets = new Set(movesOf(n, ps).filter((m) => m.k === sel).map((m) => { const q = m.to; return q.horiz ? q.r * n + (q.c < ps[sel]!.c ? q.c : q.c + q.len - 1) : (q.r < ps[sel]!.r ? q.r : q.r + q.len - 1) * n + q.c; }));
      const exitCell = 2 * n + n - 1;
      const cells = range(n * n).map((i) => {
        const k = g[i]!, pc = k >= 0 ? ps[k]! : null;
        const r = Math.floor(i / n), c = i % n;
        let style = k === 0 ? 'background:#DCEBFA' : k > 0 ? `background:${LOGS[k % LOGS.length]}` : '';
        if (pc) {
          const top = pc.horiz ? true : r === pc.r, bottom = pc.horiz ? true : r === pc.r + pc.len - 1;
          const left = pc.horiz ? c === pc.c : true, right = pc.horiz ? c === pc.c + pc.len - 1 : true;
          const edge = k === 0 ? '#2F6FC0' : '#5A3A26';
          style += `; box-shadow:inset ${left ? 3 : 0}px 0 0 ${edge}, inset ${right ? -3 : 0}px 0 0 ${edge}, inset 0 ${top ? 3 : 0}px 0 ${edge}, inset 0 ${bottom ? -3 : 0}px 0 ${edge}`;
          style += `; border-radius:${pc.horiz ? `${left ? 8 : 0}px ${right ? 8 : 0}px ${right ? 8 : 0}px ${left ? 8 : 0}px` : `${top ? 8 : 0}px ${top ? 8 : 0}px ${bottom ? 8 : 0}px ${bottom ? 8 : 0}px`}`;
        }
        const isHead = k >= 0 && ((ps[k]!.horiz && c === ps[k]!.c) || (!ps[k]!.horiz && r === ps[k]!.r));
        return `<button type="button" class="gcell burrow${k === sel ? ' hinted' : ''}${targets.has(i) ? ' target' : ''}${i === exitCell && k !== 0 ? ' exitcell' : ''}" style="${style}" data-g="cell:${i}" aria-label="${k === 0 ? 'Rabbit' : k > 0 ? 'Log' : 'Empty'}${i === exitCell ? ', next to the exit' : ''}${targets.has(i) ? ', can slide here' : ''}">${k === 0 && isHead ? character('rabbit', done ? 'happy' : 'idle', undefined, done ? 'cheer' : '') : ''}</button>`;
      }).join('');
      const text = done ? `The rabbit hopped out in ${moves} moves! Best possible: ${p.best}.` : msg ?? 'Tap the rabbit or a log, then tap a glowing square to slide it. Clear a path to the exit on the right of the rabbit’s row.';
      root.innerHTML = `${pills(`Moves: ${moves} (best ${p.best})`, 'Exit: green edge, row 3')}${coach(text, done ? 'good' : kind)}<div class="boardwrap"><div class="board" role="grid" aria-label="Burrow" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 70}px; gap:3px">${cells}</div></div>${tools(btn('undo', 'Undo', 'btn-w', done || !hist.length), btn('restart', 'Restart', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const apply = (k: number, to: Piece): boolean => {
      hist.push(ps.map((x) => ({ ...x }))); ps = ps.map((x, i) => (i === k ? to : x)); moves++;
      if (ps[0]!.c + ps[0]!.len === n) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints, moves, stars: hints === 0 && moves <= p.best ? 3 : moves <= p.best + 4 ? 2 : 1 }); return true; }
      return false;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'cell') {
        const i = Number(arg), g = occupancy(n, ps);
        if (g[i]! >= 0) { sel = g[i]!; render(); return; }
        const m = movesOf(n, ps).find((x) => x.k === sel && (x.to.horiz ? Math.floor(i / n) === x.to.r && i % n >= x.to.c && i % n < x.to.c + x.to.len : i % n === x.to.c && Math.floor(i / n) >= x.to.r && Math.floor(i / n) < x.to.r + x.to.len) && ((x.to.horiz && (i % n === x.to.c || i % n === x.to.c + x.to.len - 1)) || (!x.to.horiz && (Math.floor(i / n) === x.to.r || Math.floor(i / n) === x.to.r + x.to.len - 1))));
        if (m) { if (apply(m.k, m.to)) return; } else { msg = 'That piece can’t slide there. Pieces only move along their length.'; kind = 'bad'; }
      } else if (act === 'undo') { const h = hist.pop(); if (h) { ps = h; moves++; } }
      else if (act === 'restart') { ps = p.pieces.map((x) => ({ ...x })); hist = []; }
      else if (act === 'hint') {
        const sol = solveBurrow({ n, pieces: ps });
        if (sol && sol[1]) { const k = sol[1].findIndex((x, i) => x.r !== ps[i]!.r || x.c !== ps[i]!.c); hints++; sel = k; if (apply(k, sol[1][k]!)) return; msg = 'Hint: one piece slid for you.'; }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
