// Checks 2–6 on EVERY built page, at several widths and in light and dark colour schemes.
import { test } from '@playwright/test';
import { pages } from '../lib/site.mjs';
import { checkOverflow, checkClipping, checkOverlap, checkFooterGap, checkContrast } from '../lib/checks.mjs';

const FOOTER_GAP = 24;
// Which checks run in which setup. Layout checks run in light mode (dark mode only changes colours);
// contrast and console run in both schemes.
const SETUPS = [
  { name: 'light-360', width: 360, height: 780, scheme: 'light', checks: ['overflow', 'clipping', 'console'] },
  { name: 'light-390', width: 390, height: 844, scheme: 'light', checks: ['overflow', 'clipping', 'overlap', 'footer-gap', 'contrast', 'console'] },
  { name: 'light-1280', width: 1280, height: 800, scheme: 'light', checks: ['overflow', 'clipping', 'overlap', 'footer-gap', 'contrast', 'console'] },
  { name: 'dark-390', width: 390, height: 844, scheme: 'dark', checks: ['contrast', 'console'] },
  { name: 'dark-1280', width: 1280, height: 800, scheme: 'dark', checks: ['contrast', 'console'] },
];

const PAGES = pages();

for (const s of SETUPS) {
  test.describe(s.name, () => {
    // Reduced motion keeps decorations (falling leaves, bouncing hints) still, so layout checks are stable.
    test.use({ viewport: { width: s.width, height: s.height }, colorScheme: s.scheme, reducedMotion: 'reduce' });
    for (const p of PAGES) {
      test(p.url, async ({ page }, info) => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(`page error: ${e.message.split('\n')[0]}`));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(`console error: ${m.text().split('\n')[0]}`); });
        page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(info.project.use.baseURL ?? '') && r.url() !== page.url()) errors.push(`HTTP ${r.status()}: ${new URL(r.url()).pathname}`); });

        const res = await page.goto(p.url, { waitUntil: 'load' });
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(150);
        if (p.url !== '/404' && res && res.status() >= 400) errors.push(`page returned HTTP ${res.status()}`);

        const found = {};
        if (s.checks.includes('overflow')) found.overflow = await page.evaluate(checkOverflow);
        if (s.checks.includes('clipping')) found.clipping = await page.evaluate(checkClipping);
        if (s.checks.includes('overlap')) found.overlap = await page.evaluate(checkOverlap);
        if (s.checks.includes('footer-gap')) found['footer-gap'] = await page.evaluate(checkFooterGap, FOOTER_GAP);
        if (s.checks.includes('contrast')) found.contrast = await page.evaluate(checkContrast);
        if (s.checks.includes('console')) found.console = [...new Set(errors)];

        let total = 0;
        for (const [check, list] of Object.entries(found)) {
          info.annotations.push({ type: 'qa-ran', description: check });
          for (const msg of list) info.annotations.push({ type: 'qa-fail', description: JSON.stringify({ check, page: p.url, setup: s.name, msg }) });
          total += list.length;
        }
        if (total) throw new Error(`${total} problem(s) on ${p.url} at ${s.name}:\n` + Object.entries(found).flatMap(([c, l]) => l.map((m) => `  [${c}] ${m}`)).join('\n'));
      });
    }
  });
}
