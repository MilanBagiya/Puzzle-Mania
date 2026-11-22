// Leaf Pile: tapping a leaf flips it and the leaves above, below, left and right (green <-> gold).
// Turn the whole pile gold. Every pile can be solved; fewest taps earns three paws.
import { svgUse } from '@wild-daily/ui';
import { btn, clock, coach, nb4, onAct, pills, range, rngFrom, tools, type GameDef } from '../shared.js';

export interface LeafPuzzle { seed: string; n: number; green: number[]; best: number }
/** Minimum set of taps that turns every leaf gold (Gaussian elimination over GF(2), checking all free choices). */
export function solveLeaves(n: number, green: ReadonlySet<number>): number[] | null {
  const N = n * n, rows = range(N).map((i) => { const r = new Uint8Array(N + 1); [i, ...nb4(n, i)].forEach((j) => { r[j] = 1; }); r[N] = green.has(i) ? 1 : 0; return r; });
  const where = Array<number>(N).fill(-1); let row = 0;
  for (let col = 0; col < N && row < N; col++) {
    let sel = -1; for (let r = row; r < N; r++) if (rows[r]![col]) { sel = r; break; }
    if (sel < 0) continue;
    [rows[row], rows[sel]] = [rows[sel]!, rows[row]!];
    for (let r = 0; r < N; r++) if (r !== row && rows[r]![col]) for (let c = col; c <= N; c++) rows[r]![c]! ^= rows[row]![c]!;
    where[col] = row; row++;
  }
  for (let r = row; r < N; r++) if (rows[r]![N]) return null;
  const free = range(N).filter((c) => where[c] === -1);
  let best: number[] | null = null;
  for (let mask = 0; mask < 1 << free.length; mask++) {
    const x = new Uint8Array(N); free.forEach((c, k) => { x[c] = (mask >> k) & 1; });
    for (let c = 0; c < N; c++) if (where[c]! >= 0) { const r = rows[where[c]!]!; let v = r[N]!; free.forEach((f) => { if (r[f]) v ^= x[f]!; }); x[c] = v; }
    const taps = range(N).filter((c) => x[c]);
    if (!best || taps.length < best.length) best = taps;
  }
  return best;
}
export function generate(seed: string): LeafPuzzle {
  const rng = rngFrom('leaf:' + seed), n = 5, green = new Set<number>();
  for (let a = 0; a < 200; a++) {
    green.clear();
    const presses = 5 + Math.floor(rng() * 5);
    for (let k = 0; k < presses; k++) { const i = Math.floor(rng() * n * n); [i, ...nb4(n, i)].forEach((j) => { if (green.has(j)) green.delete(j); else green.add(j); }); }
    const sol = solveLeaves(n, green);
    if (sol && sol.length >= 5) return { seed, n, green: [...green].sort((x, y) => x - y), best: sol.length };
  }
  throw new Error('leaf-pile: generation failed for ' + seed);
}
const def: GameDef<LeafPuzzle> = {
  id: 'leaf-pile', generate,
  mount(root, p, ctx) {
    const n = p.n; let green = new Set(p.green), taps = 0, hints = 0, done = false, glow = -1, msg: string | null = null;
    const t = clock(ctx);
    const render = (): void => {
      const cells = range(n * n).map((i) => `<button type="button" class="gcell leafy${green.has(i) ? '' : ' gold'}${glow === i ? ' hinted' : ''}" data-g="tap:${i}" aria-label="Leaf ${i + 1}: ${green.has(i) ? 'green' : 'gold'}">${svgUse('n-leaf', '0 0 24 24')}</button>`).join('');
      root.innerHTML = `${pills(`Green leaves: ${green.size}`, `Taps: ${taps} (best ${p.best})`)}${coach(done ? `The pile is all gold in ${taps} taps!` : msg ?? 'Tap a leaf to flip it and its four neighbours. Turn every leaf gold.', done ? 'good' : '')}<div class="boardwrap"><div class="board" role="grid" aria-label="Leaf pile" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 76}px">${cells}</div></div>${tools(btn('restart', 'Restart', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; glow = -1;
      if (act === 'tap') {
        const i = Number(arg); [i, ...nb4(n, i)].forEach((j) => { if (green.has(j)) green.delete(j); else green.add(j); }); taps++;
        if (!green.size) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints, moves: taps, stars: !hints && taps <= p.best ? 3 : taps <= p.best + 4 ? 2 : 1 }); return; }
      } else if (act === 'restart') { green = new Set(p.green); taps = 0; }
      else if (act === 'hint') { const s = solveLeaves(n, green); if (s && s[0] !== undefined) { glow = s[0]; hints++; msg = `Hint: tap the glowing leaf. ${s.length} taps to go.`; } }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
