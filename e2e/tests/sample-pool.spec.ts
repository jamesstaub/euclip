import { test, expect, type Page } from '@playwright/test';
import { addFilepath, apiHeaders, createProjectWithTrack, login } from './helpers';

const TOM = '/Korg/Korg 01W/01W TOM.mp3';
const AGG = '/Korg/Korg 01W/AGG.mp3';

const slugOf = (page: Page) => page.url().split('/').filter(Boolean).pop()!.replace(/\?.*/, '');
const pool = (page: Page) => page.locator('[data-test-sample-pool]');
const rows = (page: Page) => pool(page).locator('[data-test-pool-sample]');
const row = (page: Page, path: string) => pool(page).locator(`[data-test-pool-sample][data-sample-path="${path}"]`);

async function addToPool(page: Page, path: string) {
  const res = await page.request.post(`/v1/projects/${slugOf(page)}/samples`, {
    headers: await apiHeaders(page),
    data: { data: { type: 'project-sample', attributes: { path } } },
  });
  expect(res.ok()).toBe(true);
}

test.describe('sample pool', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('the Samples button opens the pool in the left sidebar, empty at first', async ({ page }) => {
    await createProjectWithTrack(page);
    await expect(pool(page)).toHaveCount(0);
    await page.locator('[data-test-pool-toggle]').click();
    await expect(pool(page)).toBeVisible();
    await expect(pool(page).locator('[data-test-pool-empty]')).toBeVisible();
    await page.getByRole('button', { name: 'Close sidebar' }).first().click();
    await expect(pool(page)).toHaveCount(0);
  });

  test('lists the pool, loads each sample, and previews', async ({ page }) => {
    await createProjectWithTrack(page);
    await addToPool(page, TOM);
    await addToPool(page, AGG);
    await page.reload();
    await page.locator('[data-test-pool-toggle]').click();

    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, TOM)).toHaveAttribute('data-sample-state', 'ready', { timeout: 20_000 });
    await expect(row(page, AGG)).toHaveAttribute('data-sample-state', 'ready', { timeout: 20_000 });
    await expect(row(page, TOM).locator('[data-test-pool-state]')).toContainText(/\d\.\d\ds/);
    await expect(row(page, TOM).locator('[data-test-pool-usage]')).toContainText('Not used');
    await row(page, TOM).getByRole('button', { name: /^Preview/ }).click(); // must not throw
  });

  test('a sample can be put on a track slot; it is then in use and cannot be removed', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await addToPool(page, TOM);
    await page.reload();
    await page.locator('[data-test-pool-toggle]').click();

    await row(page, TOM).locator('[data-test-pool-use]').first().click();
    await expect(row(page, TOM).locator('[data-test-pool-use]').first()).toHaveAttribute('aria-pressed', 'true', { timeout: 20_000 });
    await expect(row(page, TOM).locator('[data-test-pool-usage]')).toContainText('Used by track 1');
    await expect(row(page, TOM).getByRole('button', { name: /^Remove/ })).toBeDisabled();
    expect(track.id).toBeTruthy();
  });

  test('files that tracks pick appear in the pool, and unused samples can be renamed and removed', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await addFilepath(page, track, 0, AGG);
    await addToPool(page, TOM);
    await page.reload();
    await page.locator('[data-test-pool-toggle]').click();

    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, AGG).locator('[data-test-pool-usage]')).toContainText('Used by');

    await row(page, TOM).locator('[data-test-pool-label]').dblclick();
    await page.getByLabel('Sample name').fill('tom');
    await page.getByLabel('Sample name').press('Enter');
    await expect(row(page, TOM).locator('[data-test-pool-label]')).toHaveText('tom');

    await row(page, TOM).getByRole('button', { name: /^Remove/ }).click();
    await expect(rows(page)).toHaveCount(1);
  });

  test('"Add samples" browses the catalog', async ({ page }) => {
    await createProjectWithTrack(page);
    await page.locator('[data-test-pool-toggle]').click();
    await pool(page).locator('[data-test-pool-browse]').click();
    await expect(pool(page).locator('[data-test-pool-catalog]')).toBeVisible();
    await expect(pool(page).getByLabel('Search for Drum Sounds')).toBeVisible();
    await pool(page).locator('[data-test-pool-browse]').click();
    await expect(pool(page).locator('[data-test-pool-list]')).toBeVisible();
  });
});
