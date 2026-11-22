// Shared helpers for every game in the pack: seeded randomness, grid maths, a timer,
// small UI builders and a generic counting-puzzle solver (used by Owl Watch, Acorn Stash, Beehive).
import { rngFrom } from '@wild-daily/game-fresh-snow/engine';
import { escapeHtml } from '@wild-daily/ui';

export { rngFrom, escapeHtml };
export type Rng = () => number;
export const range = (n: number): number[] => [...Array(n).keys()];
export function shuffle<T>(rng: Rng, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i] as T; a[i] = a[j] as T; a[j] = t; }
  return a;
}
export const pick = <T>(rng: Rng, a: readonly T[]): T => a[Math.floor(rng() * a.length)] as T;
export const randInt = (rng: Rng, lo: number, hi: number): number => lo + Math.floor(rng() * (hi - lo + 1));
export const rowOf = (n: number, i: number): number => Math.floor(i / n);
export const colOf = (n: number, i: number): number => i % n;
export function nb4(n: number, i: number): number[] {
  const r = rowOf(n, i), c = colOf(n, i), o: number[] = [];
  if (r > 0) o.push(i - n); if (r < n - 1) o.push(i + n); if (c > 0) o.push(i - 1); if (c < n - 1) o.push(i + 1);
  return o;
}
export function nb8(n: number, i: number): number[] {
  const r = rowOf(n, i), c = colOf(n, i), o: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && cc >= 0 && rr < n && cc < n) o.push(rr * n + cc);
  }
  return o;
}
/** Hex neighbours on an "odd rows shifted right" layout. */
export function nbHex(n: number, i: number): number[] {
  const r = rowOf(n, i), c = colOf(n, i), odd = r % 2 === 1, o: number[] = [];
  const d = odd ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
  for (const [dr, dc] of d) { const rr = r + dr!, cc = c + dc!; if (rr >= 0 && cc >= 0 && rr < n && cc < n) o.push(rr * n + cc); }
  return o;
}
export const cellLabel = (n: number, i: number): string => `Row ${rowOf(n, i) + 1}, column ${colOf(n, i) + 1}`;

// ---------- game contract ----------
export interface Solved { time: number; hints: number; moves?: number; stars?: number }
export interface Ctx { timerEl?: HTMLElement | null; onSolved: (s: Solved) => void }
export interface Mounted { destroy(): void }
export interface GameDef<P> { id: string; generate: (seed: string) => P; mount: (root: HTMLElement, p: P, ctx: Ctx) => Mounted }

/** Running timer shown in ctx.timerEl. */
export function clock(ctx: Ctx): { stop(): number; kill(): void; secs(): number } {
  const t0 = Date.now();
  let final = -1;
  const secs = (): number => (final >= 0 ? final : Math.round((Date.now() - t0) / 1000));
  const tick = (): void => { if (ctx.timerEl) { const s = secs(); ctx.timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; } };
  const iv = setInterval(tick, 1000);
  tick();
  return { stop: () => { final = secs(); tick(); clearInterval(iv); return final; }, kill: () => clearInterval(iv), secs };
}
/** Delegated clicks on [data-g="action:arg"]. */
export function onAct(root: HTMLElement, fn: (act: string, arg: string, el: HTMLElement) => void): () => void {
  const h = (e: Event): void => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-g]');
    if (!t || !root.contains(t) || t.hasAttribute('disabled')) return;
    const v = t.getAttribute('data-g') ?? '';
    const k = v.indexOf(':');
    fn(k < 0 ? v : v.slice(0, k), k < 0 ? '' : v.slice(k + 1), t);
  };
  root.addEventListener('click', h);
  return () => root.removeEventListener('click', h);
}
export const coach = (msg: string, kind = ''): string => `<p class="coach ${kind}" role="status">${escapeHtml(msg)}</p>`;
export const btn = (act: string, label: string, cls = 'btn-w', disabled = false): string =>
  `<button type="button" class="btn ${cls}" data-g="${act}"${disabled ? ' disabled' : ''}>${label}</button>`;
export const tools = (...b: string[]): string => `<div class="tools" style="grid-template-columns:repeat(${b.length},minmax(0,1fr))">${b.join('')}</div>`;
export const grid = (n: number, cells: string, label: string, max = 80, wrap = 'boardwrap'): string =>
  `<div class="${wrap}"><div class="board" role="grid" aria-label="${label}" style="grid-template-columns:repeat(${n},1fr); max-width:${n * max}px">${cells}</div></div>`;
export const pills = (...p: string[]): string => `<div class="row" style="justify-content:space-between">${p.map((x) => `<span class="pill p-w">${x}</span>`).join('')}</div>`;

/** Light scrambling for guess games whose answer must live in the browser (like any word-guess game). */
export function scramble(seed: string, value: string): string {
  const r = rngFrom('scr:' + seed);
  return [...value].map((ch) => (ch.charCodeAt(0) ^ Math.floor(r() * 64)).toString(36).padStart(2, '0')).join('');
}
export function unscramble(seed: string, code: string): string {
  const r = rngFrom('scr:' + seed);
  let out = '';
  for (let k = 0; k < code.length; k += 2) out += String.fromCharCode(parseInt(code.slice(k, k + 2), 36) ^ Math.floor(r() * 64));
  return out;
}

// ---------- generic counting puzzle ----------
export interface CountPuzzle {
  n: number;
  /** Cells that hold clues (never items). */
  blocked: number[];
  /** For each clue: the cells it counts, and how many items are among them. */
  sets: number[][];
  clues: number[];
  /** Total number of items to place. */
  total: number;
  /** Items may not touch (8-way, or 6-way on hex boards). */
  noTouch: boolean;
  hex?: boolean;
}
/** All placements that satisfy every clue, stopping at `limit`. */
export function solveCount(p: CountPuzzle, limit = 2): number[][] {
  const N = p.n * p.n, blocked = new Set(p.blocked);
  const nbr = (i: number): number[] => (p.hex ? nbHex(p.n, i) : nb8(p.n, i));
  const watch: number[][] = Array.from({ length: N }, () => []);
  p.sets.forEach((s, k) => s.forEach((c) => watch[c]!.push(k)));
  const cells = range(N).filter((i) => !blocked.has(i));
  const state = new Int8Array(N).fill(-1), seen = new Int16Array(p.sets.length), open = new Int16Array(p.sets.length);
  p.sets.forEach((s, k) => { open[k] = s.filter((c) => !blocked.has(c)).length; });
  let placed = 0, und = cells.length;
  const out: number[][] = [];
  const ok = (): boolean => {
    for (let k = 0; k < p.sets.length; k++) { const need = p.clues[k]!; if (seen[k]! > need || seen[k]! + open[k]! < need) return false; }
    return placed <= p.total && placed + und >= p.total;
  };
  const set = (i: number, v: 0 | 1): void => { state[i] = v; und--; if (v) placed++; for (const k of watch[i]!) { open[k]!--; if (v) seen[k]!++; } };
  const unset = (i: number): void => { const v = state[i]; state[i] = -1; und++; if (v === 1) placed--; for (const k of watch[i]!) { open[k]!++; if (v === 1) seen[k]!--; } };
  const rec = (x: number): void => {
    if (out.length >= limit) return;
    if (x === cells.length) { if (placed === p.total) out.push(cells.filter((i) => state[i] === 1)); return; }
    const i = cells[x]!;
    if (!p.noTouch || nbr(i).every((j) => state[j] !== 1)) { set(i, 1); if (ok()) rec(x + 1); unset(i); }
    set(i, 0); if (ok()) rec(x + 1); unset(i);
  };
  rec(0);
  return out;
}
/** Rule check for counting puzzles: returns per-clue state and whether the board is solved. */
export function checkCount(p: CountPuzzle, items: ReadonlySet<number>): { solved: boolean; clueState: ('ok' | 'under' | 'over')[]; touching: number[] } {
  const nbr = (i: number): number[] => (p.hex ? nbHex(p.n, i) : nb8(p.n, i));
  const clueState = p.sets.map((s, k) => { const c = s.filter((x) => items.has(x)).length, need = p.clues[k]!; return c === need ? 'ok' : c > need ? 'over' : 'under'; }) as ('ok' | 'under' | 'over')[];
  const touching = p.noTouch ? [...items].filter((i) => nbr(i).some((j) => items.has(j))) : [];
  return { solved: items.size === p.total && touching.length === 0 && clueState.every((s) => s === 'ok'), clueState, touching };
}
