import { createNestsGame, type NestsPuzzle } from '@wild-daily/game-nests';
import { formatDate, formatTime } from '@wild-daily/core';
import { nest } from '@wild-daily/ui';
import { loadPuzzle, pageDate, recordFinish, setDateLabel, shareLine, showLoadError, showResult } from './daily';

const date = pageDate();
setDateLabel('nb-date', date);
const root = document.getElementById('nb-game') as HTMLElement;
loadPuzzle<NestsPuzzle>(`/puzzles/nests/${date}.json`).then((puzzle) => {
  createNestsGame(root, {
    puzzle, timerEl: document.getElementById('nb-timer'),
    onSolved: ({ time, hints }) => {
      const rec = recordFinish({ game: 'nests', date, time, hints });
      window.setTimeout(() => showResult({
        el: document.getElementById('nb-result') as HTMLElement, game: 'nests', date, rec,
        title: 'Every nest is found!', subtitle: `Nests, ${formatDate(date)}`, art: nest(90) + nest(70) + nest(90),
        stats: [{ value: formatTime(time), label: 'time', tint: 'var(--deer-t)' }, { value: String(hints), label: hints === 1 ? 'hint' : 'hints', tint: 'var(--rabbit-t)' }, { value: String(rec.streak), label: 'day streak', tint: 'var(--fox-t)' }],
        share: shareLine('Nests', date, rec.result),
      }), 700);
    },
  });
}).catch(() => showLoadError(root, 'the Nests puzzle', date));
