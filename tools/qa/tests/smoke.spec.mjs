// Check 7: smoke play. Solve today's Fresh Snow Morning with the Hint button, press Check, expect the result panel.
import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`fresh snow morning (${width}px)`, async ({ page }, info) => {
    info.annotations.push({ type: 'qa-ran', description: 'smoke-play' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: width < 720 ? 844 : 800 });
    try {
      await page.goto('/fresh-snow?level=morning');
      const game = page.locator('#fs-game');
      const hint = game.locator('[data-fs="hint"]');
      await expect(hint).toBeVisible();
      const cards = game.locator('[data-fs="sel"]');
      const animals = await cards.count();
      expect(animals, 'animal cards on the board').toBeGreaterThan(0);
      // Each Hint adds one correct step; a trail is at most n*n squares, so this always ends.
      for (let i = 0; i < 80; i++) {
        if ((await game.locator('[data-fs="sel"] .home').count()) === animals) break;
        // The "next step" squares bounce forever; scroll to the middle so the phone tab bar can't cover it.
        await hint.scrollIntoViewIfNeeded();
        await hint.evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await hint.click({ force: true });
      }
      await expect(game.locator('[data-fs="sel"] .home'), 'every animal home').toHaveCount(animals);
      const check = game.locator('[data-fs="check"]');
      await check.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await check.click({ force: true });
      await expect(page.locator('#fs-result'), 'result panel').toBeVisible({ timeout: 10000 });
      expect(errors, 'no page errors while playing').toEqual([]);
    } catch (e) {
      info.annotations.push({ type: 'qa-fail', description: JSON.stringify({ check: 'smoke-play', page: '/fresh-snow', setup: `${width}px`, msg: String(e.message || e).split('\n')[0] }) });
      throw e;
    }
  });
}
