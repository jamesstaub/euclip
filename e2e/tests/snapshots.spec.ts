import { test, expect, type Page } from '@playwright/test';
import { apiHeaders, createProject, createProjectWithTrack, login, setScript, setSequence } from './helpers';

const strip = (page: Page) => page.locator('[data-test-snapshot-strip]');
// the exact name (so "Main" does not also match "Main copy"); the text is "<name> <bpm>"
const snapshot = (page: Page, name: string) => strip(page).locator('[data-test-snapshot]').filter({ hasText: new RegExp(`^\\s*${name}\\s+\\d+`) });
const snapshotButton = (page: Page, name: string) => snapshot(page, name).getByRole('button').first();
const trackRows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');
const activeName = (page: Page) => strip(page).locator('[data-test-snapshot][data-snapshot-state="active"]');

const slugOf = (page: Page) => page.url().split('/').filter(Boolean).pop()!.replace(/\?.*/, '');

// every step, the play script records which snapshot's script ran, the loop index, the time and the sequence length
const recorder = (label: string) => `(window.__ev = window.__ev || []).push(['${label}', index, performance.now(), sequenceIndex, array.length]);`;
const events = (page: Page) => page.evaluate(() => ((window as any).__ev ?? []) as [string, number, number, number, number][]);
const count = async (page: Page, label: string) => (await events(page)).filter((e) => e[0] === label).length;

/** Saves a snapshot through the API, holding the given settings for one track (as the app would capture them). */
async function createSnapshot(page: Page, name: string, attributes: Record<string, unknown>, tracks: Record<string, unknown>) {
  const res = await page.request.post(`/v1/projects/${slugOf(page)}/snapshots`, {
    headers: await apiHeaders(page),
    data: {
      data: {
        type: 'snapshot',
        attributes: { name, ...attributes, data: JSON.stringify({ tracks }) },
        relationships: { project: { data: { type: 'project', id: slugOf(page) } } },
      },
    },
  });
  expect(res.ok()).toBe(true);
  return (await res.json()).data.id as string;
}

const seq = (steps: number, hits = 1) => ({ order: 0, hits, steps, offset: 0, customSequence: null });

test.describe('snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a new project has one active snapshot; saving adds a copy holding the current settings', async ({ page }) => {
    await createProject(page);
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(1);
    await expect(activeName(page)).toContainText('Main');

    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);
    await expect(snapshot(page, 'Main copy')).toBeVisible();
    await expect(activeName(page)).toContainText('Main'); // saving does not switch
  });

  test('tracks are shared: a track added in one snapshot is there in the others', async ({ page }) => {
    await createProject(page);
    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    await page.getByRole('button', { name: 'New Track' }).click();
    await expect(trackRows(page)).toHaveCount(2);

    await snapshotButton(page, 'Main copy').click();
    await expect(activeName(page)).toContainText('Main copy');
    await expect(trackRows(page)).toHaveCount(2);
  });

  test('the active snapshot is remembered across a reload', async ({ page }) => {
    await createProject(page);
    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);
    await snapshotButton(page, 'Main copy').click();
    await expect(activeName(page)).toContainText('Main copy');
    await page.waitForTimeout(1000); // the choice is saved in the background

    await page.reload();
    await expect(activeName(page)).toContainText('Main copy');
  });

  test('a snapshot can be renamed and deleted (not while active)', async ({ page }) => {
    await createProject(page);
    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    await snapshotButton(page, 'Main copy').dblclick();
    await page.getByLabel('Snapshot name').fill('Chorus');
    await page.getByLabel('Snapshot name').press('Enter');
    await expect(snapshot(page, 'Chorus')).toBeVisible();

    // the double-click's first click switched to it, so Chorus is active now and only Main can be deleted
    await expect(snapshot(page, 'Chorus')).toHaveAttribute('data-snapshot-state', 'active');
    await expect(strip(page).getByRole('button', { name: 'Delete snapshot Chorus' })).toHaveCount(0); // the active one
    await strip(page).getByRole('button', { name: 'Delete snapshot Main' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(1);
  });

  test('switching while playing happens on the next step, keeps the loop position, and swaps script, sequence and tempo', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'onstep', recorder('A'));
    await setSequence(page, track, { steps: 8, hits: 3 });
    await createSnapshot(page, 'Verse', { bpm: 60 }, { [track.id]: { sequences: [seq(4)], onstep: { safeCode: recorder('B'), editorContent: recorder('B') } } });
    await page.reload();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(() => count(page, 'A'), { timeout: 15_000 }).toBeGreaterThan(4);

    await snapshotButton(page, 'Verse').click();
    await expect.poll(() => count(page, 'B'), { timeout: 15_000 }).toBeGreaterThan(3);
    await expect(activeName(page)).toContainText('Verse');

    const all = (await events(page)).filter((e) => e[3] === 0); // the primary sequence only
    const firstB = all.findIndex((e) => e[0] === 'B');
    const lastA = firstB - 1;
    expect(all.slice(firstB).every((e) => e[0] === 'B')).toBe(true); // the old script stopped at once
    expect(all.slice(firstB).every((e) => e[4] === 4)).toBe(true); // the new sequence is 4 steps
    expect(all[lastA][4]).toBe(8);
    // no gap and no double step: the next step arrives about one step (250ms) after A's last
    expect(all[firstB][2] - all[lastA][2]).toBeLessThan(450);
    expect(all[firstB][2] - all[lastA][2]).toBeGreaterThan(100);
    // the new tempo (60 bpm = 500ms per step) is in effect
    const b = all.slice(firstB);
    const gaps = b.slice(1).map((e, i) => e[2] - b[i][2]);
    expect(gaps.slice(-2).every((g) => g > 400 && g < 650)).toBe(true);
  });

  test('switching reuses the audio graph: nothing is rebuilt, and switching back restores the first state', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'onstep', recorder('A'));
    await createSnapshot(page, 'Verse', {}, { [track.id]: { onstep: { safeCode: recorder('B'), editorContent: recorder('B') } } });
    await page.reload();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(() => count(page, 'A'), { timeout: 15_000 }).toBeGreaterThan(2);
    const nodeIds = () => page.evaluate((s) => (window as any).__(s).nodes?.map?.((n: any) => n.id) ?? (window as any).__(s).size(), `.track-id-${track.id}`);
    const before = await nodeIds();

    await snapshotButton(page, 'Verse').click();
    await expect.poll(() => count(page, 'B'), { timeout: 15_000 }).toBeGreaterThan(2);
    expect(await nodeIds()).toEqual(before);

    const a = await count(page, 'A');
    await snapshotButton(page, 'Main').click();
    await expect.poll(() => count(page, 'A'), { timeout: 15_000 }).toBeGreaterThan(a + 2);
    expect(await nodeIds()).toEqual(before);
  });

  test('edits made while a snapshot is active are kept when switching away and back', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'onstep', recorder('A'));
    await setSequence(page, track, { steps: 8, hits: 3 });
    await createSnapshot(page, 'Verse', {}, { [track.id]: { sequences: [seq(4)] } });
    await page.reload();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(() => count(page, 'A'), { timeout: 15_000 }).toBeGreaterThan(2);
    // 8-step Main -> 4-step Verse -> back to Main must still be 8 steps
    await snapshotButton(page, 'Verse').click();
    await expect.poll(async () => (await events(page)).slice(-1)[0]?.[4], { timeout: 15_000 }).toBe(4);
    await snapshotButton(page, 'Main').click();
    await expect.poll(async () => (await events(page)).slice(-1)[0]?.[4], { timeout: 15_000 }).toBe(8);
  });
  test('a snapshot restores control values, and the change is saved', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await page.waitForTimeout(3000); // the track's controls are created and saved after the first build
    const loaded = page.waitForResponse((r) => r.request().method() === 'GET' && /\/projects\/[^/?]+\?/.test(r.url()));
    await page.reload();
    const body = await (await loaded).json();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(1);
    const control = body.included.find(
      (i: any) => i.type === 'track-control' && i.relationships.track.data.id === track.id && i.attributes['control-value'] != null && i.attributes.max > i.attributes.min
    );
    expect(control, 'the track has a numeric control').toBeTruthy();
    const a = control.attributes;
    const wanted = a['control-value'] === a.max ? a.min : a.max;
    const key = `${a['node-type']}:${a['node-order']}:${a['node-attr']}`;
    await createSnapshot(page, 'Verse', {}, { [track.id]: { controls: { [key]: { controlValue: wanted } } } });
    await page.reload();

    await snapshotButton(page, 'Verse').click();
    await expect(activeName(page)).toContainText('Verse');
    await expect
      .poll(async () => {
        const res = await page.request.get(`/v1/track-controls/${control.id}`, { headers: await apiHeaders(page) });
        return (await res.json()).data.attributes['control-value'];
      }, { timeout: 15_000 })
      .toBe(wanted);
  });
});
