// Snow Picture: the numbers say how many squares to shovel in each row and column, in order.
// Finish to reveal a winter animal picture. Every picture is checked to have exactly one answer.
import { btn, clock, coach, onAct, range, tools, type GameDef } from '../shared.js';

export const PICTURES: { name: string; rows: string[] }[] = [
  { name: 'Paw print', rows: ['..#..#..', '.###.###', '.###.###', '#..##..#', '#..##..#', '..####..', '.######.', '..####..'] },
  { name: 'Pine tree', rows: ['...##...', '..####..', '.######.', '..####..', '.######.', '########', '...##...', '...##...'] },
  { name: 'Fish', rows: ['........', '..####..', '.######.', '##.###.#', '########', '.######.', '..####..', '........'] },
  { name: 'Mushroom', rows: ['..####..', '.##..##.', '########', '########', '..#..#..', '..####..', '..####..', '........'] },
  { name: 'Snowflake', rows: ['#..#..#.', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '#..#..#.', '........'] },
  { name: 'Moon', rows: ['..###...', '.##.....', '##......', '##......', '##......', '.##.....', '..###...', '........'] },
  { name: 'Acorn', rows: ['...##...', '.######.', '########', '.######.', '.#....#.', '.#....#.', '..#..#..', '...##...'] },
  { name: 'Rabbit', rows: ['.#..#...', '.#..#...', '.####...', '#.##.#..', '######..', '.####...', '.######.', '.######.'] },
  { name: 'Owl', rows: ['#......#', '########', '#..##..#', '#.#..#.#', '########', '.######.', '.######.', '..#..#..'] },
  { name: 'Leaf', rows: ['......##', '....####', '..######', '.####.##', '.###.###', '.##.####', '.#.####.', '#.......'] },
  { name: 'Heart', rows: ['.##..##.', '########', '########', '########', '.######.', '..####..', '...##...', '........'] },
  { name: 'Bird', rows: ['........', '.##.....', '####....', '.#######', '..######', '...####.', '....#...', '...##...'] },
];
const runs = (line: boolean[]): number[] => { const o: number[] = []; let k = 0; for (const v of line) { if (v) k++; else if (k) { o.push(k); k = 0; } } if (k) o.push(k); return o; };
export interface PicturePuzzle { n: number; seed: string; rows: number[][]; cols: number[][]; name: string }
export function cluesOf(rows: string[]): { rows: number[][]; cols: number[][] } {
  const n = rows.length, g = rows.map((r) => [...r].map((ch) => ch === '#'));
  return { rows: g.map(runs), cols: range(n).map((c) => runs(g.map((r) => r[c]!))) };
}
/** Line-by-line solver: returns the grid if logic alone solves it (so the answer is unique). */
export function lineSolve(rowsC: number[][], colsC: number[][], n: number): number[] | null {
  const g = new Int8Array(n * n).fill(-1);
  const fits = (clue: number[], len: number): number[][] => {
    const out: number[][] = [];
    const rec = (k: number, pos: number, line: number[]): void => {
      if (k === clue.length) { out.push([...line, ...Array(len - line.length).fill(0)]); return; }
      for (let s = pos; s + clue[k]! <= len; s++) {
        const next = [...line, ...Array(s - line.length).fill(0), ...Array(clue[k]!).fill(1)];
        if (k < clue.length - 1) next.push(0);
        if (next.length > len) continue;
        rec(k + 1, next.length, next);
      }
    };
    rec(0, 0, []);
    return out;
  };
  const rowFits = rowsC.map((c) => fits(c, n)), colFits = colsC.map((c) => fits(c, n));
  for (let pass = 0; pass < 50; pass++) {
    let changed = false;
    for (let r = 0; r < n; r++) {
      const cand = rowFits[r]!.filter((f) => f.every((v, c) => g[r * n + c] === -1 || g[r * n + c] === v));
      if (!cand.length) return null;
      for (let c = 0; c < n; c++) if (g[r * n + c] === -1 && cand.every((f) => f[c] === cand[0]![c])) { g[r * n + c] = cand[0]![c]!; changed = true; }
    }
    for (let c = 0; c < n; c++) {
      const cand = colFits[c]!.filter((f) => f.every((v, r) => g[r * n + c] === -1 || g[r * n + c] === v));
      if (!cand.length) return null;
      for (let r = 0; r < n; r++) if (g[r * n + c] === -1 && cand.every((f) => f[r] === cand[0]![r])) { g[r * n + c] = cand[0]![r]!; changed = true; }
    }
    if (!changed) break;
  }
  return g.every((v) => v !== -1) ? [...g] : null;
}
export const SOLVABLE = PICTURES.filter((p) => { const c = cluesOf(p.rows); return lineSolve(c.rows, c.cols, p.rows.length) !== null; });
export function generate(seed: string): PicturePuzzle {
  const k = [...seed].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7) % SOLVABLE.length;
  const pic = SOLVABLE[k]!, c = cluesOf(pic.rows);
  return { n: pic.rows.length, seed, rows: c.rows, cols: c.cols, name: pic.name };
}
const def: GameDef<PicturePuzzle> = {
  id: 'snow-picture', generate,
  mount(root, p, ctx) {
    const n = p.n, marks = new Int8Array(n * n); // 0 snow, 1 shovelled, 2 marked "keep snow"
    let hints = 0, done = false, msg: string | null = null, kind = '', mode: 1 | 2 = 1, sol: number[] | null = null;
    const t = clock(ctx);
    const lineOk = (vals: number[], clue: number[]): boolean => runs(vals.map((v) => v === 1)).join() === (clue.length ? clue : []).join();
    const solved = (): boolean => range(n).every((r) => lineOk(range(n).map((c) => marks[r * n + c]!), p.rows[r]!)) && range(n).every((c) => lineOk(range(n).map((r) => marks[r * n + c]!), p.cols[c]!));
    const render = (): void => {
      const rowDone = range(n).map((r) => lineOk(range(n).map((c) => marks[r * n + c]!), p.rows[r]!));
      const colDone = range(n).map((c) => lineOk(range(n).map((r) => marks[r * n + c]!), p.cols[c]!));
      let html = `<div class="nono" style="grid-template-columns:auto repeat(${n},minmax(0,1fr))"><span></span>`;
      for (let c = 0; c < n; c++) html += `<span class="nclue col${colDone[c] ? ' ok' : ''}">${(p.cols[c]!.length ? p.cols[c]! : [0]).join('<br>')}</span>`;
      for (let r = 0; r < n; r++) {
        html += `<span class="nclue row${rowDone[r] ? ' ok' : ''}">${(p.rows[r]!.length ? p.rows[r]! : [0]).join(' ')}</span>`;
        for (let c = 0; c < n; c++) { const i = r * n + c, m = marks[i]; html += `<button type="button" class="ncell${m === 1 ? ' on' : ''}${m === 2 ? ' x' : ''}" data-g="cell:${i}" aria-label="Row ${r + 1}, column ${c + 1}: ${m === 1 ? 'shovelled' : m === 2 ? 'marked snow' : 'snow'}"></button>`; }
      }
      html += '</div>';
      const text = done ? `You uncovered: ${p.name}!` : msg ?? 'Each number is a run of squares to shovel, in order. Tap to shovel; switch to “Mark” to note squares that stay snowy.';
      root.innerHTML = `${coach(text, done ? 'good' : kind)}<div class="boardwrap">${html}</div>
<div class="row" style="justify-content:center"><button type="button" class="tab" style="flex:0 0 auto; padding:6px 16px" aria-selected="${mode === 1}" data-g="mode:1">Shovel</button><button type="button" class="tab" style="flex:0 0 auto; padding:6px 16px" aria-selected="${mode === 2}" data-g="mode:2">Mark</button></div>
${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'cell') { const i = Number(arg); marks[i] = marks[i] === mode ? 0 : mode; }
      else if (act === 'mode') mode = arg === '2' ? 2 : 1;
      else if (act === 'clear') marks.fill(0);
      else if (act === 'hint') {
        sol ??= lineSolve(p.rows, p.cols, n);
        if (sol) { const i = range(n * n).find((x) => (marks[x] === 1 ? 1 : 0) !== sol![x]); if (i !== undefined) { marks[i] = sol[i] ? 1 : 2; hints++; msg = sol[i] ? 'Hint: shovel the new square.' : 'Hint: that square stays snowy.'; } }
      } else if (act === 'check') {
        if (solved()) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
        msg = 'Not yet: rows and columns turn green when they match their numbers.'; kind = 'bad';
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
