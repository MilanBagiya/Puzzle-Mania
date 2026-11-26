// Frog Pond: one frog in every row, every column and every coloured patch. Frogs never touch. Exactly one answer.
import { svgUse } from '@wild-daily/ui';
import { btn, cellLabel, clock, coach, grid, nb4, nb8, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export interface PondPuzzle { n: number; seed: string; regions: number[] }
const COLORS = ['#BFE3F5', '#CDEBC0', '#FFE0B8', '#E5D4F5', '#FFD3D3', '#FFF1B0', '#C9EDE6', '#E8DCC8'];

export function solvePond(p: PondPuzzle, limit = 2): number[][] {
  const { n } = p, out: number[][] = [], cols = new Set<number>(), regs = new Set<number>(), pos: number[] = [];
  const rec = (r: number): void => {
    if (out.length >= limit) return;
    if (r === n) { out.push(pos.slice()); return; }
    for (let c = 0; c < n; c++) {
      const i = r * n + c, g = p.regions[i]!;
      if (cols.has(c) || regs.has(g)) continue;
      if (r > 0 && Math.abs((pos[r - 1]! % n) - c) <= 1) continue;
      cols.add(c); regs.add(g); pos.push(i); rec(r + 1); pos.pop(); cols.delete(c); regs.delete(g);
    }
  };
  rec(0);
  return out;
}
export function generate(seed: string): PondPuzzle {
  const rng = rngFrom('pond:' + seed), n = 6;
  for (let a = 0; a < 20000; ) {
    const perm = shuffle(rng, range(n));
    if (perm.some((c, r) => r > 0 && Math.abs(c - perm[r - 1]!) <= 1)) continue;
    a++;
    const regions = Array<number>(n * n).fill(-1);
    perm.forEach((c, r) => { regions[r * n + c] = r; });
    let left = n * n - n;
    while (left > 0) {
      const edge = range(n * n).filter((i) => regions[i] === -1 && nb4(n, i).some((j) => regions[j]! >= 0));
      const i = edge[Math.floor(rng() * edge.length)]!;
      const opts = nb4(n, i).filter((j) => regions[j]! >= 0);
      regions[i] = regions[opts[Math.floor(rng() * opts.length)]!]!; left--;
    }
    const p = { n, seed, regions };
    if (solvePond(p, 2).length === 1) return p;
  }
  throw new Error('frog-pond: generation failed for ' + seed);
}
export function checkPond(p: PondPuzzle, frogs: ReadonlySet<number>): { solved: boolean; bad: Set<number> } {
  const { n } = p, bad = new Set<number>();
  const groups = (key: (i: number) => number): void => {
    const m = new Map<number, number[]>();
    frogs.forEach((i) => { const k = key(i); m.set(k, [...(m.get(k) ?? []), i]); });
    m.forEach((v) => { if (v.length > 1) v.forEach((i) => bad.add(i)); });
  };
  groups((i) => Math.floor(i / n)); groups((i) => i % n); groups((i) => p.regions[i]!);
  frogs.forEach((i) => { if (nb8(n, i).some((j) => frogs.has(j))) bad.add(i); });
  return { solved: frogs.size === n && bad.size === 0, bad };
}
const def: GameDef<PondPuzzle> = {
  id: 'frog-pond', generate,
  mount(root, p, ctx) {
    const n = p.n, marks = new Int8Array(n * n);
    let hints = 0, done = false, msg: string | null = null, kind = '', sol: number[] | null = null;
    const t = clock(ctx);
    const frogs = (): Set<number> => new Set(range(n * n).filter((i) => marks[i] === 1));
    const render = (): void => {
      const { bad } = checkPond(p, frogs());
      const cells = range(n * n).map((i) => `<button type="button" class="gcell pond${bad.has(i) ? ' bad' : ''}" style="background:${COLORS[p.regions[i]! % COLORS.length]}" data-g="cell:${i}" aria-label="${cellLabel(n, i)}, patch ${p.regions[i]! + 1}: ${marks[i] === 1 ? 'frog' : marks[i] === 2 ? 'marked empty' : 'empty'}">${marks[i] === 1 ? svgUse('n-frog', '0 0 64 56') : marks[i] === 2 ? '<span class="dot"></span>' : ''}</button>`).join('');
      const text = done ? 'Every frog has its own lily patch!' : msg ?? (bad.size ? 'Red frogs share a row, column or patch, or are touching.' : 'Tap to place a frog, tap again for a dot. One frog per row, column and colour patch; frogs never touch.');
      root.innerHTML = `${pills(`Frogs: ${frogs().size} of ${n}`, `${n} patches`)}${coach(text, done ? 'good' : kind, 'frog')}${grid(n, cells, 'Pond', 72)}${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'cell') { const i = Number(arg); marks[i] = (marks[i]! + 1) % 3; }
      else if (act === 'clear') marks.fill(0);
      else if (act === 'hint') {
        sol ??= solvePond(p, 1)[0] ?? []; const s = new Set(sol);
        const i = range(n * n).find((x) => (marks[x] === 1) !== s.has(x) && (marks[x] === 1 || s.has(x)));
        if (i !== undefined) { marks[i] = s.has(i) ? 1 : 2; hints++; msg = s.has(i) ? `Hint: a frog sits at row ${Math.floor(i / n) + 1}, column ${(i % n) + 1}.` : 'Hint: that frog doesn’t belong there.'; }
      } else if (act === 'check') {
        if (checkPond(p, frogs()).solved) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
        msg = frogs().size !== n ? `Place ${n} frogs: you have ${frogs().size}.` : 'Not quite: check the red frogs.'; kind = 'bad';
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
