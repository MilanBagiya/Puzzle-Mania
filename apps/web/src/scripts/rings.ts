import { createRingsGame, type RingsPuzzle } from '@wild-daily/game-mushroom-rings';
import { formatDate, formatTime } from '@wild-daily/core';
import { mushroom } from '@wild-daily/ui';
import { loadPuzzle, pageDate, recordFinish, setDateLabel, shareLine, showLoadError, showResult } from './daily';

const date = pageDate();
setDateLabel('mr-date', date);
const root = document.getElementById('mr-game') as HTMLElement;
loadPuzzle<RingsPuzzle>(`/puzzles/rings/${date}.json`).then((puzzle) => {
  createRingsGame(root, {
    puzzle, timerEl: document.getElementById('mr-timer'),
    onSolved: ({ time, hints, guesses }) => {
      const stars = guesses === 1 && hints === 0 ? 3 : guesses <= 2 ? 2 : 1;
      const rec = recordFinish({ game: 'rings', date, time, hints, moves: guesses, stars });
      window.setTimeout(() => showResult({
        el: document.getElementById('mr-result') as HTMLElement, game: 'rings', date, rec,
        title: 'You found the spore!', subtitle: `Mushroom Rings, ${formatDate(date)}`, art: mushroom(70, 'sprout') + mushroom(90, 'sprout') + mushroom(70, 'sprout'),
        stats: [{ value: String(guesses), label: guesses === 1 ? 'guess' : 'guesses', tint: 'var(--fox-t)' }, { value: formatTime(time), label: 'time', tint: 'var(--deer-t)' }, { value: String(rec.streak), label: 'day streak', tint: 'var(--rabbit-t)' }],
        share: shareLine('Mushroom Rings', date, rec.result, ` in ${guesses} ${guesses === 1 ? 'guess' : 'guesses'}`),
      }), 700);
    },
  });
}).catch(() => showLoadError(root, 'the Mushroom Rings puzzle', date));
