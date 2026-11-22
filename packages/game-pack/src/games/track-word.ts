// Track Word: guess today's 5-letter animal in six tries. Green = right letter, right spot; yellow = in the word.
// Guesses must be animals from the list. The answer is scrambled in the puzzle file.
import { btn, clock, coach, onAct, range, rngFrom, scramble, unscramble, type GameDef } from '../shared.js';

export const WORDS: { w: string; hint: string }[] = [
  { w: 'MOOSE', hint: 'The largest deer in the world.' }, { w: 'OTTER', hint: 'Slides down muddy or snowy banks for fun.' },
  { w: 'SKUNK', hint: 'Black and white, with a famous smell.' }, { w: 'BISON', hint: 'A huge grazer of the plains.' },
  { w: 'MOUSE', hint: 'Tiny, and leaves tail drags in snow.' }, { w: 'SHREW', hint: 'One of the smallest mammals, always hungry.' },
  { w: 'EAGLE', hint: 'A big bird of prey with a hooked beak.' }, { w: 'RAVEN', hint: 'A clever black bird bigger than a crow.' },
  { w: 'ROBIN', hint: 'A songbird with a red or orange breast.' }, { w: 'FINCH', hint: 'A small seed-eating songbird.' },
  { w: 'HERON', hint: 'A tall bird that wades and spears fish.' }, { w: 'CRANE', hint: 'A tall bird famous for its dancing.' },
  { w: 'GOOSE', hint: 'Flies south in a V shape.' }, { w: 'QUAIL', hint: 'A small, plump ground bird.' },
  { w: 'EGRET', hint: 'A white wading bird.' }, { w: 'TROUT', hint: 'A spotted fish of cold streams.' },
  { w: 'PERCH', hint: 'A striped lake fish.' }, { w: 'SNAKE', hint: 'Leaves a wavy line in sand or dust.' },
  { w: 'STOAT', hint: 'Turns white in winter in snowy places.' }, { w: 'KOALA', hint: 'Sleeps in eucalyptus trees.' },
  { w: 'DINGO', hint: 'A wild dog of Australia.' }, { w: 'LLAMA', hint: 'A woolly animal from South America.' },
  { w: 'HORSE', hint: 'Leaves a single round hoof print.' }, { w: 'SHEEP', hint: 'Grows thick wool.' },
  { w: 'TIGER', hint: 'The largest wild cat.' }, { w: 'ZEBRA', hint: 'A striped horse of Africa.' }, { w: 'WHALE', hint: 'The biggest animal ever.' },
].filter((x) => x.hint);
export interface WordPuzzle { seed: string; code: string }
export function generate(seed: string): WordPuzzle {
  const rng = rngFrom('word:' + seed);
  return { seed, code: scramble(seed, WORDS[Math.floor(rng() * WORDS.length)]!.w) };
}
export const answerOf = (p: WordPuzzle): string => unscramble(p.seed, p.code);
export function colours(ans: string, g: string): ('g' | 'y' | 'x')[] {
  const out: ('g' | 'y' | 'x')[] = Array(5).fill('x'), left: string[] = [];
  for (let i = 0; i < 5; i++) { if (g[i] === ans[i]) out[i] = 'g'; else left.push(ans[i]!); }
  for (let i = 0; i < 5; i++) if (out[i] !== 'g') { const k = left.indexOf(g[i]!); if (k >= 0) { out[i] = 'y'; left.splice(k, 1); } }
  return out;
}
const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const def: GameDef<WordPuzzle> = {
  id: 'track-word', generate,
  mount(root, p, ctx) {
    const ans = answerOf(p), hintText = WORDS.find((x) => x.w === ans)?.hint ?? '', rows: string[] = [];
    let cur = '', done = false, lost = false, msg: string | null = null, kind = '', hints = 0;
    const t = clock(ctx);
    const render = (): void => {
      const known = new Map<string, string>();
      rows.forEach((r) => colours(ans, r).forEach((c, i) => { const ch = r[i]!, prev = known.get(ch); if (c === 'g' || (c === 'y' && prev !== 'g') || !prev) known.set(ch, c); }));
      const tiles = range(6).map((k) => { const r = rows[k] ?? (k === rows.length ? cur.padEnd(5) : '     '); const col = rows[k] ? colours(ans, rows[k]!) : null; return `<div class="wrow">${range(5).map((i) => `<span class="wtile ${col ? col[i] : r[i]!.trim() ? 'typed' : ''}">${r[i]!.trim()}</span>`).join('')}</div>`; }).join('');
      const kb = done || lost ? '' : `<div class="kb">${KEYS.map((row, ri) => `<div class="kbrow">${ri === 2 ? btn('enter', 'Enter', 'btn-p') : ''}${[...row].map((ch) => `<button type="button" class="key ${known.get(ch) ?? ''}" data-g="key:${ch}">${ch}</button>`).join('')}${ri === 2 ? btn('del', '⌫') : ''}</div>`).join('')}</div>`;
      const text = done ? `It’s the ${ans.toLowerCase()}! Solved in ${rows.length}.` : lost ? `The animal was: ${ans}. A new one tomorrow.` : msg ?? 'Guess a 5-letter animal. Green: right spot. Yellow: in the word, wrong spot.';
      root.innerHTML = `${coach(text, done ? 'good' : lost ? 'bad' : kind)}<div class="card stack" style="align-items:center">${tiles}</div>${kb}${done || lost ? '' : `<div class="row" style="justify-content:center">${btn('hint', hints ? `Clue: ${hintText}` : 'Show a clue', 'btn-y', hints > 0)}</div>`}`;
    };
    const off = onAct(root, (act, arg) => {
      if (done || lost) return; msg = null; kind = '';
      if (act === 'key' && cur.length < 5) cur += arg;
      else if (act === 'del') cur = cur.slice(0, -1);
      else if (act === 'hint') hints = 1;
      else if (act === 'enter') {
        if (cur.length < 5) { msg = 'Five letters, please.'; kind = 'bad'; }
        else if (!WORDS.some((x) => x.w === cur)) { msg = `“${cur}” isn’t on our animal list. Try another animal.`; kind = 'bad'; }
        else { rows.push(cur); const won = cur === ans; cur = ''; if (won) { done = true; const time = t.stop(); render(); const n = rows.length; ctx.onSolved({ time, hints, moves: n, stars: n <= 3 && !hints ? 3 : n <= 5 ? 2 : 1 }); return; } if (rows.length >= 6) { lost = true; t.stop(); } }
      }
      render();
    });
    render();
    return { destroy: () => { off(); t.kill(); } };
  },
};
export default def;
