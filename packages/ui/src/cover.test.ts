import { describe, expect, it } from 'vitest';
import { cover, COVER_IDS } from './cover.js';

// The tile name overlay covers the bottom of every cover, so text and letters must stay in the top 55%.
const LIMIT = 110; // of 200

/** Lowest point of each piece of text in a cover: its backing tile/badge if it has one, else its baseline. */
function textBottoms(svg: string): number[] {
  const out: number[] = [];
  for (const m of svg.matchAll(/(<rect[^>]*><\/rect>|<circle[^>]*><\/circle>)?<text[^>]*\sy="([\d.]+)"/g)) {
    const back = m[1] ?? '';
    const num = (name: string): number => Number(back.match(new RegExp(`\\s${name}="([\\d.]+)"`))?.[1] ?? NaN);
    if (back.startsWith('<rect')) out.push(num('y') + num('height'));
    else if (back.startsWith('<circle')) out.push(num('cy') + num('r'));
    else out.push(Number(m[2]));
  }
  return out;
}

describe('cover art', () => {
  it('has a scene for every cover id', () => {
    for (const id of COVER_IDS) expect(cover(id, id)).toContain('<svg');
  });
  it('keeps text and letters above the name overlay (top 55%)', () => {
    for (const id of COVER_IDS) {
      for (const bottom of textBottoms(cover(id, id))) expect(bottom, `${id}: text reaches y=${bottom}`).toBeLessThanOrEqual(LIMIT);
    }
  });
  it('finds the Track Word letter tiles (so the rule above is really checked)', () => {
    expect(textBottoms(cover('track-word', 'Track Word'))).toHaveLength(5);
  });
});
