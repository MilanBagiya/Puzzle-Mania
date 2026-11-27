import { describe, expect, it } from 'vitest';
import { BACKDROP_SEASONS, backdropSvg } from './backdrop.js';

describe('backdropSvg', () => {
  it('draws a standalone SVG for every season and theme', () => {
    for (const s of BACKDROP_SEASONS) for (const t of ['light', 'dark'] as const) {
      const svg = backdropSvg(s, t);
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      expect(svg.endsWith('</svg>')).toBe(true);
      expect(svg).not.toMatch(/NaN|undefined/);
      expect(svg.length).toBeLessThan(40_000); // small enough to load on every page
    }
  });
  it('is the same picture on every build, and differs by season and theme', () => {
    expect(backdropSvg('winter', 'light')).toBe(backdropSvg('winter', 'light'));
    expect(backdropSvg('winter', 'light')).not.toBe(backdropSvg('spring', 'light'));
    expect(backdropSvg('autumn', 'light')).not.toBe(backdropSvg('autumn', 'dark'));
  });
});
