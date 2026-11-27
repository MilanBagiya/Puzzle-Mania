// Vine Links: join each pair of matching flowers with a vine. Vines run up, down, left and right, never cross,
// and together they must cover every square of the meadow. Every puzzle has exactly one solution (solver-checked).
import { svgUse } from '@wild-daily/ui';
import { btn, cellLabel, clock, coach, nb4, onAct, pills, range, rngFrom, tools, type GameDef } from '../shared.js';

/** Flower pairs: each has its own shape and vine colour. */
export const FLOWERS = [
  { name: 'daisy', color: '#2F8F5B', art: () => svgUse('n-daisy', '0 0 30 40') },
  { name: 'tulip', color: '#D9463B', art: () => svgUse('n-tulip', '0 0 24 40') },
  { name: 'mushroom', color: '#8A5A3B', art: () => svgUse('n-mush', '0 0 40 40') },
  { name: 'butterfly', color: '#E08A1E', art: () => svgUse('n-butterfly', '0 0 30 24') },
  { name: 'acorn', color: '#3F78C9', art: () => svgUse('n-acorn', '0 0 30 36') },
  { name: 'leaf', color: '#9A5BC9', art: () => svgUse('n-leaf', '0 0 24 24') },
] as const;
export interface VinePuzzle { seed: string; n: number; pairs: [number, number][] }

/**
 * Count solutions (up to `limit`) that join every pair and cover every square. Vines grow from the first
 * flower of each pair; the most constrained vine moves first; dead squares and cut-off vines are pruned.
 */
/**
 * One hint step: extend the first vine that is wrong or unfinished by one correct square (from the end the player
 * started at), cutting any other vine that crosses the squares it lays. Returns null when every vine is right.
 */
export function vineHint(sol: number[][], paths: number[][]): { paths: number[][]; vine: number } | null {
  for (let c = 0; c < sol.length; c++) {
    const s = sol[c]!, mine = paths[c] ?? [], fromA = mine[0] === s[0] ? s : mine[0] === s[s.length - 1] ? [...s].reverse() : s;
    let k = 0; while (k < mine.length && mine[k] === fromA[k]) k++;
    if (k === fromA.length && mine.length === fromA.length) continue;
    const laid = fromA.slice(0, Math.min(fromA.length, Math.max(k, 1) + 1));
    const next = paths.map((q, o) => { if (o === c) return laid; const cut = q.findIndex((i) => laid.includes(i)); return cut >= 0 ? q.slice(0, cut) : q; });
    return { paths: next, vine: c };
  }
  return null;
}
export function solveVines(p: VinePuzzle, limit = 2): number[][][] {
  const { n, pairs } = p, N = n * n, K = pairs.length;
  const grid = new Int8Array(N).fill(-1), head = pairs.map(([a]) => a), done = new Array<boolean>(K).fill(false);
  const target = pairs.map(([, b]) => b), path: number[][] = pairs.map(([a]) => [a]);
  pairs.forEach(([a, b], c) => { grid[a] = c; grid[b] = c; });
  let empty = N - 2 * K;
  const out: number[][][] = [];
  const options = (c: number): number[] => nb4(n, head[c]!).filter((j) => grid[j] === -1 || j === target[c]);
  const deadSquare = (): boolean => {
    for (let i = 0; i < N; i++) {
      if (grid[i] !== -1) continue;
      let ways = 0;
      for (const j of nb4(n, i)) { const g = grid[j]!; if (g === -1 || (!done[g] && (j === head[g] || j === target[g]))) ways++; }
      if (ways < 2) return true;
    }
    return false;
  };
  const cutOff = (): boolean => {
    for (let c = 0; c < K; c++) {
      if (done[c]) continue;
      const seen = new Uint8Array(N), stack = [head[c]!]; seen[head[c]!] = 1; let ok = false;
      while (stack.length && !ok) { const i = stack.pop()!; for (const j of nb4(n, i)) { if (j === target[c]) { ok = true; break; } if (!seen[j] && grid[j] === -1) { seen[j] = 1; stack.push(j); } } }
      if (!ok) return true;
    }
    return false;
  };
  const dfs = (): void => {
    if (out.length >= limit) return;
    let best = -1, bestOpts: number[] = [];
    for (let c = 0; c < K; c++) { if (done[c]) continue; const o = options(c); if (best < 0 || o.length < bestOpts.length) { best = c; bestOpts = o; } if (!o.length) return; }
    if (best < 0) { if (empty === 0) out.push(path.map((x) => [...x])); return; }
    const c = best;
    for (const j of bestOpts) {
      if (j === target[c]) { done[c] = true; path[c]!.push(j); if (!deadSquare() && !cutOff()) dfs(); path[c]!.pop(); done[c] = false; }
      else {
        const prev = head[c]!; grid[j] = c; head[c] = j; path[c]!.push(j); empty--;
        if (!deadSquare() && !cutOff()) dfs();
        empty++; path[c]!.pop(); head[c] = prev; grid[j] = -1;
      }
      if (out.length >= limit) return;
    }
  };
  if (!deadSquare() && !cutOff()) dfs();
  return out;
}

/** A random path through every square (serpentine start, shuffled with "backbite" moves). */
function randomCover(n: number, rng: () => number): number[] {
  let path: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
  for (let step = 0; step < n * n * 40; step++) {
    if (rng() < 0.5) path.reverse();
    const end = path[path.length - 1]!, nbs = nb4(n, end).filter((j) => j !== path[path.length - 2]);
    const j = nbs[Math.floor(rng() * nbs.length)]; if (j === undefined) continue;
    const k = path.indexOf(j); // backbite: join end to j and reverse the tail after j
    path = [...path.slice(0, k + 1), ...path.slice(k + 1).reverse()];
  }
  return path;
}
export function generate(seed: string): VinePuzzle {
  const rng = rngFrom('vines:' + seed);
  for (let a = 0; a < 3000; a++) {
    const n = a % 3 === 2 ? 5 : 6, K = n === 5 ? 4 : 5 + Math.floor(rng() * 2);
    const cover = randomCover(n, rng);
    // Cut the cover into K vines of at least 3 squares each.
    const cuts = new Set<number>();
    while (cuts.size < K - 1) cuts.add(3 + Math.floor(rng() * (n * n - 6)));
    const marks = [0, ...[...cuts].sort((x, y) => x - y), n * n];
    if (marks.some((m, i) => i > 0 && m - marks[i - 1]! < 3)) continue;
    const pairs = range(K).map((i) => [cover[marks[i]!]!, cover[marks[i + 1]! - 1]!] as [number, number]);
    // A vine whose ends touch could be replaced by a shortcut, so it would not need its squares: skip those.
    if (pairs.some(([x, y]) => nb4(n, x).includes(y))) continue;
    const p: VinePuzzle = { seed, n, pairs };
    if (solveVines(p, 2).length === 1) return p;
  }
  throw new Error('vine-links: generation failed for ' + seed);
}

const def: GameDef<VinePuzzle> = {
  id: 'vine-links', generate,
  mount(root, p, ctx) {
    const { n, pairs } = p, N = n * n, K = pairs.length;
    const endOf = new Map<number, number>(); pairs.forEach(([a, b], c) => { endOf.set(a, c); endOf.set(b, c); });
    let paths: number[][] = pairs.map(() => []), sel = -1, hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const owner = (i: number): number => { for (let c = 0; c < K; c++) if (paths[c]!.includes(i)) return c; return -1; };
    const linked = (c: number): boolean => { const pa = paths[c]!, [a, b] = pairs[c]!; return pa.length > 1 && ((pa[0] === a && pa[pa.length - 1] === b) || (pa[0] === b && pa[pa.length - 1] === a)); };
    const covered = (): number => new Set(paths.flat()).size;
    /** Tap (or drag onto) square i. */
    const step = (i: number): void => {
      msg = null; kind = '';
      const e = endOf.get(i), own = owner(i);
      const pa = sel >= 0 ? paths[sel]! : null, headSq = pa && pa.length ? pa[pa.length - 1]! : -1;
      // Grow the selected vine into the next square (or its twin flower), cutting back any vine already there.
      if (pa && pa.length && !linked(sel) && nb4(n, headSq).includes(i) && own !== sel && (e === undefined || e === sel)) {
        if (own >= 0) paths[own] = paths[own]!.slice(0, paths[own]!.indexOf(i));
        pa.push(i); return;
      }
      if (e !== undefined) { paths[e] = [i]; sel = e; return; } // a flower: start that vine from here
      if (own >= 0) { sel = own; paths[own] = paths[own]!.slice(0, paths[own]!.indexOf(i) + 1); return; } // a vine: pick it up from here
      msg = pa && pa.length && !linked(sel) ? 'Vines grow one square at a time: up, down, left or right.' : 'Start at a flower: tap it, then tap the squares next to it.';
      kind = 'bad';
    };
    const check = (): void => {
      if (!pairs.every((_, c) => linked(c))) return;
      if (covered() < N) { msg = `Every pair is joined. Now make the vines cover all ${N} squares.`; kind = ''; return; }
      done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints, stars: hints === 0 ? 3 : hints <= 2 ? 2 : 1 });
    };
    const render = (): void => {
      const own = new Int8Array(N).fill(-1); paths.forEach((pa, c) => pa.forEach((i) => { own[i] = c; }));
      const cells = range(N).map((i) => {
        const e = endOf.get(i), o = own[i]!, f = e !== undefined ? FLOWERS[e]! : o >= 0 ? FLOWERS[o]! : null;
        const what = e !== undefined ? `${FLOWERS[e]!.name} flower${linked(e) ? ', joined' : ''}` : o >= 0 ? `${FLOWERS[o]!.name} vine` : 'empty';
        const isHead = sel >= 0 && paths[sel]!.length && paths[sel]![paths[sel]!.length - 1] === i;
        return `<button type="button" class="vcell${o >= 0 ? ' on' : ''}${isHead ? ' head' : ''}" data-g="sq:${i}" data-i="${i}" style="${f ? `--vc:${f.color}` : ''}" aria-label="${cellLabel(n, i)}: ${what}">${e !== undefined ? `<span class="vflower">${FLOWERS[e]!.art()}</span>` : ''}</button>`;
      }).join('');
      const lines = paths.map((pa, c) => pa.length > 1 ? `<polyline points="${pa.map((i) => `${(i % n) + 0.5},${Math.floor(i / n) + 0.5}`).join(' ')}" stroke="${FLOWERS[c]!.color}"></polyline>` : '').join('');
      const joined = pairs.filter((_, c) => linked(c)).length;
      const text = done ? 'The meadow is full of vines!' : msg ?? (sel >= 0 ? `Growing the ${FLOWERS[sel]!.name} vine: tap or drag to the next square.` : 'Tap a flower, then tap or drag square by square to its twin. Cover every square.');
      root.innerHTML = `${pills(`Joined: ${joined} of ${K}`, `Covered: ${covered()} of ${N}`)}${coach(text, done ? 'good' : kind)}<div class="boardwrap" style="--bmax:${n * 72}px"><div class="board vboard" role="grid" aria-label="Meadow, ${n} by ${n}" style="grid-template-columns:repeat(${n},1fr); max-width:var(--bcap)"><svg class="vlines" viewBox="0 0 ${n} ${n}" aria-hidden="true">${lines}</svg>${cells}</div></div>${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return;
      if (act === 'sq') { step(Number(arg)); check(); }
      else if (act === 'clear') { paths = pairs.map(() => []); sel = -1; msg = null; }
      else if (act === 'hint') {
        // Hints come from solving the visible puzzle: fix the first vine that is wrong or unfinished by one square.
        const sol = solveVines(p, 1)[0];
        const h = sol ? vineHint(sol, paths) : null;
        if (h) { paths = h.paths; sel = h.vine; hints++; msg = `Hint: the ${FLOWERS[h.vine]!.name} vine goes this way.`; kind = ''; check(); }
      }
      if (!done) render();
    });
    // Pointer: a press acts at once and dragging over squares grows the vine; the click the browser sends after a
    // press is then ignored (keyboard Enter/Space still arrives as a click and works as a tap).
    let dragging = false, lastSq = -1, swallow = false;
    const sqAt = (x: number, y: number): number => { const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.vcell'); return el && root.contains(el) ? Number(el.dataset.i) : -1; };
    const act = (i: number): void => { step(i); check(); if (!done) render(); };
    const down = (e: PointerEvent): void => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('.vcell'); if (done || !cell) return;
      dragging = true; swallow = true; lastSq = Number(cell.dataset.i); act(lastSq);
    };
    const move = (e: PointerEvent): void => {
      if (!dragging || done) return;
      const i = sqAt(e.clientX, e.clientY); if (i < 0 || i === lastSq) return;
      lastSq = i; act(i); e.preventDefault();
    };
    const up = (): void => { dragging = false; window.setTimeout(() => { swallow = false; }, 0); };
    const eat = (e: Event): void => { if (swallow && (e.target as HTMLElement).closest('.vcell')) { e.stopPropagation(); swallow = false; } };
    root.addEventListener('click', eat, true);
    root.addEventListener('pointerdown', down); window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up);
    render();
    return { destroy: () => { off(); t.kill(); root.removeEventListener('click', eat, true); root.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); } };
  },
};
export default def;
