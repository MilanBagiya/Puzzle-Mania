import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { addDays, formatDate, formatTime, fromIso, isIsoDate, toIso, todayIso } from './dates.js';

// Reference "next calendar day" computed in UTC, so it never depends on the local time zone.
const utcNext = (s: string, n: number): string => {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

// New York and Sydney have opposite daylight-saving switches; Santiago switches at midnight
// (so local midnight is skipped one day a year); Kiritimati (UTC+14) and Pago Pago (UTC-11)
// are a whole day apart, which covers players who travel across the date line.
const ZONES = ['America/New_York', 'Australia/Sydney', 'America/Santiago', 'Pacific/Kiritimati', 'Pacific/Pago_Pago'];

describe('formatTime', () => {
  it('formats whole seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
  });
});

describe('isIsoDate', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isIsoDate('2026-11-25')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
  });
  it('rejects empty and wrongly shaped values', () => {
    for (const s of [null, undefined, '', '2026-1-5', '26-11-25', '2026/11/25', '2026-11-25T00:00', ' 2026-11-25', 'today']) {
      expect(isIsoDate(s)).toBe(false);
    }
  });
});

for (const tz of ZONES) {
  describe(`dates in ${tz}`, () => {
    const saved = process.env.TZ;
    beforeAll(() => { process.env.TZ = tz; });
    afterAll(() => { process.env.TZ = saved; });

    it('runs in the requested time zone', () => {
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(tz);
    });

    it('toIso pads months and days and uses the local date', () => {
      expect(toIso(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(toIso(new Date(2026, 11, 31, 23, 59, 59))).toBe('2026-12-31');
      expect(toIso(new Date(2027, 0, 1, 0, 0, 0))).toBe('2027-01-01');
    });

    it('fromIso gives the local calendar day', () => {
      const d = fromIso('2028-02-29');
      expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2028, 1, 29]);
    });

    it('todayIso changes exactly at local midnight, not UTC midnight', () => {
      expect(todayIso(new Date(2026, 10, 24, 23, 59, 59))).toBe('2026-11-24');
      expect(todayIso(new Date(2026, 10, 25, 0, 0, 1))).toBe('2026-11-25');
      expect(todayIso(new Date(2026, 10, 25, 0, 30))).toBe('2026-11-25');
      expect(todayIso(new Date(2026, 10, 25, 23, 30))).toBe('2026-11-25');
    });

    it('addDays handles month ends, leap years, year ends and negatives', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
      expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
      expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
      expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
      expect(addDays('2026-11-25', 0)).toBe('2026-11-25');
      expect(addDays('2026-11-25', 365)).toBe('2027-11-25');
      expect(addDays('2026-11-25', -365)).toBe('2025-11-25');
    });

    it('addDays steps one calendar day at a time through every daylight-saving switch (2026–2028)', () => {
      let d = '2026-01-01';
      for (let k = 0; k < 365 * 3; k++) {
        const next = addDays(d, 1);
        expect(next).toBe(utcNext(d, 1));
        expect(addDays(next, -1)).toBe(d);
        d = next;
      }
    });

    it('fromIso and toIso round-trip every day (property)', () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 365 * 200 }), (k) => {
        const s = utcNext('1970-01-01', k);
        expect(toIso(fromIso(s))).toBe(s);
      }));
    });

    it('addDays(n) then addDays(-n) returns the same date (property)', () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 365 * 100 }), fc.integer({ min: -2000, max: 2000 }), (k, n) => {
        const s = utcNext('2000-01-01', k);
        expect(addDays(addDays(s, n), -n)).toBe(s);
        expect(addDays(s, n)).toBe(utcNext(s, n));
      }));
    });

    it('formatDate shows the same calendar day in every zone', () => {
      expect(formatDate('2026-11-25')).toBe('Wednesday, November 25');
      expect(formatDate('2028-02-29', { year: 'numeric', month: 'short', day: 'numeric' })).toBe('Feb 29, 2028');
    });
  });
}
