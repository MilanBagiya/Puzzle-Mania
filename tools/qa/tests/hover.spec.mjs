// Check 10: hover keeps text readable. Hover every visible link on key pages (light and dark) and require AA
// contrast (4.5:1) between its hovered text colour and the background behind it.
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/games', '/fresh-snow', '/play/frog-pond', '/stats', '/about'];
for (const scheme of ['light', 'dark']) {
  for (const url of PAGES) {
    test(`hover contrast ${scheme} ${url}`, async ({ page }, info) => {
      test.setTimeout(240_000); // hovers every control; the home and /games pages have hundreds
      info.annotations.push({ type: 'qa-ran', description: 'hover' });
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(url, { waitUntil: 'networkidle' });
      const count = await page.evaluate(() => { let n = 0; document.querySelectorAll('a').forEach((a) => { if (a.getClientRects().length && a.textContent.trim() && !a.closest('[hidden], dialog:not([open])')) a.dataset.qh = String(n++); }); return n; });
      const bad = [];
      for (let i = 0; i < count; i++) {
        const a = page.locator(`[data-qh="${i}"]`);
        try { await a.scrollIntoViewIfNeeded({ timeout: 800 }); await a.hover({ timeout: 800 }); } catch { continue; }
        await page.waitForTimeout(200); // let colour transitions finish
        const r = await a.evaluate((el) => {
          const P = (c) => c.match(/[\d.]+/g).map(Number);
          const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
          let bg = [255, 255, 255];
          for (let x = el; x; x = x.parentElement) { const c = P(getComputedStyle(x).backgroundColor); if (c.length < 4 || c[3] === 1) { bg = c; break; } }
          const fg = P(getComputedStyle(el).color), x = L(fg), y = L(bg);
          return { ratio: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) };
        });
        if (r.ratio + 0.005 < 4.5) bad.push(`"${r.text}" ${r.ratio.toFixed(2)}:1 on hover`);
      }
      for (const msg of bad) info.annotations.push({ type: 'qa-fail', description: JSON.stringify({ check: 'hover', page: url, setup: scheme, msg }) });
      expect(bad, 'hovered links below AA').toEqual([]);
    });
  }
}
