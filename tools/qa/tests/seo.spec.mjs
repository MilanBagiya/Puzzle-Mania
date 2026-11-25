// Check 8: crawl rules (no browser needed; reads the built sitemap, robots.txt and pages).
import { test } from '@playwright/test';
import { checkSeo } from '../lib/seo.mjs';

// Playwright reads fixtures from the first argument, so it must be an object pattern even when empty.
// eslint-disable-next-line no-empty-pattern
test('seo', async ({}, info) => {
  const r = checkSeo();
  info.annotations.push({ type: 'qa-ran', description: 'seo' });
  for (const msg of r.fails) info.annotations.push({ type: 'qa-fail', description: JSON.stringify({ check: 'seo', page: '', setup: 'dist', msg }) });
  for (const msg of r.notes) info.annotations.push({ type: 'qa-note', description: JSON.stringify({ check: 'seo', kind: 'sitemap', msg }) });
  if (r.fails.length) throw new Error(`${r.fails.length} crawl-rule problem(s):\n  ` + r.fails.join('\n  '));
});
