import { test, expect, type Page } from '@playwright/test';
import { addFilepath, createProject, login } from './helpers';

const rows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');

async function addTrack(page: Page, typeTitle: string) {
  const before = await rows(page).count();
  await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
  await page.getByText(typeTitle, { exact: true }).click();
  await expect(rows(page)).toHaveCount(before + 1);
  const row = rows(page).last();
  const id = (await row.getAttribute('data-track-id'))!;
  const order = (await row.locator('span.code').first().textContent())!.trim();
  return { row, id, order };
}

const nodes = (page: Page, selector: string) => page.evaluate((s) => (window as any).__(s).size(), selector);

test.describe('track types in the New Track menu', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await createProject(page);
  });

  test('lists the types the API offers', async ({ page }) => {
    await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
    for (const title of ['Sampler', 'Looped sampler', 'Multi-sample kit', 'Polysynth', 'Drum Machine']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
  });

  test('a looped sampler loops and uses Loop Sync speed', async ({ page }) => {
    const { row, order } = await addTrack(page, 'Looped sampler');
    expect(await nodes(page, `sampler .track-${order}`)).toBe(1);

    await row.click();
    const speed = page.locator('.controls-wrapper', { has: page.getByText('speed', { exact: true }) });
    await expect(speed.locator('select option:checked')).toHaveText('Loop Sync');

    // the unit is saved: still Loop Sync after a reload
    await page.waitForTimeout(2000); // controls are saved shortly after they change
    await page.reload();
    await rows(page).last().click();
    await expect(
      page.locator('.controls-wrapper', { has: page.getByText('speed', { exact: true }) }).locator('select option:checked')
    ).toHaveText('Loop Sync');
  });

  test('a multi-sample kit has four sampler pads, each with its own file slot', async ({ page }) => {
    const { row, order } = await addTrack(page, 'Multi-sample kit');
    expect(await nodes(page, `sampler .track-${order}`)).toBe(4);
    await expect(row.getByText(/pick a sound/i)).toHaveCount(4);
  });

  test('a multi-sample kit loads a file per pad and plays them round-robin', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const { id } = await addTrack(page, 'Multi-sample kit');
    const files = ['/Korg/Korg 01W/01W TOM.mp3', '/Korg/Korg 01W/AGG.mp3', '/Korg/Korg 01W/01W TOM.mp3'];
    for (const [slot, file] of files.entries()) await addFilepath(page, { id } as any, slot, file);

    const loaded = new Set<number>();
    page.on('response', (r) => /storage\.googleapis\.com.*Korg/.test(decodeURIComponent(r.url())) && loaded.add(r.status()));
    await page.reload();
    const row = page.locator(`[data-track-id="${id}"]`);
    await expect(row.getByText(/pick a sound/i)).toHaveCount(1); // pad 4 still has no file
    await expect(row).toContainText('01W TOM');
    await expect(row).toContainText('AGG');
    await expect.poll(() => [...loaded].join(',')).toBe('200');

    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'stop' }).click();
    expect(errors).toEqual([]);
  });

  test('a polysynth builds the cracked polysynth macro and plays without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    const { row, order } = await addTrack(page, 'Polysynth');
    expect(await nodes(page, `polysynth .track-${order}`)).toBe(1);
    await expect(row.locator('[data-test-no-source]')).toHaveCount(0); // the synth counts as the track's source
    await expect(row.locator('[data-test-source-label]')).toHaveText('polysynth');

    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3000); // several steps: each hit plays a note
    await page.getByRole('button', { name: 'stop' }).click();
    expect(errors).toEqual([]);
  });
});
