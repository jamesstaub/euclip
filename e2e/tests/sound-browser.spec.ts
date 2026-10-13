import { test, expect, type Page } from '@playwright/test';
import { createProject, login } from './helpers';

const sidebar = (page: Page) => page.locator('aside.sidebar--left');

async function addKit(page: Page) {
  await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
  await page.getByText('Multi-sample kit', { exact: true }).click();
  await expect(page.locator('[data-test-source-kind="multi-sample"]')).toBeVisible();
}

test.describe('sound browser, phase 0', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createProject(page);
  });

  test('nothing is highlighted before something is picked, and the breadcrumb is readable', async ({ page }) => {
    await page.locator('[data-test-source-kind="sample"]').first().click();
    await expect(sidebar(page)).toBeVisible();
    // the list used to light up its first row (an unset selection fell back to index 0)
    await expect(sidebar(page).locator('li.bg-yellow')).toHaveCount(0);
    const crumb = sidebar(page).locator('[data-test-file-breadcrumb]').first();
    await expect(crumb).toBeVisible();
    const rgb = await crumb.evaluate((el) => getComputedStyle(el).color);
    const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
    expect(Math.min(r, g, b)).toBeGreaterThan(150); // light text on the dark panel, not dark grey
  });

  test('picking a sound moves the target to the next empty sampler, and the kit button counts the loaded ones', async ({ page }) => {
    await addKit(page);
    const button = page.locator('[data-test-source-kind="multi-sample"]');
    await expect(button).toContainText('0 / 4 samplers');
    await button.click();
    const tab = (id: string) => sidebar(page).locator('.tab-btn', { hasText: id });
    await expect(tab('sampler1')).toHaveAttribute('aria-pressed', 'true');

    await sidebar(page).getByText('Korg', { exact: true }).click();
    await sidebar(page).getByText('Korg 01W', { exact: true }).click();
    await sidebar(page).getByText('AGG', { exact: true }).click();
    await expect(button).toContainText('1 / 4 samplers');
    await expect(tab('sampler2')).toHaveAttribute('aria-pressed', 'true'); // advanced

    await sidebar(page).getByText('01W TOM', { exact: true }).click();
    await expect(button).toContainText('2 / 4 samplers');
    await expect(tab('sampler3')).toHaveAttribute('aria-pressed', 'true');
  });
});
