import { test, expect, type Page } from '@playwright/test';
import { apiHeaders, createProjectWithTrack, login, setScript } from './helpers';

const rows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');
// Cracked schedules param changes on the audio clock, and a headless context doesn't render, so reading
// `.value` back never moves. Record what gets scheduled on oscillator frequency params instead.
const spyOnFrequency = (page: Page) =>
  page.addInitScript(() => {
    const w = window as any;
    w.__scheduled = [];
    const original = AudioParam.prototype.setValueAtTime;
    AudioParam.prototype.setValueAtTime = function (value: number, time: number) {
      if (this.defaultValue === 440) w.__scheduled.push(Math.round(value * 100) / 100);
      return original.call(this, value, time);
    };
  });
const scheduled = (page: Page) => page.evaluate(() => (window as any).__scheduled as number[]);
const clearScheduled = (page: Page) => page.evaluate(() => ((window as any).__scheduled = []));
const lastScheduled = async (page: Page) => (await scheduled(page)).at(-1);

// the id of a control the client created for the track, by "nodeType.attr"
function watchControlIds(page: Page) {
  const ids: Record<string, string> = {};
  page.on('response', async (r) => {
    if (r.request().method() !== 'POST' || !/\/v1\/track-controls$/.test(r.url())) return;
    const a = (await r.json().catch(() => null))?.data;
    if (a) ids[`${a.attributes['node-type']}.${a.attributes['node-attr']}`] = a.id;
  });
  return ids;
}

async function storedControl(page: Page, id: string) {
  const res = await page.request.get(`/v1/track-controls/${id}`, { headers: await apiHeaders(page) });
  return (await res.json()).data.attributes as Record<string, number>;
}

async function patchControl(page: Page, id: string, trackId: string, attributes: Record<string, number>) {
  const res = await page.request.patch(`/v1/track-controls/${id}`, {
    headers: await apiHeaders(page),
    data: { data: { type: 'track-controls', id, attributes, relationships: { track: { data: { type: 'tracks', id: trackId } } } } },
  });
  expect(res.ok()).toBe(true);
}

test('the play script reads a control live and modulates it for one step without touching the slider', async ({ page }) => {
  await spyOnFrequency(page);
  const ids = watchControlIds(page);
  await login(page);
  const track = await createProjectWithTrack(page);
  await setScript(page, track, 'init', `__().sine({ id: 'lead', frequency: 440 }).channelStrip().connect('#main-output');`);
  await setScript(page, track, 'onstep', `
    window.__reads = window.__reads || [];
    window.__reads.push(this.controls.lead.frequency, this.controls.sine.frequency, this.controls[0].frequency);
    this.controls.lead.frequency = this.controls.lead.frequency + 100;
  `);
  await page.reload();
  await expect(rows(page)).toHaveCount(1);
  await expect.poll(() => ids['sine.frequency']).toBeTruthy().catch(() => {}); // already stored on a reload

  await page.getByRole('button', { name: 'play' }).click();
  await expect.poll(() => page.evaluate(() => ((window as any).__reads ?? []).length)).toBeGreaterThan(9);

  // read by id, by type and by index all give the slider's value, however many steps have run (no compounding)
  const reads: number[] = await page.evaluate(() => (window as any).__reads);
  expect(new Set(reads.map((v) => Math.round(v)))).toEqual(new Set([440]));
  // the audio is told 540 (the slider's 440 plus the script's offset) on every step, never 640, 740...
  const values = new Set(await scheduled(page));
  expect(values.has(540)).toBe(true);
  expect([...values].filter((v) => v > 540)).toEqual([]);
  // ...while the control itself still holds the slider's value
  expect((await storedControl(page, ids['sine.frequency']))['control-value']).toBe(440);

  // ...and the source node's controls live in the Source tab, with a marker where the script is driving
  await rows(page).first().click();
  await page.getByRole('button', { name: 'source' }).click();
  await expect(page.getByText('FREQUENCY', { exact: false }).first()).toBeVisible();
  await expect(page.locator('.modulation-marker').first()).toBeVisible();
});

test('only editing the script resets a control the user changed', async ({ page }) => {
  await spyOnFrequency(page);
  const ids = watchControlIds(page);
  await login(page);
  const track = await createProjectWithTrack(page);
  const init = (hz: number) => `__().sine({ frequency: ${hz} }).channelStrip().connect('#main-output');`;
  await setScript(page, track, 'init', init(440));
  await page.reload();
  await expect(rows(page)).toHaveCount(1);
  await expect.poll(() => ids['sine.frequency']).toBeTruthy();
  const id = ids['sine.frequency'];
  await expect.poll(async () => (await storedControl(page, id))['script-value']).toBe(440);
  await page.getByRole('button', { name: 'play' }).click();
  await expect.poll(() => lastScheduled(page)).toBe(440);

  // the user moves the control: it survives a reload while the script is unchanged
  await patchControl(page, id, track.id, { 'control-value': 600 });
  await page.reload();
  await expect(rows(page)).toHaveCount(1);
  await clearScheduled(page);
  await page.getByRole('button', { name: 'play' }).click();
  await expect.poll(() => lastScheduled(page)).toBe(600);
  expect((await storedControl(page, id))['default-value']).toBe(440);
  await rows(page).first().click();
  await page.getByRole('button', { name: 'source' }).click();
  // "Reset all" is always there (so nothing shifts), and only enabled once a parameter of the node has been moved
  const reset = page.locator('[data-test-reset-node]');
  await expect(reset).toBeEnabled();
  const before = await reset.boundingBox();

  // editing the script's number puts the control back under the script's control
  await setScript(page, track, 'init', init(880));
  await page.reload();
  await expect(rows(page)).toHaveCount(1);
  await clearScheduled(page);
  await page.getByRole('button', { name: 'play' }).click();
  await expect.poll(() => lastScheduled(page)).toBe(880);
  await expect.poll(async () => (await storedControl(page, id))['control-value']).toBe(880);
  expect((await storedControl(page, id))['script-value']).toBe(880);

  // back under the script: the button is disabled, in the exact place it was
  await rows(page).first().click();
  await page.getByRole('button', { name: 'source' }).click();
  await expect(reset).toBeDisabled();
  expect(await reset.boundingBox()).toEqual(before);
});