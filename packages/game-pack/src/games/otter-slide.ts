// Otter Slide: rotate river tiles so water from the spring reaches every pool, with no open ends.
import { svgUse } from '@wild-daily/ui';
import { btn, clock, coach, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

// bit 1 = up, 2 = right, 4 = down, 8 = left
export interface OtterPuzzle { n: number; seed: string; source: number; tiles: number[] }
const rot = (m: number, k: number): number => { let x = m; for (let i = 0; i < k; i++) x = ((x << 1) | (x >> 3)) & 15; return x; };
const DIRS = [[1, -1, 0, 4], [2, 0, 1, 8], [4, 1, 0, 1], [8, 0, -1, 2]] as const; // bit, dr, dc, opposite
export function generate(seed: string): OtterPuzzle {
  const rng = rngFrom('otter:' + seed), n = 5, N = n * n, mask = Array<number>(N).fill(0);
  const source = Math.floor(rng() * N), seen = new Set([source]), stack = [source];
  while (stack.length) {
    const i = stack[stack.length - 1]!, r = Math.floor(i / n), c = i % n;
    const opts = shuffle(rng, DIRS.filter(([, dr, dc]) => { const rr = r + dr, cc = c + dc; return rr >= 0 && cc >= 0 && rr < n && cc < n && !seen.has(rr * n + cc); }).slice());
    if (!opts.length) { stack.pop(); continue; }
    const [bit, dr, dc, opp] = opts[0]!, j = (r + dr) * n + c + dc;
    mask[i]! |= bit; mask[j]! |= opp; seen.add(j); stack.push(j);
  }
  const tiles = mask.map((m) => rot(m, Math.floor(rng() * 4)));
  return { n, seed, source, tiles };
}
/** Which tiles are connected to the spring, and whether every tile is connected with no open ends. */
export function flow(p: OtterPuzzle, tiles: number[]): { wet: Set<number>; solved: boolean } {
  const { n } = p, wet = new Set([p.source]), q = [p.source];
  let open = false;
  while (q.length) {
    const i = q.shift()!, r = Math.floor(i / n), c = i % n;
    for (const [bit, dr, dc, opp] of DIRS) {
      if (!(tiles[i]! & bit)) continue;
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) { open = true; continue; }
      const j = rr * n + cc;
      if (!(tiles[j]! & opp)) { open = true; continue; }
      if (!wet.has(j)) { wet.add(j); q.push(j); }
    }
  }
  return { wet, solved: !open && wet.size === n * n };
}
/** Find rotations that connect everything (for hints). */
export function solveOtter(p: OtterPuzzle): number[] | null {
  const { n } = p, N = n * n, cur = p.tiles.slice();
  const rec = (i: number): boolean => {
    if (i === N) return flow(p, cur).solved;
    const r = Math.floor(i / n), c = i % n, seen = new Set<number>();
    for (let k = 0; k < 4; k++) {
      const m = rot(p.tiles[i]!, k);
      if (seen.has(m)) continue; seen.add(m);
      if (r === 0 && m & 1) continue; if (c === 0 && m & 8) continue; if (r === n - 1 && m & 4) continue; if (c === n - 1 && m & 2) continue;
      if (r > 0 && !!(m & 1) !== !!(cur[i - n]! & 4)) continue;
      if (c > 0 && !!(m & 8) !== !!(cur[i - 1]! & 2)) continue;
      cur[i] = m;
      if (rec(i + 1)) return true;
    }
    cur[i] = p.tiles[i]!;
    return false;
  };
  return rec(0) ? cur : null;
}
function pipe(m: number, wet: boolean): string {
  const col = wet ? '#3F9FE0' : '#B9A68A', segs: string[] = [];
  if (m & 1) segs.push('M50 50 V0'); if (m & 2) segs.push('M50 50 H100'); if (m & 4) segs.push('M50 50 V100'); if (m & 8) segs.push('M50 50 H0');
  return `<svg viewBox="0 0 100 100" aria-hidden="true" style="width:100%; height:100%"><path d="${segs.join(' ')}" stroke="${col}" stroke-width="26" stroke-linecap="round" fill="none"></path><circle cx="50" cy="50" r="14" fill="${col}"></circle></svg>`;
}
const def: GameDef<OtterPuzzle> = {
  id: 'otter-slide', generate,
  mount(root, p, ctx) {
    const n = p.n, tiles = p.tiles.slice();
    let hints = 0, moves = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const render = (): void => {
      const { wet } = flow(p, tiles);
      const ends = new Set(tiles.map((m, i) => ([1, 2, 4, 8].filter((b) => m & b).length === 1 ? i : -1)).filter((i) => i >= 0 && i !== p.source));
      const cells = range(n * n).map((i) => `<button type="button" class="gcell river" data-g="cell:${i}" aria-label="Tile ${i + 1}${i === p.source ? ', spring' : ''}${wet.has(i) ? ', water flowing' : ''}">${pipe(tiles[i]!, wet.has(i))}${i === p.source ? `<span class="spring"></span>` : ''}${ends.has(i) && wet.has(i) ? `<span class="otter">${svgUse('n-otter', '0 0 40 30')}</span>` : ''}</button>`).join('');
      const text = done ? 'Water reaches every pool. The otters are sliding!' : msg ?? 'Tap a tile to turn it. Connect every tile to the spring (the dark circle) with no open ends.';
      root.innerHTML = `${pills(`Wet tiles: ${wet.size} of ${n * n}`, `Turns: ${moves}`)}${coach(text, done ? 'good' : kind, 'otter')}<div class="boardwrap"><div class="board" role="grid" aria-label="River" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 80}px; gap:3px">${cells}</div></div>${tools(btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
    };
    const finishIfDone = (): boolean => { if (flow(p, tiles).solved) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints, moves }); return true; } return false; };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'cell') { const i = Number(arg); tiles[i] = rot(tiles[i]!, 1); moves++; if (finishIfDone()) return; }
      else if (act === 'hint') {
        const sol = solveOtter({ ...p, tiles: p.tiles });
        const i = sol ? range(n * n).find((x) => tiles[x] !== sol[x]) : undefined;
        if (sol && i !== undefined) { tiles[i] = sol[i]!; hints++; msg = 'Hint: one tile turned into place.'; if (finishIfDone()) return; }
      } else if (act === 'check') { if (finishIfDone()) return; msg = 'Some water spills out or some tiles are still dry.'; kind = 'bad'; }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
