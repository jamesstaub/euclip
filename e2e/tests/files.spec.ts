import { test, expect } from '@playwright/test';
import { addFilepath, createProjectWithTrack, login, setScript } from './helpers';

// stored the way the file picker stores them: with a leading slash
const KICK = '/Korg/Korg 01W/01W TOM.mp3';
const SNARE = '/Korg/Korg 01W/AGG.mp3';

// A track can have several sampler nodes, each with its own file (slot 0, 1, ...).
test('a track with two files builds two samplers, loads both, and creates no extra controls', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);
  await setScript(page, track, 'init', `
    __().sampler({ path: this.files[0] }).channelStrip().connect('#main-output');
    __().sampler({ path: this.files[1] }).channelStrip().connect('#main-output');
  `);
  await addFilepath(page, track, 0, KICK);
  await addFilepath(page, track, 1, SNARE);

  const created: string[] = [];
  page.on('request', (rq) => rq.method() === 'POST' && /\/v1\/filepath-controls/.test(rq.url()) && created.push(rq.url()));
  const fetched = new Set<number>();
  page.on('response', (r) => /storage\.googleapis\.com.*Korg/.test(decodeURIComponent(r.url())) && fetched.add(r.status()));

  await page.reload();
  const rows = page.locator('[data-test-track-item]:not(:has-text("Main Output"))');
  await expect(rows).toHaveCount(1);

  // two sampler nodes, one per file
  await expect.poll(() => page.evaluate(() => (window as any).__('sampler').size())).toBe(2);
  // both samples came from the bucket successfully
  await expect.poll(() => [...fetched].join(',')).toBe('200');
  // the client used the stored controls instead of creating new ones for the slots
  expect(created).toHaveLength(0);
  // the track row is one multi-sample button; the source tab shows the selected sampler's own file
  await expect(rows.first().locator('[data-test-source-kind="multi-sample"]')).toContainText('2 samples');
  await rows.first().locator('[data-test-source-kind]').click();
  await expect(page.locator('[data-test-source-samples]')).toContainText('01W TOM');
  await page.locator('.tab-btn.horizontal').nth(1).click(); // the second sampler
  await expect(page.locator('[data-test-source-samples]')).toContainText('AGG');
});
