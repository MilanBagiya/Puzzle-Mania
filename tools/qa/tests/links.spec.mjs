// Check 1: links (no browser needed; reads the built files).
import { test } from '@playwright/test';
import { checkLinks } from '../lib/links.mjs';

test('links', async ({}, info) => {
  const r = checkLinks();
  info.annotations.push({ type: 'qa-ran', description: 'links' });
  for (const msg of r.broken) info.annotations.push({ type: 'qa-fail', description: JSON.stringify({ check: 'links', page: '', setup: 'dist', msg }) });
  for (const msg of r.falsePositives) info.annotations.push({ type: 'qa-note', description: JSON.stringify({ check: 'links', kind: 'false positive', msg }) });
  for (const page of r.orphans) info.annotations.push({ type: 'qa-note', description: JSON.stringify({ check: 'links', kind: 'orphan', msg: `${page} has no links pointing to it` }) });
  if (r.broken.length) throw new Error(`${r.broken.length} broken link(s):\n  ` + r.broken.join('\n  '));
});
