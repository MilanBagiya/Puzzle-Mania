// Trail Trek map: 60 stages in 4 chapters, unlocked one at a time.
import { loadProgress, trekStars, trekUnlocked } from '@wild-daily/core';
import { TREK_CHAPTERS, TREK_STAGE_COUNT } from '@wild-daily/game-fresh-snow/engine';
import { paws } from '@wild-daily/ui';

const p = loadProgress();
const unlocked = trekUnlocked(p);
const map = document.getElementById('trek-map') as HTMLElement;
const sum = document.getElementById('trek-sum');
if (sum) sum.textContent = `${Math.min(unlocked - 1, TREK_STAGE_COUNT)} of ${TREK_STAGE_COUNT} stages · ${trekStars(p)} of ${TREK_STAGE_COUNT * 3} paws`;
const cont = document.getElementById('trek-continue') as HTMLAnchorElement | null;
if (cont) { if (unlocked > TREK_STAGE_COUNT) { cont.textContent = 'Trek complete! Replay any stage'; cont.href = '/trek/play?stage=1'; } else { cont.textContent = unlocked === 1 ? 'Start stage 1' : `Continue: stage ${unlocked}`; cont.href = `/trek/play?stage=${unlocked}`; } }
map.innerHTML = TREK_CHAPTERS.map((c) => {
  const done = Array.from({ length: c.to - c.from + 1 }, (_, k) => c.from + k).filter((s) => p.trek?.[String(s)]).length;
  const tiles = Array.from({ length: c.to - c.from + 1 }, (_, k) => {
    const s = c.from + k, r = p.trek?.[String(s)];
    const cls = r ? 'done' : s === unlocked ? 'current' : s > unlocked ? 'locked' : '';
    return s > unlocked
      ? `<span class="tstage locked" aria-label="Stage ${s}, locked">${s}<small>Locked</small></span>`
      : `<a class="tstage ${cls}" href="/trek/play?stage=${s}" aria-label="Stage ${s}${r ? `, ${r.stars} paws` : ', play'}">${s}${r ? paws(r.stars, 13) : '<small>Play</small>'}</a>`;
  }).join('');
  return `<section class="card stack"><div class="row" style="justify-content:space-between"><div><h2 class="h-m">${c.id}. ${c.name}</h2><p class="muted" style="margin:2px 0 0">${c.blurb}</p></div><span class="pill ${done === c.to - c.from + 1 ? 'p-g' : 'p-w'}">${done} of ${c.to - c.from + 1}</span></div><div class="trek-map">${tiles}</div></section>`;
}).join('');
