import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { CHALLENGE_UNITS, compareChallenge, decodeChallenge, encodeChallenge, unitFromLabel, unitText, type Challenge } from './challenge.js';

describe('challenge links', () => {
  it('encodes compactly and reads back the same result', () => {
    expect(encodeChallenge({ stars: 3, time: 123 })).toBe('s3.t123');
    expect(encodeChallenge({ stars: 2, time: 61, n: 9, unit: 'crossings' })).toBe('s2.t61.n9.u1');
    expect(decodeChallenge('s2.t61.n9.u1')).toEqual({ stars: 2, time: 61, n: 9, unit: 'crossings' });
  });
  it('round-trips any valid result', () => {
    const arb = fc.record({ stars: fc.integer({ min: 0, max: 3 }), time: fc.integer({ min: 0, max: 86_400 }), withN: fc.boolean(), n: fc.integer({ min: 0, max: 999 }), u: fc.constantFrom(...CHALLENGE_UNITS) });
    fc.assert(fc.property(arb, ({ stars, time, withN, n, u }) => {
      const c: Challenge = withN ? { stars, time, n, unit: u } : { stars, time };
      expect(decodeChallenge(encodeChallenge(c))).toEqual(c);
    }));
  });
  it('rejects malformed or edited links', () => {
    for (const bad of [null, '', 's4.t10', 's3', 's3.t-1', 's3.t999999', 's3.t10.n5', 's3.t10.n5.u9', 's3.t10<script>', 'x'.repeat(50), 's3.t10.n1234.u0']) expect(decodeChallenge(bad), String(bad)).toBeNull();
  });
  it('more paws win, then the lower count of the same kind, then the faster time', () => {
    expect(compareChallenge({ stars: 3, time: 300 }, { stars: 2, time: 10 })).toBe('win');
    expect(compareChallenge({ stars: 2, time: 50, n: 9, unit: 'crossings' }, { stars: 2, time: 20, n: 11, unit: 'crossings' })).toBe('win');
    expect(compareChallenge({ stars: 2, time: 50, n: 9, unit: 'crossings' }, { stars: 2, time: 20, n: 9, unit: 'crossings' })).toBe('lose');
    expect(compareChallenge({ stars: 2, time: 20, n: 3, unit: 'hints' }, { stars: 2, time: 30, n: 1, unit: 'moves' })).toBe('win'); // different kinds: time decides
    expect(compareChallenge({ stars: 1, time: 20 }, { stars: 1, time: 20 })).toBe('tie');
  });
  it('maps result-screen labels to units and writes counts in words', () => {
    expect(unitFromLabel('crossings')).toBe('crossings');
    expect(unitFromLabel('guess')).toBe('guesses');
    expect(unitFromLabel('jumps (best 7)')).toBe('jumps');
    expect(unitFromLabel('wrong guess')).toBe('wrong guesses');
    expect(unitFromLabel('time')).toBeUndefined();
    expect(unitText(1, 'crossings')).toBe('1 crossing');
    expect(unitText(4, 'wrong guesses')).toBe('4 wrong guesses');
  });
});
