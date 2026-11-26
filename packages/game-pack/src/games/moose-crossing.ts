// Moose Crossing: the moose slides on ice in a straight line until it hits a tree or the edge.
// Reach the lake (the lake stops it). Fewer slides earn more paws. Every puzzle is solvable in 4–8 slides.
import { Mover, character, tree } from '@wild-daily/ui';
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
/**
 * A hint for the moose's slides so far: the direction to slide next, or, when the lake can no longer be reached
 * from here, how many slides to undo to get back to a square that can still reach it.
 */
export function mooseHint(p: Pick<MoosePuzzle, 'n' | 'trees' | 'lake'>, path: readonly number[]): { dir: number } | { undo: number } | null {
  for (let back = 0; back < path.length; back++) {
    const at = path[path.length - 1 - back]!, r = bestRoute(p, at);
    if (!r || r[1] === undefined) continue;
    if (back) return { undo: back };
    return { dir: [0, 1, 2, 3].find((x) => slide(p, at, x) === r[1])! };
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
    const mover = new Mover();
    const render = (): void => {
      const cells = range(n * n).map((i) => `<div class="gcell ice${i === p.lake ? ' lake' : ''}${path.includes(i) && i !== at ? ' trail' : ''}" data-cell="${i}" role="gridcell" aria-label="${i === at ? 'Moose' : i === p.lake ? 'Lake' : trees.has(i) ? 'Tree' : 'Ice'}">${trees.has(i) ? tree() : ''}</div>`).join('');
      const text = done ? `The moose reached the lake in ${path.length - 1} slides! Best possible: ${p.best}.` : msg ?? 'Pick a direction. The moose slides until it bumps into a tree or the edge. The lake stops it.';
      const arrows = done ? '' : `<div class="dpad dpad-row">${btn('go:3', '◀ Left')}${btn('go:0', '▲ Up')}${btn('go:2', '▼ Down')}${btn('go:1', 'Right ▶')}</div>`;
      root.innerHTML = `${pills(`Slides: ${path.length - 1}`, `Best possible: ${p.best}`)}${coach(text, done ? 'good' : kind, 'moose')}<div class="boardwrap" style="--bmax:${n * 60}px"><div class="board" role="grid" aria-label="Frozen pond" style="grid-template-columns:repeat(${n},1fr); max-width:var(--bcap); gap:3px">${cells}</div></div>${arrows}${tools(btn('undo', 'Undo', 'btn-w', done || path.length < 2), btn('restart', 'Restart', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
      mover.sync(root.querySelector<HTMLElement>('.boardwrap'), [{ id: 'moose', cell: at, el: root.querySelector(`[data-cell="${at}"]`), html: character('moose', done ? 'happy' : kind === 'bad' ? 'oops' : 'idle'), gait: 'slide', selected: !done, size: 1.05, puff: at === p.lake ? '#9FD3EE' : '#FFFFFF' }]);
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'go') {
        const j = slide(p, at, Number(arg));
        if (j === at) { msg = 'Bump! A tree or the edge is right there.'; kind = 'bad'; render(); mover.shake('moose'); return; }
        else { at = j; path.push(j); if (at === p.lake) { done = true; const time = t.stop(); render(); const moves = path.length - 1; ctx.onSolved({ time, hints, moves, stars: hints === 0 && moves === p.best ? 3 : moves <= p.best + 2 ? 2 : 1 }); return; } }
      } else if (act === 'undo') { if (path.length > 1) { path.pop(); at = path[path.length - 1]!; } } // never undo past the start
      else if (act === 'restart') { at = p.start; path = [p.start]; }
      else if (act === 'hint') {
        const h = mooseHint(p, path);
        if (h && 'dir' in h) { hints++; msg = `Hint: slide ${D[h.dir]![2]}.`; }
        else if (h) { hints++; msg = `The lake can’t be reached from here. Undo ${h.undo === 1 ? 'your last slide' : `${h.undo} slides`}, then ask again.`; kind = 'bad'; }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); mover.clear(); } };
  },
};
export default def;
