// Mushroom Rings board UI. Three guesses; a wrong guess shows the ring it would have made.
import { escapeHtml, leaf, mushroom, stump } from '@wild-daily/ui';
import { candidates, ringOf, type RingsPuzzle } from './engine.js';

export interface RingsOptions { puzzle: RingsPuzzle; timerEl?: HTMLElement | null; onSolved?: (s: { time: number; hints: number; guesses: number }) => void; onFailed?: () => void }
export function createRingsGame(root: HTMLElement, opts: RingsOptions): { destroy(): void } {
  const p = opts.puzzle, n = p.n, stumps = new Set(p.stumps), mush = new Set(p.mushrooms), leaves = new Set(p.leaves);
  const guesses: number[] = [];
  let ghost = new Set<number>(), hints = 0, done = false, failed = false, secs = 0, msg: string | null = null, kind = '';
  const revealed = new Set<number>();
  const t0 = Date.now();
  const spore = (): number => candidates(p)[0]!;
  function render(): void {
    const answer = done || failed ? spore() : -1;
    const ring = answer >= 0 ? ringOf(n, stumps, answer, p.nights) : null;
    const cells = [...Array(n * n).keys()].map((i) => {
      const r = Math.floor(i / n) + 1, c = (i % n) + 1;
      if (stumps.has(i)) return `<div class="mr-cell stump" role="gridcell" aria-label="Row ${r}, column ${c}: stump">${stump()}</div>`;
      const underLeaf = leaves.has(i) && !revealed.has(i) && !ring;
      const showMush = mush.has(i) || (ring?.has(i) ?? false) || (revealed.has(i) && ringOf(n, stumps, spore(), p.nights).has(i));
      const cls = ['mr-cell', ghost.has(i) ? 'ghost' : '', guesses.includes(i) && i !== answer ? 'guess' : '', i === answer ? 'spore' : ''].join(' ');
      const inner = underLeaf ? leaf() : showMush ? mushroom(undefined, 'sprout') : i === answer ? '<b class="display" style="font-size:20px">✦</b>' : '';
      return `<button class="${cls}" data-mr="${i}" aria-label="Row ${r}, column ${c}: ${underLeaf ? 'fallen leaf' : showMush ? 'mushroom' : 'moss'}${guesses.includes(i) ? ', guessed' : ''}">${inner}</button>`;
    }).join('');
    let coach = msg ?? `The ring moved outward for ${p.nights} nights, walking around stumps. Tap the square where the spore landed. Leaves may hide mushrooms.`;
    if (done) coach = `Found it in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}! The glowing square is where the spore landed.`;
    if (failed) coach = 'Out of guesses. The glowing square is where the spore landed; tomorrow’s ring is a fresh chance.';
    root.innerHTML = `<div class="row" style="justify-content:space-between"><span class="pill p-w">Night ${p.nights}</span><span class="pill p-w">Guesses left: ${3 - guesses.length}</span></div>
<p class="coach ${done ? 'good' : failed ? 'bad' : kind}" role="status">${escapeHtml(coach)}</p>
<div class="boardwrap"><div class="board" role="grid" aria-label="Forest floor, ${n} by ${n}" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 72}px">${cells}</div></div>
<div class="tools" style="grid-template-columns:1fr 1fr"><button class="btn btn-y" data-mr-act="hint"${done || failed ? ' disabled' : ''}>Hint: lift a leaf</button><button class="btn btn-w" data-mr-act="clear"${done || failed || !ghost.size ? ' disabled' : ''}>Hide ghost ring</button></div>`;
  }
  function onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-mr],[data-mr-act]');
    if (!t || done || failed) return;
    msg = null; kind = '';
    if (t.dataset.mr) {
      const i = Number(t.dataset.mr);
      if (guesses.includes(i)) return;
      guesses.push(i);
      if (candidates(p).includes(i)) { done = true; secs = Math.round((Date.now() - t0) / 1000); ghost = new Set(); render(); tick(); opts.onSolved?.({ time: secs, hints, guesses: guesses.length }); return; }
      ghost = ringOf(n, stumps, i, p.nights);
      if (guesses.length >= 3) { failed = true; ghost = new Set(); render(); opts.onFailed?.(); return; }
      msg = 'Not there. The dashed squares show the ring that spot would have made. Compare it with the real mushrooms.'; kind = 'bad';
    } else if (t.dataset.mrAct === 'hint') {
      const hidden = p.leaves.filter((x) => !revealed.has(x));
      if (hidden.length) { const x = hidden[0]!; revealed.add(x); hints++; msg = ringOf(n, stumps, spore(), p.nights).has(x) ? 'Hint: there was a mushroom under that leaf.' : 'Hint: nothing under that leaf.'; }
      else msg = 'No leaves left to lift.';
    } else if (t.dataset.mrAct === 'clear') ghost = new Set();
    render();
  }
  function tick(): void { if (!opts.timerEl) return; const s = done ? secs : Math.round((Date.now() - t0) / 1000); opts.timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  root.addEventListener('click', onClick);
  const iv = window.setInterval(tick, 1000);
  render(); tick();
  return { destroy(): void { root.removeEventListener('click', onClick); window.clearInterval(iv); } };
}
