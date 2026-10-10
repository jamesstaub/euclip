import { test, expect } from '@playwright/test';
import { apiHeaders, createProjectWithTrack, login } from './helpers';

// Edits to a control must reach the audio and the API, and survive playing and reloading
// (the client used to re-link controls on load and could overwrite them with defaults).
test('channel strip gain edited in the UI survives play and a reload', async ({ page }) => {
  const controlIds: Record<string, string> = {};
  page.on('response', async (r) => {
    if (r.request().method() === 'POST' && /\/v1\/track-controls$/.test(r.url())) {
      const j = await r.json().catch(() => null);
      const a = j?.data?.attributes;
      if (a) controlIds[`${a['node-type']}.${a['node-attr']}@${j.data.relationships.track.data.id}`] = j.data.id;
    }
  });

  await login(page);
  const track = await createProjectWithTrack(page);
  await expect.poll(() => controlIds[`channelStrip.gain@${track.id}`]).toBeTruthy();
  const id = controlIds[`channelStrip.gain@${track.id}`];

  const audioGain = () => page.evaluate(() => (window as any).__('channelStrip .track-1').attr('gain'));
  const storedGain = async () =>
    (await (await page.request.get(`/v1/track-controls/${id}`, { headers: await apiHeaders(page) })).json()).data.attributes['control-value'] as number;

  await page.locator('[data-test-track-item]:not(:has-text("Main Output"))').first().click();
  await expect(page.getByText('CHANNEL STRIP')).toBeVisible();
  expect(await audioGain()).toBeCloseTo(0.9, 2); // the default

  // drag the strip's gain slider down: the audio changes at once, the API a moment later
  await page.mouse.move(51, 473);
  await page.mouse.down();
  await page.mouse.move(51, 520, { steps: 6 });
  await page.mouse.move(51, 560, { steps: 6 });
  await page.mouse.up();
  const edited = await audioGain();
  expect(edited).toBeLessThan(0.8);
  await expect.poll(storedGain, { timeout: 10_000 }).toBeCloseTo(edited, 2);

  // playing rebuilds the audio nodes: the edit must carry over
  await page.getByRole('button', { name: 'play' }).click();
  await page.waitForTimeout(2000);
  expect(await audioGain()).toBeCloseTo(edited, 2);
  expect(await storedGain()).toBeCloseTo(edited, 2);

  // and so must a reload
  await page.reload();
  await expect.poll(audioGain).toBeCloseTo(edited, 2);
  expect(await storedGain()).toBeCloseTo(edited, 2);
});
