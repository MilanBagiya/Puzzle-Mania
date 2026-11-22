// Egg Match: guess the order of four coloured bird eggs in six tries. After each guess:
// a filled dot = right colour, right spot; a ring = right colour, wrong spot.
// Like any guessing game, the answer must live in the browser; it is scrambled in the file.
import { btn, clock, coach, onAct, range, rngFrom, scramble, shuffle, unscramble, tools, type GameDef } from '../shared.js';

export const EGGS = [{ c: '#7FC4E8', n: 'robin blue' }, { c: '#F2F0E6', n: 'speckled white' }, { c: '#C9915E', n: 'brown' }, { c: '#9BD08A', n: 'pale green' }, { c: '#F6C445', n: 'cream yellow' }, { c: '#E8A3B0', n: 'pink' }] as const;
export interface EggPuzzle { seed: string; code: string }
export function generate(seed: string): EggPuzzle {
  const rng = rngFrom('egg:' + seed);
  return { seed, code: scramble(seed, shuffle(rng, range(EGGS.length)).slice(0, 4).join('')) };
}
export const answerOf = (p: EggPuzzle): number[] => [...unscramble(p.seed, p.code)].map(Number);
export function score(ans: number[], guess: number[]): { exact: number; near: number } {
  const exact = guess.filter((g, i) => g === ans[i]).length;
  const near = guess.filter((g) => ans.includes(g)).length - exact;
  return { exact, near };
}
const egg = (k: number, w = 34): string => `<svg viewBox="0 0 30 38" width="${w}" height="${Math.round(w * 38 / 30)}" aria-hidden="true"><ellipse cx="15" cy="21" rx="12" ry="15" fill="${EGGS[k]!.c}" stroke="rgba(35,49,66,.25)"></ellipse><ellipse cx="10" cy="15" rx="3" ry="5" fill="#fff" fill-opacity=".5"></ellipse></svg>`;
const def: GameDef<EggPuzzle> = {
  id: 'egg-match', generate,
  mount(root, p, ctx) {
    const ans = answerOf(p), guesses: { g: number[]; s: { exact: number; near: number } }[] = [];
    let cur: number[] = [], done = false, lost = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const render = (): void => {
      const rows = range(6).map((k) => {
        const g = guesses[k];
        const eggs = g ? g.g.map((e) => egg(e, 30)).join('') : k === guesses.length && !done && !lost ? range(4).map((j) => (cur[j] !== undefined ? egg(cur[j]!, 30) : '<span class="eggslot"></span>')).join('') : range(4).map(() => '<span class="eggslot dim"></span>').join('');
        const pegs = g ? range(4).map((j) => `<span class="peg ${j < g.s.exact ? 'exact' : j < g.s.exact + g.s.near ? 'near' : ''}"></span>`).join('') : '';
        return `<div class="eggrow"><span class="muted" style="width:18px; font-weight:800">${k + 1}</span><div class="row" style="gap:6px; flex-wrap:nowrap">${eggs}</div><div class="pegs" aria-label="${g ? `${g.s.exact} right spot, ${g.s.near} wrong spot` : ''}">${pegs}</div></div>`;
      }).join('');
      const text = done ? `Cracked it in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}!` : lost ? 'Out of tries! The real order is shown below. A new nest tomorrow.' : msg ?? 'Pick 4 different eggs, then Guess. ● right egg, right spot; ○ right egg, wrong spot.';
      root.innerHTML = `${coach(text, done ? 'good' : lost ? 'bad' : kind)}<div class="card stack" style="gap:8px">${rows}</div>
${lost ? `<div class="card row" style="justify-content:center">${ans.map((e) => egg(e, 40)).join('')}</div>` : done ? '' : `<div class="card row" style="justify-content:center; gap:8px">${EGGS.map((e, k) => `<button type="button" class="eggbtn" data-g="pick:${k}" aria-label="${e.n} egg"${cur.includes(k) ? ' disabled' : ''}>${egg(k, 36)}</button>`).join('')}</div>
${tools(btn('back', 'Delete', 'btn-w', !cur.length), btn('guess', 'Guess', 'btn-p', cur.length < 4))}`}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done || lost) return; msg = null; kind = '';
      if (act === 'pick' && cur.length < 4) cur.push(Number(arg));
      else if (act === 'back') cur.pop();
      else if (act === 'guess' && cur.length === 4) {
        const s = score(ans, cur); guesses.push({ g: cur, s }); cur = [];
        if (s.exact === 4) { done = true; const time = t.stop(); render(); const n = guesses.length; ctx.onSolved({ time, hints: 0, moves: n, stars: n <= 3 ? 3 : n <= 5 ? 2 : 1 }); return; }
        if (guesses.length >= 6) { lost = true; t.stop(); }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
