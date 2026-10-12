import { test, expect, type Page } from '@playwright/test';
import { addFilepath, apiHeaders, createProjectWithTrack, login, setScript } from './helpers';

const LONG_LOOP = '/Roland/Roland CR-78 CompuRhythm/CR-78 Kit 03/LOOP1.mp3'; // 2.23 s
const SHORT_LOOP = '/Casio SK1/Casio SK-1/skloop.mp3'; // 1.89 s

const rows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');

function watchControlIds(page: Page) {
  const ids: Record<string, string> = {};
  page.on('response', async (r) => {
    if (r.request().method() !== 'POST' || !/\/v1\/track-controls$/.test(r.url())) return;
    const d = (await r.json().catch(() => null))?.data;
    if (d) ids[`${d.attributes['node-type']}.${d.attributes['node-attr']}`] = d.id;
  });
  return ids;
}

const storedValue = async (page: Page, id: string, attr = 'control-value') =>
  ((await (await page.request.get(`/v1/track-controls/${id}`, { headers: await apiHeaders(page) })).json()).data.attributes as Record<string, number>)[attr];

async function openSourceTab(page: Page) {
  await rows(page).first().click();
  await page.getByRole('button', { name: 'source' }).click();
}

const midiOf = (label: string) => {
  const [, name, octave] = /^([A-G]#?)(-?\d+)$/.exec(label.trim())!;
  return (Number(octave) + 1) * 12 + ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(name);
};

test.describe('source tab surfaces', () => {
  let errors: string[] = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await login(page);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test('an oscillator gets a piano that sets its frequency control', async ({ page }) => {
    const ids = watchControlIds(page);
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `__().sine({ id: 'lead', frequency: 220 }).channelStrip().connect('#main-output');`);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await expect.poll(() => ids['sine.frequency']).toBeTruthy();
    await openSourceTab(page);

    // 220 Hz is A3, and that key is lit
    const note = page.locator('[data-test-piano-note]');
    await expect(note).toHaveText('A3');

    // press a key in the middle of the keyboard: the control follows, in Hz
    const piano = page.locator('.piano-surface .pa2 > div').first();
    const box = (await piano.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.85);
    await expect(note).not.toHaveText('A3');
    const pressed = midiOf((await note.textContent())!);
    const expectedHz = 440 * Math.pow(2, (pressed - 69) / 12);
    await expect.poll(() => storedValue(page, ids['sine.frequency'])).toBeCloseTo(expectedHz, 1);

    // the slider next to it still shows the same value
    await expect(page.locator('.controls-wrapper input').first()).toHaveValue(String(Math.round(expectedHz * 100) / 100));
  });

  test('a sampler gets a waveform with draggable start and end markers', async ({ page }) => {
    const ids = watchControlIds(page);
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `__().sampler({ path: this.files[0] }).channelStrip().connect('#main-output');`);
    await addFilepath(page, track, 0, LONG_LOOP);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await expect.poll(() => ids['sampler.end']).toBeTruthy();
    await openSourceTab(page);

    const surface = page.locator('.waveform-surface');
    await expect(surface).toBeVisible();
    // the markers replace the start and end sliders
    await expect(page.locator('.controls-wrapper', { has: page.getByText('start', { exact: true }) })).toHaveCount(0);
    await expect(page.locator('.controls-wrapper', { has: page.getByText('end', { exact: true }) })).toHaveCount(0);

    // before touching anything the whole sample plays
    const endHandle = page.locator('[data-test-waveform-handle="end"]');
    const duration = Number(await endHandle.getAttribute('aria-valuenow'));
    expect(duration).toBeGreaterThan(2.2);
    await expect.poll(() => storedValue(page, ids['sampler.end'])).toBeCloseTo(duration, 1);

    // drag the end marker to the middle of the sample
    const area = (await page.locator('.waveform-area').boundingBox())!;
    const h = (await endHandle.boundingBox())!;
    await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * 0.5, h.y + h.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => storedValue(page, ids['sampler.end']), { timeout: 10_000 }).toBeCloseTo(duration / 2, 1);

    // ...and drag start past it: it stops short of the end marker
    const s = (await page.locator('[data-test-waveform-handle="start"]').boundingBox())!;
    await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * 0.9, s.y + s.height / 2, { steps: 8 });
    await page.mouse.up();
    await expect.poll(() => storedValue(page, ids['sampler.start']), { timeout: 10_000 }).toBeLessThan(duration / 2);

    // the markers survive a reload (the sample is not reset to its full length)
    await page.waitForTimeout(1500);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await openSourceTab(page);
    await expect.poll(async () => Number(await page.locator('[data-test-waveform-handle="end"]').getAttribute('aria-valuenow')), { timeout: 10_000 }).toBeCloseTo(duration / 2, 1);
  });

  test('the playhead cursor on the waveform follows the pointer and leaves nothing behind', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `__().sampler({ path: this.files[0] }).channelStrip().connect('#main-output');`);
    await addFilepath(page, track, 0, LONG_LOOP);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await openSourceTab(page);
    const canvas = page.locator('.waveform-canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(500);

    const pixels = () => canvas.evaluate((c) => (c as HTMLCanvasElement).toDataURL());
    const clean = await pixels();

    // sweep across the waveform: the cursor is drawn...
    const box = (await canvas.boundingBox())!;
    const y = box.y + box.height / 2;
    for (const f of [0.2, 0.35, 0.5, 0.65, 0.8]) {
      await page.mouse.move(box.x + box.width * f, y);
    }
    expect(await pixels()).not.toBe(clean);

    // ...and moving away (and back) leaves exactly the waveform, with no trail of old cursors
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height + 80);
    expect(await pixels()).toBe(clean);
  });

  // one project per test: starting a second while the first page is still fetching aborts its requests
  async function speedUnitFor(page: Page, file: string) {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `__().sampler({ path: this.files[0] }).channelStrip().connect('#main-output');`);
    await addFilepath(page, track, 0, file);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await openSourceTab(page);
    await expect(page.locator('.waveform-surface')).toBeVisible(); // the sample has loaded
    return page.locator('.controls-wrapper', { has: page.getByText('speed', { exact: true }) }).locator('select option:checked');
  }

  test('a sample over 2 seconds defaults to Loop Sync speed', async ({ page }) => {
    await expect(await speedUnitFor(page, LONG_LOOP)).toHaveText('Loop Sync');
  });

  test('a sample under 2 seconds keeps Play Rate speed', async ({ page }) => {
    await expect(await speedUnitFor(page, SHORT_LOOP)).toHaveText('Play Rate');
  });

  test.describe('the source button in the track list', () => {
    const button = (page: Page) => rows(page).first().locator('[data-test-source-kind]');

    test('a single sample shows its filename and opens the source tab', async ({ page }) => {
      const track = await createProjectWithTrack(page);
      await setScript(page, track, 'init', `__().sampler({ path: this.files[0] }).channelStrip().connect('#main-output');`);
      await addFilepath(page, track, 0, '/Korg/Korg 01W/01W TOM.mp3');
      await page.reload();
      await expect(button(page)).toHaveAttribute('data-test-source-kind', 'sample');
      await expect(button(page)).toContainText('01W TOM');

      // start on the controls tab; the button switches to the source tab, which shows what is loaded
      await rows(page).first().click();
      await page.getByRole('button', { name: 'controls' }).click();
      await expect(page.locator('[data-test-source-samples]')).toHaveCount(0);
      await button(page).click();
      await expect(page.locator('[data-test-source-samples]')).toContainText('01W TOM');
      await expect(page.locator('.waveform-surface')).toBeVisible();
    });

    test('an oscillator shows a waveform and its name', async ({ page }) => {
      const track = await createProjectWithTrack(page);
      await setScript(page, track, 'init', `__().square({ frequency: 220 }).channelStrip().connect('#main-output');`);
      await page.reload();
      await expect(button(page)).toHaveAttribute('data-test-source-kind', 'oscillator');
      await expect(button(page)).toContainText('square');
      await expect(button(page).locator('svg path')).toHaveCount(1); // the waveform outline

      await button(page).click();
      await expect(page.locator('.piano-surface')).toBeVisible(); // lands on the source tab, where the piano is
    });

    test('a macro instrument shows an icon and its name', async ({ page }) => {
      const track = await createProjectWithTrack(page);
      await setScript(page, track, 'init', `__().polysynth({ osc_type: 'sawtooth' }).channelStrip().connect('#main-output');`);
      await page.reload();
      await expect(button(page)).toHaveAttribute('data-test-source-kind', 'macro');
      await expect(button(page)).toContainText('polysynth');
    });

    test('a track with no source has no source button', async ({ page }) => {
      const track = await createProjectWithTrack(page);
      await setScript(page, track, 'init', `__().gain().channelStrip().connect('#main-output');`);
      await page.reload();
      await expect(rows(page)).toHaveCount(1);
      await expect(button(page)).toHaveCount(0);
      await expect(rows(page).first().locator('[data-test-no-source]')).toHaveCount(1);
    });
  });
});
