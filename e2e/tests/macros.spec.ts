import { test, expect, type Page } from '@playwright/test';
import { apiHeaders, createProjectWithTrack, login, oscillatorStarts, scheduledOn, setMacrosScript, setScript, spyOnOscillatorStarts, spyOnParams } from './helpers';

const rows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');

// what a polysynth was last told by `update` (the macro keeps its settings on the node)
const polysynthSettings = (page: Page) =>
  page.evaluate(() => {
    const w = window as any;
    const uuid = [].concat(w.__._getNodeLookup()['polysynth'])[0];
    const s = w.__._getNode(uuid)?.getParams()?.settings ?? {};
    return { lp_frequency: s.lp_frequency, lp_q: s.lp_q, osc_type: s.osc_type, gain_volume: s.gain_volume, lfo_speed: s.lfo_speed };
  });

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

test.describe('macro controls', () => {
  let errors: string[] = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await spyOnParams(page);
    await spyOnOscillatorStarts(page);
    await login(page);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("a polysynth's settings become controls that update the macro", async ({ page }) => {
    const ids = watchControls(page);
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `
      __().polysynth({ osc_type: 'square', lp_frequency: 1800, gain_volume: 0.6 }).channelStrip().connect('#main-output');
    `);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);

    // one control per schema setting, created from the macro's schema
    await expect.poll(() => Object.keys(ids).filter((k) => k.startsWith('polysynth.')).length).toBe(9);

    // the numbers and the choice the script passed are the controls' starting values (and the macro's)
    await expect.poll(() => polysynthSettings(page)).toMatchObject({ lp_frequency: 1800, gain_volume: 0.6, osc_type: 'square' });
    await expect.poll(async () => (await stored(page, ids['polysynth.lp_frequency']))['control-value']).toBe(1800);
    await expect.poll(async () => (await stored(page, ids['polysynth.osc_type']))['control-value']).toBe(1); // 'square'

    // they are source controls: in the source tab, a choice shows as a select
    await rows(page).first().click();
    await page.getByRole('button', { name: 'source' }).click();
    await expect(page.locator('.controls-wrapper', { has: page.getByText('lp_frequency', { exact: false }) }).first()).toBeVisible();
    await expect(page.locator('[data-test-choice-control]')).toHaveCount(2); // osc_type and lfo_type
  });

  test('a script reads a macro control and offsets it for one step', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'init', `__().polysynth({ lp_frequency: 1000 }).channelStrip().connect('#main-output');`);
    await setScript(page, track, 'onstep', `
      window.__reads = (window.__reads || []).concat(this.controls.polysynth.lp_frequency);
      this.controls.polysynth.lp_frequency = this.controls.polysynth.lp_frequency * 2;
    `);
    await page.reload();
    await expect(rows(page)).toHaveCount(1);
    await page.getByRole('button', { name: 'play' }).click();

    await expect.poll(() => page.evaluate(() => ((window as any).__reads ?? []).length)).toBeGreaterThan(4);
    // the script always reads the control's own value (never last step's offset)...
    expect(new Set(await page.evaluate(() => (window as any).__reads))).toEqual(new Set([1000]));
    // ...while the macro itself was told the offset value
    await expect.poll(async () => (await polysynthSettings(page)).lp_frequency).toBe(2000);
  });

  async function openMacroMenu(page: Page) {
    await rows(page).first().click();
    await rows(page).first().getByRole('button', { name: 'scripts' }).click();
    await page.locator('[data-test-open-macros]').click();
    await expect(page.locator('[data-test-macro-menu]')).toBeVisible();
  }

  test('the Macros menu loads a documented example whose schema declaration drives the controls', async ({ page }) => {
    const ids = watchControls(page);
    await createProjectWithTrack(page);
    await expect(rows(page)).toHaveCount(1);
    await openMacroMenu(page);

    // both built-in macros are listed, with their settings
    await expect(page.locator('[data-test-macro-item]')).toHaveCount(3); // polysynth, monosynth and the define-your-own template
    await page.locator('[data-test-macro-item="monosynth"]').click();
    await expect(page.locator('[data-test-macro-settings]')).toContainText('lp_frequency');
    await page.locator('[data-test-macro-load]').click();

    // the example replaced the scripts and the track now has a monosynth
    await expect.poll(() => page.evaluate(() => (window as any).__('monosynth').size()), { timeout: 15_000 }).toBe(1);
    await expect.poll(() => ids['monosynth.lp_frequency'], { timeout: 15_000 }).toBeTruthy();

    // the example's declareControls() narrowed the cutoff to 60-3000 Hz (built in: 20-20000), and its
    // literal (900) is the control's starting value
    await expect.poll(async () => (await stored(page, ids['monosynth.lp_frequency'])).min, { timeout: 15_000 }).toBe(60);
    expect((await stored(page, ids['monosynth.lp_frequency'])).max).toBe(3000);
    expect((await stored(page, ids['monosynth.lp_frequency']))['control-value']).toBe(900);

    // its oscillator is started (otherwise no note makes a sound)
    await page.getByRole('button', { name: 'play' }).first().click();
    await expect.poll(() => oscillatorStarts(page), { timeout: 10_000 }).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'stop' }).click();

    // playing it: notes play and the play script sweeps the filter an octave either side of the control
    await page.getByRole('button', { name: 'play' }).first().click(); // the transport (the script panel has a "play" tab too)
    await page.waitForTimeout(3500);
    const cutoffs = (await scheduledOn(page, 350)).filter((hz) => hz !== 20000 && hz !== 440); // not the starting track's filter, nor cracked's one-off creation value
    expect(Math.max(...cutoffs)).toBeCloseTo(1800, 0);
    expect(Math.min(...cutoffs)).toBeCloseTo(450, 0);
  });

  test('editing the declared schema changes the control without recreating it', async ({ page }) => {
    const ids = watchControls(page);
    const track = await createProjectWithTrack(page);
    const init = (min: number) => `
      __().polysynth({ lp_frequency: 1000 }).channelStrip().connect('#main-output');
      this.declareControls('polysynth', { lp_frequency: { min: ${min}, max: 5000, scale: 'log' } });
    `;
    await setScript(page, track, 'init', init(100));
    await page.reload();
    await expect.poll(() => ids['polysynth.lp_frequency']).toBeTruthy();
    await expect.poll(async () => (await stored(page, ids['polysynth.lp_frequency'])).min).toBe(100);

    await setScript(page, track, 'init', init(300));
    await page.reload();
    await expect.poll(async () => (await stored(page, ids['polysynth.lp_frequency'])).min).toBe(300);
    expect((await stored(page, ids['polysynth.lp_frequency'])).max).toBe(5000);
  });

  test("the project's macros script declares a macro's controls for every track, and a track can still override it", async ({ page }) => {
    const ids = watchControls(page);
    const project = await createProjectWithTrack(page);
    await setMacrosScript(page, project, `this.declareControls('polysynth', { lp_frequency: { min: 150, max: 6000 }, lp_q: { max: 9 } });`);
    await setScript(page, project, 'init', `
      __().polysynth({ lp_frequency: 1000 }).channelStrip().connect('#main-output');
      this.declareControls('polysynth', { lp_q: { max: 4 } }); // this track narrows resonance further
    `);
    await page.reload();
    await expect.poll(() => ids['polysynth.lp_frequency']).toBeTruthy();

    // from the project: the cutoff range. From the track: the resonance range (it wins over the project's)
    await expect.poll(async () => (await stored(page, ids['polysynth.lp_frequency'])).min).toBe(150);
    expect((await stored(page, ids['polysynth.lp_frequency'])).max).toBe(6000);
    await expect.poll(async () => (await stored(page, ids['polysynth.lp_q'])).max).toBe(4);
  });

  test('a macro defined in the macros script is usable by name in a track, with controls from its schema', async ({ page }) => {
    const ids = watchControls(page);
    const project = await createProjectWithTrack(page);
    await setMacrosScript(page, project, `
      this.defineMacro('siren', {
        controls: {
          wave: { type: 'choice', choices: ['sine', 'square'], default: 0 },
          rate: { min: 0.5, max: 30, step: 0.5, default: 4 },
        },
        create(settings) {
          __().lfo({ type: 'sine', gain: 50, frequency: settings.rate, modulates: 'frequency' })
            .osc({ type: settings.wave, frequency: 220 })
            .gain({ gain: 0.4 });
        },
        update(changes, el) {
          window.__sirenUpdates = (window.__sirenUpdates || []).concat([changes]);
          if ('rate' in changes) __.exec('frequency', [changes.rate], el.search('lfo'));
        },
      });
    `);
    await setScript(page, project, 'init', `__().siren({ rate: 6, wave: 'square' }).channelStrip().connect('#main-output');`);
    await setScript(page, project, 'onstep', `this.controls.siren.rate = 12;`);
    await page.reload();

    // the schema in the macros script made controls for the macro's settings
    await expect.poll(() => ids['siren.rate']).toBeTruthy();
    await expect.poll(() => ids['siren.wave']).toBeTruthy();
    await expect.poll(async () => (await stored(page, ids['siren.rate']))['control-value']).toBe(6); // the track's number
    await expect.poll(async () => (await stored(page, ids['siren.wave']))['control-value']).toBe(1); // 'square'
    await expect.poll(() => page.evaluate(() => (window as any).__('siren').size())).toBe(1);

    // playing: the control reaches the macro's own update() (which retunes its LFO)
    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(() => page.evaluate(() => ((window as any).__sirenUpdates ?? []).some((c: any) => c.rate === 12))).toBe(true);
    await expect.poll(async () => (await scheduledOn(page, 440)).includes(12)).toBe(true);
  });

  test('the macros tab holds the project-wide script, and loading a macro example never adds it twice', async ({ page }) => {
    await createProjectWithTrack(page);
    await expect(rows(page)).toHaveCount(1);
    await rows(page).first().click();
    await rows(page).first().getByRole('button', { name: 'scripts' }).click();

    // a third tab, with the project script and a note that it is shared
    await page.getByRole('button', { name: 'macros', exact: true }).click();
    // the explanation lives in the sidebar's info box with the other script descriptions, not between the tabs and the editor
    await expect(page.locator('.script-wrapper [data-test-macros-script-note]')).toHaveCount(0);
    await page.getByRole('button', { name: 'More information' }).click();
    await expect(page.locator('[data-test-macros-script-note]')).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('MACROS');

    // load the template twice: its registration is added to the macros script once
    for (let i = 0; i < 2; i++) {
      await page.locator('[data-test-open-macros]').click();
      await page.locator('[data-test-macro-item="siren"]').click();
      await page.locator('[data-test-macro-load]').click();
      await expect.poll(() => page.evaluate(() => (window as any).__('siren').size()), { timeout: 15_000 }).toBe(1);
    }
    await page.getByRole('button', { name: 'macros', exact: true }).click();
    const text = await page.locator('.cm-content').innerText();
    expect(text.split('---- macro: siren ----').length - 1).toBe(1);
    expect(text).toContain("this.defineMacro('siren'");

    // the template track runs: the macro's oscillators are started and it plays without errors
    await page.getByRole('button', { name: 'play' }).first().click();
    await expect.poll(() => oscillatorStarts(page), { timeout: 10_000 }).toBeGreaterThan(0);
  });
});
