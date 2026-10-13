import { test, expect, type Page } from '@playwright/test';
import { addFilepath, createProject, login, oscillatorStarts, rampsSeen, scheduledOn, setScript, spyOnOscillatorStarts, spyOnParams, spyOnRamps } from './helpers';

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
  // creating a track navigates between routes: nothing may log an error while doing so
  let pageErrors: string[] = [];
  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && pageErrors.push(m.text()));
    await spyOnParams(page);
    await spyOnRamps(page);
    await spyOnOscillatorStarts(page);
    await login(page);
    await createProject(page);
  });
  test.afterEach(() => {
    expect(pageErrors).toEqual([]);
  });

  test('lists the types the API offers', async ({ page }) => {
    await page.getByRole('button', { name: 'New Track' }).locator('..').getByRole('button').last().click();
    for (const title of ['Sampler', 'Looped sampler', 'Multi-sample kit', 'Chopped loop', 'Humanized sampler', 'Filter sweep', 'Oscillator arpeggio', 'Polysynth', 'From sounds…']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
  });

  // Biquad filter frequency params default to 350 and oscillator frequency params to 440.
  const FILTER_FREQ = 350;
  const OSC_FREQ = 440;
  // The project's starting Sampler track also schedules on these params (its wide-open 20000 Hz low-pass),
  // and cracked sets a node's own default (440) once when it is created. Neither belongs to the track
  // under test, so drop them.
  const ofTrackUnderTest = (values: number[]) => values.filter((v) => v !== 20000 && v !== 440);

  test('a new sampler starts with its low-pass wide open, not muffled', async ({ page }) => {
    const created: Record<string, number> = {};
    page.on('response', async (r) => {
      if (r.request().method() !== 'POST' || !/\/v1\/track-controls$/.test(r.url())) return;
      const a = (await r.json().catch(() => null))?.data?.attributes;
      if (a) created[`${a['node-type']}.${a['node-attr']}`] = a['control-value'];
    });
    await addTrack(page, 'Sampler');
    await expect.poll(() => created['lowpass.frequency']).toBe(20000);
    expect(created['lowpass.q']).toBe(0); // flat: no resonant bump until the user adds one
  });

  test('a humanized sampler varies every hit around the sliders without moving them', async ({ page }) => {
    await addTrack(page, 'Humanized sampler');
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3500);

    // the filter starts at the script's 8000 Hz and each hit is offset by up to +/-25% of it
    const cutoffs = ofTrackUnderTest(await scheduledOn(page, FILTER_FREQ));
    expect(new Set(cutoffs).size).toBeGreaterThan(2);
    cutoffs.forEach((hz) => {
      expect(hz).toBeGreaterThanOrEqual(8000 * 0.75 - 1);
      expect(hz).toBeLessThanOrEqual(8000 * 1.25 + 1);
    });
    expect(cutoffs).toContain(8000); // the slider's own value is applied between hits
  });

  test('a filter sweep moves the cutoff an octave either side of the slider', async ({ page }) => {
    await addTrack(page, 'Filter sweep');
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3500);

    const cutoffs = ofTrackUnderTest(await scheduledOn(page, FILTER_FREQ));
    expect(Math.max(...cutoffs)).toBe(2400); // 1200 Hz * 2
    expect(Math.min(...cutoffs)).toBe(600); // 1200 Hz / 2
    expect(cutoffs).toContain(1200);
  });

  test('an oscillator arpeggio plays scale ratios above the frequency control', async ({ page }) => {
    await addTrack(page, 'Oscillator arpeggio');
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3500);

    const pitches = new Set(await scheduledOn(page, OSC_FREQ));
    [220, 247.5, 275, 330].forEach((hz) => expect(pitches.has(hz)).toBe(true));
    expect([...pitches].every((hz) => hz >= 220 && hz <= 220 * (5 / 3) + 0.01)).toBe(true);
  });

  test('an oscillator arpeggio opens its envelope on every hit (otherwise it is silent)', async ({ page }) => {
    await addTrack(page, 'Oscillator arpeggio');
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3500);

    // an envelope ramps its gain up to 1 (the attack peak); without a trigger the gain stays at 0
    const peaks = (await rampsSeen(page)).filter((r) => r.value === 1);
    expect(peaks.length).toBeGreaterThan(3);
  });

  test('an oscillator arpeggio starts its oscillator (cracked sources make no sound until started)', async ({ page }) => {
    const before = await oscillatorStarts(page);
    await addTrack(page, 'Oscillator arpeggio');
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(2500);
    expect(await oscillatorStarts(page)).toBeGreaterThan(before);
  });

  // a guard: cracked's trigger acts on the selection, so one track playing must not open another's envelope
  test("one track's ADSR trigger leaves every other track's envelope alone", async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // The project starts with one sampler track. Give it an oscillator + envelope that nothing triggers...
    const loaded = page.waitForResponse((r) => r.request().method() === 'GET' && /\/projects\/project\d+\?/.test(r.url()));
    await page.reload();
    const project = await (await loaded).json();
    const track = project.included.find((i: any) => i.type === 'track' && !i.attributes['is-master']);
    const quiet = {
      id: track.id as string,
      sequenceId: '',
      initScriptId: track.relationships['init-script'].data.id as string,
      onstepScriptId: track.relationships['onstep-script'].data.id as string,
    };
    await setScript(page, quiet, 'init', `__().sine({ frequency: 330 }).adsr('fast').channelStrip().connect('#main-output');`);
    await setScript(page, quiet, 'onstep', `// never triggers its envelope`);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);

    // ...next to an arpeggio, which triggers its own envelope on every hit
    await addTrack(page, 'Oscillator arpeggio');
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3500);

    const ramped = new Set((await rampsSeen(page)).filter((r) => r.value === 1).map((r) => r.param));
    expect(ramped.size).toBe(1); // only the arpeggio's envelope; the quiet track's stays closed
  });

  test('a looped sampler loops and uses Loop Sync speed', async ({ page }) => {
    const { row, order } = await addTrack(page, 'Looped sampler');
    expect(await nodes(page, `sampler .track-${order}`)).toBe(1);

    await row.click();
    await page.getByRole('button', { name: 'source' }).click(); // a sampler's controls live in the source tab
    const speed = page.locator('.controls-wrapper', { has: page.getByText('speed', { exact: true }) });
    await expect(speed.locator('select option:checked')).toHaveText('Loop Sync');

    // the unit is saved: still Loop Sync after a reload
    await page.waitForTimeout(2000); // controls are saved shortly after they change
    await page.reload();
    await rows(page).last().click();
    await page.getByRole('button', { name: 'source' }).click();
    await expect(
      page.locator('.controls-wrapper', { has: page.getByText('speed', { exact: true }) }).locator('select option:checked')
    ).toHaveText('Loop Sync');
  });

  test('a looped sampler never warns about Loop Sync, with or without a file', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (m) => /loop-relative|Loop Sync/i.test(m.text()) && warnings.push(m.text()));

    const { id } = await addTrack(page, 'Looped sampler');
    // no file chosen yet: nothing to stretch, so it must stay quiet while stepping
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: 'stop' }).click();
    expect(warnings).toEqual([]);

    // with a file, and across the rebuild that playing triggers (the node starts without a decoded buffer)
    await addFilepath(page, { id } as any, 0, '/Korg/Korg 01W/01W TOM.mp3');
    await page.reload();
    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(2500);
    await page.getByRole('button', { name: 'stop' }).click();
    await page.getByRole('button', { name: 'play' }).click(); // replay: rebuilds the nodes again
    await page.waitForTimeout(2500);
    expect(warnings).toEqual([]);
  });

  test('a multi-sample kit has four samplers, each with its own file slot', async ({ page }) => {
    const { row, order } = await addTrack(page, 'Multi-sample kit');
    expect(await nodes(page, `sampler .track-${order}`)).toBe(4);
    // the track list shows one multi-sample button; the source tab has a tab per sampler and shows the selected sampler's sample
    await expect(row.locator('[data-test-source-kind]')).toHaveCount(1);
    await expect(row.locator('[data-test-source-kind="multi-sample"]')).toContainText('3 / 4 samplers');
    await row.locator('[data-test-source-kind]').click(); // opens the sound sidebar
    await page.getByRole('button', { name: 'source' }).click(); // the footer's source tab
    const samplerTabs = page.locator('.track-footer .tab-btn.horizontal').filter({ has: page.locator('[data-test-tab-sublabel]') });
    await expect(samplerTabs).toHaveCount(4);
    await expect(page.locator('[data-test-source-sample]')).toHaveAttribute('data-source-node-id', 'sampler1');
    await expect(page.locator('[data-test-source-sample]').getByRole('button', { name: 'Pick a Sound' })).toHaveCount(1);

    // choosing another sampler shows its (still empty) sample
    await samplerTabs.nth(3).click();
    await expect(page.locator('[data-test-source-sample]')).toHaveAttribute('data-source-node-id', 'sampler4');
    await expect(page.locator('[data-test-source-sample]').getByRole('button', { name: 'Pick a Sound' })).toHaveCount(1);
  });

  test('a multi-sample kit loads a file per sampler and plays them round-robin', async ({ page }) => {
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
    await expect(row.locator('[data-test-source-kind="multi-sample"]')).toContainText('0 / 4 samplers');
    await row.locator('[data-test-source-kind]').click(); // opens the sound sidebar
    await page.getByRole('button', { name: 'source' }).click(); // the footer's source tab
    const sample = page.locator('[data-test-source-sample]');
    const samplerTabs = page.locator('.track-footer .tab-btn.horizontal').filter({ has: page.locator('[data-test-tab-sublabel]') });
    await expect(sample).toContainText('01W TOM'); // sampler 1
    await samplerTabs.nth(1).click();
    await expect(sample).toContainText('AGG'); // sampler 2
    await samplerTabs.nth(3).click();
    await expect(sample.getByRole('button', { name: 'Pick a Sound' })).toHaveCount(1); // sampler 4 still has no file
    await expect.poll(() => [...loaded].join(',')).toBe('200');

    await page.getByRole('button', { name: 'play' }).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'stop' }).click();
    expect(errors).toEqual([]);
  });

  test('a polysynth releases every note: voices come and go and nothing sustains', async ({ page }) => {
    // another track that plays on its hits changes cracked's global selection every step, which is
    // what used to leave the synth's notes unreleased
    await addTrack(page, 'Multi-sample kit');
    await addTrack(page, 'Polysynth');
    const probe = () =>
      page.evaluate(() => {
        const w = window as any;
        let voices = 0;
        w.cracked.each('polysynth', (el: any) => { voices += Object.keys(el.getParams().settings.active_voices).length; });
        return { voices, nodes: w.__('*').size() };
      });
    const baseline = (await probe()).nodes;

    await page.getByRole('button', { name: 'play', exact: true }).click();
    let sawVoice = false;
    let maxVoices = 0;
    for (let i = 0; i < 40; i++) { // ~4s of steps, sampled every 100ms
      await page.waitForTimeout(100);
      const { voices } = await probe();
      sawVoice ||= voices > 0;
      maxVoices = Math.max(maxVoices, voices);
    }
    expect(sawVoice).toBe(true);
    expect(maxVoices).toBeLessThanOrEqual(2); // a note is released before the next one is a step away

    await page.getByRole('button', { name: 'stop', exact: true }).click();
    await expect.poll(async () => (await probe()).voices, { timeout: 3000 }).toBe(0);
    // released voices are removed, not left connected (their nodes would pile up and keep sounding)
    await expect.poll(async () => (await probe()).nodes, { timeout: 4000 }).toBeLessThanOrEqual(baseline + 2);
  });

  test('a track type stays loaded after its script panel is opened and the page reloaded', async ({ page }) => {
    // opening the script editor saves the draft; that must never replace the running script
    // (it used to reset it to the default sampler, so a reload showed "Pick a Sound" and an unloaded script)
    const { id } = await addTrack(page, 'Polysynth');
    const row = page.locator(`[data-track-id="${id}"]`);
    await row.click();
    await row.getByRole('button', { name: 'scripts' }).click();
    await expect(page.getByText('Loaded...')).toBeVisible();
    await page.waitForTimeout(3500); // the editor's draft save is debounced

    await page.reload();
    await expect(row.locator('[data-test-source-label]')).toHaveText('polysynth');
    await expect(row.getByText(/pick a sound/i)).toHaveCount(0);

    await row.click();
    await row.getByRole('button', { name: 'scripts' }).click();
    await expect(page.getByText('Loaded...')).toBeVisible(); // not the "Load" button
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
