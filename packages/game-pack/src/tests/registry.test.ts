import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { PACK } from '../index.js';
describe('registry', () => {
  it('every listed game has a module and vice versa', () => {
    const files = readdirSync(new URL('../games/', import.meta.url)).filter((f) => f.endsWith('.ts')).map((f) => f.replace('.ts', '')).sort();
    expect(PACK.map((g) => g.id).sort()).toEqual(files);
    expect(PACK).toHaveLength(25);
  });
  it('every game has a card hook of at most 60 characters', () => {
    for (const g of PACK) {
      expect(g.hook.length, g.id).toBeGreaterThan(0);
      expect(g.hook.length, `${g.id}: "${g.hook}"`).toBeLessThanOrEqual(60);
    }
  });
});
import { PACK_META } from '@wild-daily/core';
import { ALL_GAMES } from '../all.js';
describe('registry matches core', () => {
  it('core, metadata and modules list the same 20 games', () => {
    expect(PACK_META.map((m) => m[0]).sort()).toEqual(PACK.map((g) => g.id).sort());
    expect(Object.keys(ALL_GAMES).sort()).toEqual(PACK.map((g) => g.id).sort());
  });
});
