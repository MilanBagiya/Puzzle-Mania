import { describe, expect, it } from 'vitest';
import { checkRoute, generateStones, shortestRoute } from './engine.js';
describe('Stepping Stones', () => {
  it('every daily puzzle is solvable in 6–10 jumps', () => {
    for (let d = 0; d < 120; d++) {
      const p = generateStones('day-' + d);
      const r = shortestRoute(p, p.start, new Set())!;
      expect(r.length - 1).toBe(p.best);
      expect(p.best).toBeGreaterThanOrEqual(6);
      expect(checkRoute(p, r)).toBe(true);
    }
  });
  it('rejects illegal routes', () => {
    const p = generateStones('x');
    expect(checkRoute(p, [p.start, p.goal])).toBe(false);
  });
});
