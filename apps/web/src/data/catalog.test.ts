import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { tileHtml } from '../scripts/tiles';

describe('card hooks', () => {
  it('every game has a hook of at most 60 characters', () => {
    expect(CATALOG).toHaveLength(29);
    for (const e of CATALOG) {
      expect(e.hook, e.id).toBeTruthy();
      expect(e.hook!.length, `${e.id}: "${e.hook}"`).toBeLessThanOrEqual(60);
    }
  });

  it('cards show the hook, and fall back to the blurb without one', () => {
    const e = CATALOG.find((g) => g.id === 'nests')!;
    expect(tileHtml(e)).toContain(`<span class="tile-hook">${e.hook}</span>`);
    expect(tileHtml({ ...e, hook: undefined })).toContain(`<span class="tile-hook">${e.blurb}</span>`);
    expect(tileHtml(e, { hook: 'Custom' })).toContain('<span class="tile-hook">Custom</span>');
  });
  it('every card shows a chip: the category by default, or a given chip such as a Fresh Snow level', () => {
    const nests = CATALOG.find((g) => g.id === 'nests')!, dawn = CATALOG.find((g) => g.id === 'dawn')!;
    expect(tileHtml(nests)).toMatch(/<span class="tile-chip cat-logic"><svg[^]*?<\/svg>Logic<\/span>/);
    expect(tileHtml(dawn)).toContain('>Clues</span>');
    expect(tileHtml(nests, { chip: 'Morning', chipKind: 'lv-morning' })).toContain('<span class="tile-chip lv-morning">Morning</span>');
    expect(tileHtml(nests)).not.toContain('tile-cat');
  });
});
