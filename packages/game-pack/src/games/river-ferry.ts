// River Ferry: get everyone across the river on a little raft. The raft holds two and needs a paddler aboard,
// and some pairs can't be left on a bank without a paddler to keep the peace. A move game: every puzzle is solvable
// (checked by a solver in the generator and the tests), and `best` is the fewest crossings. The file holds no route.
import { character, type CharacterId } from '@wild-daily/ui';
import { btn, clock, coach, escapeHtml, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

/** Animals that can paddle, and animals that ride along. */
export const PADDLERS: readonly CharacterId[] = ['beaver', 'otter', 'moose', 'bear'];
export const RIDERS: readonly CharacterId[] = ['fox', 'rabbit', 'skunk', 'raccoon', 'squirrel', 'mouse', 'frog', 'wolf', 'deer', 'coyote'];
export const CAPACITY = 2;
/** Why a pair can't be left alone. Silly, never about anyone getting hurt. */
export const SQUABBLES: readonly string[] = [
  'A tells B terrible jokes until B runs off.',
  'A and B argue about whose tail is fluffier.',
  'A eats all of B’s snacks.',
  'A and B have a staring contest that never ends.',
  'A sings, very loudly, and B can’t stand it.',
  'A keeps borrowing B’s hat.',
];
export interface FerryPuzzle { seed: string; animals: CharacterId[]; paddlers: number[]; pairs: [number, number, number][]; best: number }
/** A state: bit k set = animal k is on the far bank; raft 0 = near bank, 1 = far bank. */
export interface FerryState { far: number; raft: 0 | 1 }

const bit = (k: number): number => 1 << k;
/** Is a bank (a set of animals, as bits) peaceful? Yes if it has a paddler, or no squabbling pair on it. */
export function bankOk(p: Pick<FerryPuzzle, 'paddlers' | 'pairs'>, bank: number): boolean {
  if (p.paddlers.some((k) => bank & bit(k))) return true;
  return !p.pairs.some(([a, b]) => bank & bit(a) && bank & bit(b));
}
/** Can these animals cross together from the raft's bank, and leave a peaceful bank behind? */
export function canCross(p: Pick<FerryPuzzle, 'animals' | 'paddlers' | 'pairs'>, s: FerryState, riders: number[]): boolean {
  const all = bit(p.animals.length) - 1, here = s.raft ? s.far : all & ~s.far;
  if (riders.length < 1 || riders.length > CAPACITY || new Set(riders).size !== riders.length) return false;
  if (!riders.every((k) => here & bit(k))) return false;
  if (!riders.some((k) => p.paddlers.includes(k))) return false;
  const left = riders.reduce((b, k) => b & ~bit(k), here);
  return bankOk(p, left);
}
export function cross(s: FerryState, riders: number[]): FerryState {
  const m = riders.reduce((b, k) => b | bit(k), 0);
  return { far: s.raft ? s.far & ~m : s.far | m, raft: s.raft ? 0 : 1 };
}
const groups = (n: number): number[][] => [...range(n).map((a) => [a]), ...range(n).flatMap((a) => range(n).filter((b) => b > a).map((b) => [a, b]))];
/** Fewest crossings from `s` to everyone across, as the list of rider groups; null if it can't be done. */
export function solveFerry(p: Pick<FerryPuzzle, 'animals' | 'paddlers' | 'pairs'>, s: FerryState = { far: 0, raft: 0 }): number[][] | null {
  const n = p.animals.length, goal = bit(n) - 1, key = (x: FerryState): number => x.far * 2 + x.raft;
  const prev = new Map<number, [number, number[]] | null>([[key(s), null]]), q: FerryState[] = [s], gs = groups(n);
  while (q.length) {
    const cur = q.shift()!;
    if (cur.far === goal) {
      const route: number[][] = []; let k = key(cur);
      for (let e = prev.get(k); e; e = prev.get(k)) { route.unshift(e[1]); k = e[0]; }
      return route;
    }
    for (const g of gs) {
      if (!canCross(p, cur, g)) continue;
      const nx = cross(cur, g), nk = key(nx);
      if (!prev.has(nk)) { prev.set(nk, [key(cur), g]); q.push(nx); }
    }
  }
  return null;
}

export function generate(seed: string): FerryPuzzle {
  const rng = rngFrom('ferry:' + seed);
  for (let tries = 0; tries < 400; tries++) {
    // One paddler and 3 or 4 riders (with two paddlers the squabbles never make the trip longer, so it isn't a puzzle).
    const nPad = 1, nRide = 3 + Math.floor(rng() * 2);
    const animals = [...shuffle(rng, PADDLERS.slice()).slice(0, nPad), ...shuffle(rng, RIDERS.slice()).slice(0, nRide)];
    const order = shuffle(rng, range(animals.length));
    const ordered = order.map((k) => animals[k]!), paddlers = order.map((k, i) => (k < nPad ? i : -1)).filter((i) => i >= 0);
    const riders = range(ordered.length).filter((i) => !paddlers.includes(i));
    const all = riders.flatMap((a) => riders.filter((b) => b > a).map((b) => [a, b] as [number, number]));
    const nPairs = 1 + Math.floor(rng() * Math.min(4, all.length));
    const pairs = shuffle(rng, all).slice(0, nPairs).map(([a, b]) => [a, b, Math.floor(rng() * SQUABBLES.length)] as [number, number, number]);
    const p = { animals: ordered, paddlers, pairs };
    const route = solveFerry(p);
    // A real puzzle: solvable, and the squabbles make it longer than just ferrying everyone over.
    if (!route || route.length < 7 || route.length > 13) continue;
    const easy = solveFerry({ ...p, pairs: [] })!;
    if (route.length <= easy.length) continue;
    return { seed, animals: ordered, paddlers, pairs, best: route.length };
  }
  throw new Error('river-ferry: generation failed for ' + seed);
}

export const nameOf = (a: CharacterId): string => a[0]!.toUpperCase() + a.slice(1);
export function squabbleText(p: FerryPuzzle, [a, b, w]: [number, number, number]): string {
  return SQUABBLES[w]!.replace(/\bA\b/g, nameOf(p.animals[a]!)).replace(/\bB\b/g, nameOf(p.animals[b]!));
}

const def: GameDef<FerryPuzzle> = {
  id: 'river-ferry', generate,
  mount(root, p, ctx) {
    const n = p.animals.length;
    let s: FerryState = { far: 0, raft: 0 }, aboard: number[] = [], moves = 0, hints = 0, done = false, msg: string | null = null, kind = '';
    const hist: FerryState[] = [];
    const t = clock(ctx);
    const padNames = p.paddlers.map((k) => nameOf(p.animals[k]!));
    const onFar = (k: number): boolean => !!(s.far & bit(k));
    const render = (): void => {
      const animal = (k: number): string => {
        const on = aboard.includes(k), side = onFar(k) ? 'far' : 'near', here = (s.raft === 1) === onFar(k);
        return `<button type="button" class="fy-animal${on ? ' on' : ''}${p.paddlers.includes(k) ? ' pad' : ''}" data-g="tap:${k}" aria-pressed="${on}" aria-label="${nameOf(p.animals[k]!)}${p.paddlers.includes(k) ? ', can paddle' : ''}, ${on ? 'on the raft' : (side === 'far' ? 'on the other side' : 'on the start bank')}"${done || !here ? ' disabled' : ''}>${character(p.animals[k]!, done ? 'happy' : 'idle')}<b>${nameOf(p.animals[k]!)}</b>${p.paddlers.includes(k) ? '<small>paddles</small>' : ''}</button>`;
      };
      const bank = (far: boolean): string => range(n).filter((k) => onFar(k) === far && !aboard.includes(k)).map(animal).join('') || '<span class="fy-none">Nobody here</span>';
      const raft = `<div class="fy-raft ${s.raft ? 'at-far' : 'at-near'}" aria-label="The raft, at ${s.raft ? 'the other side' : 'the start bank'}">${aboard.map(animal).join('') || '<span class="fy-none">Empty raft</span>'}</div>`;
      const rules = [`<li><b>Raft:</b> holds ${CAPACITY}, and only ${padNames.join(' and ')} can paddle.</li>`, ...p.pairs.map((pr) => `<li><b>${nameOf(p.animals[pr[0]]!)} and ${nameOf(p.animals[pr[1]]!)}</b> can’t be left without a paddler: ${escapeHtml(squabbleText(p, pr))}</li>`)].join('');
      const text = done ? `Everyone made it across in ${moves} crossings!${moves <= p.best ? ' That’s the best possible.' : ` The best is ${p.best}.`}`
        : msg ?? (aboard.length ? `${aboard.map((k) => nameOf(p.animals[k]!)).join(' and ')} ${aboard.length > 1 ? 'are' : 'is'} on the raft. Tap Cross, or add one more.` : 'Tap animals on the raft’s bank to put them on the raft, then Cross.');
      root.innerHTML = `${pills(`Crossings: ${moves}`, `Best: ${p.best}`)}${coach(text, done ? 'good' : kind, 'beaver')}
<div class="fy-river"><div class="fy-bank near" role="group" aria-label="Start bank"><span class="fy-label">Start</span>${bank(false)}</div><div class="fy-water">${raft}</div><div class="fy-bank far" role="group" aria-label="Other side"><span class="fy-label">Other side</span>${bank(true)}</div></div>
<ul class="fy-rules">${rules}</ul>
${tools(btn('undo', 'Undo', 'btn-w', done || !hist.length), btn('hint', 'Hint', 'btn-y', done), btn('go', `Cross ${s.raft ? '←' : '→'}`, 'btn-p', done || !aboard.length))}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      if (act === 'tap') {
        const k = Number(arg);
        if (aboard.includes(k)) aboard = aboard.filter((x) => x !== k);
        else if (aboard.length < CAPACITY) aboard = [...aboard, k];
        else { msg = `The raft holds only ${CAPACITY}. Tap someone on the raft to let them off first.`; kind = 'bad'; }
      } else if (act === 'go') {
        if (!aboard.some((k) => p.paddlers.includes(k))) { msg = `Nobody on the raft can paddle! Only ${padNames.join(' and ')} can.`; kind = 'bad'; }
        else if (!canCross(p, s, aboard)) {
          const all = bit(n) - 1, here = s.raft ? s.far : all & ~s.far, left = aboard.reduce((b, k) => b & ~bit(k), here);
          const pr = p.pairs.find(([a, b]) => left & bit(a) && left & bit(b))!;
          msg = `Uh oh: that leaves ${nameOf(p.animals[pr[0]]!)} and ${nameOf(p.animals[pr[1]]!)} without a paddler. ${squabbleText(p, pr)}`; kind = 'bad';
        } else {
          hist.push(s); s = cross(s, aboard); aboard = []; moves++;
          if (s.far === bit(n) - 1) {
            done = true; const time = t.stop(); render();
            ctx.onSolved({ time, hints, moves, score: { value: String(moves), label: moves === 1 ? 'crossing' : 'crossings' }, stars: hints === 0 && moves <= p.best ? 3 : moves <= p.best + 2 && hints <= 1 ? 2 : 1 });
            return;
          }
        }
      } else if (act === 'undo') { const prev = hist.pop(); if (prev) { s = prev; aboard = []; moves--; } }
      else if (act === 'hint') {
        // Hints come from solving the visible puzzle from where the raft is now.
        const route = solveFerry(p, s);
        if (route?.length) { aboard = route[0]!.slice(); hints++; msg = `Hint: send ${aboard.map((k) => nameOf(p.animals[k]!)).join(' and ')} across next.`; }
        else { msg = 'From here nobody can get everyone across. Tap Undo to go back a crossing.'; kind = 'bad'; hints++; }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
