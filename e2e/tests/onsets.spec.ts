import { test, expect, type Page } from '@playwright/test';
import { addFilepath, apiHeaders, createProjectWithTrack, login, setScript } from './helpers';

const LOOP = '/Roland/Roland CR-78 CompuRhythm/CR-78 Kit 03/LOOP1.mp3'; // a 2.23 s drum loop

const rows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');

function watchControls(page: Page) {
  const ids: Record<string, string> = {};
  page.on('response', async (r) => {
    if (r.request().method() !== 'POST' || !/\/v1\/track-controls$/.test(r.url())) return;
    const d = (await r.json().catch(() => null))?.data;
    if (d) ids[`${d.attributes['node-type']}.${d.attributes['node-attr']}`] = d.id;
  });
  return ids;
}

const stored = async (page: Page, id: string) =>
  (await (await page.request.get(`/v1/track-controls/${id}`, { headers: await apiHeaders(page) })).json()).data.attributes as Record<string, any>;

// opens a project whose first track has the drum loop in a sampler, on the source tab
async function openLoopTrack(page: Page, onstep?: string, loop = true) {
  const ids = watchControls(page);
  const track = await createProjectWithTrack(page);
  await setScript(page, track, 'init', `__().sampler({ path: this.files[0], loop: ${loop} }).channelStrip().connect('#main-output');`);
  if (onstep) await setScript(page, track, 'onstep', onstep);
  await addFilepath(page, track, 0, LOOP);
  await page.reload();
  await expect(rows(page)).toHaveCount(1);
  await rows(page).first().click();
  await page.getByRole('button', { name: 'source' }).click();
  await expect(page.locator('[data-test-waveform-surface]')).toBeVisible();
  return { ids, track };
}

const markerTimes = (page: Page) =>
  page.locator('[data-test-onset-marker]').evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-time'))));

const sliceCount = async (page: Page) => Number(/(\d+) slices/.exec(await page.locator('[data-test-slice-count]').innerText())![1]);

// a sampler's real loop region (cracked maps start/end to loopStart/loopEnd on the native node)
const loopRegion = (page: Page) =>
  page.evaluate(() => {
    const w = window as any;
    const uuid = [].concat(w.__._getNodeLookup()['sampler'])[0];
    const natives = ([] as any[]).concat(w.__._getNode(uuid)?.getNativeNode());
    const source = natives.find((n) => n?.constructor?.name === 'AudioBufferSourceNode');
    return { start: source?.loopStart as number, end: source?.loopEnd as number, loop: source?.loop as boolean };
  });

test.describe('onset detection and slices', () => {
  let errors: string[] = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await login(page);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test('a loaded sample is analysed and its onsets are drawn as slice markers', async ({ page }) => {
    await openLoopTrack(page);
    await expect.poll(() => sliceCount(page), { timeout: 15_000 }).toBeGreaterThan(2);

    const times = await markerTimes(page);
    // one marker fewer than there are slices (the file's own start and end are not markers)
    expect(times.length).toBe((await sliceCount(page)) - 1);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times.every((t) => t > 0 && t < 2.3)).toBe(true);
  });

  test('the onset threshold changes how many slices there are, and is saved with the sample', async ({ page }) => {
    await openLoopTrack(page);
    await expect.poll(() => sliceCount(page), { timeout: 15_000 }).toBeGreaterThan(2);
    const slider = page.locator('[data-test-onset-threshold]');
    await expect(slider).toBeVisible();

    await slider.fill('0.02');
    await expect.poll(() => sliceCount(page)).toBeGreaterThan(0);
    const sensitive = await sliceCount(page);
    await slider.fill('0.95');
    await expect.poll(() => sliceCount(page)).toBeLessThan(sensitive);
    const strict = await sliceCount(page);
    expect(strict).toBeGreaterThanOrEqual(1); // never fewer than one slice: the whole file

    // saved shortly after it stops moving (wait for that request), so it survives a reload
    await slider.fill('0.95');
    await page.waitForResponse((r) => r.request().method() === 'PATCH' && /\/v1\/samples\/\d+/.test(r.url()) && r.ok());
    await page.reload();
    await rows(page).first().click();
    await page.getByRole('button', { name: 'source' }).click();
    await expect(page.locator('[data-test-onset-threshold]')).toHaveValue('0.95');
    await expect.poll(() => sliceCount(page), { timeout: 15_000 }).toBe(strict);
  });

  test('snap makes the markers jump to onsets and to the ends of the file', async ({ page }) => {
    const { ids } = await openLoopTrack(page);
    await expect.poll(() => sliceCount(page), { timeout: 15_000 }).toBeGreaterThan(2);
    await expect.poll(() => ids['sampler.start']).toBeTruthy();
    const cuts = [0, ...(await markerTimes(page)), 2.2257];

    const drag = async (handle: 'start' | 'end', fraction: number) => {
      const area = (await page.locator('.waveform-area').boundingBox())!;
      const h = (await page.locator(`[data-test-waveform-handle="${handle}"]`).boundingBox())!;
      await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
      await page.mouse.down();
      await page.mouse.move(area.x + area.width * fraction, h.y + h.height / 2, { steps: 8 });
      await page.mouse.up();
    };

    // snap on (the default): the start lands exactly on the onset nearest where it was dragged
    await expect(page.locator('[data-test-snap-toggle]')).toBeChecked();
    await drag('start', 0.4);
    await expect.poll(() => stored(page, ids['sampler.start']).then((a) => a['control-value']), { timeout: 10_000 }).toBeGreaterThan(0);
    const snapped = (await stored(page, ids['sampler.start']))['control-value'] as number;
    expect(cuts.some((cut) => Math.abs(cut - snapped) < 0.002)).toBe(true);

    // snap off: it goes where it is dragged, which is no onset
    await page.locator('[data-test-snap-toggle]').uncheck();
    await drag('start', 0.123);
    await expect.poll(() => stored(page, ids['sampler.start']).then((a) => a['control-value']), { timeout: 10_000 }).toBeLessThan(snapped);
    const free = (await stored(page, ids['sampler.start']))['control-value'] as number;
    expect(cuts.every((cut) => Math.abs(cut - free) > 0.01)).toBe(true);

    // snap back on: the end marker can snap to the very end of the file
    await page.locator('[data-test-snap-toggle]').check();
    await drag('end', 1.0);
    await expect.poll(() => stored(page, ids['sampler.end']).then((a) => a['control-value']), { timeout: 10_000 }).toBeCloseTo(2.2257, 1);
  });

  test("the markers are drawn in a disabled colour when the sampler isn't looping", async ({ page }) => {
    const { ids, track } = await openLoopTrack(page, undefined, false);
    await expect.poll(() => ids['sampler.loop']).toBeTruthy();
    const surface = page.locator('[data-test-waveform-surface]');
    const handleColor = () =>
      page.locator('[data-test-waveform-handle="start"]').evaluate((el) => getComputedStyle(el, '::before').backgroundColor);

    // the script says loop: false, so the loop control starts false: disabled
    await expect(surface).toHaveClass(/is-loop-off/);
    const disabled = await handleColor();

    // turn looping on, as the control would, and the markers are enabled (and a different colour)
    const res = await page.request.patch(`/v1/track-controls/${ids['sampler.loop']}`, {
      headers: await apiHeaders(page),
      data: { data: { type: 'track-controls', id: ids['sampler.loop'], attributes: { 'control-value': 1 }, relationships: { track: { data: { type: 'tracks', id: track.id } } } } },
    });
    expect(res.ok()).toBe(true);
    await page.reload();
    await rows(page).first().click();
    await page.getByRole('button', { name: 'source' }).click();
    await expect(page.locator('[data-test-waveform-surface]')).toBeVisible();
    await expect(surface).not.toHaveClass(/is-loop-off/);
    expect(await handleColor()).not.toBe(disabled);
  });

  test("a script's loop: true is the loop control's starting value, so the markers start enabled", async ({ page }) => {
    const { ids } = await openLoopTrack(page); // loop: true
    await expect.poll(() => ids['sampler.loop']).toBeTruthy();
    await expect(page.locator('[data-test-waveform-surface]')).not.toHaveClass(/is-loop-off/);
    await expect.poll(async () => (await stored(page, ids['sampler.loop']))['control-value']).toBe(1);
  });

  test('a script can still say startSlice and endSlice: they move start and end, and are not controls of their own', async ({ page }) => {
    // the play script takes slice 1 (to slice 2) every step
    const { ids } = await openLoopTrack(page, `
      this.controls.sampler.startSlice = 1;
      this.controls.sampler.endSlice = 2;
    `);
    await expect.poll(() => sliceCount(page), { timeout: 15_000 }).toBeGreaterThan(3);
    const cuts = [0, ...(await markerTimes(page)), 2.2257];

    await expect.poll(() => ids['sampler.start'] && ids['sampler.end']).toBeTruthy();
    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(async () => (await loopRegion(page)).start, { timeout: 15_000 }).toBeCloseTo(cuts[1], 2);
    expect((await loopRegion(page)).end).toBeCloseTo(cuts[3], 2); // the end of slice 2 is the start of slice 3
    await page.getByRole('button', { name: 'stop' }).click();

    // the slice is not a parameter: there is nothing to save for it, and the saved start/end are untouched
    expect(ids['sampler.startSlice']).toBeUndefined();
    expect(ids['sampler.endSlice']).toBeUndefined();
    expect((await stored(page, ids['sampler.start']))['control-value']).toBe(0);
    expect((await stored(page, ids['sampler.end']))['control-value']).toBeGreaterThan(2);
  });

  test('Slice is a unit of start and end: the markers snap to cuts, and switching units keeps the region', async ({ page }) => {
    const { ids } = await openLoopTrack(page);
    await expect.poll(() => sliceCount(page), { timeout: 15_000 }).toBeGreaterThan(3);
    const slices = await sliceCount(page);
    const cuts = [0, ...(await markerTimes(page)), 2.2257];

    // the units are chosen next to the markers, and Slice is one of them
    const startUnit = page.locator('[data-test-start-unit]');
    const endUnit = page.locator('[data-test-end-unit]');
    await expect(startUnit.locator('option')).toContainText(['Seconds', 'Slice']);
    await startUnit.selectOption({ label: 'Slice' });
    await endUnit.selectOption({ label: 'Slice' });
    // untouched, the region is the whole file: the first slice to the last
    await expect(page.locator('[data-test-start-value]')).toHaveText('0');
    await expect(page.locator('[data-test-end-value]')).toHaveText(String(slices - 1));
    await expect.poll(() => ids['sampler.end']).toBeTruthy();
    await expect.poll(async () => (await stored(page, ids['sampler.end'])).max).toBe(slices - 1); // range fitted to the slices

    // dragging the start marker to just inside slice 2 snaps to the nearest cut, where slice 2 starts, and the value is the index
    const area = page.locator('.waveform-area');
    const box = (await area.boundingBox())!;
    const handleBox = (await page.locator('[data-test-waveform-handle="start"]').boundingBox())!;
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + ((cuts[2] + (cuts[3] - cuts[2]) * 0.2) / 2.2257) * box.width, handleBox.y + handleBox.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('[data-test-start-value]')).toHaveText('2');

    // back to seconds: the marker has not moved, the number is now the time of slice 2's start
    await startUnit.selectOption({ label: 'Seconds' });
    await expect.poll(async () => Number(await page.locator('[data-test-start-value]').innerText())).toBeCloseTo(cuts[2], 2);
  });

  test('a project saved with startSlice / endSlice controls opens with them as the Slice unit of start and end', async ({ page }) => {
    const { ids, track } = await openLoopTrack(page);
    await expect.poll(() => ids['sampler.start'] && ids['sampler.end']).toBeTruthy();
    // what the earlier design stored: slice 1 to slice 2, as controls of their own
    const template = await stored(page, ids['sampler.start']);
    const old = async (attr: string, value: number) => {
      const res = await page.request.post('/v1/track-controls', {
        headers: await apiHeaders(page),
        data: {
          data: {
            type: 'track-controls',
            attributes: { ...template, 'node-attr': attr, 'control-value': value, 'default-value': -1, min: -1, max: 63, 'step-size': 1 },
            relationships: { track: { data: { type: 'tracks', id: track.id } } },
          },
        },
      });
      expect(res.ok(), await res.text()).toBe(true);
      return (await res.json()).data.id as string;
    };
    const startSliceId = await old('startSlice', 1);
    const endSliceId = await old('endSlice', 2);

    await page.reload();
    await page.getByRole('button', { name: 'source', exact: true }).click(); // the footer is on the controls tab after a reload
    await expect(page.locator('[data-test-waveform-surface]')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-test-start-unit] option:checked')).toHaveText('Slice');
    await expect(page.locator('[data-test-start-value]')).toHaveText('1');
    await expect(page.locator('[data-test-end-unit] option:checked')).toHaveText('Slice');
    await expect(page.locator('[data-test-end-value]')).toHaveText('2');
    // and the old controls are gone
    await expect.poll(async () => (await page.request.get(`/v1/track-controls/${startSliceId}`, { headers: await apiHeaders(page) })).status()).toBe(404);
    expect((await page.request.get(`/v1/track-controls/${endSliceId}`, { headers: await apiHeaders(page) })).status()).toBe(404);
  });
});
