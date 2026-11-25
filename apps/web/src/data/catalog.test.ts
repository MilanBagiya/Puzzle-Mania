import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { tileHtml } from '../scripts/tiles';

describe('card hooks', () => {
  it('every game has a hook of at most 60 characters', () => {
    expect(CATALOG).toHaveLength(26);
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
});
