// Check 13: the board never jumps. Messages change length while you play; the board and its buttons must stay put.
import { test, expect } from '@playwright/test';
import { pages } from '../lib/site.mjs';

const PACK = ['frog-pond', 'firefly-night', 'owl-watch', 'acorn-stash', 'beehive', 'beaver-lodges', 'snow-picture', 'otter-slide', 'moose-crossing', 'burrow-escape', 'salmon-run', 'bears-last-snack', 'who-ate', 'freshest-track', 'egg-match', 'track-word', 'whose-print', 'feather-pairs', 'leaf-pile', 'who-was-here', 'nut-sort', 'vine-links', 'spot-the-change', 'berry-match', 'hollow-tree-inn'];
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

// Calm UI: nothing in the interface shakes, hops, bounces or pops while you play, and buttons do not move on hover
// or press. Records every CSS animation and script animation that starts while tapping through each game.
const JOLTS = ['shake', 'wobble', 'boing', 'cheer', 'bounce', 'burrowshake', 'arrivepop', 'tokbob', 'berry-drop', 'bubblein', 'sing'];
for (const url of PAGES) {
  test(`nothing shakes, hops or pops: ${url}`, async ({ page }, info) => {
    info.annotations.push({ type: 'qa-ran', description: 'stable' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(() => {
      window.__jolts = [];
      document.addEventListener('animationstart', (e) => window.__jolts.push({ css: e.animationName }));
      const orig = window.Element.prototype.animate;
      window.Element.prototype.animate = function (frames, opts) {
        const tf = (Array.isArray(frames) ? frames : []).map((f) => String(f.transform ?? '')).filter(Boolean);
        if (tf.length >= 3 && !this.classList.contains('puff')) window.__jolts.push({ js: tf.join(' → ').slice(0, 120), on: this.className });
        return orig.call(this, frames, opts);
      };
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('#fs-skip')?.click());
    // Tap around the board (some taps are wrong on purpose), then Hint.
    const cells = page.locator(`${BOARD} button:not([disabled])`);
    const n = await cells.count();
    for (const k of [0, 2, 5, 9, 14].filter((x) => x < n)) { await cells.nth(k).click({ force: true }).catch(() => {}); await page.waitForTimeout(80); }
    const hint = page.locator('main button[data-g="hint"]:not([disabled]), main button[data-fs="hint"]:not([disabled]), main button[data-nb="hint"]:not([disabled]), main button[data-mr-act="hint"]:not([disabled])').first();
    if (await hint.count()) {
      // Hover and press must not move the button.
      await hint.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await page.waitForTimeout(250);
      const y = () => hint.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      const before = { y: await y() };
      await hint.hover(); await page.waitForTimeout(250);
      const hovered = { y: await y() };
      await page.mouse.down(); await page.waitForTimeout(150);
      const pressed = { y: await y() };
      await page.mouse.up(); await page.waitForTimeout(150);
      expect(Math.abs(hovered.y - before.y), 'Hint moved on hover').toBeLessThanOrEqual(0.5);
      expect(Math.abs(pressed.y - before.y), 'Hint moved when pressed').toBeLessThanOrEqual(0.5);
    }
    const jolts_names = JOLTS; const jolts = (await page.evaluate(() => window.__jolts)).filter((j) => j.js || jolts_names.includes(j.css));
    expect(jolts, JSON.stringify(jolts.slice(0, 4))).toEqual([]);
  });
}
