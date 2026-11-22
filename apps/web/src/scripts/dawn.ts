// Dawn Chorus: the order is checked against the clues (no answer is sent to the browser).
import { BIRDS, orderFits, solveDawn, type BirdId, type DawnPublic } from '@wild-daily/game-dawn-chorus';
import { formatDate, formatTime, loadProgress } from '@wild-daily/core';
import { bird } from '@wild-daily/ui';
import { loadPuzzle, pageDate, recordFinish, setDateLabel, shareLine, showLoadError, showResult } from './daily';

const date = pageDate();
setDateLabel('dc-date', date);
const box = document.getElementById('dc') as HTMLElement;
loadPuzzle<DawnPublic>(`/puzzles/dawn/${date}.json`).then((g) => {
  const clues = document.getElementById('dc-clues') as HTMLElement;
  clues.innerHTML = g.text.map((c) => `<li>${c}</li>`).join('');
  const already = !!loadProgress().days[date]?.dawn;
  let slots: (BirdId | null)[] = already ? (solveDawn(g) ?? []).slice() : [null, null, null, null, null];
  let result: 'win' | 'wrong' | null = already ? 'win' : null;
  let hints = 0, wrongIdx: number[] = [];
  const t0 = Date.now();
  function render(): void {
    const win = result === 'win', full = slots.every(Boolean);
    let msg = 'Tap the birds to put them on the branch in the order they sang. Tap a bird on the branch to take it off.', kind = '';
    if (result === 'wrong') { msg = 'Not quite: at least one clue isn’t true for this order. Try swapping a pair.'; kind = 'bad'; }
    else if (win) { msg = 'Beautiful! You hear the whole dawn chorus.'; kind = 'good'; }
    else if (full) msg = 'All five are on the branch. Tap Listen!';
    const used = new Set(slots.filter(Boolean));
    box.innerHTML = `<div class="dc-branch"><svg viewBox="0 0 358 40" preserveAspectRatio="none" aria-hidden="true" style="position:absolute; left:0; top:80px; width:100%; height:40px"><path d="M0 22 Q90 10 180 20 T358 14" stroke="#8A5A3B" stroke-width="10" fill="none" stroke-linecap="round"></path></svg>
<div class="dc-slots" role="list" aria-label="Order on the branch">${slots.map((b, i) => `<button class="dc-slot" data-out="${i}" aria-label="Position ${i + 1}${b ? ': ' + BIRDS[b].name : ', empty'}">${b ? `<span class="${win ? 'sing' : ''}${wrongIdx.includes(i) ? ' wrongglow' : ''}" style="display:block; margin-bottom:6px; ${win ? `animation-delay:${i * 0.2}s` : ''}">${bird(BIRDS[b].color, 60)}</span><span>${BIRDS[b].name}</span>` : `<span class="dc-empty">${i + 1}</span>`}</button>`).join('')}</div></div>
<p class="coach ${kind}" role="status">${msg}</p>
${win ? '' : `<div class="dc-tray">${g.birds.filter((b) => !used.has(b)).map((b) => `<button class="dc-bird" data-in="${b}" aria-label="Add the ${BIRDS[b].name}">${bird(BIRDS[b].color, 46)}<span>${BIRDS[b].name}</span></button>`).join('')}</div>
<div class="tools" style="grid-template-columns:repeat(3,minmax(0,1fr))"><button class="btn btn-w" data-clear>Clear</button><button class="btn btn-y" data-hint>Hint</button><button class="btn btn-p" data-check${full ? '' : ' disabled'}>Listen</button></div>`}`;
  }
  box.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-in],[data-out],[data-clear],[data-check],[data-hint]');
    if (!t || result === 'win') return;
    wrongIdx = [];
    if (t.dataset.in) { const j = slots.indexOf(null); if (j >= 0) slots[j] = t.dataset.in as BirdId; result = null; }
    else if (t.dataset.out) { slots[Number(t.dataset.out)] = null; result = null; }
    else if (t.dataset.clear !== undefined) { slots = [null, null, null, null, null]; result = null; }
    else if (t.dataset.hint !== undefined) {
      const ans = solveDawn(g) ?? [];
      const k = ans.findIndex((b, i) => slots[i] !== b);
      if (k >= 0) { const b = ans[k]!; slots = slots.map((x) => (x === b ? null : x)); slots[k] = b; hints++; result = null; }
    } else if (t.dataset.check !== undefined) {
      const order = slots as BirdId[];
      if (orderFits(g, order)) {
        result = 'win';
        const time = Math.round((Date.now() - t0) / 1000);
        const rec = recordFinish({ game: 'dawn', date, time, hints });
        render();
        window.setTimeout(() => showResult({
          el: document.getElementById('dc-result') as HTMLElement, game: 'dawn', date, rec,
          title: 'The whole chorus is singing!', subtitle: `Dawn Chorus, ${formatDate(date)}`, art: order.map((b) => bird(BIRDS[b].color, 60)).join(''),
          stats: [{ value: formatTime(time), label: 'time', tint: 'var(--fox-t)' }, { value: String(hints), label: hints === 1 ? 'hint' : 'hints', tint: 'var(--rabbit-t)' }, { value: String(rec.streak), label: 'day streak', tint: 'var(--deer-t)' }],
          share: shareLine('Dawn Chorus', date, rec.result),
        }), 900);
        return;
      }
      result = 'wrong';
      const ans = solveDawn(g) ?? [];
      wrongIdx = order.map((b, i) => (b !== ans[i] ? i : -1)).filter((i) => i >= 0).slice(0, 2);
    }
    render();
  });
  render();
}).catch(() => showLoadError(box, 'the Dawn Chorus puzzle', date));
