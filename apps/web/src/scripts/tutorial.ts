// One-minute guided tutorial on a hand-made 4×4 board.
import { loadProgress, saveProgress } from '@wild-daily/core';
import { ANIMAL_NAME, ANIMAL_SHORT, burrow, character, print, rock, tree, type AnimalId } from '@wild-daily/ui';

const ROCKS = [4], TREES = [15];
const HOMES: Record<number, AnimalId> = { 3: 'fox', 10: 'rabbit' };
const PRINTS: Record<number, AnimalId> = { 12: 'fox', 9: 'fox', 6: 'fox', 0: 'rabbit', 8: 'rabbit' };
const STEPS: { a: AnimalId; cell: number; say: string }[] = [
  { a: 'fox', cell: 12, say: 'Meet the fox. It walked into the snow from the edge. Tap its orange print on the bottom edge to start its trail.' },
  { a: 'fox', cell: 9, say: 'The fox walks 1 square diagonally. Tap the next orange print, up and to the right.' },
  { a: 'fox', cell: 6, say: 'Nice tracking! Keep following the prints diagonally.' },
  { a: 'fox', cell: 3, say: 'Now walk the fox into the burrow in the corner.' },
  { a: 'rabbit', cell: 0, say: 'The fox is home and happy! Now the rabbit: tap its blue print in the top-left corner.' },
  { a: 'rabbit', cell: 8, say: 'Rabbits hop exactly 2 squares in a straight line. Tap where it landed, 2 squares down.' },
  { a: 'rabbit', cell: 10, say: 'Last hop: 2 squares to the right, into the empty burrow.' },
];
let step = 0, wrong = -1, msg: string | null = null, timer = 0;
const box = document.getElementById('tut') as HTMLElement;
function render(): void {
  const done = step >= STEPS.length, cur = done ? null : STEPS[step]!;
  if (done) { const p = loadProgress(); if (!p.tutorialDone) { p.tutorialDone = true; p.tutorialSeen = true; saveProgress(p); } }
  const placed: Record<number, { a: AnimalId; no: number }> = {};
  STEPS.slice(0, step).forEach((s, k) => { placed[s.cell] = { a: s.a, no: s.a === 'fox' ? k + 1 : k - 3 }; });
  const cells = [...Array(16).keys()].map((i) => {
    let cls = 'cell', inner = '';
    const home = HOMES[i], pl = placed[i];
    if (ROCKS.includes(i)) { inner = rock(); cls += ' blocked'; }
    else if (TREES.includes(i)) { inner = tree(); cls += ' blocked'; }
    else if (home) inner = pl ? character(home, 'happy', undefined, 'cheer') : burrow();
    else { const pr = PRINTS[i]; if (pr) inner = `<span class="prints">${print(pr)}</span>`; if (pl) { cls += ' st-' + pl.a; inner += `<span class="badge ${pl.a}">${pl.no}</span>`; } }
    if (cur && i === cur.cell) cls += ' next';
    if (i === wrong) cls += ' bad';
    return `<button type="button" class="${cls}" data-i="${i}" aria-label="Row ${Math.floor(i / 4) + 1}, column ${(i % 4) + 1}${cur && i === cur.cell ? ', tap here' : ''}">${inner}</button>`;
  }).join('');
  const who = (a: AnimalId): string => {
    const isDone = a === 'fox' ? step >= 4 : done, on = !!cur && cur.a === a;
    const m = isDone ? 'happy' : on && wrong >= 0 ? 'oops' : 'idle';
    return `<div class="acard" aria-pressed="${on}">${character(a, m, 50, m === 'happy' ? 'cheer' : m === 'oops' ? 'shake' : '')}<span><b>${ANIMAL_NAME[a]}</b><small>${ANIMAL_SHORT[a]}</small></span>${isDone ? '<span class="pill p-g home">Home</span>' : ''}</div>`;
  };
  const dots = STEPS.map((_, k) => `<span style="width:${k === step ? 22 : 10}px; height:10px; border-radius:2px; background:${k < step ? 'var(--pine)' : k === step ? 'var(--coral)' : 'var(--soft-e)'}"></span>`).join('');
  box.innerHTML = `<div class="row" style="gap:6px">${dots}<span class="muted" style="font-weight:800; margin-left:6px">${done ? 'Done!' : `Step ${step + 1} of ${STEPS.length}`}</span></div>
<div class="cards">${who('fox')}${who('rabbit')}</div>
<p class="coach ${done ? 'good' : msg ? 'bad' : ''}" role="status">${done ? 'You did it! Both animals are home. That’s the whole game: real puzzles just have more animals, drifts and choices.' : msg ?? cur!.say}</p>
<div class="boardwrap" style="max-width:420px; width:100%; margin:0 auto"><div class="board" style="grid-template-columns:repeat(4,1fr)">${cells}</div></div>
${done ? `<div class="row"><a class="btn btn-p big" href="/fresh-snow?level=morning">Play today’s Morning puzzle</a><button class="btn btn-w" data-reset>Replay tutorial</button></div>`
    : `<div class="row"><button class="btn btn-w" data-reset>Start over</button><a class="btn btn-w" href="/" id="tut-skip">Skip for now</a></div>`}`;
}
box.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-i],[data-reset],#tut-skip');
  if (!t) return;
  if (t.id === 'tut-skip') { const p = loadProgress(); p.tutorialSeen = true; saveProgress(p); return; }
  if (t.dataset.reset !== undefined) { step = 0; wrong = -1; msg = null; render(); return; }
  if (step >= STEPS.length) return;
  const i = Number(t.dataset.i);
  if (i === STEPS[step]!.cell) { step++; wrong = -1; msg = null; }
  else { wrong = i; msg = 'Not that square. Tap the glowing one.'; window.clearTimeout(timer); timer = window.setTimeout(() => { wrong = -1; msg = null; render(); }, 1300); }
  render();
});
render();
