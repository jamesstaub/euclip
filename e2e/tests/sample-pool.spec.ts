import { test, expect, type Page } from '@playwright/test';
import { addFilepath, apiHeaders, createProjectWithTrack, login } from './helpers';

const TOM = '/Korg/Korg 01W/01W TOM.mp3';
const AGG = '/Korg/Korg 01W/AGG.mp3';

const slugOf = (page: Page) => page.url().split('/').filter(Boolean).pop()!.replace(/\?.*/, '');
const pool = (page: Page) => page.locator('[data-test-sample-pool]');
const rows = (page: Page) => pool(page).locator('[data-test-pool-sample]');
const row = (page: Page, path: string) => pool(page).locator(`[data-test-pool-sample][data-sample-path="${path}"]`);

// the pool is the "In this project" shelf of the sound browser: open the browser from the track's source
// button, then switch shelf
async function openPool(page: Page) {
  await page.locator('[data-test-source-kind]').first().click();
  await page.locator('[data-test-segment="pool"]').click();
}

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

  test('the pool is the "In this project" shelf of the sound browser, empty at first', async ({ page }) => {
    await createProjectWithTrack(page);
    await expect(pool(page)).toHaveCount(0);
    await openPool(page);
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
    await openPool(page);

    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, TOM)).toHaveAttribute('data-sample-state', 'ready', { timeout: 20_000 });
    await expect(row(page, AGG)).toHaveAttribute('data-sample-state', 'ready', { timeout: 20_000 });
    await expect(row(page, TOM).locator('[data-test-pool-state]')).toContainText(/\d\.\d\ds/);
    await expect(row(page, TOM).locator('[data-test-pool-usage]')).toContainText(/not used/i);
    await row(page, TOM).getByRole('button', { name: /^Audition/ }).click(); // must not throw
  });

  test('a sample can be put on a track slot; it is then in use and cannot be removed', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await addToPool(page, TOM);
    await page.reload();
    await openPool(page);

    await row(page, TOM).hover(); // Use shows on the row you are on
    await row(page, TOM).locator('[data-test-pool-use]').click(); // puts it on the sampler the target card shows
    await expect(row(page, TOM).locator('[data-test-pool-usage]')).not.toContainText(/not used/i, { timeout: 20_000 });
    await expect(page.locator('[data-test-source-label]').first()).toContainText('01W TOM');
    // in use: the API refuses to remove it
    await row(page, TOM).locator('[data-test-pool-menu]').click();
    await page.getByRole('button', { name: 'Remove from project' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'still used' })).toBeVisible();
    await expect(rows(page)).toHaveCount(1);
    expect(track.id).toBeTruthy();
  });

  test('files that tracks pick appear in the pool, and unused samples can be renamed and removed', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await addFilepath(page, track, 0, AGG);
    await addToPool(page, TOM);
    await page.reload();
    await openPool(page);

    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, AGG).locator('[data-test-pool-usage]')).not.toContainText(/not used/i);

    await row(page, TOM).locator('[data-test-pool-label]').dblclick();
    await page.getByLabel('Sample name').fill('tom');
    await page.getByLabel('Sample name').press('Enter');
    await expect(row(page, TOM).locator('[data-test-pool-label]')).toHaveText('tom');

    await row(page, TOM).locator('[data-test-pool-menu]').click();
    await page.getByRole('button', { name: 'Remove from project' }).click();
    await expect(rows(page)).toHaveCount(1);
  });

  test('the browser has two shelves: In this project and All sounds', async ({ page }) => {
    await createProjectWithTrack(page);
    await page.locator('[data-test-source-kind]').first().click();
    const segment = (value: string) => page.locator(`[data-test-segment="${value}"]`);
    await expect(segment('browse')).toHaveAttribute('aria-pressed', 'true'); // the catalog is where a pick starts
    await expect(pool(page)).toHaveCount(0);
    await expect(page.getByLabel('Search for Drum Sounds')).toBeVisible();

    await segment('pool').click();
    await expect(segment('pool')).toHaveAttribute('aria-pressed', 'true');
    await expect(pool(page)).toBeVisible();

    await segment('browse').click();
    await expect(pool(page)).toHaveCount(0);
  });
});
