import { test, expect, type Page } from '@playwright/test';
import { createProject, login } from './helpers';

// A node's parameters are compact rows in a grid: the strip never scrolls vertically, scrolls sideways when the rows do not
// fit, and resetting is one button for the whole node.
async function polysynthSourceTab(page: Page) {
  await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
  await page.getByText('Polysynth', { exact: true }).click();
  await page.locator('[data-test-track-item]', { has: page.locator('[data-test-source-kind="macro"]') }).click(); // waits for the new row
  await page.getByRole('button', { name: 'source', exact: true }).click(); // the footer's source tab
  await expect(page.locator('[data-test-param]').first()).toBeVisible({ timeout: 20_000 });
}

const strip = (page: Page) => page.locator('.node-controls');
const param = (page: Page, name: string) => page.locator(`[data-test-param="${name}"]`);

test.describe('node controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await createProject(page);
  });

  test('every parameter is one compact row, all visible, and the strip does not scroll vertically', async ({ page }) => {
    await polysynthSourceTab(page);
    const rows = page.locator('[data-test-param]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toBeInViewport();
      expect((await rows.nth(i).boundingBox())!.height).toBeLessThanOrEqual(64); // one line, not a bulky column
    }
    expect(await strip(page).evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
    // names are readable, not cut to "LP_FRE…"
    expect(await param(page, 'lp_frequency').locator('span.truncate').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('when the rows do not fit across, the strip scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await polysynthSourceTab(page);
    const scrolls = await strip(page).evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(scrolls).toBe(true);
    await strip(page).evaluate((el) => { el.scrollLeft = 300; });
    expect(await strip(page).evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect(await strip(page).evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true); // still no vertical scroll
  });

  test('Reset all puts every parameter of the node back; it is disabled when none was moved', async ({ page }) => {
    await polysynthSourceTab(page);
    const reset = page.locator('[data-test-reset-node]');
    await expect(reset).toBeDisabled();
    await expect(page.locator('[data-test-changed-count]')).toHaveText('0 changed');

    const input = param(page, 'osc_detune').locator('input');
    const original = await input.inputValue();
    await input.fill('25');
    await input.press('Enter');
    await expect(page.locator('[data-test-changed-count]')).toHaveText('1 changed');
    await expect(reset).toBeEnabled();

    await reset.click();
    await expect(page.locator('[data-test-changed-count]')).toHaveText('0 changed');
    await expect(input).toHaveValue(original);
    await expect(reset).toBeDisabled();
  });

  test("a parameter's range, step, default and reset are in its settings menu", async ({ page }) => {
    await polysynthSourceTab(page);
    await param(page, 'lp_frequency').locator('[data-test-control-config]').click();
    const panel = page.locator('[data-test-control-config-panel]');
    await expect(panel).toBeVisible();
    for (const label of ['max', 'min', 'step size', 'default']) await expect(panel).toContainText(label);
    await expect(panel.locator('[data-test-reset-control]')).toBeDisabled(); // nothing moved yet
    await expect(panel.getByRole('button', { name: 'Toggle Multislider Mode' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  });

  test('a unit that says nothing is not shown (a choice, a switch); an informative one is', async ({ page }) => {
    await polysynthSourceTab(page);
    await expect(param(page, 'lp_frequency').locator('[data-test-param-unit]')).toHaveText('Hz');
    await expect(param(page, 'osc_type').locator('[data-test-param-unit]')).toHaveCount(0); // a choice: "Choice" would say nothing
    await expect(param(page, 'osc_type').locator('.nexus-select').nth(1)).toHaveCount(0); // and no unit select either
  });
});
