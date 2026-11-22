// Move explorer on the How to play page.
import { ANIMAL_NAME, ANIMAL_RULE, character, type AnimalId } from '@wild-daily/ui';

const TEXT: Record<AnimalId, string> = {
  fox: 'Foxes trot in neat diagonal steps. In the puzzle its trail zig-zags corner to corner, one square at a time.',
  rabbit: 'Rabbits bound, so it jumps straight up, down, left or right by exactly 2 squares and only leaves prints where it lands. It can hop over anything.',
  deer: 'Deer walk calmly forward: 1 square up, down, left or right, but never straight back the way it came. Move it once and the square it came from turns red.',
};
let a: AnimalId = 'fox', pos = 12, prev: number | null = null;
const box = document.getElementById('hx') as HTMLElement;
function moves(): number[] {
  const r = Math.floor(pos / 5), c = pos % 5, out: number[] = [];
  const add = (dr: number, dc: number, k: number): void => { const rr = r + dr * k, cc = c + dc * k; if (rr >= 0 && cc >= 0 && rr < 5 && cc < 5) out.push(rr * 5 + cc); };
  if (a === 'fox') [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => add(dr!, dc!, 1));
  else [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([dr, dc]) => add(dr!, dc!, a === 'rabbit' ? 2 : 1));
  return out.filter((i) => !(a === 'deer' && i === prev));
}
function render(): void {
  const ok = moves();
  const cells = [...Array(25).keys()].map((i) => {
    const here = i === pos, can = ok.includes(i), backSq = a === 'deer' && i === prev;
    return `<button class="cell${can ? ' next' : ''}${backSq ? ' bad' : ''}${!can && !here ? ' blocked' : ''}" data-i="${i}" aria-label="Row ${Math.floor(i / 5) + 1}, column ${(i % 5) + 1}${here ? `, the ${a} is here` : can ? ', can move here' : backSq ? ', came from here' : ''}">${here ? character(a, 'idle', undefined, a === 'rabbit' ? 'boing' : '') : ''}</button>`;
  }).join('');
  box.innerHTML = `<div class="stack"><h2 class="h-m">Move explorer</h2>
<div class="tabs" role="tablist" aria-label="Animal">${(['fox', 'rabbit', 'deer'] as AnimalId[]).map((x) => `<button class="tab" role="tab" aria-selected="${x === a}" data-a="${x}">${ANIMAL_NAME[x]}</button>`).join('')}</div>
<div class="boardwrap"><div class="board" style="grid-template-columns:repeat(5,1fr)">${cells}</div></div>
<button class="btn btn-w" data-reset style="align-self:flex-start">Back to the middle</button></div>
<div class="stack"><p class="coach">The ${a} ${ANIMAL_RULE[a]}.</p><p class="lead" style="color:var(--ink)">${TEXT[a]}</p><p class="muted" style="margin:0">Tap a glowing square to move the ${a}.</p></div>`;
}
box.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-i],[data-a],[data-reset]');
  if (!t) return;
  if (t.dataset.a) { a = t.dataset.a as AnimalId; pos = 12; prev = null; }
  else if (t.dataset.i) { const i = Number(t.dataset.i); if (!moves().includes(i)) return; prev = pos; pos = i; }
  else { pos = 12; prev = null; }
  render();
});
render();
