// Check 9: keyboard focus survives a board action. Games re-draw their board on every move; a keyboard
// or screen-reader player must stay on the board instead of being thrown back to the top of the page.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from '@playwright/test';
import { DIST } from '../lib/site.mjs';

const CORE = [
  ['/fresh-snow?level=morning', '#fs-game'],
  ['/nests', '#nb-game'],
  ['/stepping-stones', '#st-game'],
  ['/mushroom-rings', '#mr-game'],
  ['/dawn-chorus', '#dc'],
  ['/trek/play?stage=1', '#tk-game'],
];
const playDir = join(DIST, 'play');
const PACK = existsSync(playDir) ? readdirSync(playDir).map((id) => [`/play/${id}`, '#pk-game']) : [];
// Any control a game draws carries one of these attributes; the first enabled one is pressed.
const CONTROL = ['data-fs="cell"', 'data-nb', 'data-st', 'data-mr', 'data-in', 'data-g']
  .map((a) => `button:not([disabled])[${a}]`).join(', ');

for (const [url, root] of [...CORE, ...PACK]) {
  test(`focus stays on the board: ${url}`, async ({ page }, info) => {
    info.annotations.push({ type: 'qa-ran', description: 'focus' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);
    const control = page.locator(root).locator(CONTROL).first();
    try {
      await control.waitFor({ timeout: 10000 });
      await control.focus();
      for (let k = 0; k < 2; k++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(120);
        const where = await page.evaluate((r) => { const a = document.activeElement; return !a || a === document.body ? 'the page body' : document.querySelector(r)?.contains(a) ? 'board' : `outside the board (${a.tagName})`; }, root);
        if (where !== 'board') throw new Error(`after pressing Enter ${k + 1}×, focus is on ${where}`);
      }
    } catch (e) {
      info.annotations.push({ type: 'qa-fail', description: JSON.stringify({ check: 'focus', page: url, setup: '1280px', msg: String(e.message || e).split('\n')[0] }) });
      throw e;
    }
  });
}
