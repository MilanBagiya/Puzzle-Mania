// One Trail Trek stage.
import { createFreshSnowGame, trekChapterOf, TREK_STAGE_COUNT, type Puzzle } from "@wild-daily/game-fresh-snow";
import { formatTime, loadProgress, recordTrek, saveProgress, takeNewBadges, trekUnlocked } from '@wild-daily/core';
import { ANIMAL_NAME, character, paws } from '@wild-daily/ui';
import { loadPuzzle, share, today } from './daily';
import { toast } from './toast';
import { params } from './nav';

const q = Number(params().get('stage') ?? '1');
const p0 = loadProgress();
const unlocked = trekUnlocked(p0);
const stage = Math.min(Math.max(Number.isFinite(q) ? Math.round(q) : 1, 1), Math.min(unlocked, TREK_STAGE_COUNT));
const ch = trekChapterOf(stage);
const title = document.getElementById('tk-title'); if (title) title.textContent = `Stage ${stage}`;
const sub = document.getElementById('tk-chapter'); if (sub) sub.textContent = `Chapter ${ch.id}: ${ch.name}`;
const root = document.getElementById('tk-game') as HTMLElement;
const resEl = document.getElementById('tk-result') as HTMLElement;
loadPuzzle<Puzzle>(`/puzzles/trek/${stage}.json`).then((puzzle) => {
  createFreshSnowGame(root, {
    puzzle, timerEl: document.getElementById('tk-timer'),
    onSolved: ({ time, hints }) => {
      const p = loadProgress();
      const r = recordTrek(p, stage, puzzle.n, { time, hints });
      const badges = takeNewBadges(p, today);
      saveProgress(p);
      const next = stage < TREK_STAGE_COUNT ? stage + 1 : null;
      const chapterDone = stage === ch.to;
      window.setTimeout(() => {
        resEl.innerHTML = `<section class="card stack" style="align-items:center; text-align:center; padding:26px">
<div class="row" style="justify-content:center">${puzzle.animals.map((a) => character(a, 'happy', 96, 'cheer', ANIMAL_NAME[a])).join('')}</div>
<h2 class="h-l">${chapterDone ? `Chapter ${ch.id} complete!` : `Stage ${stage} cleared!`}</h2>${paws(r.stars, 30)}
<p class="muted" style="margin:0; font-weight:800">${formatTime(time)} · ${hints} ${hints === 1 ? 'hint' : 'hints'}${r.stars < 3 ? ' · solve with no hints and quickly for 3 paws' : ''}</p>
<div class="row" style="justify-content:center"><button class="btn btn-w big" data-share>Share</button>${next ? `<a class="btn btn-c big" href="/trek/play?stage=${next}">Next: stage ${next}</a>` : '<a class="btn btn-c big" href="/trek">Back to the map</a>'}</div>
<a href="/trek" style="font-weight:800">Trail Trek map</a></section>
${badges.map((b) => `<section class="card banner" style="margin-top:20px; background:var(--note)"><span class="badge-tile" style="padding:0; box-shadow:none; background:transparent"><span class="medal" style="font-size:28px">${b.icon}</span></span><div class="grow"><span class="pill p-y">New badge!</span><h2 class="h-s" style="margin-top:6px">${b.name}</h2><p class="muted" style="margin:2px 0 0">${b.desc}</p></div></section>`).join('')}`;
        resEl.hidden = false; resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        resEl.querySelector('[data-share]')?.addEventListener('click', () => share(`Trail Trek stage ${stage}: ${'🐾'.repeat(r.stars)} in ${formatTime(time)}.`));
        if (badges.length) toast(`Badge earned: ${badges[0]!.name}!`);
      }, 800);
    },
  });
}).catch(() => { root.innerHTML = `<p class="coach bad">We couldn’t load stage ${stage}. Check your connection and try again.</p>`; });
