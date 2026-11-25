// Loads and runs one game from the pack. Each game's code is split into its own small file.
import type { GameDef } from '@wild-daily/game-pack';
import { GAMES, formatDate, formatTime, type GameKey } from '@wild-daily/core';
import { character } from '@wild-daily/ui';
import { loadPuzzle, pageDate, recordFinish, setDateLabel, shareLine, showLoadError, showResult } from './daily';

const LOADERS: Record<string, () => Promise<{ default: GameDef<unknown> }>> = {
  'frog-pond': () => import('@wild-daily/game-pack/games/frog-pond') as never,
  'firefly-night': () => import('@wild-daily/game-pack/games/firefly-night') as never,
  'owl-watch': () => import('@wild-daily/game-pack/games/owl-watch') as never,
  'acorn-stash': () => import('@wild-daily/game-pack/games/acorn-stash') as never,
  beehive: () => import('@wild-daily/game-pack/games/beehive') as never,
  'beaver-lodges': () => import('@wild-daily/game-pack/games/beaver-lodges') as never,
  'snow-picture': () => import('@wild-daily/game-pack/games/snow-picture') as never,
  'otter-slide': () => import('@wild-daily/game-pack/games/otter-slide') as never,
  'moose-crossing': () => import('@wild-daily/game-pack/games/moose-crossing') as never,
  'burrow-escape': () => import('@wild-daily/game-pack/games/burrow-escape') as never,
  'salmon-run': () => import('@wild-daily/game-pack/games/salmon-run') as never,
  'bears-last-snack': () => import('@wild-daily/game-pack/games/bears-last-snack') as never,
  'who-ate': () => import('@wild-daily/game-pack/games/who-ate') as never,
  'freshest-track': () => import('@wild-daily/game-pack/games/freshest-track') as never,
  'egg-match': () => import('@wild-daily/game-pack/games/egg-match') as never,
  'track-word': () => import('@wild-daily/game-pack/games/track-word') as never,
  'whose-print': () => import('@wild-daily/game-pack/games/whose-print') as never,
  'feather-pairs': () => import('@wild-daily/game-pack/games/feather-pairs') as never,
  'leaf-pile': () => import('@wild-daily/game-pack/games/leaf-pile') as never,
  'who-was-here': () => import('@wild-daily/game-pack/games/who-was-here') as never,
  'berry-match': () => import('@wild-daily/game-pack/games/berry-match') as never,
  'spot-the-change': () => import('@wild-daily/game-pack/games/spot-the-change') as never,
  'vine-links': () => import('@wild-daily/game-pack/games/vine-links') as never,
  'nut-sort': () => import('@wild-daily/game-pack/games/nut-sort') as never,
};
const root = document.getElementById('pk-game') as HTMLElement;
const id = root.getAttribute('data-game') ?? '';
const key = id as GameKey;
const date = pageDate();
setDateLabel('pk-date', date);
const loader = LOADERS[id];
if (!loader) showLoadError(root, 'this game', date);
else Promise.all([loader(), loadPuzzle<unknown>(`/puzzles/pack/${id}/${date}.json`)]).then(([mod, puzzle]) => {
  mod.default.mount(root, puzzle, {
    timerEl: document.getElementById('pk-timer'),
    onSolved: (s) => {
      const rec = recordFinish({ game: key, date, time: s.time, hints: s.hints, ...(s.moves !== undefined ? { moves: s.moves } : {}), ...(s.stars !== undefined ? { stars: s.stars } : {}) });
      window.setTimeout(() => showResult({
        el: document.getElementById('pk-result') as HTMLElement, game: key, date, rec,
        title: 'Solved!', subtitle: `${GAMES[key].name}, ${formatDate(date)}`,
        art: character('fox', 'happy', 90, 'cheer') + character('rabbit', 'happy', 84, 'cheer'),
        stats: [{ value: formatTime(s.time), label: 'time', tint: 'var(--fox-t)' }, s.moves !== undefined ? { value: String(s.moves), label: 'moves', tint: 'var(--rabbit-t)' } : { value: String(s.hints), label: s.hints === 1 ? 'hint' : 'hints', tint: 'var(--rabbit-t)' }, { value: String(rec.streak), label: 'day streak', tint: 'var(--deer-t)' }],
        share: shareLine(GAMES[key].name, date, rec.result),
      }), 700);
    },
  });
}).catch(() => showLoadError(root, `today’s ${GAMES[key]?.name ?? 'puzzle'}`, date));
