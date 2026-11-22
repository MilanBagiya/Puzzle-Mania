// Stepping Stones board UI.
import { escapeHtml, frog, lilyPad } from '@wild-daily/ui';
import { jumpsFrom, shortestRoute, type StonesPuzzle } from './engine.js';

export interface StonesOptions { puzzle: StonesPuzzle; timerEl?: HTMLElement | null; onSolved?: (s: { time: number; hints: number; moves: number }) => void }
export function createStonesGame(root: HTMLElement, opts: StonesOptions): { destroy(): void } {
  const p = opts.puzzle, n = p.n;
  let route = [p.start], hints = 0, done = false, secs = 0, msg: string | null = null, kind = '', bad = -1;
  const t0 = Date.now();
  const used = (): Set<number> => new Set(route);
  function render(): void {
    const at = route[route.length - 1]!, next = done ? [] : jumpsFrom(p, at, used());
    const stuck = !done && next.length === 0;
    const cells = p.pads.map((k, i) => {
      const r = Math.floor(i / n) + 1, c = (i % n) + 1;
      if (i === p.goal) return `<button class="st-cell${next.includes(i) ? ' next' : ''}" data-st="${i}" aria-label="Far bank${next.includes(i) ? ', you can jump here' : ''}"><span class="bank">Bank</span>${at === i ? `<span class="frogpos">${frog()}</span>` : ''}</button>`;
      const sunk = route.includes(i) && i !== at;
      return `<button class="st-cell${sunk ? ' sunk' : ''}${next.includes(i) ? ' next' : ''}${bad === i ? ' bad' : ''}" data-st="${i}" aria-label="Row ${r}, column ${c}: pad ${k}${sunk ? ', sunk' : ''}${next.includes(i) ? ', you can jump here' : ''}">${lilyPad().replace('<svg', '<svg class="pad"')}<span class="n">${k}</span>${at === i ? `<span class="frogpos">${frog()}</span>` : ''}</button>`;
    }).join('');
    let coach = msg ?? (stuck ? 'Oh no, the frog is stuck! Tap Undo to go back, or Restart.' : `The frog is on a ${p.pads[at]}. It must jump exactly ${p.pads[at]} ${p.pads[at] === 1 ? 'pad' : 'pads'} in a straight line. Glowing pads are where it can land.`);
    if (done) coach = `Made it across in ${route.length - 1} jumps! The best route takes ${p.best}.`;
    root.innerHTML = `<div class="row" style="justify-content:space-between"><span class="pill p-w">Jumps: ${route.length - 1}</span><span class="pill p-w">Best possible: ${p.best}</span></div>
<p class="coach ${done ? 'good' : stuck ? 'bad' : kind}" role="status">${escapeHtml(coach)}</p>
<div class="pond"><div class="board" role="grid" aria-label="Pond, ${n} by ${n}" style="grid-template-columns:repeat(${n},1fr); max-width:${n * 80}px">${cells}</div></div>
<div class="tools" style="grid-template-columns:repeat(3,minmax(0,1fr))"><button class="btn btn-w" data-st-act="undo"${done || route.length < 2 ? ' disabled' : ''}>Undo</button><button class="btn btn-w" data-st-act="restart"${done ? ' disabled' : ''}>Restart</button><button class="btn btn-y" data-st-act="hint"${done ? ' disabled' : ''}>Hint</button></div>`;
  }
  function onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-st],[data-st-act]');
    if (!t || done) return;
    msg = null; kind = ''; bad = -1;
    const at = route[route.length - 1]!;
    if (t.dataset.st) {
      const i = Number(t.dataset.st);
      if (jumpsFrom(p, at, used()).includes(i)) {
        route.push(i);
        if (i === p.goal) { done = true; secs = Math.round((Date.now() - t0) / 1000); render(); tick(); opts.onSolved?.({ time: secs, hints, moves: route.length - 1 }); return; }
      } else if (i !== at) { bad = i; msg = route.includes(i) ? 'That pad has sunk. Each pad holds the frog only once.' : `The frog must jump exactly ${p.pads[at]} in a straight line from here.`; kind = 'bad'; }
    } else if (t.dataset.stAct === 'undo') route.pop();
    else if (t.dataset.stAct === 'restart') route = [p.start];
    else if (t.dataset.stAct === 'hint') {
      let r = shortestRoute(p, at, new Set(route.slice(0, -1)));
      if (!r) { route = [p.start]; r = shortestRoute(p, p.start, new Set()); msg = 'There’s no way across from there, so the frog went back to the start. '; }
      if (r && r[1] !== undefined) { bad = -1; hints++; msg = (msg ?? '') + `Hint: jump to the glowing pad next.`; renderWithHint(r[1]); return; }
    }
    render();
  }
  function renderWithHint(i: number): void { render(); root.querySelector(`[data-st="${i}"]`)?.classList.add('next'); root.querySelectorAll('.st-cell.next').forEach((el) => { if (el.getAttribute('data-st') !== String(i)) el.classList.remove('next'); }); }
  function tick(): void { if (!opts.timerEl) return; const s = done ? secs : Math.round((Date.now() - t0) / 1000); opts.timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  root.addEventListener('click', onClick);
  const iv = window.setInterval(tick, 1000);
  render(); tick();
  return { destroy(): void { root.removeEventListener('click', onClick); window.clearInterval(iv); } };
}
