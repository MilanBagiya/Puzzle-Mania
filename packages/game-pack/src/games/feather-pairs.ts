// Feather Pairs: flip two cards at a time to find matching pairs. Fewer flips earn more paws.
import { bird, character, print } from '@wild-daily/ui';
import { clock, coach, onAct, pills, range, rngFrom, shuffle, type GameDef } from '../shared.js';

const FACES = [() => print('fox', 40), () => print('rabbit', 38), () => print('deer', 36), () => print('hand', 38), () => character('fox', 'happy', 48), () => character('rabbit', 'happy', 48), () => bird('#E2594A', 44), () => bird('#3F86D3', 44), () => print('cat', 38), () => character('deer', 'happy', 48)];
export interface PairsPuzzle { seed: string; cards: number[] }
export function generate(seed: string): PairsPuzzle {
  const rng = rngFrom('pairs:' + seed), faces = shuffle(rng, range(FACES.length)).slice(0, 8);
  return { seed, cards: shuffle(rng, [...faces, ...faces]) };
}
const def: GameDef<PairsPuzzle> = {
  id: 'feather-pairs', generate,
  mount(root, p, ctx) {
    const found = new Set<number>(); let open: number[] = [], flips = 0, done = false, lock = false;
    const t = clock(ctx);
    const render = (): void => {
      const cells = p.cards.map((f, i) => { const up = found.has(i) || open.includes(i); return `<button type="button" class="pcard${up ? ' up' : ''}${found.has(i) ? ' found' : ''}" data-g="flip:${i}" aria-label="${up ? 'Card showing' : 'Hidden card'}">${up ? FACES[f]!() : '<span class="pback"></span>'}</button>`; }).join('');
      root.innerHTML = `${pills(`Pairs: ${found.size / 2} of 8`, `Flips: ${flips}`)}${coach(done ? `All pairs found in ${flips} flips!` : 'Flip two cards. Matching pairs stay face up.', done ? 'good' : '')}<div class="boardwrap"><div class="board" style="grid-template-columns:repeat(4,1fr); max-width:420px">${cells}</div></div>`;
    };
    const off = onAct(root, (act, arg) => {
      if (done || lock || act !== 'flip') return;
      const i = Number(arg); if (found.has(i) || open.includes(i)) return;
      open.push(i); flips++;
      if (open.length === 2) {
        const [a, b] = open as [number, number];
        if (p.cards[a] === p.cards[b]) { found.add(a); found.add(b); open = []; if (found.size === 16) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints: 0, moves: flips, stars: flips <= 26 ? 3 : flips <= 36 ? 2 : 1 }); return; } }
        else { lock = true; render(); setTimeout(() => { open = []; lock = false; render(); }, 800); return; }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
