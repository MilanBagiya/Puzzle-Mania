// Check 13: the board never jumps. Messages change length while you play; the board and its buttons must stay put.
import { test, expect } from '@playwright/test';
import { pages } from '../lib/site.mjs';

const PACK = ['frog-pond', 'firefly-night', 'owl-watch', 'acorn-stash', 'beehive', 'beaver-lodges', 'snow-picture', 'otter-slide', 'moose-crossing', 'burrow-escape', 'salmon-run', 'bears-last-snack', 'who-ate', 'freshest-track', 'egg-match', 'track-word', 'whose-print', 'feather-pairs', 'leaf-pile', 'who-was-here', 'nut-sort', 'vine-links', 'spot-the-change', 'berry-match'];
const PAGES = ['/fresh-snow', '/nests', '/dawn-chorus', '/stepping-stones', '/mushroom-rings', ...PACK.map((g) => `/play/${g}`)];
// What the player looks at: the board, or for games without one, the first block right after the message.
const BOARD = 'main .boardwrap, main .pond, main [role="grid"], main .spot-scenes, main .coach + *';

for (const [w, h] of [[390, 844], [1280, 900]]) for (const url of PAGES) {
  test(`board stays put while playing (${w}px): ${url}`, async ({ page }, info) => {
    info.annotations.push({ type: 'qa-ran', description: 'stable' });
    await page.setViewportSize({ width: w, height: h });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('#fs-banner [data-dismiss], #fs-banner button:last-child')?.click());
    await page.waitForTimeout(150);
    const top = () => page.evaluate((sel) => { const b = document.querySelector(sel); return b ? Math.round(b.getBoundingClientRect().top + window.scrollY) : null; }, BOARD);
    const start = await top();
    expect(start, 'found the board').not.toBeNull();
    const moves = [];
    // Tap a spread of board controls, then Hint and Check, as a player would; note where the board is after each.
    const targets = await page.evaluate((sel) => {
      const b = document.querySelector(sel); const btns = [...(b?.querySelectorAll('button:not([disabled]), [data-cell], [data-g]') ?? [])];
      return [0, 3, 7, 12, 18].map((k) => btns[k] ? btns.indexOf(btns[k]) : -1).filter((k) => k >= 0);
    }, BOARD);
    for (const k of targets) {
      await page.evaluate(([sel, i]) => { const b = document.querySelector(sel); const btns = [...(b?.querySelectorAll('button:not([disabled]), [data-cell], [data-g]') ?? [])]; btns[i]?.click(); }, [BOARD, k]);
      await page.waitForTimeout(120);
      const t = await top(); if (t !== null) moves.push(t - start);
    }
    for (const act of ['hint', 'check']) {
      const b = page.locator(`main button[data-g="${act}"]:not([disabled]), main button[data-fs="${act}"]:not([disabled]), main button[data-nb="${act}"]:not([disabled]), main button[data-mr-act="${act}"]:not([disabled])`).first();
      if (await b.count()) { await b.click(); await page.waitForTimeout(150); const t = await top(); if (t !== null) moves.push(t - start); }
    }
    // Once solved the result screen may replace the board; only compare while the board is there.
    const worst = Math.max(0, ...moves.map((m) => Math.abs(m)));
    expect(worst, `board moved by ${moves.join(', ')}px`).toBeLessThanOrEqual(2);
  });
}

// Every page: content must not jump while the page loads and fills in (banners, saved progress, picks).
// Measured with the browser's own layout-shift score (CLS); Google's "good" limit is 0.1, we hold 0.02.
for (const [w, h] of [[390, 844], [1280, 800]]) for (const p of pages()) {
  test(`page does not jump while loading (${w}px): ${p.url}`, async ({ page }, info) => {
    info.annotations.push({ type: 'qa-ran', description: 'stable' });
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(() => {
      window.__cls = []; new window.PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls.push({ v: e.value, who: e.sources?.map((s) => s.node?.nodeName + (s.node?.id ? '#' + s.node.id : s.node?.className ? '.' + String(s.node.className).split(' ')[0] : '')).join(' ') }); }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(p.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const shifts = await page.evaluate(() => window.__cls);
    const total = shifts.reduce((s, x) => s + x.v, 0);
    expect(total, `layout shift ${total.toFixed(3)}: ${shifts.map((s) => `${s.v.toFixed(3)} ${s.who}`).join('; ')}`).toBeLessThanOrEqual(0.02);
  });
}
