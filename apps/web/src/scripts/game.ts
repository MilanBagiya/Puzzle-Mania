// Fresh Snow daily page.
import { createFreshSnowGame, type LevelId, type Puzzle } from '@wild-daily/game-fresh-snow';
import { LEVEL_NAME, LEVELS, formatDate, formatTime, loadProgress, nextLevel, saveProgress } from '@wild-daily/core';
import { ANIMAL_NAME, character } from '@wild-daily/ui';
import { params } from './nav';
import { loadPuzzle, pageDate, recordFinish, setDateLabel, shareLine, showLoadError, showResult, today } from './daily';

const date = pageDate();
let p = loadProgress();
const lvParam = params().get('level') as LevelId | null;
const level: LevelId = lvParam && (LEVELS as readonly string[]).includes(lvParam) ? lvParam : nextLevel(p, date) ?? 'morning';
const url = (l: string): string => `/fresh-snow?level=${l}${date !== today ? `&date=${date}` : ''}`;
setDateLabel('fs-date', date);
const back = document.getElementById('fs-back') as HTMLAnchorElement | null;
if (back && date !== today) back.href = '/fresh-snow/archive';
document.querySelectorAll<HTMLAnchorElement>('#fs-tabs [data-level]').forEach((a) => {
  const l = a.dataset.level as LevelId;
  a.href = url(l); a.setAttribute('aria-selected', String(l === level)); a.classList.toggle('done', !!p.days[date]?.[l]);
});
if (!p.tutorialSeen && !p.tutorialDone) document.getElementById('fs-banner')?.removeAttribute('hidden');
document.getElementById('fs-skip')?.addEventListener('click', () => { p = loadProgress(); p.tutorialSeen = true; saveProgress(p); document.getElementById('fs-banner')?.setAttribute('hidden', ''); });

const root = document.getElementById('fs-game') as HTMLElement;
loadPuzzle<Puzzle>(`/puzzles/fresh-snow/${date}/${level}.json`).then((puzzle) => {
  createFreshSnowGame(root, {
    puzzle, timerEl: document.getElementById('fs-timer'),
    onSolved: ({ time, hints }) => {
      const rec = recordFinish({ game: level, date, time, hints });
      document.querySelector(`#fs-tabs [data-level="${level}"]`)?.classList.add('done');
      window.setTimeout(() => showResult({
        el: document.getElementById('fs-result') as HTMLElement, game: level, date, rec,
        title: 'Every animal is home!', subtitle: `Fresh Snow, ${LEVEL_NAME[level]}, ${formatDate(date)}`,
        art: puzzle.animals.map((a, k) => character(a, 'happy', 100, 'cheer', ANIMAL_NAME[a] + ', happy').replace('<svg', `<svg style="animation-delay:${k * 0.2}s"`)).join(''),
        stats: [{ value: formatTime(time), label: 'time', tint: 'var(--fox-t)' }, { value: String(hints), label: hints === 1 ? 'hint' : 'hints', tint: 'var(--rabbit-t)' }, { value: String(rec.streak), label: 'day streak', tint: 'var(--deer-t)' }],
        share: shareLine(`Fresh Snow ${LEVEL_NAME[level]}`, date, rec.result),
      }), 900);
    },
  });
}).catch(() => showLoadError(root, `the ${LEVEL_NAME[level]} puzzle`, date));
