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

    await page.locator('[data-test-sampler-where]').click(); // the card's folder caption: show it in the browser
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
  // a sampler's card in the footer's source tab, by its id in the script
  const card = (page: Page, id: string) => page.locator(`[data-test-sampler-card][data-source-node-id="${id}"]`);
  const menuTab = (page: Page, id: string) => card(page, id).locator('[data-test-sampler-select]');
  const sidebarTab = (page: Page, id: string) => sidebar(page).locator(`[data-test-target-slot="${id === 'kick' ? 1 : 2}"]`); // the target card's sampler chips

  test('the source tab shows what each sampler holds, and selecting one is a click on its card', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', TWO_SAMPLERS);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);

    await expect(page.locator('[data-test-sampler-card]')).toHaveCount(2);
    await expect(card(page, 'kick').locator('[data-test-sampler-name]')).toHaveText('01W TOM');
    await expect(card(page, 'snare').locator('[data-test-sampler-add]')).toBeVisible(); // nothing in the second yet
    await expect(card(page, 'kick').locator('[data-test-sampler-select]')).toHaveAttribute('aria-pressed', 'true');
    await card(page, 'snare').locator('[data-test-sampler-add]').click(); // an empty card selects itself and opens the browser
    await expect(sidebarTab(page, 'snare')).toHaveAttribute('aria-pressed', 'true');
  });

  test('selecting a node tab in the source menu or the file sidebar keeps both in sync', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', TWO_SAMPLERS);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);
    await page.locator('[data-test-sampler-where]').click(); // opens the file sidebar

    await expect(menuTab(page, 'kick')).toHaveAttribute('aria-pressed', 'true');
    await expect(sidebarTab(page, 'kick')).toHaveAttribute('aria-pressed', 'true');

    await sidebarTab(page, 'snare').click(); // from the sidebar...
    await expect(menuTab(page, 'snare')).toHaveAttribute('aria-pressed', 'true');

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

    await card(page, 'snare').locator('[data-test-sampler-add]').click();
    await expect(sidebarTab(page, 'snare')).toHaveAttribute('aria-pressed', 'true'); // the sidebar follows
    await crumb(page, '/').click();
    await expect(crumb(page, '/')).toHaveAttribute('aria-current', 'location');
    await sidebar(page).getByText('Korg', { exact: true }).click();
    await sidebar(page).getByText('Korg 01W', { exact: true }).click();
    const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/v1\/filepath-controls/.test(r.url()));
    await sidebar(page).getByText('AGG', { exact: true }).click(); // hears it
    await sidebar(page).locator('[data-test-sound-row][data-sound-name="AGG"] [data-test-sound-use]').click(); // Use puts it there

    const body = await (await saved).json();
    expect(body.data.attributes['node-order']).toBe(1); // slot 1 = the second sampler
    await expect(card(page, 'snare').locator('[data-test-sampler-name]')).toHaveText('AGG');
    await expect(card(page, 'kick').locator('[data-test-sampler-name]')).toHaveText('01W TOM'); // the first one is unchanged
  });

  test('sampler cards show the sampler id, and a long id does not stretch a card', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `
      __().sampler({ id: 'a-very-long-sampler-identifier-that-would-not-fit', path: this.files[0] }).channelStrip().connect('#main-output');
      __().sampler({ id: 'snare', path: this.files[1] }).channelStrip().connect('#main-output');
    `);
    await addFilepath(page, track, 0, TOM);
    await page.reload();
    await openSourceTab(page);

    const cards = page.locator('[data-test-sampler-card]');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(1)).toContainText('snare');
    const widths = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(widths[0]).toBe(widths[1]); // consistent size
  });
});
