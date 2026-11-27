// Forest Journal: one card unlocked per day played.
import { daysPlayed, JOURNAL, loadProgress, playedDay, todayIso, type JournalCard } from '@wild-daily/core';
import { bird, character, print } from '@wild-daily/ui';

const prog = loadProgress();
const n = Math.min(daysPlayed(prog), JOURNAL.length);
const nextWhen = playedDay(prog, todayIso()) ? 'Next: play tomorrow' : 'Next: play today';
let pick = 0;
const art = (j: JournalCard, w: number, mood: 'idle' | 'happy' = 'idle'): string =>
  j.art.kind === 'character' ? character(j.art.animal, mood, w, mood === 'happy' ? 'cheer' : j.art.animal === 'rabbit' ? 'boing' : '')
    : j.art.kind === 'bird' ? bird(j.art.color, w) : print(j.art.print, Math.round(w * 0.75));
const grid = document.getElementById('jr-grid') as HTMLElement;
const side = document.getElementById('jr-side') as HTMLElement;
const bar = document.getElementById('jr-bar') as HTMLElement;
const count = document.getElementById('jr-count') as HTMLElement;
const empty = document.getElementById('jr-empty') as HTMLElement;
function render(): void {
  bar.style.width = `${Math.round((n / JOURNAL.length) * 100)}%`;
  count.textContent = `${n} of ${JOURNAL.length} found`;
  empty.hidden = n > 0;
  grid.innerHTML = JOURNAL.map((j, k) => k < n
    ? `<button class="card jcard" data-k="${k}" aria-pressed="${k === pick}" style="padding:12px"><span class="stage" style="height:96px; width:100%; background:${j.tint}">${art(j, 70)}</span><b class="display" style="font-size:17px">${j.name}</b></button>`
    : `<div class="lockcard"><span class="stage" style="height:96px; width:100%; position:relative"><span class="jr-shadow" aria-hidden="true">${art(j, 70)}</span><b class="display" style="position:absolute; font-size:34px; color:var(--ink-mute)">?</b></span><span class="muted" style="font-weight:800; font-size:14px">${k === n ? nextWhen : `Day ${k + 1}`}</span></div>`).join('');
  const j = JOURNAL[pick];
  side.innerHTML = n && j
    ? `<section class="card stack tilt-l" style="background:var(--note); align-items:center; text-align:center"><span class="pill p-y" style="align-self:flex-start">Journal card</span><div style="min-height:110px; display:flex; align-items:flex-end">${art(j, 96, 'happy')}</div><h2 class="h-m">${j.name}</h2><p style="margin:0; max-width:40ch">${j.fact}</p><a class="btn btn-w" href="/animals/${j.guide}">Read the ${j.name.toLowerCase()} guide</a></section>`
    : `<div class="card stack"><h2 class="h-s">How cards work</h2><ol class="steps"><li>Solve any daily puzzle.</li><li>Your first solve of the day unlocks the next animal.</li><li>Tap a card to read its real fact.</li></ol></div>`;
}
grid.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-k]'); if (b) { pick = Number(b.dataset.k); render(); } });
render();
