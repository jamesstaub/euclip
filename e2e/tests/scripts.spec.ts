import { test, expect } from '@playwright/test';
import { createProject, login } from './helpers';

test('script panel switches between the setup and play scripts', async ({ page }) => {
  await login(page);
  await createProject(page);

  await page.getByRole('button', { name: 'scripts' }).first().click();
  const setup = page.getByRole('button', { name: 'setup' });
  await expect(setup).toBeVisible();
  const playTab = setup.locator('..').getByRole('button', { name: 'play' });
  await expect(playTab).toBeVisible();

  const editor = page.locator('.cm-content').first();
  await expect(editor).toContainText('sampler'); // the default setup script builds a sampler
  const setupText = await editor.innerText();

  await playTab.click();
  await expect.poll(async () => (await page.locator('.cm-content').first().innerText()) !== setupText).toBe(true);

  await setup.click();
  await expect.poll(async () => page.locator('.cm-content').first().innerText()).toBe(setupText);
});
