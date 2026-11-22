// Moose Crossing: the moose slides on ice in a straight line until it hits a tree or the edge.
// Reach the lake (the lake stops it). Fewer slides earn more paws. Every puzzle is solvable in 4–8 slides.
import { character, tree } from '@wild-daily/ui';
import { btn, clock, coach, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export interface MoosePuzzle { n: number; seed: string; trees: number[]; start: number; lake: number; best: number }
const D = [[-1, 0, 'up'], [0, 1, 'right'], [1, 0, 'down'], [0, -1, 'left']] as const;
export function slide(p: Pick<MoosePuzzle, 'n' | 'trees' | 'lake'>, from: number, d: number): number {
  const { n } = p, trees = new Set(p.trees), [dr, dc] = D[d]!;
  let r = Math.floor(from / n), c = from % n;
  for (;;) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= n || cc >= n || trees.has(rr * n + cc)) return r * n + c;
    r = rr; c = cc;
    if (r * n + c === p.lake) return p.lake;
  }
}
export function bestRoute(p: Pick<MoosePuzzle, 'n' | 'trees' | 'lake'>, start: number): number[] | null {
  const prev = new Map<number, number>([[start, -1]]), q = [start];
  while (q.length) {
    const i = q.shift()!;
    if (i === p.lake) { const path = [i]; let x = prev.get(i)!; while (x >= 0) { path.unshift(x); x = prev.get(x)!; } return path; }
    for (let d = 0; d < 4; d++) { const j = slide(p, i, d); if (!prev.has(j)) { prev.set(j, i); q.push(j); } }
  }
  return null;
}
export function generate(seed: string): MoosePuzzle {
  const rng = rngFrom('moose:' + seed), n = 8;
  for (let a = 0; a < 3000; a++) {
    const cells = shuffle(rng, range(n * n));
    const trees = cells.slice(0, 9 + Math.floor(rng() * 6)), start = cells[20]!, lake = cells[21]!;
    const route = bestRoute({ n, trees, lake }, start);
    if (!route) continue;
    const best = route.length - 1;
    if (best < 4 || best > 8) continue;
    return { n, seed, trees, start, lake, best };
  }
  throw new Error('moose-crossing: generation failed for ' + seed);
}
const def: GameDef<MoosePuzzle> = {
  id: 'moose-crossing', generate,
  mount(root, p, ctx) {
    const n = p.n, trees = new Set(p.trees);
    let at = p.start, path = [p.start], hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const render = (): void => {
      const cells = range(n * n).map((i) => `<div class="gcell ice${i === p.lake ? ' lake' : ''}${path.includes(i) && i !== at ? ' trail' : ''}" role="gridcell" aria-label="${i === at ? 'Moose' : i === p.lake ? 'Lake' : trees.has(i) ? 'Tree' : 'Ice'}">${trees.has(i) ? tree() : i === at ? character('deer', done ? 'happy' : 'idle', undefined, done ? 'cheer' : '') : ''}</div>`).join('');
      const text = done ? `The moose reached the lake in ${path.length - 1} slides! Best possible: ${p.best}.` : msg ?? 'Pick a direction. The moose slides until it bumps into a tree or the edge. The lake stops it.';
      const arrows = done ? '' : `<div class="dpad"><span></span>${btn('go:0', '▲ Up')}<span></span>${btn('go:3', '◀ Left')}${btn('undo', 'Undo', 'btn-w', path.length < 2)}${btn('go:1', 'Right ▶')}<span></span>${btn('go:2', '▼ Down')}<span></span></div>`;
      root.innerHTML = `${pills(`Slides: ${path.length - 1}`, `Best possible: ${p.best}`)}${coach(text, done ? 'good' : kind)}<div class="boardwrap"><div class="board" role="grid" aria-label="Frozen pond" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 60}px; gap:3px">${cells}</div></div>${arrows}${tools(btn('restart', 'Restart', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'go') {
        const j = slide(p, at, Number(arg));
        if (j === at) { msg = 'Bump! A tree or the edge is right there.'; kind = 'bad'; }
        else { at = j; path.push(j); if (at === p.lake) { done = true; const time = t.stop(); render(); const moves = path.length - 1; ctx.onSolved({ time, hints, moves, stars: hints === 0 && moves === p.best ? 3 : moves <= p.best + 2 ? 2 : 1 }); return; } }
      } else if (act === 'undo') { path.pop(); at = path[path.length - 1]!; }
      else if (act === 'restart') { at = p.start; path = [p.start]; }
      else if (act === 'hint') {
        const r = bestRoute(p, at);
        if (r && r[1] !== undefined) { const d = [0, 1, 2, 3].find((x) => slide(p, at, x) === r[1])!; hints++; msg = `Hint: slide ${D[d]![2]}.`; }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
