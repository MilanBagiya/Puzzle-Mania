// Who Ate the Berries?: match each animal to the snack it ate and where it ate it, using the clues.
// Exactly one answer; the browser checks your answer against the clues (no answer is stored).
import { btn, clock, coach, onAct, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

export const ANIMALS = ['Fox', 'Rabbit', 'Deer', 'Squirrel'] as const;
export const SNACKS = ['berries', 'acorns', 'clover', 'seeds'] as const;
export const PLACES = ['the pond', 'the hill', 'the meadow', 'the old oak'] as const;
export type Clue = { t: 'snack' | 'nosnack'; a: number; s: number } | { t: 'place' | 'noplace'; a: number; p: number } | { t: 'link' | 'nolink'; s: number; p: number };
export interface WhoPuzzle { seed: string; clues: Clue[]; text: string[] }
type Assign = { snack: number[]; place: number[] }; // index = animal
const perms = (n: number): number[][] => { if (n === 1) return [[0]]; const out: number[][] = []; perms(n - 1).forEach((p) => { for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]); }); return out; };
const P4 = perms(4);
export const holds = (c: Clue, x: Assign): boolean => {
  switch (c.t) {
    case 'snack': return x.snack[c.a] === c.s;
    case 'nosnack': return x.snack[c.a] !== c.s;
    case 'place': return x.place[c.a] === c.p;
    case 'noplace': return x.place[c.a] !== c.p;
    case 'link': return x.snack.indexOf(c.s) === x.place.indexOf(c.p);
    case 'nolink': return x.snack.indexOf(c.s) !== x.place.indexOf(c.p);
  }
};
export const text = (c: Clue): string => {
  switch (c.t) {
    case 'snack': return `The ${ANIMALS[c.a]!.toLowerCase()} ate the ${SNACKS[c.s]}.`;
    case 'nosnack': return `The ${ANIMALS[c.a]!.toLowerCase()} didn’t eat the ${SNACKS[c.s]}.`;
    case 'place': return `The ${ANIMALS[c.a]!.toLowerCase()} was at ${PLACES[c.p]}.`;
    case 'noplace': return `The ${ANIMALS[c.a]!.toLowerCase()} wasn’t at ${PLACES[c.p]}.`;
    case 'link': return `Whoever ate the ${SNACKS[c.s]} was at ${PLACES[c.p]}.`;
    case 'nolink': return `Whoever ate the ${SNACKS[c.s]} wasn’t at ${PLACES[c.p]}.`;
  }
};
const ALL: Assign[] = P4.flatMap((s) => P4.map((p) => ({ snack: s, place: p })));
export const fitsAll = (cl: Clue[], x: Assign): boolean => cl.every((c) => holds(c, x));
export const solveWho = (p: Pick<WhoPuzzle, 'clues'>): Assign | null => { const f = ALL.filter((x) => fitsAll(p.clues, x)); return f.length === 1 ? f[0]! : null; };
export function generate(seed: string): WhoPuzzle {
  const rng = rngFrom('who:' + seed);
  for (let a = 0; a < 200; a++) {
    const ans = { snack: shuffle(rng, range(4)), place: shuffle(rng, range(4)) };
    let cand = ALL.slice(), clues: Clue[] = [];
    for (let g = 0; g < 600 && cand.length > 1; g++) {
      const r = rng(), A = Math.floor(rng() * 4), S = Math.floor(rng() * 4), Pp = Math.floor(rng() * 4);
      const c: Clue = r < 0.08 ? { t: 'snack', a: A, s: ans.snack[A]! } : r < 0.3 ? { t: 'nosnack', a: A, s: S } : r < 0.38 ? { t: 'place', a: A, p: ans.place[A]! } : r < 0.6 ? { t: 'noplace', a: A, p: Pp } : r < 0.75 ? { t: 'link', s: S, p: ans.place[ans.snack.indexOf(S)]! } : { t: 'nolink', s: S, p: Pp };
      if (!holds(c, ans)) continue;
      const next = cand.filter((x) => holds(c, x));
      if (next.length === cand.length) continue;
      cand = next; clues.push(c);
    }
    if (cand.length !== 1) continue;
    for (let i = clues.length - 1; i >= 0; i--) { const rest = clues.filter((_, j) => j !== i); if (ALL.filter((x) => fitsAll(rest, x)).length === 1) clues = rest; }
    if (clues.length >= 4 && clues.length <= 9) return { seed, clues, text: clues.map(text) };
  }
  throw new Error('who-ate: generation failed for ' + seed);
}
const def: GameDef<WhoPuzzle> = {
  id: 'who-ate', generate,
  mount(root, p, ctx) {
    const pick = { snack: [-1, -1, -1, -1], place: [-1, -1, -1, -1] };
    let hints = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const render = (): void => {
      const rows = ANIMALS.map((a, i) => `<div class="card tight stack" style="gap:8px"><b class="display" style="font-size:19px">${a}</b>
<div class="chips">${SNACKS.map((s, k) => `<button type="button" class="tab" style="flex:0 0 auto; padding:6px 12px" aria-selected="${pick.snack[i] === k}" data-g="snack:${i}-${k}">${s}</button>`).join('')}</div>
<div class="chips">${PLACES.map((pl, k) => `<button type="button" class="tab" style="flex:0 0 auto; padding:6px 12px" aria-selected="${pick.place[i] === k}" data-g="place:${i}-${k}">${pl.replace('the ', '')}</button>`).join('')}</div></div>`).join('');
      const text2 = done ? 'Case closed! Every snack is accounted for.' : msg ?? 'Each animal ate one snack in one place, and no two match. Use the clues, then tap Check.';
      root.innerHTML = `<div class="card stack"><b>Clues</b><ol style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:6px">${p.text.map((c) => `<li>${c}</li>`).join('')}</ol></div>${coach(text2, done ? 'good' : kind)}<div class="stack" style="gap:12px">${rows}</div>${tools(btn('clear', 'Clear', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'snack' || act === 'place') {
        const [i, k] = arg.split('-').map(Number) as [number, number], arr = pick[act];
        arr.forEach((v, j) => { if (v === k && j !== i) arr[j] = -1; });
        arr[i] = arr[i] === k ? -1 : k;
      } else if (act === 'clear') { pick.snack.fill(-1); pick.place.fill(-1); }
      else if (act === 'hint') {
        const s = solveWho(p)!;
        const i = range(4).find((x) => pick.snack[x] !== s.snack[x] || pick.place[x] !== s.place[x]);
        if (i !== undefined) {
          for (const key of ['snack', 'place'] as const) { const want = s[key][i]!; pick[key].forEach((v, j) => { if (v === want) pick[key][j] = -1; }); pick[key][i] = want; }
          hints++; msg = `Hint: the ${ANIMALS[i]!.toLowerCase()} is filled in.`;
        }
      } else if (act === 'check') {
        if (pick.snack.every((v) => v >= 0) && pick.place.every((v) => v >= 0) && fitsAll(p.clues, pick)) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
        msg = pick.snack.includes(-1) || pick.place.includes(-1) ? 'Pick a snack and a place for every animal.' : 'At least one clue isn’t true for your answer.'; kind = 'bad';
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
