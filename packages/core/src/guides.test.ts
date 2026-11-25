import { describe, expect, it } from 'vitest';
import { GUIDES, guideBySlug } from './guides.js';

describe('animal guides data', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s, s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('keeps every title under 60 characters (search results cut longer ones)', () => {
    for (const g of GUIDES) expect(g.title.length, `${g.slug}: "${g.title}"`).toBeLessThan(60);
  });
  it('keeps every description under 155 characters', () => {
    for (const g of GUIDES) expect(g.description.length, `${g.slug}: "${g.description}"`).toBeLessThan(155);
  });
  it('has no empty body, title, description or text field', () => {
    for (const g of GUIDES) {
      expect(g.body.length, `${g.slug} body`).toBeGreaterThan(0);
      for (const p of g.body) expect(p.trim().length, `${g.slug} body paragraph`).toBeGreaterThan(0);
      for (const k of ['name', 'title', 'description', 'size', 'clue', 'lookAlike'] as const) expect(g[k].trim().length, `${g.slug}.${k}`).toBeGreaterThan(0);
    }
  });
  it('guideBySlug finds every guide and nothing else', () => {
    for (const g of GUIDES) expect(guideBySlug(g.slug)).toBe(g);
    expect(guideBySlug('unicorn')).toBeUndefined();
    expect(guideBySlug('')).toBeUndefined();
  });
});
