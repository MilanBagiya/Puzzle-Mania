// Bear's Last Snack: before winter, the bear visits every bush exactly once, stepping up, down, left or right,
// and ends in its cave. A few bushes show their visit number. Any route that follows the rules wins.
import { Mover, svgUse } from '@wild-daily/ui';
import { btn, clock, coach, nb4, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export interface BearPuzzle { n: number; seed: string; start: number; cave: number; given: Record<string, number> }
export function generate(seed: string): BearPuzzle {
  const rng = rngFrom('bear:' + seed), n = 5, N = n * n;
  for (let a = 0; a < 200; a++) {
    const start = Math.floor(rng() * N), path = [start], seen = new Set(path);
    const rec = (): boolean => {
      if (path.length === N) return true;
      const at = path[path.length - 1]!;
      const opts = shuffle(rng, nb4(n, at).filter((j) => !seen.has(j))).sort((x, y) => nb4(n, x).filter((k) => !seen.has(k)).length - nb4(n, y).filter((k) => !seen.has(k)).length);
      for (const j of opts) { path.push(j); seen.add(j); if (rec()) return true; path.pop(); seen.delete(j); }
      return false;
    };
    if (!rec()) continue;
    const given: Record<string, number> = {};
    shuffle(rng, range(N - 2).map((x) => x + 1)).slice(0, 5).forEach((k) => { given[String(path[k])] = k + 1; });
    return { n, seed, start, cave: path[N - 1]!, given };
  }
  throw new Error('bears-last-snack: generation failed for ' + seed);
}
export function checkRoute(p: BearPuzzle, route: number[]): boolean {
  const N = p.n * p.n;
  if (route.length !== N || route[0] !== p.start || route[N - 1] !== p.cave || new Set(route).size !== N) return false;
  for (let k = 1; k < N; k++) if (!nb4(p.n, route[k - 1]!).includes(route[k]!)) return false;
  return Object.entries(p.given).every(([cell, k]) => route[k - 1] === Number(cell));
}
export function solveBear(p: BearPuzzle, prefix: number[]): number[] | null {
  const N = p.n * p.n, path = prefix.slice(), seen = new Set(path), want = new Map(Object.entries(p.given).map(([c, k]) => [k, Number(c)]));
  const cellStep = new Map(Object.entries(p.given).map(([c, k]) => [Number(c), k]));
  // The route so far must keep the rules too (it used to be trusted, so a hint could extend a route that can never win).
  if (path[0] !== p.start || seen.size !== path.length) return null;
  for (let k = 0; k < path.length; k++) {
    const c = path[k]!, step = k + 1;
    if (k && !nb4(p.n, path[k - 1]!).includes(c)) return null;
    if ((want.has(step) && want.get(step) !== c) || (cellStep.has(c) && cellStep.get(c) !== step) || (c === p.cave && step !== N)) return null;
  }
  const rec = (): boolean => {
    if (path.length === N) return path[N - 1] === p.cave;
    const at = path[path.length - 1]!, step = path.length + 1;
    for (const j of nb4(p.n, at)) {
      if (seen.has(j)) continue;
      if (want.has(step) && want.get(step) !== j) continue;
      if (cellStep.has(j) && cellStep.get(j) !== step) continue;
      if (j === p.cave && step !== N) continue;
      path.push(j); seen.add(j); if (rec()) return true; path.pop(); seen.delete(j);
    }
    return false;
  };
  return rec() ? path : null;
}
/** The hint: keep the longest start of the player's route that can still win, then add the next step. */
export function bearHint(p: BearPuzzle, route: readonly number[]): number[] | null {
  for (let keep = route.length; keep >= 1; keep--) {
    const sol = solveBear(p, route.slice(0, keep));
    if (sol) return sol.slice(0, keep + 1);
  }
  return null;
}
const def: GameDef<BearPuzzle> = {
  id: 'bears-last-snack', generate,
  mount(root, p, ctx) {
    const n = p.n, N = n * n;
    let route = [p.start], hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const mover = new Mover();
    const render = (): void => {
      const at = route[route.length - 1]!, step = new Map(route.map((c, k) => [c, k + 1]));
      const cells = range(N).map((i) => {
        const g = p.given[String(i)], s = step.get(i);
        return `<button type="button" class="gcell forest${s ? ' trail' : ''}${!done && nb4(n, at).includes(i) && !s ? ' target' : ''}" data-g="cell:${i}" aria-label="Bush${g ? ` number ${g}` : ''}${i === p.cave ? ', cave' : ''}${s ? `, visited as ${s}` : ''}">${i === p.cave ? svgUse('i3-home', '0 0 72 54') : svgUse('n-bush', '0 0 36 30')}${g ? `<span class="num ${s === g ? 'ok' : s ? 'over' : ''}">${g}</span>` : s ? `<span class="stepnum">${s}</span>` : ''}</button>`;
      }).join('');
      const text = done ? 'Every bush visited and the bear is snoring in its cave!' : msg ?? `Visit all ${N} bushes once, one step at a time, ending in the cave. Numbered bushes must be visited at that step. Tap a visited bush to go back to it.`;
      root.innerHTML = `${pills(`Bushes: ${route.length} of ${N}`, `Step ${route.length}`)}${coach(text, done ? 'good' : kind)}<div class="boardwrap"><div class="board" role="grid" aria-label="Forest" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 76}px">${cells}</div></div>${tools(btn('undo', 'Undo', 'btn-w', done || route.length < 2), btn('restart', 'Restart', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done))}`;
      mover.sync(root.querySelector<HTMLElement>('.boardwrap'), [{ id: 'bear', cell: at, el: root.querySelector(`[data-g="cell:${at}"]`), html: svgUse('n-bear', '0 0 40 36'), gait: 'walk', selected: !done, size: 0.8 }]);
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      const at = route[route.length - 1]!;
      if (act === 'cell') {
        const i = Number(arg), k = route.indexOf(i);
        if (k >= 0) route = route.slice(0, k + 1);
        else if (!nb4(n, at).includes(i)) { msg = 'The bear steps one square up, down, left or right.'; kind = 'bad'; render(); mover.shake('bear'); return; }
        else {
          route.push(i);
          const g = p.given[String(i)];
          if (g && g !== route.length) { msg = `That bush must be visit number ${g}, not ${route.length}.`; kind = 'bad'; }
          if (route.length === N) { if (checkRoute(p, route)) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; } msg = 'Every bush is visited, but the route breaks a rule. Check the numbers and end in the cave.'; kind = 'bad'; }
        }
      } else if (act === 'undo') route.pop();
      else if (act === 'restart') route = [p.start];
      else if (act === 'hint') {
        const had = route.length, next = bearHint(p, route);
        if (next) { route = next; hints++; msg = route.length <= had ? 'Hint: your route went wrong earlier, so it was shortened and the next step added.' : 'Hint: the next step is added.'; if (route.length === N && checkRoute(p, route)) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; } }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); mover.clear(); } };
  },
};
export default def;
