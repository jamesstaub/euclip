import { test, expect } from '@playwright/test';
import { addSequence, createProjectWithTrack, login, setScript } from './helpers';

// A track can have several sequences; each steps independently and the play script is told which one fired.
test('a track steps all of its sequences and the play script knows which one fired', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);

  await setScript(page, track, 'onstep', `
    window.__seq = window.__seq || {};
    const seen = window.__seq[sequenceIndex] || { calls: 0 };
    window.__seq[sequenceIndex] = { calls: seen.calls + 1, length: array.length };
  `);
  await addSequence(page, track, { steps: 4, hits: 2 });
  await page.reload();
  await expect(page.locator('[data-test-track-item]:not(:has-text("Main Output"))')).toHaveCount(1);

  await page.getByRole('button', { name: 'play' }).click();
  const seen = () => page.evaluate(() => (window as any).__seq as Record<string, { calls: number; length: number }>);
  await expect.poll(async () => Object.keys((await seen()) ?? {}).sort().join(',')).toBe('0,1');

  const result = await seen();
  expect(result['0'].length).toBe(8); // the primary sequence (8 steps)
  expect(result['1'].length).toBe(4); // the second one, stepping on its own loop
  expect(result['0'].calls).toBeGreaterThan(0);
  expect(result['1'].calls).toBeGreaterThan(0);
});
