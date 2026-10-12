import { test, expect, type Page } from '@playwright/test';
import { addFilepath, createProjectWithTrack, login, setScript } from './helpers';

const TOM = '/Korg/Korg 01W/01W TOM.mp3';
const sidebar = (page: Page) => page.locator('aside.sidebar--left');
const crumb = (page: Page, path: string) => sidebar(page).locator(`[data-test-file-breadcrumb="${path}"]`);

async function openSourceTab(page: Page) {
  await page.locator('[data-test-track-item]:not(:has-text("Main Output"))').first().click();
  await page.getByRole('button', { name: 'source' }).click();
}

test.describe('file browser', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('from a lower folder you can always go back up to the root', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);

    await page.locator('[data-test-source-sample] button', { hasText: /^\s*Korg 01W\s*$/ }).click(); // a lower path segment
    await expect(crumb(page, '/Korg/Korg 01W')).toHaveAttribute('aria-current', 'location');

    await crumb(page, '/Korg').click();
    await expect(crumb(page, '/Korg')).toHaveAttribute('aria-current', 'location');
    await expect(crumb(page, '/Korg/Korg 01W')).toHaveCount(0);

    await crumb(page, '/').click(); // back to the root
    await expect(crumb(page, '/')).toHaveAttribute('aria-current', 'location');
    await expect(sidebar(page).getByText('Korg', { exact: true })).toBeVisible(); // the root lists the drum machines
    await expect(sidebar(page).getByText('Roland', { exact: true })).toBeVisible();
  });

  const TWO_SAMPLERS = `
      __().sampler({ id: 'kick', path: this.files[0] }).channelStrip().connect('#main-output');
      __().sampler({ id: 'snare', path: this.files[1] }).channelStrip().connect('#main-output');
    `;
  const menuTab = (page: Page, id: string) => page.locator('.track-footer .tab-btn', { hasText: id });
  const sidebarTab = (page: Page, id: string) => sidebar(page).locator('.tab-btn', { hasText: id });

  test('the source menu shows the sample of the selected node only', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', TWO_SAMPLERS);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);

    const sample = page.locator('[data-test-source-sample]');
    await expect(sample).toHaveCount(1);
    await expect(sample).toContainText('01W TOM'); // the first node (kick)
    await menuTab(page, 'snare').click();
    await expect(sample).toHaveCount(1);
    await expect(sample).toHaveAttribute('data-source-node-id', 'snare');
    await expect(sample.getByRole('button', { name: 'Pick a Sound' })).toBeVisible();
  });

  test('selecting a node tab in the source menu or the file sidebar keeps both in sync', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', TWO_SAMPLERS);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);
    await page.locator('[data-test-source-sample] button', { hasText: /^\s*Korg 01W\s*$/ }).click(); // opens the file sidebar

    await expect(menuTab(page, 'kick')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidebarTab(page, 'kick')).toHaveAttribute('aria-pressed', 'true');

    await sidebarTab(page, 'snare').click(); // from the sidebar...
    await expect(menuTab(page, 'snare')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-test-source-sample]')).toHaveAttribute('data-source-node-id', 'snare');

    await menuTab(page, 'kick').click(); // ...and from the source menu
    await expect(sidebarTab(page, 'kick')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidebarTab(page, 'snare')).toHaveAttribute('aria-pressed', 'false');
  });

  test('a file picked while the second node is selected fills the second sampler', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', TWO_SAMPLERS);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);

    await menuTab(page, 'snare').click();
    await page.locator('[data-test-source-sample]').getByRole('button', { name: 'Pick a Sound' }).click();
    await expect(sidebarTab(page, 'snare')).toHaveAttribute('aria-pressed', 'true'); // the sidebar follows
    await crumb(page, '/').click();
    await expect(crumb(page, '/')).toHaveAttribute('aria-current', 'location');
    await sidebar(page).getByText('Korg', { exact: true }).click();
    await sidebar(page).getByText('Korg 01W', { exact: true }).click();
    const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/v1\/filepath-controls/.test(r.url()));
    await sidebar(page).getByText('AGG', { exact: true }).click();

    const body = await (await saved).json();
    expect(body.data.attributes['node-order']).toBe(1); // slot 1 = the second sampler
    await expect(page.locator('[data-test-source-sample]')).toContainText('AGG');
    await menuTab(page, 'kick').click();
    await expect(page.locator('[data-test-source-sample]')).toContainText('01W TOM'); // the first one is unchanged
  });

  test('node tabs show the node type with its id underneath, cut off with an ellipsis', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `
      __().sampler({ id: 'a-very-long-sampler-identifier-that-would-not-fit', path: this.files[0] }).channelStrip().connect('#main-output');
      __().sampler({ id: 'snare', path: this.files[1] }).channelStrip().connect('#main-output');
    `);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);

    const buttons = page.locator('.tab-btn.horizontal').filter({ has: page.locator('[data-test-tab-sublabel]') });
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(1)).toContainText('snare');
    const widths = await buttons.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(widths[0]).toBe(widths[1]); // consistent size
    const long = buttons.nth(0).locator('[data-test-tab-sublabel]');
    expect(await long.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true); // truncated
  });
});
