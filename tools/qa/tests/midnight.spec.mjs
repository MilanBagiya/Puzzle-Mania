// Check 11: a page left open past local midnight offers the new day's puzzles (and archive pages stay quiet).
import { test, expect } from '@playwright/test';

for (const [w, h] of [[390, 844], [1280, 800]]) {
  test(`midnight notice appears and fits at ${w}px`, async ({ page }, info) => {
    info.annotations.push({ type: 'qa-ran', description: 'midnight' });
    await page.setViewportSize({ width: w, height: h });
    await page.clock.install({ time: new Date('2026-11-25T23:59:30') });
    await page.goto('/play/nut-sort', { waitUntil: 'networkidle' });
    await expect(page.locator('.newday')).toHaveCount(0);
    await page.clock.fastForward('01:00');
    const note = page.locator('.newday');
    await expect(note).toBeVisible();
    await expect(note).toContainText('today’s puzzles are ready');
    const box = await note.boundingBox();
    expect(box.x, 'inside the left edge').toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, 'inside the right edge').toBeLessThanOrEqual(w);
    await expect(note.getByRole('button', { name: 'Load today' })).toBeVisible();
  });
}

test('no midnight notice while playing from the archive', async ({ page }, info) => {
  info.annotations.push({ type: 'qa-ran', description: 'midnight' });
  await page.clock.install({ time: new Date('2026-11-25T23:59:30') });
  await page.goto('/play/nut-sort?date=2026-11-20', { waitUntil: 'networkidle' });
  await page.clock.fastForward('01:00');
  await page.waitForTimeout(200);
  await expect(page.locator('.newday')).toHaveCount(0);
});
