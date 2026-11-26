// Acorn Thief: someone raided Squirrel's acorn stash. Five suspects stand in a line and each says one thing.
// Only the thief lies; everyone else tells the truth. Exactly one suspect fits (checked by a solver in the generator
// and the tests). The puzzle file holds only the suspects and what they said, never the answer.
import { character, type CharacterId } from '@wild-daily/ui';
import { btn, clock, coach, escapeHtml, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

/** Suspects come from the cast (Squirrel is the victim and Owl is the detective, so neither is a suspect). */
export const SUSPECTS: readonly CharacterId[] = ['fox', 'rabbit', 'deer', 'moose', 'bear', 'raccoon', 'skunk', 'wolf', 'coyote', 'bobcat', 'beaver', 'otter', 'frog', 'mouse'];
export const N = 5;
/** What a suspect says. `a`/`b` are positions in the line (0 = leftmost as you look at them). */
export type Claim =
  | { t: 'is'; a: number } | { t: 'not'; a: number } | { t: 'or'; a: number; b: number }
  | { t: 'next' } | { t: 'left' } | { t: 'right' };
export interface ThiefPuzzle { seed: string; line: CharacterId[]; says: Claim[] }

/** Is `c`, said by the suspect at position `i`, true when the thief is at position `thief`? */
export function holds(c: Claim, i: number, thief: number): boolean {
  switch (c.t) {
    case 'is': return thief === c.a;
    case 'not': return thief !== c.a;
    case 'or': return thief === c.a || thief === c.b;
    case 'next': return Math.abs(thief - i) === 1;
    case 'left': return thief < i;
    case 'right': return thief > i;
  }
}
/** Every position that could be the thief: the thief's claim is false and everyone else's is true. */
export function solveThief(p: Pick<ThiefPuzzle, 'says'>): number[] {
  return range(p.says.length).filter((t) => p.says.every((c, i) => holds(c, i, t) === (i !== t)));
}

function randomClaim(rng: () => number, i: number): Claim {
  const other = (): number => { let a = Math.floor(rng() * N); while (a === i) a = Math.floor(rng() * N); return a; };
  const r = rng();
  if (r < 0.22) return { t: 'not', a: other() };
  if (r < 0.36) return { t: 'is', a: other() };
  if (r < 0.56) { const a = other(); let b = other(); while (b === a) b = other(); return { t: 'or', a: Math.min(a, b), b: Math.max(a, b) }; }
  if (r < 0.74) return { t: 'next' };
  if (i === 0) return { t: 'right' };
  if (i === N - 1) return { t: 'left' };
  return rng() < 0.5 ? { t: 'left' } : { t: 'right' };
}
export function generate(seed: string): ThiefPuzzle {
  const rng = rngFrom('thief:' + seed);
  const line = shuffle(rng, SUSPECTS.slice()).slice(0, N);
  for (let a = 0; a < 2000; a++) {
    const says = range(N).map((i) => randomClaim(rng, i));
    // Exactly one thief, and no free giveaway: nobody truthful simply names the thief.
    const sol = solveThief({ says });
    if (sol.length !== 1) continue;
    const t = sol[0]!;
    if (says.some((c, i) => i !== t && c.t === 'is')) continue;
    // Real reasoning: at least three of the claims are needed (dropping any one of those leaves two or more suspects).
    const needed = range(N).filter((k) => range(N).filter((x) => says.every((c, i) => i === k || holds(c, i, x) === (i !== x))).length > 1).length;
    if (needed < 3) continue;
    return { seed, line, says };
  }
  throw new Error('acorn-thief: generation failed for ' + seed);
}

const NAME: Partial<Record<CharacterId, string>> = {};
export const nameOf = (a: CharacterId): string => NAME[a] ?? a[0]!.toUpperCase() + a.slice(1);
/** The claim in plain words, from the speaker's point of view. */
export function sayText(p: ThiefPuzzle, c: Claim): string {
  const n = (k: number): string => nameOf(p.line[k]!);
  switch (c.t) {
    case 'is': return `It was ${n(c.a)}!`;
    case 'not': return `${n(c.a)} didn't do it.`;
    case 'or': return `It was ${n(c.a)} or ${n(c.b)}.`;
    case 'next': return 'The thief is standing right next to me.';
    case 'left': return 'The thief is somewhere to my left.';
    case 'right': return 'The thief is somewhere to my right.';
  }
}

const def: GameDef<ThiefPuzzle> = {
  id: 'acorn-thief', generate,
  mount(root, p, ctx) {
    const sol = solveThief(p), thief = sol[0]!;
    const crossed = new Set<number>();
    let sel = -1, wrong = 0, hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const render = (): void => {
      const cards = range(N).map((i) => {
        const a = p.line[i]!, out = crossed.has(i);
        const mood = done ? (i === thief ? 'oops' : 'happy') : 'idle';
        const cls = ['suspect', sel === i ? 'sel' : '', out ? 'out' : '', done && i === thief ? 'caught' : ''].filter(Boolean).join(' ');
        return `<div class="${cls}">
<button type="button" class="suspect-pick" data-g="pick:${i}" aria-pressed="${sel === i}" aria-label="${escapeHtml(`${nameOf(a)}, position ${i + 1}, says: ${sayText(p, p.says[i]!)}${out ? '. Crossed off.' : ''}`)}"${done ? ' disabled' : ''}>
<span class="suspect-art">${character(a, mood)}</span><b class="suspect-name">${nameOf(a)}</b><span class="suspect-says">“${escapeHtml(sayText(p, p.says[i]!))}”</span></button>
${done ? '' : `<button type="button" class="suspect-cross" data-g="cross:${i}" aria-pressed="${out}" aria-label="${out ? 'Put back' : 'Cross off'} ${nameOf(a)}">${out ? 'Put back' : '✗ Not them'}</button>`}</div>`;
      }).join('');
      const text = done ? `Caught! ${nameOf(p.line[thief]!)} took the acorns, and only that claim was a lie.`
        : msg ?? (sel >= 0 ? `Accuse ${nameOf(p.line[sel]!)}? Check that everyone else is telling the truth first.` : 'Someone raided Squirrel’s acorns! Only the thief lies. Tap the suspect you think did it.');
      root.innerHTML = `${pills(`Suspects: ${N - crossed.size} left`, `Wrong guesses: ${wrong}`)}${coach(text, done ? 'good' : kind, 'owl')}<div class="lineup" role="group" aria-label="Suspects, left to right">${cards}</div>${tools(btn('hint', 'Hint', 'btn-y', done), btn('accuse', sel >= 0 ? `Accuse ${nameOf(p.line[sel]!)}` : 'Accuse', 'btn-p', done || sel < 0))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      const i = Number(arg);
      if (act === 'pick') sel = sel === i ? -1 : i;
      else if (act === 'cross') { if (crossed.has(i)) crossed.delete(i); else { crossed.add(i); if (sel === i) sel = -1; } }
      else if (act === 'hint') {
        const left = range(N).filter((k) => k !== thief && !crossed.has(k));
        if (left.length) { const k = left[0]!; crossed.add(k); if (sel === k) sel = -1; hints++; msg = `Hint: ${nameOf(p.line[k]!)} is telling the truth, so it’s not them.`; }
      } else if (act === 'accuse' && sel >= 0) {
        if (sel === thief) {
          done = true; const time = t.stop(); render();
          ctx.onSolved({ time, hints, moves: wrong, score: { value: String(wrong), label: wrong === 1 ? 'wrong guess' : 'wrong guesses' }, stars: !wrong && !hints ? 3 : wrong + hints <= 1 ? 2 : 1 });
          return;
        }
        wrong++; crossed.add(sel);
        msg = `Not ${nameOf(p.line[sel]!)}: that would make someone else a liar too. Try again.`; kind = 'bad'; sel = -1;
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
