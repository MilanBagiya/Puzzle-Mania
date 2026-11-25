// Nests board UI (plain DOM). Tap a square: nest → "no nest" dot → empty.
import { escapeHtml, nest, tree } from '@wild-daily/ui';
import { checkNests, solveNests, type Mark, type NestsPuzzle } from './engine.js';

export interface NestsOptions { puzzle: NestsPuzzle; timerEl?: HTMLElement | null; onSolved?: (s: { time: number; hints: number }) => void }

export function createNestsGame(root: HTMLElement, opts: NestsOptions): { destroy(): void } {
  const p = opts.puzzle, n = p.n, N = n * n, treeSet = new Set(p.trees);
  const marks: Mark[] = Array(N).fill(0);
  let hints = 0, done = false, secs = 0, msg: string | null = null, kind = '', hinted = -1;
  const t0 = Date.now();
  let solution: number[] | null = null;
  function render(): void {
    const chk = checkNests(p, marks);
    const touch = new Set(chk.touching);
    const cells = [...Array(N).keys()].map((i) => {
      const r = Math.floor(i / n) + 1, c = (i % n) + 1;
      if (treeSet.has(i)) {
        const k = p.trees.indexOf(i), st = chk.treeState[k];
        return `<div class="nb-cell tree" role="gridcell" aria-label="Row ${r}, column ${c}: tree that sees ${p.clues[k]} ${p.clues[k] === 1 ? 'nest' : 'nests'}${st === 'ok' ? ', satisfied' : st === 'over' ? ', too many' : ''}">${tree()}<span class="num ${st === 'ok' ? 'ok' : st === 'over' ? 'over' : ''}">${p.clues[k]}</span></div>`;
      }
      const m = marks[i];
      return `<button type="button" class="nb-cell${touch.has(i) ? ' touch' : ''}${hinted === i ? ' hinted' : ''}" data-nb="${i}" aria-label="Row ${r}, column ${c}: ${m === 1 ? 'nest' : m === 2 ? 'marked no nest' : 'empty'}">${m === 1 ? nest() : m === 2 ? '<span class="dot"></span>' : ''}</button>`;
    }).join('');
    let coach = msg ?? (chk.touching.length ? 'Two nests are touching. Nests never touch, not even corner to corner.' : chk.treeState.includes('over') ? 'A red number means that tree sees too many nests.' : 'Tap a square to place a nest. Tap again to mark it “no nest”. Each tree’s number is how many nests it can see.');
    if (done) { coach = 'Every nest is found! The birds are safe.'; kind = 'good'; }
    root.innerHTML = `<div class="row" style="justify-content:space-between"><span class="pill p-w">Nests placed: ${chk.placed} of ${p.nests}</span><span class="pill p-w">${p.trees.length} trees</span></div>
<p class="coach ${done ? 'good' : kind}" role="status">${escapeHtml(coach)}</p>
<div class="boardwrap" style="--bmax:${n * 80}px"><div class="board" role="grid" aria-label="Meadow, ${n} by ${n}" style="grid-template-columns:repeat(${n},1fr); max-width:var(--bcap)">${cells}</div></div>
<div class="tools"><button class="btn btn-w" data-nb-act="clear"${done ? ' disabled' : ''}>Clear</button><button class="btn btn-w" data-nb-act="dots"${done ? ' disabled' : ''}>Fill dots</button><button class="btn btn-y" data-nb-act="hint"${done ? ' disabled' : ''}>Hint</button><button class="btn btn-p" data-nb-act="check"${done ? ' disabled' : ''}>Check</button></div>`;
  }
  function onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-nb],[data-nb-act]');
    if (!t || done) return;
    msg = null; kind = ''; hinted = -1;
    if (t.dataset.nb) { const i = Number(t.dataset.nb); marks[i] = ((marks[i]! + 1) % 3) as Mark; }
    else if (t.dataset.nbAct === 'clear') marks.fill(0);
    else if (t.dataset.nbAct === 'dots') { for (let i = 0; i < N; i++) if (!treeSet.has(i) && marks[i] === 0) marks[i] = 2; }
    else if (t.dataset.nbAct === 'hint') {
      solution ??= solveNests(p, 1)[0] ?? [];
      const sol = new Set(solution);
      const wrong = [...Array(N).keys()].find((i) => !treeSet.has(i) && ((marks[i] === 1) !== sol.has(i)) && (marks[i] === 1 || sol.has(i) || marks[i] === 0));
      const target = wrong ?? -1;
      if (target >= 0) { marks[target] = sol.has(target) ? 1 : 2; hinted = target; hints++; msg = sol.has(target) ? 'Hint: a nest belongs here.' : 'Hint: there’s no nest here.'; }
    } else if (t.dataset.nbAct === 'check') {
      const chk = checkNests(p, marks);
      if (chk.solved) { done = true; secs = Math.round((Date.now() - t0) / 1000); render(); tick(); opts.onSolved?.({ time: secs, hints }); return; }
      msg = chk.placed !== p.nests ? `You’ve placed ${chk.placed} of ${p.nests} nests.` : 'Not quite: check the red numbers and touching nests.'; kind = 'bad';
    }
    render();
  }
  function tick(): void { if (!opts.timerEl) return; const s = done ? secs : Math.round((Date.now() - t0) / 1000); opts.timerEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
  root.addEventListener('click', onClick);
  const iv = window.setInterval(tick, 1000);
  render(); tick();
  return { destroy(): void { root.removeEventListener('click', onClick); window.clearInterval(iv); } };
}
