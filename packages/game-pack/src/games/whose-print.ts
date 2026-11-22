// Whose Print?: five footprints, three choices each. Every answer links to a track guide.
import { print } from '@wild-daily/ui';
import { btn, clock, coach, onAct, range, rngFrom, scramble, shuffle, unscramble, type GameDef } from '../shared.js';

export const PRINTS = [
  { id: 'fox', name: 'Red fox', guide: 'fox', why: 'Four toes and a neat oval with a chevron-shaped heel bar.' },
  { id: 'rabbit', name: 'Rabbit', guide: 'rabbit', why: 'Long hind feet that land side by side, in front of the small front feet.' },
  { id: 'deer', name: 'White-tailed deer', guide: 'deer', why: 'A split heart made by two hoof halves.' },
  { id: 'squirrel', name: 'Gray squirrel', guide: 'squirrel', why: 'Small paired prints in boxy groups of four.' },
  { id: 'bird', name: 'Wild turkey', guide: 'turkey-and-birds', why: 'Three long toes pointing forward.' },
  { id: 'canid', name: 'Coyote', guide: 'coyote', why: 'An oval print with claw marks and an H-shaped gap.' },
  { id: 'hand', name: 'Raccoon', guide: 'raccoon', why: 'Five long toes, like a tiny hand.' },
  { id: 'cat', name: 'Bobcat', guide: 'bobcat', why: 'A round print with no claw marks.' },
  { id: 'skunk', name: 'Striped skunk', guide: 'skunk', why: 'Five toes with long claws on the front feet.' },
  { id: 'hoof', name: 'Moose', guide: 'moose', why: 'A giant split heart, much longer than a deer’s.' },
] as const;
export interface QuizPuzzle { seed: string; qs: { print: number; options: number[] }[]; code: string }
export function generate(seed: string): QuizPuzzle {
  const rng = rngFrom('quiz:' + seed), picks = shuffle(rng, range(PRINTS.length)).slice(0, 5);
  const qs = picks.map((k) => ({ print: k, options: shuffle(rng, [k, ...shuffle(rng, range(PRINTS.length).filter((x) => x !== k && !(k === 2 && x === 9) && !(k === 9 && x === 2))).slice(0, 2)]) }));
  return { seed, qs: qs.map((q) => ({ print: -1, options: q.options })), code: scramble(seed, picks.join(',')) };
}
export const answersOf = (p: QuizPuzzle): number[] => unscramble(p.seed, p.code).split(',').map(Number);
const def: GameDef<QuizPuzzle> = {
  id: 'whose-print', generate,
  mount(root, p, ctx) {
    const ans = answersOf(p), picked: number[] = [];
    let done = false;
    const t = clock(ctx);
    const render = (): void => {
      const q = picked.length, right = picked.filter((x, i) => x === ans[i]).length;
      if (q >= 5) {
        root.innerHTML = `${coach(`You got ${right} of 5 right!`, right >= 3 ? 'good' : '')}<div class="stack">${ans.map((a, i) => `<div class="card tight row" style="flex-wrap:nowrap">${print(PRINTS[a]!.id, 46)}<div><b>${picked[i] === a ? '✓' : '✗'} ${PRINTS[a]!.name}</b><div class="muted" style="font-size:14px">${PRINTS[a]!.why}</div><a href="/animals/${PRINTS[a]!.guide}" style="font-weight:800; font-size:14px">Read the guide</a></div></div>`).join('')}</div>`;
        return;
      }
      const a = ans[q]!, last = picked[q - 1], lastAns = ans[q - 1];
      root.innerHTML = `${coach(q && last !== undefined ? (last === lastAns ? `Right! ${PRINTS[lastAns!]!.why}` : `Not quite: that was the ${PRINTS[lastAns!]!.name.toLowerCase()}. ${PRINTS[lastAns!]!.why}`) : 'Whose footprint is this?', q && last === lastAns ? 'good' : q ? 'bad' : '')}
<div class="card stack" style="align-items:center"><span class="pill p-w">Question ${q + 1} of 5</span><div class="stage" style="height:160px; width:100%">${print(PRINTS[a]!.id, 110)}</div></div>
<div class="stack" style="gap:10px">${p.qs[q]!.options.map((o) => btn(`ans:${o}`, PRINTS[o]!.name, 'btn-w big')).join('')}</div>`;
    };
    const off = onAct(root, (act, arg) => {
      if (done || act !== 'ans') return;
      picked.push(Number(arg));
      if (picked.length === 5) { done = true; const time = t.stop(); render(); const right = picked.filter((x, i) => x === ans[i]).length; ctx.onSolved({ time, hints: 0, moves: right, stars: right === 5 ? 3 : right >= 3 ? 2 : 1 }); return; }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
