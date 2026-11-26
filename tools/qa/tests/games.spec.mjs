// Check 12: game controls do what they say (Undo takes a move back, Restart resets, timers stop, hints act).
import { test, expect } from '@playwright/test';

const pill = (page, i) => page.locator('#pk-game .pill').nth(i);

test('Burrow Escape: Undo takes the move back and Restart resets the count', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'game-controls' });
  await page.goto('/play/burrow-escape', { waitUntil: 'networkidle' });
  const slide = async () => {
    // Select pieces until one has a glowing target square, then slide it there.
    for (const piece of await page.locator('#pk-game .gcell.burrow[aria-label^="Log"], #pk-game .gcell.burrow[aria-label^="Rabbit"]').all()) {
      await piece.click();
      if (await page.locator('#pk-game .gcell.target').count()) { await page.locator('#pk-game .gcell.target').first().click(); return; }
    }
    throw new Error('no piece could slide');
  };
  await slide();
  await expect(pill(page, 0)).toContainText('Moves: 1');
  await page.locator('#pk-game [data-g="undo"]').click();
  await expect(pill(page, 0)).toContainText('Moves: 0');
  await slide(); await slide();
  await expect(pill(page, 0)).toContainText('Moves: 2');
  await page.locator('#pk-game [data-g="restart"]').click();
  await expect(pill(page, 0)).toContainText('Moves: 0');
});

test('Fresh Snow: Undo after tapping back along a trail restores the removed steps', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'game-controls' });
  await page.goto('/fresh-snow?level=morning', { waitUntil: 'networkidle' });
  const steps = () => page.locator('#fs-game .badge').count();
  for (let k = 0; k < 3; k++) { await page.locator('[data-fs="hint"]').click(); await page.waitForTimeout(80); }
  expect(await steps()).toBe(3);
  await page.locator('[data-fs="cell"][aria-label*="step 1"]').first().click(); // tap back: keeps step 1 only
  expect(await steps()).toBe(1);
  await page.locator('[data-fs="undo"]').click();
  expect(await steps(), 'Undo brings back the steps the tap removed').toBe(3);
});

test('Mushroom Rings: the clock stops after the last wrong guess', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'game-controls' });
  await page.goto('/mushroom-rings', { waitUntil: 'networkidle' });
  // Guess squares until the game ends; stop counting if a guess happens to be right.
  for (const cell of await page.locator('[data-mr]').all()) {
    if (await page.locator('[data-mr-act="hint"][disabled]').count()) break;
    if ((await cell.getAttribute('aria-label')).includes('guessed')) continue;
    await cell.click(); await page.waitForTimeout(60);
  }
  const won = await page.locator('#mr-result:not([hidden])').count();
  test.skip(won > 0, 'a guess found the spore; the loss path did not happen');
  const before = await page.locator('#mr-timer').innerText();
  await page.waitForTimeout(2300);
  expect(await page.locator('#mr-timer').innerText()).toBe(before);
});

test('Beaver Lodges: Hint clears a half-tapped corner', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'game-controls' });
  await page.goto('/play/beaver-lodges', { waitUntil: 'networkidle' });
  await page.locator('#pk-game .gcell.lodge').first().click();
  await expect(page.locator('#pk-game .gcell.lodge.hinted')).toHaveCount(1);
  await page.locator('#pk-game [data-g="hint"]').click();
  await expect(page.locator('#pk-game .gcell.lodge.hinted')).toHaveCount(0);
});

test('Whose Print?: the result shows answers right, not moves', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'game-controls' });
  await page.goto('/play/whose-print', { waitUntil: 'networkidle' });
  for (let q = 0; q < 5; q++) { await page.locator('#pk-game [data-g^="ans:"]').first().click(); await page.waitForTimeout(60); }
  const stats = page.locator('#pk-result .stats');
  await expect(stats).toContainText('of 5');
  await expect(stats).toContainText('correct');
  await expect(stats).not.toContainText('moves');
});

test('Acorn Thief: if you cross off the thief, Hint puts them back', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'game-controls' });
  await page.goto('/play/acorn-thief', { waitUntil: 'networkidle' });
  for (let k = 0; k < 5; k++) await page.locator(`#pk-game [data-g="cross:${k}"]`).click();
  await expect(pill(page, 0)).toContainText('0 left');
  await page.locator('#pk-game [data-g="hint"]').click();
  await expect(page.locator('#pk-game .coach')).toContainText('could still be the thief');
  await expect(pill(page, 0)).toContainText('1 left');
});
