// Firefly Night: place fireflies so every grass square is lit. Light shines in straight lines until a tree.
// Two fireflies may never light each other. A numbered tree touches exactly that many fireflies. One answer.
import { svgUse, tree } from '@wild-daily/ui';
import { btn, cellLabel, clock, coach, grid, nb4, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export interface FireflyPuzzle { n: number; seed: string; trees: number[]; numbers: (number | null)[] }
function segments(n: number, trees: ReadonlySet<number>): { segOf: number[][]; segs: number[][] } {
  const segs: number[][] = [], segOf: number[][] = Array.from({ length: n * n }, () => []);
  for (const horiz of [true, false]) for (let a = 0; a < n; a++) {
    let cur: number[] = [];
    for (let b = 0; b <= n; b++) {
      const i = horiz ? a * n + b : b * n + a;
      if (b === n || trees.has(i)) { if (cur.length) { cur.forEach((x) => segOf[x]!.push(segs.length)); segs.push(cur); } cur = []; }
      else cur.push(i);
    }
  }
  return { segOf, segs };
}
export function solveFireflies(p: FireflyPuzzle, limit = 2): number[][] {
  const N = p.n * p.n, trees = new Set(p.trees), { segOf, segs } = segments(p.n, trees);
  const cells = range(N).filter((i) => !trees.has(i));
  const state = new Int8Array(N).fill(-1), segCount = new Int8Array(segs.length);
  const numbered = p.trees.map((t, k) => ({ t, need: p.numbers[k], around: nb4(p.n, t).filter((x) => !trees.has(x)) })).filter((x) => x.need !== null && x.need !== undefined);
  const out: number[][] = [];
  const litPossible = (i: number): boolean => segOf[i]!.some((s) => segCount[s]! > 0 || segs[s]!.some((x) => state[x] === -1));
  const okNumbers = (): boolean => numbered.every(({ need, around }) => { const on = around.filter((x) => state[x] === 1).length, und = around.filter((x) => state[x] === -1).length; return on <= need! && on + und >= need!; });
  const rec = (k: number): void => {
    if (out.length >= limit) return;
    if (k === cells.length) { if (cells.every((i) => segOf[i]!.some((s) => segCount[s]! > 0))) out.push(cells.filter((i) => state[i] === 1)); return; }
    const i = cells[k]!;
    if (segOf[i]!.every((s) => segCount[s] === 0)) {
      state[i] = 1; segOf[i]!.forEach((s) => segCount[s]!++);
      if (okNumbers()) rec(k + 1);
      segOf[i]!.forEach((s) => segCount[s]!--); state[i] = -1;
    }
    state[i] = 0;
    if (okNumbers() && cells.slice(0, k + 1).every(litPossible)) rec(k + 1);
    state[i] = -1;
  };
  rec(0);
  return out;
}
export function generate(seed: string): FireflyPuzzle {
  const rng = rngFrom('firefly:' + seed), n = 7, N = n * n;
  for (let a = 0; a < 600; a++) {
    const trees = new Set(shuffle(rng, range(N)).slice(0, 10 + Math.floor(rng() * 4)));
    const { segOf } = segments(n, trees);
    const lit = new Set<number>(), flies = new Set<number>();
    for (const i of shuffle(rng, range(N).filter((x) => !trees.has(x)))) {
      if (lit.has(i)) continue;
      flies.add(i);
      segOf[i]!.forEach((s) => { const { segs } = segments(n, trees); segs[s]!.forEach((x) => lit.add(x)); });
    }
    const tl = [...trees].sort((x, y) => x - y);
    const numbers: (number | null)[] = tl.map((t) => nb4(n, t).filter((x) => flies.has(x)).length);
    const p: FireflyPuzzle = { n, seed, trees: tl, numbers };
    if (solveFireflies(p, 2).length !== 1) continue;
    for (const k of shuffle(rng, range(tl.length))) { const keep = numbers[k]!; numbers[k] = null; if (solveFireflies(p, 2).length !== 1) numbers[k] = keep; }
    return p;
  }
  throw new Error('firefly-night: generation failed for ' + seed);
}
export function checkFireflies(p: FireflyPuzzle, flies: ReadonlySet<number>): { solved: boolean; lit: Set<number>; clash: Set<number>; numState: ('ok' | 'over' | 'under' | '')[] } {
  const trees = new Set(p.trees), { segOf, segs } = segments(p.n, trees), lit = new Set<number>(), clash = new Set<number>();
  segs.forEach((s) => { const f = s.filter((x) => flies.has(x)); if (f.length) s.forEach((x) => lit.add(x)); if (f.length > 1) f.forEach((x) => clash.add(x)); });
  const numState = p.trees.map((t, k) => { const need = p.numbers[k]; if (need === null || need === undefined) return ''; const c = nb4(p.n, t).filter((x) => flies.has(x)).length; return c === need ? 'ok' : c > need ? 'over' : 'under'; }) as ('ok' | 'over' | 'under' | '')[];
  const all = range(p.n * p.n).filter((i) => !trees.has(i));
  void segOf;
  return { solved: clash.size === 0 && all.every((i) => lit.has(i)) && numState.every((x) => x === '' || x === 'ok'), lit, clash, numState };
}
const def: GameDef<FireflyPuzzle> = {
  id: 'firefly-night', generate,
  mount(root, p, ctx) {
    const n = p.n, trees = new Set(p.trees), marks = new Int8Array(n * n);
    let hints = 0, done = false, msg: string | null = null, kind = '', sol: number[] | null = null;
    const t = clock(ctx);
    const flies = (): Set<number> => new Set(range(n * n).filter((i) => marks[i] === 1));
    const render = (): void => {
      const chk = checkFireflies(p, flies());
      const dark = range(n * n).filter((i) => !trees.has(i) && !chk.lit.has(i)).length;
      const cells = range(n * n).map((i) => {
        if (trees.has(i)) { const k = p.trees.indexOf(i), v = p.numbers[k], st = chk.numState[k]; return `<div class="gcell clue dusk" role="gridcell" aria-label="${cellLabel(n, i)}: tree${v !== null && v !== undefined ? ` touching ${v} fireflies` : ''}">${tree()}${v !== null && v !== undefined ? `<span class="num ${st === 'ok' ? 'ok' : st === 'over' ? 'over' : ''}">${v}</span>` : ''}</div>`; }
        return `<button type="button" class="gcell dusk${chk.lit.has(i) ? ' lit' : ''}${chk.clash.has(i) ? ' bad' : ''}" data-g="cell:${i}" aria-label="${cellLabel(n, i)}: ${marks[i] === 1 ? 'firefly' : chk.lit.has(i) ? 'lit' : 'dark'}">${marks[i] === 1 ? svgUse('n-firefly', '0 0 20 20') : marks[i] === 2 ? '<span class="dot"></span>' : ''}</button>`;
      }).join('');
      const text = done ? 'The whole meadow is glowing!' : msg ?? (chk.clash.size ? 'Two fireflies can see each other. Each line of light may hold only one.' : 'Tap to place a firefly. Its light shines up, down, left and right until a tree. Light every square.');
      root.innerHTML = `${pills(`Dark squares: ${dark}`, `Fireflies: ${flies().size}`)}${coach(text, done ? 'good' : kind)}${grid(n, cells, 'Meadow at night', 70)}${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'cell') { const i = Number(arg); marks[i] = (marks[i]! + 1) % 3; }
      else if (act === 'clear') marks.fill(0);
      else if (act === 'hint') {
        sol ??= solveFireflies(p, 1)[0] ?? []; const s = new Set(sol);
        const i = range(n * n).find((x) => !trees.has(x) && (marks[x] === 1) !== s.has(x) && (marks[x] === 1 || s.has(x)));
        if (i !== undefined) { marks[i] = s.has(i) ? 1 : 2; hints++; msg = s.has(i) ? 'Hint: a firefly belongs on the new glowing square.' : 'Hint: that firefly doesn’t belong there.'; }
      } else if (act === 'check') {
        if (checkFireflies(p, flies()).solved) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
        msg = 'Not yet: some squares are dark, a number is off, or two fireflies see each other.'; kind = 'bad';
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
