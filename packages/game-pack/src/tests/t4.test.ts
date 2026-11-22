import { describe, expect, it } from 'vitest';
import who, { solveWho } from '../games/who-ate.js';
import fresh, { solveTrack } from '../games/freshest-track.js';
import egg, { answerOf as eggAns, score } from '../games/egg-match.js';
import word, { WORDS, answerOf as wordAns, colours } from '../games/track-word.js';
import quiz, { answersOf } from '../games/whose-print.js';
import pairs from '../games/feather-pairs.js';
import leaf, { solveLeaves } from '../games/leaf-pile.js';
import zoom, { answerOf as zoomAns, CAST } from '../games/who-was-here.js';
describe('word, order and quick games', () => {
  it('who ate: unique', () => { for (let d = 0; d < 60; d++) expect(solveWho(who.generate('d' + d))).not.toBeNull(); });
  it('freshest: unique', () => { for (let d = 0; d < 60; d++) expect(solveTrack(fresh.generate('d' + d))).not.toBeNull(); });
  it('egg: valid code, scoring', () => { const p = egg.generate('x'); const a = eggAns(p); expect(new Set(a).size).toBe(4); expect(score(a, a).exact).toBe(4); expect(p.code).not.toContain(a.join('')); });
  it('word: answer is a listed animal; colours', () => { for (let d = 0; d < 40; d++) expect(WORDS.some((w) => w.w === wordAns(word.generate('d' + d)))).toBe(true); expect(colours('OTTER', 'TOTEM')).toEqual(['y', 'y', 'g', 'g', 'x']); });
  it('quiz: 5 questions with the answer among 3 options', () => { const p = quiz.generate('q'); const a = answersOf(p); expect(a).toHaveLength(5); p.qs.forEach((q, i) => { expect(q.options).toHaveLength(3); expect(q.options).toContain(a[i]); }); });
  it('pairs: 8 pairs', () => { const p = pairs.generate('p'); expect(p.cards).toHaveLength(16); });
  it('leaf: solvable with best taps', () => { for (let d = 0; d < 40; d++) { const p = leaf.generate('d' + d); expect(solveLeaves(p.n, new Set(p.green))!.length).toBe(p.best); } });
  it('zoom: answer in cast', () => { const a = zoomAns(zoom.generate('z')); expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThan(CAST.length); });
});
