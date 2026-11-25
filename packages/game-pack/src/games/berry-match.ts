// Berry Match: swap two neighbouring berries to line up three or more of a kind. Matched berries are
// picked, the ones above drop down, and new berries fall in from each column's own fixed queue, so every
// player sees the same board and the same refills. Goal: pick enough of today's berry within the swaps.
// The generator plays the puzzle as a simple greedy player and sets the goal a little below what it picked.
import { btn, cellLabel, clock, coach, onAct, pills, range, rngFrom, tools, type GameDef } from '../shared.js';

export const N = 7;
/** Five berries, each with its own shape and colour (our own SVG). */
export const BERRIES = [
  { name: 'blueberry', plural: 'blueberries', svg: '<circle cx="20" cy="22" r="14" fill="#3B6FD6"></circle><path d="M14 11 L17 14 L20 9 L23 14 L26 11 L25 16 H15 Z" fill="#23468F"></path><circle cx="15" cy="20" r="3" fill="#fff" opacity=".45"></circle>' },
  { name: 'strawberry', plural: 'strawberries', svg: '<path d="M6 14 Q20 8 34 14 Q32 30 20 37 Q8 30 6 14 Z" fill="#E0483E"></path><path d="M12 12 L20 4 L28 12 L20 10 Z" fill="#3E9B48"></path><g fill="#FFE08A"><circle cx="14" cy="19" r="1.4"></circle><circle cx="22" cy="18" r="1.4"></circle><circle cx="27" cy="22" r="1.4"></circle><circle cx="17" cy="26" r="1.4"></circle><circle cx="23" cy="29" r="1.4"></circle></g>' },
  { name: 'blackberry', plural: 'blackberries', svg: '<g fill="#7A48B5"><circle cx="20" cy="12" r="6"></circle><circle cx="13" cy="18" r="6"></circle><circle cx="27" cy="18" r="6"></circle><circle cx="20" cy="22" r="6"></circle><circle cx="14" cy="27" r="6"></circle><circle cx="26" cy="27" r="6"></circle><circle cx="20" cy="32" r="6"></circle></g><g fill="#fff" opacity=".4"><circle cx="18" cy="10" r="1.6"></circle><circle cx="11" cy="16" r="1.6"></circle></g>' },
  { name: 'gooseberry', plural: 'gooseberries', svg: '<ellipse cx="20" cy="22" rx="11" ry="15" fill="#6DB24A"></ellipse><path d="M20 7 V37 M14 10 Q11 22 14 34 M26 10 Q29 22 26 34" stroke="#3F7F2B" stroke-width="1.6" fill="none"></path><path d="M20 7 L20 2" stroke="#5B3A22" stroke-width="2.4" stroke-linecap="round"></path>' },
  { name: 'rowan berry', plural: 'rowan berries', svg: '<path d="M20 3 L12 20 M20 3 L28 20" stroke="#5B3A22" stroke-width="2.4" fill="none" stroke-linecap="round"></path><circle cx="12" cy="27" r="9" fill="#F08A24"></circle><circle cx="28" cy="27" r="9" fill="#F08A24"></circle><circle cx="9" cy="24" r="2.4" fill="#fff" opacity=".5"></circle><circle cx="25" cy="24" r="2.4" fill="#fff" opacity=".5"></circle>' },
] as const;
export const KINDS = BERRIES.length;
const QLEN = 160;

export interface BerryPuzzle {
  seed: string;
  /** The starting board, row by row (N x N kinds). */
  board: number[];
  /** The berries that fall into each column, in order. */
  queues: number[][];
  target: number;
  goal: number;
  swaps: number;
  /** Swaps the simple greedy player needed to reach the goal (a par, not an answer). */
  best: number;
}
export interface BerryState { board: number[]; ptr: number[]; got: number[] }
export type Swap = [number, number];

export const startState = (p: BerryPuzzle): BerryState => ({ board: [...p.board], ptr: range(N).map(() => 0), got: range(KINDS).map(() => 0) });
const runAt = (b: readonly number[], i: number): boolean => {
  const k = b[i]!, r = Math.floor(i / N), c = i % N;
  let h = 1; for (let x = c - 1; x >= 0 && b[r * N + x] === k; x--) h++; for (let x = c + 1; x < N && b[r * N + x] === k; x++) h++;
  if (h >= 3) return true;
  let v = 1; for (let y = r - 1; y >= 0 && b[y * N + c] === k; y--) v++; for (let y = r + 1; y < N && b[y * N + c] === k; y++) v++;
  return v >= 3;
};
/** Every square that is part of a line of three or more. */
export function matchesOf(b: readonly number[]): Set<number> {
  const out = new Set<number>();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; ) {
    let e = c + 1; while (e < N && b[r * N + e] === b[r * N + c]) e++;
    if (e - c >= 3) for (let x = c; x < e; x++) out.add(r * N + x);
    c = e;
  }
  for (let c = 0; c < N; c++) for (let r = 0; r < N; ) {
    let e = r + 1; while (e < N && b[e * N + c] === b[r * N + c]) e++;
    if (e - r >= 3) for (let y = r; y < e; y++) out.add(y * N + c);
    r = e;
  }
  return out;
}
export const adjacent = (a: number, b: number): boolean => (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N)) || Math.abs(a - b) === N;
/** A swap is allowed only if it lines up three or more. */
export function canSwap(b: readonly number[], a: number, c: number): boolean {
  if (a < 0 || c < 0 || a >= N * N || c >= N * N || !adjacent(a, c) || b[a] === b[c]) return false;
  const t = [...b]; t[a] = b[c]!; t[c] = b[a]!;
  return runAt(t, a) || runAt(t, c);
}
export function swapsOf(b: readonly number[]): Swap[] {
  const out: Swap[] = [];
  for (let i = 0; i < N * N; i++) {
    if (i % N < N - 1 && canSwap(b, i, i + 1)) out.push([i, i + 1]);
    if (i + N < N * N && canSwap(b, i, i + N)) out.push([i, i + N]);
  }
  return out;
}
export interface Played { state: BerryState; picked: number[]; waves: number; fresh: Set<number> }
/** Make a swap and let everything settle. Returns null if the swap is not allowed. */
export function play(p: BerryPuzzle, s: BerryState, [a, c]: Swap): Played | null {
  if (!canSwap(s.board, a, c)) return null;
  const b = [...s.board], ptr = [...s.ptr], got = [...s.got], picked = range(KINDS).map(() => 0);
  [b[a], b[c]] = [b[c]!, b[a]!];
  let waves = 0; const fresh = new Set<number>();
  for (let m = matchesOf(b); m.size; m = matchesOf(b)) {
    waves++;
    for (const i of m) { picked[b[i]!]!++; got[b[i]!]!++; b[i] = -1; }
    for (let col = 0; col < N; col++) {
      // Berries drop to the bottom; new ones come from the column's queue, the first one landing lowest.
      const keep = range(N).map((r) => b[r * N + col]!).filter((k) => k >= 0);
      const add = N - keep.length, q = p.queues[col]!;
      const newcomers = range(add).map(() => q[ptr[col]!++ % q.length]!).reverse();
      const colNow = [...newcomers, ...keep];
      for (let r = 0; r < N; r++) { b[r * N + col] = colNow[r]!; if (r < add) fresh.add(r * N + col); }
    }
  }
  return { state: { board: b, ptr, got }, picked, waves, fresh };
}

/** Beam search: the most `target` berries it can pick in `swaps` swaps, the line that does it, and when it first reaches `goal`. */
export function search(p: BerryPuzzle, from: BerryState, swaps: number, width = 10, goal = Infinity): { got: number; line: Swap[]; reached: number } {
  type Node = { s: BerryState; line: Swap[]; score: number };
  let beam: Node[] = [{ s: from, line: [], score: 0 }];
  let best = { got: from.got[p.target]!, line: [] as Swap[], reached: from.got[p.target]! >= goal ? 0 : Infinity };
  for (let d = 0; d < swaps && beam.length; d++) {
    const next: Node[] = [];
    for (const n of beam) for (const sw of swapsOf(n.s.board)) {
      const r = play(p, n.s, sw)!;
      const g = r.state.got[p.target]!, onBoard = r.state.board.filter((k) => k === p.target).length;
      const line = [...n.line, sw];
      if (g > best.got) best = { ...best, got: g, line };
      if (g >= goal && line.length < best.reached) best = { ...best, reached: line.length };
      next.push({ s: r.state, line, score: g * 10 + onBoard + (swapsOf(r.state.board).length ? 0 : -1000) });
    }
    next.sort((x, y) => y.score - x.score);
    const seen = new Set<string>(); beam = [];
    for (const n of next) { const k = n.s.board.join(''); if (seen.has(k)) continue; seen.add(k); beam.push(n); if (beam.length >= width) break; }
  }
  return best;
}

/** A simple player: every swap picks as many target berries as it can right now. The goal is set from this. */
export function greedy(p: BerryPuzzle, goal = Infinity): { got: number; line: Swap[]; reached: number } {
  let s = startState(p), reached = Infinity; const line: Swap[] = [];
  for (let k = 0; k < p.swaps; k++) {
    let pick: Played | null = null, sw: Swap | null = null;
    for (const m of swapsOf(s.board)) { const r = play(p, s, m)!; if (!pick || r.picked[p.target]! > pick.picked[p.target]!) { pick = r; sw = m; } }
    if (!pick || !sw) break;
    s = pick.state; line.push(sw);
    if (s.got[p.target]! >= goal && reached === Infinity) reached = line.length;
  }
  return { got: s.got[p.target]!, line, reached };
}

export function generate(seed: string): BerryPuzzle {
  const rng = rngFrom('berry:' + seed), roll = (): number => Math.floor(rng() * KINDS);
  for (let a = 0; a < 50; a++) {
    // A starting board with no lines yet and at least a few swaps to choose from.
    const board: number[] = [];
    for (let i = 0; i < N * N; i++) {
      let k = roll(), guard = 0;
      const r = Math.floor(i / N), c = i % N;
      while (guard++ < 20 && ((c >= 2 && board[i - 1] === k && board[i - 2] === k) || (r >= 2 && board[i - N] === k && board[i - 2 * N] === k))) k = roll();
      board.push(k);
    }
    if (matchesOf(board).size || swapsOf(board).length < 4) continue;
    const queues = range(N).map(() => range(QLEN).map(roll));
    const target = Math.floor(rng() * KINDS), swaps = 15;
    const p: BerryPuzzle = { seed, board, queues, target, goal: 0, swaps, best: swaps };
    const g = greedy(p);
    if (g.got < 16) continue;
    p.goal = Math.floor(g.got * 0.85);
    p.best = greedy(p, p.goal).reached;
    return p;
  }
  throw new Error('berry-match: generation failed for ' + seed);
}

const art = (k: number): string => `<svg viewBox="0 0 40 40" aria-hidden="true">${BERRIES[k]!.svg}</svg>`;

const def: GameDef<BerryPuzzle> = {
  id: 'berry-match', generate,
  mount(root, p, ctx) {
    let s = startState(p), used = 0, hints = 0, done = false, out = false, sel = -1, glow: Swap | null = null, fresh = new Set<number>();
    let msg: string | null = null, kind = '';
    const hist: { s: BerryState; used: number }[] = [];
    const t = clock(ctx);
    const tgt = BERRIES[p.target]!;
    const render = (): void => {
      const left = p.swaps - used, got = Math.min(s.got[p.target]!, p.goal);
      const cells = s.board.map((k, i) => {
        const cls = ['bcell', `k${k}`, sel === i ? 'sel' : '', glow && glow.includes(i) ? 'hint' : '', fresh.has(i) ? 'fresh' : '', k === p.target ? 'tgt' : ''].filter(Boolean).join(' ');
        return `<button type="button" class="${cls}" data-g="pick:${i}" aria-pressed="${sel === i}" aria-label="${cellLabel(N, i)}: ${BERRIES[k]!.name}">${art(k)}</button>`;
      }).join('');
      const text = done ? `Basket full: ${p.goal} ${tgt.plural} with ${left} swap${left === 1 ? '' : 's'} to spare!`
        : out ? `Out of swaps: ${got} of ${p.goal} ${tgt.plural}. Undo or Restart to try another way.`
        : msg ?? (sel >= 0 ? 'Now tap a berry next to it to swap them.' : `Swap two neighbouring berries to make a line of three. Pick ${p.goal} ${tgt.plural}.`);
      root.innerHTML = `${pills(`<span class="bgoal">${art(p.target)}${got} of ${p.goal}</span>`, `Swaps left: ${left}`)}${coach(text, done ? 'good' : out ? 'bad' : kind)}<div class="boardwrap berries" style="--bmax:480px"><div class="board bgrid" role="group" aria-label="Berry board, ${N} by ${N}">${cells}</div></div>${tools(btn('undo', 'Undo', 'btn-w', done || !hist.length), btn('restart', 'Restart', 'btn-w', done || !used), btn('hint', 'Hint', 'btn-y', done || out))}`;
    };
    const doSwap = (a: number, c: number): void => {
      const r = play(p, s, [a, c]);
      if (!r) { msg = adjacent(a, c) ? 'That swap makes no line of three.' : 'Pick a berry right next to the first one.'; kind = 'bad'; return; }
      hist.push({ s, used }); s = r.state; used++; fresh = r.fresh;
      const n = r.picked[p.target]!;
      msg = n ? `+${n} ${n === 1 ? tgt.name : tgt.plural}${r.waves > 1 ? `, a ${r.waves}-step cascade` : ''}!` : r.waves > 1 ? `A ${r.waves}-step cascade, but no ${tgt.plural}.` : `No ${tgt.plural} that time.`;
      kind = n ? 'good' : '';
      if (s.got[p.target]! >= p.goal) {
        done = true; const time = t.stop(); render();
        ctx.onSolved({ time, hints, moves: used, stars: !hints && used <= p.best ? 3 : hints <= 1 ? 2 : 1 });
        return;
      }
      if (used >= p.swaps) out = true;
      else if (!swapsOf(s.board).length) { out = true; msg = 'No swaps left on the board.'; }
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = ''; glow = null; fresh = new Set();
      if (act === 'pick') {
        if (out) return;
        const i = Number(arg);
        if (sel < 0) sel = i;
        else if (sel === i) sel = -1;
        else if (adjacent(sel, i)) { const a = sel; sel = -1; doSwap(a, i); }
        else sel = i;
      } else if (act === 'undo') { const h = hist.pop(); if (h) { s = h.s; used = h.used; out = false; } sel = -1; }
      else if (act === 'restart') { s = startState(p); used = 0; hist.length = 0; out = false; sel = -1; }
      else if (act === 'hint') {
        const r = search(p, s, Math.min(4, p.swaps - used), 6);
        const first = r.line[0] ?? swapsOf(s.board)[0];
        if (first) { glow = first; hints++; sel = -1; msg = 'Hint: swap the two glowing berries.'; } else msg = 'No swaps left: try Undo or Restart.';
      }
      render();
    });
    // Swipe from one berry towards a neighbour to swap them.
    let down: { i: number; x: number; y: number } | null = null;
    const pd = (e: PointerEvent): void => { const el = (e.target as HTMLElement).closest<HTMLElement>('.bcell'); if (el && !done && !out) down = { i: Number(el.dataset['g']!.split(':')[1]), x: e.clientX, y: e.clientY }; };
    const pu = (e: PointerEvent): void => {
      if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y, from = down.i; down = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      const to = Math.abs(dx) > Math.abs(dy) ? (dx > 0 && from % N < N - 1 ? from + 1 : dx < 0 && from % N > 0 ? from - 1 : -1) : dy > 0 ? from + N : from - N;
      if (to < 0 || to >= N * N) return;
      swallow = true; window.setTimeout(() => { swallow = false; }, 0);
      msg = null; kind = ''; glow = null; sel = -1; doSwap(from, to); render();
    };
    let swallow = false;
    const eat = (e: Event): void => { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } };
    root.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); root.addEventListener('click', eat, true);
    render();
    return { destroy: () => { off(); t.kill(); root.removeEventListener('pointerdown', pd); window.removeEventListener('pointerup', pu); root.removeEventListener('click', eat, true); } };
  },
};
export default def;
