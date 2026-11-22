// One board UI for every counting puzzle (Owl Watch, Acorn Stash, Beehive).
import { checkCount, clock, coach, grid, onAct, pills, btn, tools, cellLabel, solveCount, type CountPuzzle, type Ctx, type Mounted } from './shared.js';

export interface CountLook {
  item: string; itemName: string; clueArt: string; clueName: string;
  intro: string; tile: string; hex?: boolean;
}
export function mountCount(root: HTMLElement, p: CountPuzzle, ctx: Ctx, look: CountLook): Mounted {
  const n = p.n, N = n * n, blocked = new Set(p.blocked);
  const marks = new Int8Array(N); // 0 empty, 1 item, 2 dot
  let hints = 0, done = false, msg: string | null = null, kind = '', hinted = -1;
  let sol: number[] | null = null;
  const t = clock(ctx);
  const items = (): Set<number> => new Set([...marks.keys()].filter((i) => marks[i] === 1));
  function render(): void {
    const chk = checkCount(p, items());
    const touch = new Set(chk.touching);
    const cells = [...Array(N).keys()].map((i) => {
      if (blocked.has(i)) {
        const k = p.blocked.indexOf(i), st = chk.clueState[k];
        return `<div class="gcell clue ${look.tile}" role="gridcell" aria-label="${cellLabel(n, i)}: ${look.clueName} ${p.clues[k]}${st === 'ok' ? ', satisfied' : st === 'over' ? ', too many' : ''}">${look.clueArt}<span class="num ${st === 'ok' ? 'ok' : st === 'over' ? 'over' : ''}">${p.clues[k]}</span></div>`;
      }
      const m = marks[i];
      return `<button type="button" class="gcell ${look.tile}${touch.has(i) ? ' bad' : ''}${hinted === i ? ' hinted' : ''}" data-g="cell:${i}" aria-label="${cellLabel(n, i)}: ${m === 1 ? look.itemName : m === 2 ? 'marked empty' : 'empty'}">${m === 1 ? look.item : m === 2 ? '<span class="dot"></span>' : ''}</button>`;
    }).join('');
    const body = look.hex ? hexGrid(n, cells) : grid(n, cells, 'Board', 76);
    let text = msg ?? (chk.touching.length ? `Two ${look.itemName}s are touching, and they never touch.` : chk.clueState.includes('over') ? 'A red number means too many around it.' : look.intro);
    if (done) { text = `All ${p.total} found!`; kind = 'good'; }
    root.innerHTML = `${pills(`Placed: ${chk.solved ? p.total : items().size} of ${p.total}`, `${p.blocked.length} clues`)}${coach(text, done ? 'good' : kind)}${body}
${tools(btn('clear', 'Clear', 'btn-w', done), btn('dots', 'Fill dots', 'btn-w', done), btn('hint', 'Hint', 'btn-y', done), btn('check', 'Check', 'btn-p', done))}`;
  }
  function hexGrid(rows: number, cellsHtml: string): string {
    const parts = cellsHtml.match(/<(div|button)[\s\S]*?<\/\1>/g) ?? [];
    let html = '<div class="boardwrap"><div class="hexboard" role="grid" aria-label="Honeycomb">';
    for (let r = 0; r < rows; r++) html += `<div class="hexrow${r % 2 ? ' odd' : ''}">${parts.slice(r * rows, r * rows + rows).join('')}</div>`;
    return html + '</div></div>';
  }
  const off = onAct(root, (act, arg) => {
    if (done) return;
    msg = null; kind = ''; hinted = -1;
    if (act === 'cell') { const i = Number(arg); marks[i] = (marks[i]! + 1) % 3; }
    else if (act === 'clear') marks.fill(0);
    else if (act === 'dots') { for (let i = 0; i < N; i++) if (!blocked.has(i) && marks[i] === 0) marks[i] = 2; }
    else if (act === 'hint') {
      sol ??= solveCount(p, 1)[0] ?? [];
      const s = new Set(sol);
      const i = [...Array(N).keys()].find((x) => !blocked.has(x) && ((marks[x] === 1) !== s.has(x)) );
      if (i !== undefined) { marks[i] = s.has(i) ? 1 : 2; hinted = i; hints++; msg = s.has(i) ? `Hint: a ${look.itemName} goes here.` : `Hint: this square is empty.`; }
      else msg = 'Everything placed is right. Tap Check!';
    } else if (act === 'check') {
      const chk = checkCount(p, items());
      if (chk.solved) { done = true; const time = t.stop(); render(); ctx.onSolved({ time, hints }); return; }
      msg = items().size !== p.total ? `You’ve placed ${items().size} of ${p.total}.` : 'Not quite: look for red numbers.'; kind = 'bad';
    }
    render();
  });
  render();
  return { destroy: () => { off(); t.kill(); } };
}
