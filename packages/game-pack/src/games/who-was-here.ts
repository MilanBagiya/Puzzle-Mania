// Who Was Here?: a close-up of an animal zooms out after every wrong guess. Six guesses.
import { bird, character, svgUse } from '@wild-daily/ui';
import { btn, clock, coach, onAct, range, rngFrom, scramble, unscramble, type GameDef } from '../shared.js';

export const CAST = [
  { name: 'Red fox', art: () => character('fox', 'idle', 300) }, { name: 'Rabbit', art: () => character('rabbit', 'idle', 300) },
  { name: 'Deer', art: () => character('deer', 'idle', 300) }, { name: 'Beaver', art: () => character('beaver', 'idle', 300) },
  { name: 'Crab', art: () => svgUse('n-crab', '0 0 80 64', 300) }, { name: 'Frog', art: () => character('frog', 'idle', 300) },
  { name: 'Robin', art: () => bird('#E2594A', 300) }, { name: 'Bluebird', art: () => bird('#3F86D3', 300) },
  { name: 'Owl', art: () => character('owl', 'idle', 300) }, { name: 'Salmon', art: () => character('salmon', 'idle', 300) },
];
export interface ZoomPuzzle { seed: string; code: string; fx: number; fy: number }
export function generate(seed: string): ZoomPuzzle {
  const rng = rngFrom('zoom:' + seed);
  return { seed, code: scramble(seed, String(Math.floor(rng() * CAST.length))), fx: 30 + Math.floor(rng() * 40), fy: 25 + Math.floor(rng() * 40) };
}
export const answerOf = (p: ZoomPuzzle): number => Number(unscramble(p.seed, p.code));
const ZOOM = [3.6, 2.9, 2.3, 1.8, 1.4, 1.1, 1];
const def: GameDef<ZoomPuzzle> = {
  id: 'who-was-here', generate,
  mount(root, p, ctx) {
    const ans = answerOf(p), wrong: number[] = [];
    let done = false, lost = false;
    const t = clock(ctx);
    const render = (): void => {
      const z = done || lost ? 1 : ZOOM[wrong.length]!;
      const text = done ? `It was the ${CAST[ans]!.name.toLowerCase()}! Found in ${wrong.length + 1} ${wrong.length ? 'guesses' : 'guess'}.` : lost ? `It was the ${CAST[ans]!.name.toLowerCase()}. A new close-up tomorrow.` : wrong.length ? `Not the ${CAST[wrong[wrong.length - 1]!]!.name.toLowerCase()}. Zooming out…` : 'Who is this? Each wrong guess zooms out a little.';
      root.innerHTML = `${coach(text, done ? 'good' : lost || wrong.length ? 'bad' : '')}<div class="card" style="display:grid; place-items:center"><div class="zoombox"><div style="transform:scale(${z}); transform-origin:${p.fx}% ${p.fy}%; transition:transform .5s ease">${CAST[ans]!.art()}</div></div><span class="pill p-w" style="margin-top:10px">Guesses left: ${6 - wrong.length - (done ? 1 : 0)}</span></div>
${done || lost ? '' : `<div class="answers">${range(CAST.length).map((k) => btn(`guess:${k}`, CAST[k]!.name, 'btn-w', wrong.includes(k))).join('')}</div>`}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done || lost || act !== 'guess') return;
      const k = Number(arg);
      if (k === ans) { done = true; const time = t.stop(); render(); const g = wrong.length + 1; ctx.onSolved({ time, hints: 0, moves: g, score: { value: String(g), label: g === 1 ? 'guess' : 'guesses' }, stars: g <= 2 ? 3 : g <= 4 ? 2 : 1 }); return; }
      wrong.push(k); if (wrong.length >= 6) { lost = true; t.stop(); }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
