import { describe, expect, it } from 'vitest';
import { activeSeason, hemisphereFromTimeZone, seasonFor, SEASONS, SEASON_INFO, type Season } from './season.js';

// Meteorological seasons, month by month (index 0 = January).
const NORTH: Season[] = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];
const SOUTH: Season[] = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'];
const mm = (m: number): string => String(m + 1).padStart(2, '0');

describe('seasonFor', () => {
  it('gives the meteorological season for every month, north and south', () => {
    for (let m = 0; m < 12; m++) {
      expect(seasonFor(`2027-${mm(m)}-15`, 'north'), `north month ${m + 1}`).toBe(NORTH[m]);
      expect(seasonFor(`2027-${mm(m)}-15`, 'south'), `south month ${m + 1}`).toBe(SOUTH[m]);
    }
  });
  it('defaults to the north', () => {
    for (let m = 0; m < 12; m++) expect(seasonFor(`2027-${mm(m)}-15`)).toBe(NORTH[m]);
  });
  it('switches exactly on the first of the month', () => {
    expect(seasonFor('2027-02-28')).toBe('winter'); expect(seasonFor('2027-03-01')).toBe('spring');
    expect(seasonFor('2028-02-29')).toBe('winter'); // leap day
    expect(seasonFor('2027-05-31')).toBe('spring'); expect(seasonFor('2027-06-01')).toBe('summer');
    expect(seasonFor('2027-08-31')).toBe('summer'); expect(seasonFor('2027-09-01')).toBe('autumn');
    expect(seasonFor('2027-11-30')).toBe('autumn'); expect(seasonFor('2027-12-01')).toBe('winter');
    expect(seasonFor('2026-12-31', 'south')).toBe('summer'); expect(seasonFor('2027-01-01', 'south')).toBe('summer');
  });
  it('south is always the opposite season of north', () => {
    const opposite: Record<Season, Season> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' };
    for (let m = 0; m < 12; m++) expect(seasonFor(`2027-${mm(m)}-01`, 'south')).toBe(opposite[seasonFor(`2027-${mm(m)}-01`, 'north')]);
  });
});

describe('hemisphereFromTimeZone', () => {
  it.each([
    ['Australia/Sydney', 'south'], ['America/Sao_Paulo', 'south'], ['Africa/Johannesburg', 'south'],
    ['Europe/London', 'north'], ['Asia/Kolkata', 'north'], [undefined, 'north'], ['', 'north'],
  ] as const)('%s -> %s', (tz, h) => {
    expect(hemisphereFromTimeZone(tz)).toBe(h);
  });
});

describe('activeSeason', () => {
  const july = '2027-07-15'; // summer in the north, winter in the south
  it('uses the calendar season for the time zone when nothing is chosen', () => {
    expect(activeSeason({}, july, 'Europe/London')).toBe('summer');
    expect(activeSeason({}, july, 'Australia/Sydney')).toBe('winter');
    expect(activeSeason({ season: 'auto', hemisphere: 'auto' }, july, 'Australia/Sydney')).toBe('winter');
    expect(activeSeason({}, july)).toBe('summer'); // no time zone: north
  });
  it("the player's season choice beats everything else", () => {
    for (const s of SEASONS) {
      expect(activeSeason({ season: s }, july, 'Europe/London')).toBe(s);
      expect(activeSeason({ season: s, hemisphere: 'south' }, july, 'Australia/Sydney')).toBe(s);
    }
  });
  it('a hemisphere preference beats the time zone', () => {
    expect(activeSeason({ hemisphere: 'south' }, july, 'Europe/London')).toBe('winter');
    expect(activeSeason({ hemisphere: 'north' }, july, 'Australia/Sydney')).toBe('summer');
  });
  it('ignores unknown stored values and falls back to auto', () => {
    expect(activeSeason({ season: 'monsoon', hemisphere: 'east' }, july, 'Australia/Sydney')).toBe('winter');
    expect(activeSeason({ season: 'monsoon' }, july, 'Europe/London')).toBe('summer');
  });
});

describe('SEASON_INFO', () => {
  it('has copy for every season', () => {
    for (const s of SEASONS) for (const k of ['name', 'title', 'lead', 'short'] as const) expect(SEASON_INFO[s][k].length, `${s}.${k}`).toBeGreaterThan(0);
  });
});
