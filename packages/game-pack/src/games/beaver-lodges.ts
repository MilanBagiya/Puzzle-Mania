// Beaver Lodges: split the river into rectangles. Each rectangle holds exactly one lodge, and the lodge's number
// is the rectangle's size. Tap two opposite corners to build a dam rectangle; tap inside one to remove it. One answer.
import { btn, cellLabel, clock, coach, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export interface LodgePuzzle { n: number; seed: string; clues: { cell: number; size: number }[] }
type Rect = [number, number, number, number]; // r0, c0, r1, c1 (inclusive)
const cellsOf = (n: number, [r0, c0, r1, c1]: Rect): number[] => { const o: number[] = []; for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) o.push(r * n + c); return o; };
function rectsFor(p: LodgePuzzle, k: number): Rect[] {
  const { n } = p, { cell, size } = p.clues[k]!, R = Math.floor(cell / n), C = cell % n, out: Rect[] = [];
  const others = new Set(p.clues.filter((_, j) => j !== k).map((x) => x.cell));
  for (let h = 1; h <= size; h++) {
    if (size % h) continue;
    const w = size / h;
    for (let r0 = R - h + 1; r0 <= R; r0++) for (let c0 = C - w + 1; c0 <= C; c0++) {
      const rect: Rect = [r0, c0, r0 + h - 1, c0 + w - 1];
      if (r0 < 0 || c0 < 0 || rect[2] >= n || rect[3] >= n) continue;
      if (cellsOf(n, rect).some((x) => others.has(x))) continue;
      out.push(rect);
    }
  }
  return out;
}
export function solveLodges(p: LodgePuzzle, limit = 2): Rect[][] {
  const { n } = p, opts = p.clues.map((_, k) => rectsFor(p, k)), used = new Uint8Array(n * n), pick: Rect[] = [], out: Rect[][] = [];
  const order = range(p.clues.length).sort((a, b) => opts[a]!.length - opts[b]!.length);
  const rec = (x: number): void => {
    if (out.length >= limit) return;
    if (x === order.length) { if (used.every((u) => u === 1)) out.push(pick.slice()); return; }
    for (const r of opts[order[x]!]!) {
      const cs = cellsOf(n, r);
      if (cs.some((c) => used[c])) continue;
      cs.forEach((c) => { used[c] = 1; }); pick.push(r); rec(x + 1); pick.pop(); cs.forEach((c) => { used[c] = 0; });
    }
  };
  rec(0);
  return out;
}
export function generate(seed: string): LodgePuzzle {
  const rng = rngFrom('lodge:' + seed), n = 6;
  for (let a = 0; a < 3000; a++) {
    const owner = Array<number>(n * n).fill(-1), clues: { cell: number; size: number }[] = [];
    let ok = true;
    for (let i = 0; i < n * n && ok; i++) {
      if (owner[i]! >= 0) continue;
      const r = Math.floor(i / n), c = i % n, choices: Rect[] = [];
      for (let h = 1; h <= 4; h++) for (let w = 1; w <= 4; w++) {
        if (h * w < 2 || h * w > 8) continue;
        const rect: Rect = [r, c, r + h - 1, c + w - 1];
        if (rect[2] >= n || rect[3] >= n) continue;
        if (cellsOf(n, rect).some((x) => owner[x]! >= 0)) continue;
        choices.push(rect);
      }
      if (!choices.length) { ok = false; break; }
      const rect = choices[Math.floor(rng() * choices.length)]!, cs = cellsOf(n, rect);
      cs.forEach((x) => { owner[x] = clues.length; });
      clues.push({ cell: shuffle(rng, cs.slice())[0]!, size: cs.length });
    }
    if (!ok) continue;
    const p = { n, seed, clues };
    if (solveLodges(p, 2).length === 1) return p;
  }
  throw new Error('beaver-lodges: generation failed for ' + seed);
}
const TINTS = ['#CDEBC0', '#FFE0B8', '#BFE3F5', '#E5D4F5', '#FFF1B0', '#FFD3D3', '#C9EDE6', '#E8DCC8'];
const def: GameDef<LodgePuzzle> = {
  id: 'beaver-lodges', generate,
  mount(root, p, ctx) {
    const n = p.n, clueAt = new Map(p.clues.map((c) => [c.cell, c.size]));
    let rects: Rect[] = [], first: number | null = null, hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const ownerOf = (): number[] => { const o = Array<number>(n * n).fill(-1); rects.forEach((r, k) => cellsOf(n, r).forEach((c) => { o[c] = k; })); return o; };
    const valid = (r: Rect): boolean => { const cs = cellsOf(n, r), cl = cs.filter((c) => clueAt.has(c)); return cl.length === 1 && clueAt.get(cl[0]!) === cs.length; };
    const render = (): void => {
      const o = ownerOf();
      const cells = range(n * n).map((i) => {
        const k = o[i]!, r = k >= 0 ? rects[k]! : null, v = clueAt.get(i);
        const bg = r ? (valid(r) ? TINTS[k % TINTS.length] : 'var(--wrong)') : '#DCEFF8';
        const edges = r ? `border-top:${Math.floor(i / n) === r[0] ? 3 : 0}px solid #8A5A3B; border-bottom:${Math.floor(i / n) === r[2] ? 3 : 0}px solid #8A5A3B; border-left:${i % n === r[1] ? 3 : 0}px solid #8A5A3B; border-right:${i % n === r[3] ? 3 : 0}px solid #8A5A3B;` : '';
        return `<button type="button" class="gcell lodge${first === i ? ' hinted' : ''}" style="background:${bg}; ${edges}" data-g="cell:${i}" aria-label="${cellLabel(n, i)}${v ? `: lodge ${v}` : ''}${r ? ', inside a dam' : ''}">${v ? `<span class="lodgenum">${v}</span>` : ''}</button>`;
      }).join('');
      const covered = o.filter((x) => x >= 0).length;
      const text = done ? 'Every lodge has its own pool!' : msg ?? (first !== null ? 'Now tap the opposite corner of the rectangle.' : 'Tap one corner, then the opposite corner, to build a rectangle. Each must hold one lodge, sized by its number.');
      root.innerHTML = `${pills(`Covered: ${covered} of ${n * n}`, `${p.clues.length} lodges`)}${coach(text, done ? 'good' : kind)}<div class="boardwrap"><div class="board" role="grid" aria-label="River" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 72}px; gap:2px">${cells}</div></div>${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'cell') {
        const i = Number(arg), o = ownerOf();
        if (first === null && o[i]! >= 0) { rects.splice(o[i]!, 1); render(); return; }
        if (first === null) { first = i; render(); return; }
        const r: Rect = [Math.min(Math.floor(first / n), Math.floor(i / n)), Math.min(first % n, i % n), Math.max(Math.floor(first / n), Math.floor(i / n)), Math.max(first % n, i % n)];
        first = null;
        const cs = cellsOf(n, r);
        if (cs.some((c) => o[c]! >= 0)) { msg = 'That overlaps another dam. Tap inside a dam to remove it first.'; kind = 'bad'; }
        else rects.push(r);
      } else if (act === 'clear') { rects = []; first = null; }
      else if (act === 'hint') {
        first = null; // a half-tapped corner would otherwise pair with the next tap
        const sol = solveLodges(p, 1)[0] ?? [];
        rects = rects.filter((r) => sol.some((s) => s.join() === r.join()));
        const add = sol.find((s) => !rects.some((r) => r.join() === s.join()));
        if (add) { rects.push(add); hints++; msg = 'Hint: one correct dam added (wrong ones removed).'; }
      } else if (act === 'check') {
        const o = ownerOf();
        if (o.every((x) => x >= 0) && rects.every(valid)) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
        msg = o.some((x) => x < 0) ? 'Some water isn’t inside a dam yet.' : 'Red dams don’t match their lodge number.'; kind = 'bad';
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
