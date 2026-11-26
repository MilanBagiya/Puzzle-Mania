import { describe, expect, it } from 'vitest';
import thief, { N as THIEF_N, holds, sayText, solveThief } from '../games/acorn-thief.js';

// Real seeds are 'YYYY-MM-DD' dates.
const dates = (n: number, from = Date.UTC(2026, 0, 1)): string[] => Array.from({ length: n }, (_, d) => new Date(from + d * 86_400_000 * 5).toISOString().slice(0, 10));

describe('Acorn Thief', () => {
  it('generates 120 days, each with exactly one thief that the claims prove', () => {
    for (const d of dates(120)) {
      const p = thief.generate(d);
      expect(p.line).toHaveLength(THIEF_N);
      expect(new Set(p.line).size, d).toBe(THIEF_N);
      expect(p.line, d).not.toContain('squirrel'); // the victim
      const sol = solveThief(p);
      expect(sol, d).toHaveLength(1);
      // The thief's claim is false and everyone else's is true.
      p.says.forEach((c, i) => expect(holds(c, i, sol[0]!), `${d} #${i}`).toBe(i !== sol[0]));
      // No free answer: nobody truthful simply names the thief.
      p.says.forEach((c, i) => { if (i !== sol[0]) expect(c.t === 'is', `${d} #${i}`).toBe(false); });
    }
  });
  it('the puzzle file holds only the suspects and what they said', () => {
    expect(Object.keys(thief.generate('2026-11-26')).sort()).toEqual(['line', 'says', 'seed']);
  });
  it('the solver reads claims exactly', () => {
    // 0 says "thief is to my right", 1 says "it was 3", 2 says "the thief is next to me", 3 says "not 0", 4 says "it was 0 or 1"
    const says = [{ t: 'right' }, { t: 'is', a: 3 }, { t: 'next' }, { t: 'not', a: 0 }, { t: 'or', a: 0, b: 1 }] as const;
    expect(solveThief({ says: [...says] })).toEqual([1]);
    expect(holds({ t: 'left' }, 2, 0)).toBe(true);
    expect(holds({ t: 'left' }, 2, 3)).toBe(false);
  });
  it('every claim reads as a short sentence', () => {
    const p = thief.generate('2026-11-26');
    for (const c of p.says) expect(sayText(p, c)).toMatch(/^[A-Z].{8,60}[.!]$/);
  });
  it('is deterministic per date and quick', () => {
    expect(thief.generate('2026-11-26')).toEqual(thief.generate('2026-11-26'));
    const t = Date.now(); for (const d of dates(50, Date.UTC(2027, 0, 1))) thief.generate(d);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});
