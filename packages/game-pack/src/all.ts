// Static map of every game (used by the generator in Node). The website loads games one at a time instead.
import type { GameDef } from './shared.js';
import frogPond from './games/frog-pond.js'; import fireflyNight from './games/firefly-night.js'; import owlWatch from './games/owl-watch.js';
import acornStash from './games/acorn-stash.js'; import beehive from './games/beehive.js'; import beaverLodges from './games/beaver-lodges.js';
import snowPicture from './games/snow-picture.js'; import otterSlide from './games/otter-slide.js'; import mooseCrossing from './games/moose-crossing.js';
import burrowEscape from './games/burrow-escape.js'; import salmonRun from './games/salmon-run.js'; import bearsLastSnack from './games/bears-last-snack.js';
import whoAte from './games/who-ate.js'; import freshestTrack from './games/freshest-track.js'; import eggMatch from './games/egg-match.js';
import trackWord from './games/track-word.js'; import whosePrint from './games/whose-print.js'; import featherPairs from './games/feather-pairs.js';
import leafPile from './games/leaf-pile.js'; import whoWasHere from './games/who-was-here.js';
import spotTheChange from './games/spot-the-change.js';
import vineLinks from './games/vine-links.js';
import nutSort from './games/nut-sort.js';
export const ALL_GAMES: Record<string, GameDef<unknown>> = Object.fromEntries(
  [frogPond, fireflyNight, owlWatch, acornStash, beehive, beaverLodges, snowPicture, otterSlide, mooseCrossing, burrowEscape, salmonRun, bearsLastSnack, whoAte, freshestTrack, eggMatch, trackWord, whosePrint, featherPairs, leafPile, whoWasHere, nutSort, vineLinks, spotTheChange]
    .map((g) => [g.id, g as unknown as GameDef<unknown>]),
);
