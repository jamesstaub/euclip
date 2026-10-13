import { test, expect, type Page } from '@playwright/test';
import { createProject, login } from './helpers';

const sidebar = (page: Page) => page.locator('aside.sidebar--left');
const row = (page: Page, name: string) => sidebar(page).locator(`[data-test-sound-row][data-sound-name="${name}"]`);
const crumbs = (page: Page) => sidebar(page).locator('[data-test-file-breadcrumb]');

async function addKit(page: Page) {
  await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
  await page.getByText('Multi-sample kit', { exact: true }).click();
  await expect(page.locator('[data-test-source-kind="multi-sample"]')).toBeVisible();
}

// the browser opens at the root of the catalog; this walks to a folder of sounds
async function openKorg(page: Page) {
  await row(page, 'Korg').locator('[data-test-sound-folder]').click();
  await row(page, 'Korg 01W').locator('[data-test-sound-folder]').click();
  await expect(row(page, 'AGG')).toBeVisible();
}

// Use shows on the row you are on, so a person hovers it first
async function use(page: Page, name: string) {
  await row(page, name).hover();
  await row(page, name).locator('[data-test-sound-use]').click();
}

test.describe('sound browser', () => {
  test.beforeEach(async ({ page }) => {
    // count every sound the page starts playing (the preview goes straight to the speakers)
    await page.addInitScript(() => {
      (window as any).__starts = 0;
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args: any[]) {
        (window as any).__starts++;
        return start.apply(this, args as any);
      };
    });
    await login(page);
    await createProject(page);
  });

  test('nothing is highlighted before something is picked, and the breadcrumb is readable', async ({ page }) => {
    await page.locator('[data-test-source-kind="sample"]').first().click();
    await expect(sidebar(page)).toBeVisible();
    await expect(sidebar(page).locator('[data-test-sound-row][aria-selected="true"]')).toHaveCount(0);
    const rgb = await crumbs(page).first().evaluate((el) => getComputedStyle(el).color);
    const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
    expect(Math.min(r, g, b)).toBeGreaterThan(150); // light text on the dark panel
  });

  test('the target card says where the next sound goes', async ({ page }) => {
    await page.locator('[data-test-source-kind="sample"]').first().click();
    await expect(page.locator('[data-test-target]')).toContainText('Track 1');
    await expect(page.locator('[data-test-target]')).toContainText('Sampler');
  });

  test('a sound can be auditioned before it is used, and shows its length afterwards', async ({ page }) => {
    await page.locator('[data-test-source-kind="sample"]').first().click();
    await openKorg(page);
    await expect(row(page, 'AGG').locator('.sound-row__detail')).toHaveCount(0); // not known before it is heard
    await row(page, 'AGG').locator('[data-test-sound-play]').click();
    await expect.poll(() => page.evaluate(() => (window as any).__starts), { timeout: 20_000 }).toBeGreaterThan(0);
    await expect(row(page, 'AGG').locator('.sound-row__detail')).toContainText(/\d\.\d\ds/);
    // and the track still has no sound: hearing it is not choosing it
    await expect(page.locator('[data-test-source-kind="sample"] [data-test-source-label]')).toHaveText('Pick a Sound');
  });

  test('arrow keys move through the list, → opens a folder, ← goes up, Enter uses a sound', async ({ page }) => {
    await page.locator('[data-test-source-kind="sample"]').first().click();
    const list = sidebar(page).getByRole('listbox', { name: 'Sounds' });
    await list.focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(sidebar(page).locator('[data-test-sound-row][aria-selected="true"]')).toHaveCount(1);
    await expect(crumbs(page)).toHaveCount(1); // at the root
    await page.keyboard.press('ArrowRight'); // opens the second folder
    await expect(crumbs(page)).toHaveCount(2);
    await page.keyboard.press('ArrowLeft'); // back up
    await expect(crumbs(page)).toHaveCount(1);

    await openKorg(page);
    await list.focus();
    await page.keyboard.press('ArrowDown');
    const first = (await sidebar(page).locator('[data-test-sound-row][aria-selected="true"]').getAttribute('data-sound-name'))!;
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-test-source-kind="sample"] [data-test-source-label]')).toHaveText(first.replace(/\.[^.]+$/, ''));
  });

  test('Use puts the sound on the track in one click, and Undo takes it back', async ({ page }) => {
    const label = page.locator('[data-test-source-kind="sample"] [data-test-source-label]');
    await page.locator('[data-test-source-kind="sample"]').first().click();
    await openKorg(page);
    await use(page, 'AGG');
    await expect(label).toHaveText('AGG');
    await expect(row(page, 'AGG').locator('[data-test-sound-badge]')).toHaveCount(1); // it knows where it lives now

    await page.locator('[data-test-toast-action]').click(); // Undo
    await expect(label).toHaveText('Pick a Sound');
    await use(page, '01W TOM');
    await expect(label).toHaveText('01W TOM');
    await use(page, 'AGG'); // replaces
    await expect(label).toHaveText('AGG');
    await page.locator('[data-test-toast-action]').click(); // Undo brings the previous one back, not an empty sampler
    await expect(label).toHaveText('01W TOM');
  });

  test('filling a kit: each Use moves the target to the next empty sampler; badges show where sounds are', async ({ page }) => {
    await addKit(page);
    const button = page.locator('[data-test-source-kind="multi-sample"]');
    await expect(button).toContainText('0 / 4 samplers');
    await button.click();
    const chip = (n: number) => page.locator(`[data-test-target-slot="${n}"]`);
    await expect(chip(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 1');

    await openKorg(page);
    await use(page, 'AGG');
    await expect(button).toContainText('1 / 4 samplers');
    await expect(chip(2)).toHaveAttribute('aria-pressed', 'true'); // advanced
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 2');
    await use(page, '01W TOM');
    await expect(button).toContainText('2 / 4 samplers');
    await expect(chip(3)).toHaveAttribute('aria-pressed', 'true');
    await expect(row(page, 'AGG').locator('[data-test-sound-badge]')).toHaveText('Sampler 1');
    await expect(row(page, '01W TOM').locator('[data-test-sound-badge]')).toHaveText('Sampler 2');

    await page.locator('[data-test-toast-action]').click(); // Undo the second
    await expect(button).toContainText('1 / 4 samplers');
    await expect(chip(2)).toHaveAttribute('aria-pressed', 'true');
  });

  test('the target can be changed from the card: a chip, or its menu', async ({ page }) => {
    await addKit(page);
    await page.locator('[data-test-source-kind="multi-sample"]').click();
    await page.locator('[data-test-target-slot="3"]').click();
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 3');
    await page.locator('[data-test-target-change]').click();
    await page.getByRole('button', { name: /Sampler 4$/ }).click();
    await expect(page.locator('[data-test-target-slot="4"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('search lists sounds grouped by machine; Use puts one on the track', async ({ page }) => {
    await page.locator('[data-test-source-kind="sample"]').first().click();
    await sidebar(page).getByLabel('Search for Drum Sounds').pressSequentially('kick', { delay: 60 });
    const results = sidebar(page).locator('[data-test-search-results]');
    await expect(results).toBeVisible({ timeout: 15_000 });
    expect(await results.locator('.sound-group__name').count()).toBeGreaterThan(1);
    const first = results.locator('[data-test-sound-row]').first();
    const name = (await first.getAttribute('data-sound-name'))!;
    await first.hover();
    await first.locator('[data-test-sound-use]').click();
    await expect(page.locator('[data-test-source-kind="sample"] [data-test-source-label]')).toHaveText(name.replace(/\.[^.]+$/, ''));
    await sidebar(page).locator('[data-test-search-clear]').click(); // back to browsing
    await expect(results).toHaveCount(0);
  });

  test('"From sounds…" targets new tracks: tick sounds, then make one track each, or one kit', async ({ page }) => {
    const openFromSounds = async () => {
      await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
      await page.getByText('From sounds…', { exact: true }).click();
      await expect(page.locator('[data-test-target]')).toContainText('New tracks');
      // the browser remembers its folder: only walk there when it is not already there
      if (!(await row(page, 'AGG').isVisible())) await openKorg(page);
    };
    const tick = (name: string) => row(page, name).locator('[data-test-sound-check]').check();

    // a kit from three sounds
    await openFromSounds();
    await expect(row(page, 'AGG').locator('[data-test-sound-use]')).toHaveCount(0); // ticking replaces Use here
    await tick('AGG');
    await expect(page.locator('[data-test-create-kit]')).toBeDisabled(); // a kit needs two to four
    await tick('01W TOM');
    await tick('CABA');
    await expect(page.locator('[data-test-selection-tray]')).toContainText('AGG');
    await page.locator('[data-test-create-kit]').click();
    const kit = page.locator('[data-test-source-kind="multi-sample"]');
    await expect(kit).toContainText('3 / 4 samplers', { timeout: 30_000 });
    await expect(sidebar(page)).toHaveCount(0); // done: the browser closes

    // and a track each from two
    const before = await page.locator('[data-test-source-kind="sample"]').count();
    await openFromSounds();
    await tick('AGG');
    await tick('01W TOM');
    await page.locator('[data-test-create-tracks]').click();
    await expect(page.locator('[data-test-source-kind="sample"]')).toHaveCount(before + 2, { timeout: 30_000 });
  });

  // ---- the sampler rack (footer, Source tab) ----

  async function kitWithTwoSounds(page: Page) {
    await addKit(page);
    await page.locator('[data-test-source-kind="multi-sample"]').click();
    await page.getByRole('button', { name: 'source' }).click(); // the rack is in the footer's source tab
    await openKorg(page);
    await use(page, 'AGG');
    await expect(page.locator('[data-test-sampler-card="1"] [data-test-sampler-name]')).toHaveText('AGG');
    await use(page, '01W TOM');
    await expect(page.locator('[data-test-sampler-card="2"] [data-test-sampler-name]')).toHaveText('01W TOM');
  }
  const sourceTab = (page: Page) => page.getByRole('button', { name: 'source' }).click();
  const samplerCard = (page: Page, n: number) => page.locator(`[data-test-sampler-card="${n}"]`);

  test('the rack shows what each sampler holds, and the card the browser is adding to has a ring', async ({ page }) => {
    await kitWithTwoSounds(page);
    await sourceTab(page);
    await expect(page.locator('[data-test-sampler-card]')).toHaveCount(4);
    await expect(samplerCard(page, 1).locator('canvas')).toBeVisible({ timeout: 20_000 }); // a small waveform
    await expect(samplerCard(page, 3).locator('[data-test-sampler-add]')).toBeVisible();
    await expect(page.locator('.sampler-rack__count')).toContainText('2 loaded');
    // the browser is open and moved on to the third sampler: that card says so
    await expect(samplerCard(page, 3)).toHaveClass(/sampler-card--target/);
    await expect(samplerCard(page, 3)).toContainText('adding here');
    await sidebar(page).getByRole('button', { name: /close sidebar/i }).click();
    await expect(samplerCard(page, 3)).not.toHaveClass(/sampler-card--target/);
  });

  test('an empty card opens the browser aimed at it; change does the same for a full one', async ({ page }) => {
    await kitWithTwoSounds(page);
    await sourceTab(page);
    await sidebar(page).getByRole('button', { name: /close sidebar/i }).click();
    await samplerCard(page, 4).locator('[data-test-sampler-add]').click();
    await expect(sidebar(page)).toBeVisible();
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 4');

    await samplerCard(page, 1).locator('[data-test-sampler-change]').click();
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 1');
    await use(page, 'CABA'); // replaces sampler 1
    await expect(samplerCard(page, 1).locator('[data-test-sampler-name]')).toHaveText('CABA');
  });

  test('a card can be cleared, with Undo', async ({ page }) => {
    await kitWithTwoSounds(page);
    await sourceTab(page);
    await samplerCard(page, 2).locator('[data-test-sampler-clear]').click();
    await expect(samplerCard(page, 2).locator('[data-test-sampler-add]')).toBeVisible();
    await expect(page.locator('[data-test-source-kind="multi-sample"]')).toContainText('1 / 4 samplers');
    await page.locator('[data-test-toast-action]').click();
    await expect(samplerCard(page, 2).locator('[data-test-sampler-name]')).toHaveText('01W TOM');
    await expect(page.locator('[data-test-source-kind="multi-sample"]')).toContainText('2 / 4 samplers');
  });

  test('a card can audition its sound', async ({ page }) => {
    await kitWithTwoSounds(page);
    await sourceTab(page);
    const before = await page.evaluate(() => (window as any).__starts);
    await samplerCard(page, 1).locator('[data-test-sampler-audition]').click();
    await expect.poll(() => page.evaluate(() => (window as any).__starts), { timeout: 20_000 }).toBeGreaterThan(before);
  });

  test("the folder caption shows the sampler's sound in the browser, marked and in view", async ({ page }) => {
    await kitWithTwoSounds(page);
    await sourceTab(page);
    await sidebar(page).getByRole('button', { name: /close sidebar/i }).click();
    await expect(samplerCard(page, 1).locator('[data-test-sampler-where]')).toHaveText('Korg › Korg 01W');
    await samplerCard(page, 1).locator('[data-test-sampler-where]').click();
    await expect(crumbs(page).last()).toHaveAttribute('aria-current', 'location');
    await expect(crumbs(page).last()).toHaveText('Korg 01W');
    await expect(row(page, 'AGG')).toHaveClass(/sound-row--current/); // the sampler's own sound
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 1');
  });

  test('clicking a kit\'s source button in the track list aims the browser at the first empty sampler', async ({ page }) => {
    await kitWithTwoSounds(page);
    await sidebar(page).getByRole('button', { name: /close sidebar/i }).click();
    await page.locator('[data-test-source-kind="multi-sample"]').click();
    await expect(page.locator('[data-test-target]')).toContainText('Sampler 3');
  });
});
