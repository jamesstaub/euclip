import { test, expect, type Page } from '@playwright/test';
import { audioNodeCount, createProject, login } from './helpers';

// A new project starts with one sampler track (plus the hidden "Main Output" track).
const trackRows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');

test.describe('tracks', () => {
  test.beforeEach(async ({ page }) => {
    // record whether the failure label ever shows (it must not flash during create/delete)
    await page.addInitScript(() => {
      (window as any).__sawFailedLabel = false;
      new MutationObserver(() => {
        if (document.querySelector('[data-test-source-failed]')) (window as any).__sawFailedLabel = true;
      }).observe(document, { subtree: true, childList: true });
    });
    await login(page);
    await createProject(page);
  });

  test('a new project has a sampler track that builds and plays', async ({ page }) => {
    await expect(trackRows(page)).toHaveCount(1);
    await expect(trackRows(page).first().locator('[data-test-no-source]')).toHaveCount(0);

    await page.getByRole('button', { name: 'play' }).click();
    await expect(page.getByRole('button', { name: 'pause' })).toBeVisible();
    await expect.poll(() => audioNodeCount(page, 'sampler')).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'stop' }).click();
    await expect(page.getByRole('button', { name: 'play' })).toBeVisible();
    expect(await page.evaluate(() => (window as any).__sawFailedLabel)).toBe(false);
  });

  test('deleting a playing track removes its audio and never flashes a failure', async ({ page }) => {
    await page.getByRole('button', { name: 'New Track' }).click();
    await expect(trackRows(page)).toHaveCount(2);
    const added = trackRows(page).last();
    const trackId = await added.getAttribute('data-track-id');
    const order = (await added.locator('span.code').first().textContent())!.trim();

    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(() => audioNodeCount(page, `sampler .track-${order}`)).toBeGreaterThan(0);

    await added.getByRole('button').last().click(); // track dropdown menu
    await page.getByText('delete', { exact: true }).click();

    await expect(trackRows(page)).toHaveCount(1);
    await expect(page.locator(`[data-track-id="${trackId}"]`)).toHaveCount(0);
    await expect.poll(() => audioNodeCount(page, `.track-${order}`)).toBe(0);
    // the other track keeps playing
    expect(await audioNodeCount(page, 'sampler')).toBeGreaterThan(0);
    // and we never sit on the URL of a track that no longer exists
    await expect.poll(() => page.url()).not.toContain(`/track/${trackId}`);
    expect(await page.evaluate(() => (window as any).__sawFailedLabel)).toBe(false);
  });

  test('audio is cleaned up after earlier deletes renumber the remaining tracks', async ({ page }) => {
    // the API renumbers `order` after a delete; teardown must still find the right nodes
    await page.getByRole('button', { name: 'New Track' }).click();
    await expect(trackRows(page)).toHaveCount(2);
    await page.getByRole('button', { name: 'New Track' }).click();
    await expect(trackRows(page)).toHaveCount(3);
    const ids = await trackRows(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-track-id')!));

    await page.getByRole('button', { name: 'play' }).click();
    for (const id of ids) {
      await expect.poll(() => audioNodeCount(page, `.track-id-${id}`)).toBeGreaterThan(0);
    }

    const remove = async (id: string) => {
      await page.locator(`[data-track-id="${id}"]`).getByRole('button').last().click();
      await page.getByText('delete', { exact: true }).click();
      await expect(page.locator(`[data-track-id="${id}"]`)).toHaveCount(0);
    };
    await remove(ids[0]); // later tracks move up one position
    await remove(ids[1]);

    await expect.poll(() => audioNodeCount(page, `.track-id-${ids[0]}`)).toBe(0);
    await expect.poll(() => audioNodeCount(page, `.track-id-${ids[1]}`)).toBe(0);
    expect(await audioNodeCount(page, `.track-id-${ids[2]}`)).toBeGreaterThan(0); // survivor still plays
  });
});
