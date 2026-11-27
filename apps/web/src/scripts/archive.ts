// Archive calendar: pick any past day, then a level.
import { BONUS, DAILY_SET, GAMES, LISTED_PACK, formatDate, formatTime, fromIso, loadProgress, setCount, toIso, todayIso, type GameKey } from '@wild-daily/core';
import { chevron, paws } from '@wild-daily/ui';

const p = loadProgress();
const today = todayIso();
const t = fromIso(today);
let y = t.getFullYear(), m = t.getMonth(), sel: string | null = null;
/** First day with puzzle files (from the generator's index.json); days before it have nothing to play. */
let firstDay = '';
const cal = document.getElementById('arc-cal') as HTMLElement;
const panel = document.getElementById('arc-panel') as HTMLElement;

function render(): void {
  const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
  const cur = y === t.getFullYear() && m === t.getMonth();
  const atStart = !!firstDay && toIso(first) <= firstDay;
  const cells: string[] = Array(lead).fill('<span></span>');
  for (let d = 1; d <= days; d++) {
    const s = toIso(new Date(y, m, d)), fut = s > today, n = setCount(p, s);
    if (!fut && firstDay && s < firstDay) { cells.push(`<span class="day future" aria-label="${formatDate(s)}, no puzzles">${d}<small>None</small></span>`); continue; }
    const cls = fut ? 'future' : s === today ? 'today' : n ? 'done' : 'plain';
    cells.push(fut ? `<span class="day future" aria-label="${formatDate(s)}, not yet">${d}<small>Soon</small></span>`
      : `<button class="day ${cls}" data-day="${s}" aria-label="${formatDate(s)}, ${n} of 5 solved"${sel === s ? ' style="outline:3px solid var(--coral)"' : ''}>${d}<small>${s === today ? 'Today' : n ? `${n} of 5` : 'Play'}</small></button>`);
  }
  cal.innerHTML = `<div class="monthbar"><button class="btn btn-w" data-month="-1" aria-label="Previous month"${atStart ? ' disabled' : ''}>${chevron('left')}</button><h2 class="h-m">${first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button class="btn btn-w" data-month="1" aria-label="Next month"${cur ? ' disabled' : ''}>${chevron('right')}</button></div>
<div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((x) => `<span class="dow">${x}</span>`).join('')}${cells.join('')}</div>`;
  const link = (g: GameKey): string => { const r = p.days[sel!]?.[g]; const href = `${GAMES[g].href}${GAMES[g].href.includes('?') ? '&' : '?'}date=${sel}`; return `<a class="btn ${r ? 'btn-w' : 'btn-p'}" href="${href}" style="justify-content:space-between">${GAMES[g].name}${r ? ` <span>${paws(r.stars, 14)} ${formatTime(r.time)}</span>` : ''}</a>`; };
  panel.innerHTML = sel
    ? `<div class="card stack"><h2 class="h-s">${formatDate(sel)}</h2>${[...DAILY_SET, ...BONUS].map(link).join('')}<details><summary>Game pack (${LISTED_PACK.length} more)</summary><div class="stack" style="gap:8px; margin-top:10px">${LISTED_PACK.map(link).join('')}</div></details><p class="muted" style="margin:0; font-size:14px">Archive puzzles count for badges and the Journal, but not for today’s streak.</p></div>`
    : `<div class="card stack" style="background:var(--good)"><h2 class="h-s">Pick a day</h2><p style="margin:0">Every past day has its own puzzles for every game.</p></div>`;
}
cal.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-day],[data-month]');
  if (!el || (el as HTMLButtonElement).disabled) return;
  if (el.dataset.day) sel = el.dataset.day;
  else { const d = new Date(y, m + Number(el.dataset.month), 1); y = d.getFullYear(); m = d.getMonth(); sel = null; }
  render();
});
render();
fetch('/puzzles/index.json').then((r) => (r.ok ? r.json() : null)).then((ix: { from?: string } | null) => {
  if (ix?.from && /^\d{4}-\d{2}-\d{2}$/.test(ix.from)) { firstDay = ix.from; render(); }
}).catch(() => undefined);
