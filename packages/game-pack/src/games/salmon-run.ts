// Salmon Run: the salmon leaps upstream. Each pool's number is exactly how far it must jump next:
// up, left or right (never back downstream). Reach the spawning stream at the top.
import { Mover, character } from '@wild-daily/ui';
import { btn, clock, coach, onAct, pills, range, rngFrom, tools, type GameDef } from '../shared.js';

export interface SalmonPuzzle { n: number; seed: string; pools: number[]; start: number; best: number }
export function leaps(p: Pick<SalmonPuzzle, 'n' | 'pools'>, i: number): number[] {
  const { n } = p, r = Math.floor(i / n), c = i % n, k = p.pools[i]!, out: number[] = [];
  if (r - k >= 0) out.push((r - k) * n + c);
  if (c - k >= 0) out.push(r * n + c - k);
  if (c + k < n) out.push(r * n + c + k);
  return out;
}
export const isTop = (n: number, i: number): boolean => i < n;
export function bestLeaps(p: Pick<SalmonPuzzle, 'n' | 'pools'>, from: number): number[] | null {
  const prev = new Map<number, number>([[from, -1]]), q = [from];
  while (q.length) {
    const i = q.shift()!;
    if (isTop(p.n, i)) { const path = [i]; let x = prev.get(i)!; while (x >= 0) { path.unshift(x); x = prev.get(x)!; } return path; }
    for (const j of leaps(p, i)) if (!prev.has(j)) { prev.set(j, i); q.push(j); }
  }
  return null;
}
export function generate(seed: string): SalmonPuzzle {
  const rng = rngFrom('salmon:' + seed), n = 7;
  for (let a = 0; a < 4000; a++) {
    const pools = range(n * n).map(() => 1 + Math.floor(rng() * 3));
    const start = (n - 1) * n + Math.floor(rng() * n);
    const r = bestLeaps({ n, pools }, start);
    if (!r) continue;
    const best = r.length - 1;
    if (best < 5 || best > 10) continue;
    return { n, seed, pools, start, best };
  }
  throw new Error('salmon-run: generation failed for ' + seed);
}
const def: GameDef<SalmonPuzzle> = {
  id: 'salmon-run', generate,
  mount(root, p, ctx) {
    const n = p.n;
    let path = [p.start], hints = 0, done = false, msg: string | null = null, kind = '', glow = -1;
    const t = clock(ctx);
    const mover = new Mover();
    const render = (): void => {
      const at = path[path.length - 1]!, next = done ? [] : leaps(p, at);
      const cells = range(n * n).map((i) => `<button type="button" class="gcell stream${isTop(n, i) ? ' spawn' : ''}${next.includes(i) ? ' target' : ''}${glow === i ? ' hinted' : ''}${path.includes(i) && i !== at ? ' trail' : ''}" data-g="cell:${i}" aria-label="Pool ${p.pools[i]}${i === at ? ', salmon here' : ''}${next.includes(i) ? ', can leap here' : ''}"><b class="display">${p.pools[i]}</b></button>`).join('');
      const text = done ? `Home to the spawning stream in ${path.length - 1} leaps! Best possible: ${p.best}.` : msg ?? `The salmon is in a ${p.pools[at]} pool: it leaps exactly ${p.pools[at]} up, left or right. Reach the top row.`;
      root.innerHTML = `${pills(`Leaps: ${path.length - 1}`, `Best possible: ${p.best}`)}${coach(text, done ? 'good' : kind, 'salmon')}<div class="boardwrap"><div class="board" role="grid" aria-label="River" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 66}px; gap:3px">${cells}</div></div>${tools(btn('undo', 'Undo', 'btn-w', done || path.length < 2), btn('restart', 'Restart', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
      mover.sync(root.querySelector<HTMLElement>('.boardwrap'), [{ id: 'salmon', cell: at, el: root.querySelector(`[data-g="cell:${at}"]`), html: character('salmon', done ? 'happy' : kind === 'bad' ? 'oops' : 'idle'), gait: 'leap', selected: !done, size: 0.62, puff: '#9FD3EE' }]);
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = ''; glow = -1;
      const at = path[path.length - 1]!;
      if (act === 'cell') {
        const i = Number(arg);
        if (leaps(p, at).includes(i)) { path.push(i); if (isTop(n, i)) { done = true; const time = t.stop(); render(); const moves = path.length - 1; ctx.onSolved({ time, hints, moves, stars: hints === 0 && moves === p.best ? 3 : moves <= p.best + 2 ? 2 : 1 }); return; } }
        else if (i !== at) { msg = `It must leap exactly ${p.pools[at]}, and never downstream.`; kind = 'bad'; render(); mover.shake('salmon'); return; }
      } else if (act === 'undo') path.pop();
      else if (act === 'restart') path = [p.start];
      else if (act === 'hint') { const r = bestLeaps(p, at); if (r && r[1] !== undefined) { glow = r[1]; hints++; msg = 'Hint: leap to the glowing pool.'; } else { path = [p.start]; msg = 'No way up from there, so back to the start.'; } }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); mover.clear(); } };
  },
};
export default def;
