import { createStonesGame, type StonesPuzzle } from '@wild-daily/game-stepping-stones';
import { formatDate, formatTime, starsFor, GAMES } from '@wild-daily/core';
import { frog } from '@wild-daily/ui';
import { loadPuzzle, pageDate, recordFinish, setDateLabel, shareLine, showLoadError, showResult } from './daily';

const date = pageDate();
setDateLabel('st-date', date);
const root = document.getElementById('st-game') as HTMLElement;
loadPuzzle<StonesPuzzle>(`/puzzles/stones/${date}.json`).then((puzzle) => {
  createStonesGame(root, {
    puzzle, timerEl: document.getElementById('st-timer'),
    onSolved: ({ time, hints, moves }) => {
      // Paws reward short routes: best route and no hints = 3, within 2 extra jumps = 2.
      const stars = Math.min(starsFor(time, hints, GAMES.stones.par), hints === 0 && moves === puzzle.best ? 3 : moves <= puzzle.best + 2 ? 2 : 1);
      const rec = recordFinish({ game: 'stones', date, time, hints, moves, stars });
      window.setTimeout(() => showResult({
        el: document.getElementById('st-result') as HTMLElement, game: 'stones', date, rec,
        title: 'The frog made it across!', subtitle: `Stepping Stones, ${formatDate(date)}`, art: frog(110, 'cheer'),
        stats: [{ value: String(moves), label: `jumps (best ${puzzle.best})`, tint: 'var(--deer-t)' }, { value: formatTime(time), label: 'time', tint: 'var(--rabbit-t)' }, { value: String(rec.streak), label: 'day streak', tint: 'var(--fox-t)' }],
        share: shareLine('Stepping Stones', date, rec.result, ` with ${moves} jumps`),
      }), 600);
    },
  });
}).catch(() => showLoadError(root, 'the Stepping Stones puzzle', date));
