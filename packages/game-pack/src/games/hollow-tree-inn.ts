// Hollow Tree Inn: six guests arrive at a hollow tree with six rooms (two floors of three). Each guest has a wish.
// Put every guest in a room so that every wish comes true. Exactly one way works (checked by a solver in the generator
// and the tests). The puzzle file holds only the guests and their wishes, never the room plan.
import { character, type CharacterId } from '@wild-daily/ui';
import { btn, clock, coach, escapeHtml, onAct, pills, range, rngFrom, shuffle, tools, type GameDef } from '../shared.js';

/** Guests come from the cast. */
export const GUESTS: readonly CharacterId[] = ['fox', 'rabbit', 'deer', 'moose', 'bear', 'raccoon', 'skunk', 'wolf', 'squirrel', 'beaver', 'otter', 'frog', 'mouse'];
/** Rooms 0–5: 0–2 upstairs (left to right), 3–5 downstairs. */
export const ROOMS = 6;
export const floorOf = (r: number): number => Math.floor(r / 3);
export const colOf = (r: number): number => r % 3;
/** A wish. `a`/`b` are guest numbers (positions in the guest list). */
export type Wish =
  | { t: 'floor'; a: number; f: 0 | 1 } | { t: 'col'; a: number; c: 0 | 1 | 2 } | { t: 'corner'; a: number }
  | { t: 'above'; a: number; b: number } | { t: 'next'; a: number; b: number } | { t: 'apart'; a: number; b: number }
  | { t: 'left'; a: number; b: number };
export interface InnPuzzle { seed: string; guests: CharacterId[]; wishes: Wish[] }

/** Is the wish true when guest k is in room `room[k]`? */
export function wishHolds(w: Wish, room: readonly number[]): boolean {
  const ra = room[w.a]!, rb = 'b' in w ? room[w.b]! : -1;
  switch (w.t) {
    case 'floor': return floorOf(ra) === w.f;
    case 'col': return colOf(ra) === w.c;
    case 'corner': return colOf(ra) !== 1;
    case 'above': return colOf(ra) === colOf(rb) && floorOf(ra) === 0 && floorOf(rb) === 1;
    case 'next': return floorOf(ra) === floorOf(rb) && Math.abs(colOf(ra) - colOf(rb)) === 1;
    case 'apart': return !(floorOf(ra) === floorOf(rb) && Math.abs(colOf(ra) - colOf(rb)) === 1);
    case 'left': return colOf(ra) < colOf(rb);
  }
}
const PERMS: number[][] = (() => {
  const out: number[][] = [];
  const go = (cur: number[], left: number[]): void => { if (!left.length) { out.push(cur); return; } left.forEach((x, i) => go([...cur, x], left.filter((_, j) => j !== i))); };
  go([], range(ROOMS));
  return out;
})();
/** Every room plan (room[guest]) that makes every wish true, up to `limit`. */
export function solveInn(p: Pick<InnPuzzle, 'wishes'>, limit = 2): number[][] {
  const out: number[][] = [];
  for (const room of PERMS) { if (p.wishes.every((w) => wishHolds(w, room))) { out.push(room); if (out.length >= limit) break; } }
  return out;
}
/** Every wish that is true for this room plan (the generator picks from these). */
function trueWishes(room: number[]): Wish[] {
  const all: Wish[] = [];
  for (let a = 0; a < ROOMS; a++) {
    all.push({ t: 'floor', a, f: floorOf(room[a]!) as 0 | 1 }, { t: 'col', a, c: colOf(room[a]!) as 0 | 1 | 2 });
    if (colOf(room[a]!) !== 1) all.push({ t: 'corner', a });
    for (let b = 0; b < ROOMS; b++) {
      if (a === b) continue;
      for (const t of ['above', 'next', 'apart', 'left'] as const) {
        if (t !== 'above' && t !== 'left' && b < a) continue; // next/apart are symmetric
        const w = { t, a, b } as Wish; if (wishHolds(w, room)) all.push(w);
      }
    }
  }
  return all;
}
/** How often each kind of wish is offered: mostly wishes about two guests, which make the best reasoning. */
const WEIGHT: Record<Wish['t'], number> = { floor: 1, col: 0.6, corner: 1, above: 2, next: 2, apart: 1.6, left: 1.6 };
export function generate(seed: string): InnPuzzle {
  const rng = rngFrom('inn:' + seed);
  const guests = shuffle(rng, GUESTS.slice()).slice(0, ROOMS);
  for (let tries = 0; tries < 200; tries++) {
    const room = shuffle(rng, range(ROOMS));
    const pool = trueWishes(room).map((w) => ({ w, k: rng() ** (1 / WEIGHT[w.t]) })).sort((x, y) => y.k - x.k).map((x) => x.w);
    // Add wishes until only one room plan is left, then drop any wish the others already imply.
    const wishes: Wish[] = [];
    for (const w of pool) { wishes.push(w); if (solveInn({ wishes }).length === 1) break; }
    if (solveInn({ wishes }).length !== 1) continue;
    for (let i = wishes.length - 1; i >= 0; i--) { const rest = wishes.filter((_, j) => j !== i); if (solveInn({ wishes: rest }).length === 1) wishes.splice(i, 1); }
    // A fair daily puzzle: between 5 and 8 wishes, at most two that place a guest on their own, and every guest named.
    const single = wishes.filter((w) => w.t === 'floor' || w.t === 'col' || w.t === 'corner').length;
    const named = new Set(wishes.flatMap((w) => ('b' in w ? [w.a, w.b] : [w.a])));
    if (wishes.length < 5 || wishes.length > 8 || single > 2 || named.size < ROOMS - 1) continue;
    return { seed, guests, wishes: shuffle(rng, wishes) };
  }
  throw new Error('hollow-tree-inn: generation failed for ' + seed);
}

export const nameOf = (a: CharacterId): string => a[0]!.toUpperCase() + a.slice(1);
/** The wish in plain, friendly words. */
export function wishText(p: InnPuzzle, w: Wish): string {
  const A = nameOf(p.guests[w.a]!), B = 'b' in w ? nameOf(p.guests[w.b]!) : '';
  switch (w.t) {
    case 'floor': return w.f === 0 ? `${A} wants a room upstairs, for the view.` : `${A} wants a room downstairs. No stairs, please!`;
    case 'col': return [`${A} wants a room on the left.`, `${A} wants a middle room.`, `${A} wants a room on the right.`][w.c]!;
    case 'corner': return `${A} wants a corner room (left or right, not the middle).`;
    case 'above': return `${A} must be right above ${B}, to keep an eye on them.`;
    case 'next': return `${A} and ${B} are best friends: rooms side by side.`;
    case 'apart': return `${A} snores! ${B} won’t sleep next door to them.`;
    case 'left': return `${A}’s room must be somewhere left of ${B}’s.`;
  }
}

const def: GameDef<InnPuzzle> = {
  id: 'hollow-tree-inn', generate,
  mount(root, p, ctx) {
    const sol = solveInn(p, 1)[0]!;
    const room: (number | null)[] = p.guests.map(() => null); // room of each guest, or null while in the queue
    let sel = 0, hints = 0, moves = 0, done = false, msg: string | null = null, kind = '';
    const t = clock(ctx);
    const who = (r: number): number => room.indexOf(r);
    /** A wish is settled once every guest it names has a room: then it is either kept or broken. */
    const state = (w: Wish): 'ok' | 'bad' | '' => {
      const names = 'b' in w ? [w.a, w.b] : [w.a];
      if (names.some((k) => room[k] === null)) return '';
      return wishHolds(w, room as number[]) ? 'ok' : 'bad';
    };
    const render = (): void => {
      const placed = room.filter((r) => r !== null).length, broken = p.wishes.filter((w) => state(w) === 'bad').length;
      const rooms = range(ROOMS).map((r) => {
        const g = who(r), label = `${floorOf(r) ? 'Downstairs' : 'Upstairs'}, ${['left', 'middle', 'right'][colOf(r)]} room: ${g >= 0 ? nameOf(p.guests[g]!) : 'empty'}`;
        return `<button type="button" class="inn-room${g >= 0 ? ' full' : ''}${g >= 0 && g === sel ? ' sel' : ''}" data-g="room:${r}" aria-label="${label}"${done ? ' disabled' : ''}>${g >= 0 ? character(p.guests[g]!, done ? 'happy' : 'idle') : '<span class="inn-empty" aria-hidden="true"></span>'}</button>`;
      }).join('');
      const queue = p.guests.map((a, k) => room[k] !== null ? '' : `<button type="button" class="inn-guest${k === sel ? ' sel' : ''}" data-g="guest:${k}" aria-pressed="${k === sel}" aria-label="${nameOf(a)}, waiting for a room"><span class="inn-art">${character(a, 'idle')}</span><b>${nameOf(a)}</b></button>`).join('');
      const list = p.wishes.map((w) => { const s = state(w); return `<li class="inn-wish ${s}"><span class="inn-mark" aria-hidden="true">${s === 'ok' ? '✓' : s === 'bad' ? '✗' : ''}</span><span>${escapeHtml(wishText(p, w))}${s === 'bad' ? '<span class="sr"> (broken)</span>' : s === 'ok' ? '<span class="sr"> (kept)</span>' : ''}</span></li>`; }).join('');
      const text = done ? 'Every guest is happy! The inn is fully booked.'
        : msg ?? (sel >= 0 && room[sel] === null ? `Where should ${nameOf(p.guests[sel]!)} stay? Tap a room.` : sel >= 0 ? `Moving ${nameOf(p.guests[sel]!)}: tap another room, or the same room to send them back to the queue.` : 'Tap a guest, then a room. Every wish must come true.');
      root.innerHTML = `${pills(`Guests in rooms: ${placed} of ${ROOMS}`, `Broken wishes: ${broken}`)}${coach(text, done ? 'good' : kind, 'owl')}
<div class="inn"><div class="inn-tree" role="group" aria-label="The inn: two floors of three rooms">${rooms}</div>
<div class="inn-side"><div class="inn-queue" role="group" aria-label="Guests waiting">${queue || '<p class="muted" style="margin:0">Everyone has a room.</p>'}</div>
<ol class="inn-wishes" aria-label="Wishes">${list}</ol></div></div>
${tools(btn('clear', 'Clear', 'btn-w', done || placed === 0), btn('hint', 'Hint', 'btn-y', done))}`;
    };
    const finish = (): void => {
      if (room.some((r) => r === null) || !p.wishes.every((w) => wishHolds(w, room as number[]))) return;
      done = true; const time = t.stop(); render();
      ctx.onSolved({ time, hints, moves, score: { value: String(hints), label: hints === 1 ? 'hint' : 'hints' }, stars: hints === 0 ? 3 : hints === 1 ? 2 : 1 });
    };
    const off = onAct(root, (act, arg) => {
      if (done) return; msg = null; kind = '';
      const i = Number(arg);
      if (act === 'guest') sel = sel === i ? -1 : i;
      else if (act === 'room') {
        const g = who(i);
        if (g >= 0 && g === sel) { room[sel] = null; } // the selected guest's own room: back to the queue
        else if (g >= 0 && (sel < 0 || room[sel] === null)) sel = g; // a guest in a room: pick them up to move them
        else if (sel < 0) { /* empty room, nobody selected: nothing to do */ }
        else {
          const from = room[sel]!;
          if (g >= 0) room[g] = from; // swap: the guest already there moves to the room we came from (or the queue)
          room[sel] = i; moves++;
          const next = room.findIndex((r) => r === null);
          sel = next;
          const broke = p.wishes.filter((w) => state(w) === 'bad' && ('b' in w ? [w.a, w.b] : [w.a]).includes(room.indexOf(i)));
          if (broke.length) { msg = `That breaks a wish: “${wishText(p, broke[0]!)}”`; kind = 'bad'; }
        }
      } else if (act === 'clear') { room.fill(null); sel = 0; }
      else if (act === 'hint') {
        // Hints come from solving the visible puzzle: send a guest in the wrong room back, or seat one correctly.
        const wrong = room.findIndex((r, k) => r !== null && r !== sol[k]);
        if (wrong >= 0) { room[wrong] = null; sel = wrong; msg = `Hint: ${nameOf(p.guests[wrong]!)} is in the wrong room.`; }
        else {
          const k = sel >= 0 && room[sel] === null ? sel : room.findIndex((r) => r === null);
          if (k >= 0) { const g = who(sol[k]!); if (g >= 0) room[g] = null; room[k] = sol[k]!; sel = room.findIndex((r) => r === null); msg = `Hint: ${nameOf(p.guests[k]!)} belongs in this room.`; }
        }
        hints++;
      }
      render(); finish();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
