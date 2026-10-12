import { test, expect, type Page } from '@playwright/test';
import { apiHeaders, createProject, createProjectWithTrack, login, setScript } from './helpers';

const strip = (page: Page) => page.locator('[data-test-snapshot-strip]');
// the exact name (so "Main" does not also match "Main copy"); the text is "<name> <bpm>"
const snapshot = (page: Page, name: string) => strip(page).locator('[data-test-snapshot]').filter({ hasText: new RegExp(`^\\s*${name}\\s+\\d+`) });
const snapshotButton = (page: Page, name: string) => snapshot(page, name).getByRole('button').first();
const trackRows = (page: Page) => page.locator('[data-test-track-item]:not(:has-text("Main Output"))');

const slugOf = (page: Page) => page.url().split('/').filter(Boolean).pop()!.replace(/\?.*/, '');

/** Saves the active snapshot as a copy through the API; returns the copy's id and its (non-master) track's play-script id. */
async function cloneViaApi(page: Page, name: string) {
  const res = await page.request.post(`/v1/projects/${slugOf(page)}/snapshots?include=tracks`, {
    headers: await apiHeaders(page),
    data: { data: { type: 'snapshot', attributes: { name }, relationships: { project: { data: { type: 'project', id: slugOf(page) } } } } },
  });
  expect(res.ok()).toBe(true);
  const body = await res.json();
  const tracks = body.included.filter((i: any) => i.type === 'track' && !i.attributes['is-master']);
  return {
    id: body.data.id as string,
    onstepScriptId: tracks[0].relationships['onstep-script'].data.id as string,
    trackId: tracks[0].id as string,
  };
}

async function setOnstepById(page: Page, scriptId: string, trackId: string, code: string) {
  const res = await page.request.patch(`/v1/onstep-scripts/${scriptId}`, {
    headers: await apiHeaders(page),
    data: { data: { type: 'onstep-scripts', id: scriptId, attributes: { code, 'editor-content': code }, relationships: { track: { data: { type: 'tracks', id: trackId } } } } },
  });
  expect(res.ok()).toBe(true);
}

// every step, the play script records which snapshot's track ran and the loop index
const recorder = (label: string) => `(window.__ev = window.__ev || []).push(['${label}', index, performance.now(), sequenceIndex]);`;
const events = (page: Page) => page.evaluate(() => ((window as any).__ev ?? []) as [string, number, number, number][]);

test.describe('snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('a new project has one active snapshot, and saving adds a copy that is built in the background', async ({ page }) => {
    await createProject(page);
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(1);
    await expect(strip(page).locator('[data-test-snapshot][data-snapshot-state="active"]')).toContainText('Main');

    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);
    const copy = snapshot(page, 'Main copy');
    await expect(copy).toBeVisible();
    await expect(copy).toHaveAttribute('data-snapshot-state', 'ready', { timeout: 15_000 }); // staged: ready to switch to
  });

  test('edits apply to the active snapshot only; switching while stopped swaps the track list', async ({ page }) => {
    await createProject(page);
    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    // add a track to Main (the active one): the copy must not get it
    await page.getByRole('button', { name: 'New Track' }).click();
    await expect(trackRows(page)).toHaveCount(2);

    await snapshotButton(page, 'Main copy').click();
    await expect(strip(page).locator('[data-test-snapshot][data-snapshot-state="active"]')).toContainText('Main copy');
    await expect(trackRows(page)).toHaveCount(1);

    await snapshotButton(page, 'Main').click();
    await expect(trackRows(page)).toHaveCount(2);
  });

  test('the active snapshot is remembered across a reload', async ({ page }) => {
    await createProject(page);
    await strip(page).getByRole('button', { name: 'Save snapshot' }).click();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);
    await snapshotButton(page, 'Main copy').click();
    await expect(strip(page).locator('[data-test-snapshot][data-snapshot-state="active"]')).toContainText('Main copy');
    await page.waitForTimeout(1000); // the choice is saved in the background

    await page.reload();
    await expect(strip(page).locator('[data-test-snapshot][data-snapshot-state="active"]')).toContainText('Main copy');
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

  test('switching while playing happens on the next step, continues the loop position, and uses the new tempo', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'onstep', recorder('A'));
    const b = await cloneViaApi(page, 'Verse'); // copy of A
    await setOnstepById(page, b.onstepScriptId, b.trackId, recorder('B'));
    await page.request.patch(`/v1/snapshots/${b.id}`, {
      headers: await apiHeaders(page),
      data: { data: { type: 'snapshot', id: b.id, attributes: { bpm: 60 } } },
    });
    await page.reload();
    await expect(strip(page).locator('[data-test-snapshot]')).toHaveCount(2);

    await page.getByRole('button', { name: 'play' }).click();
    await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'A').length, { timeout: 15_000 }).toBeGreaterThan(4);
    await expect(snapshot(page, 'Verse')).toHaveAttribute('data-snapshot-state', 'ready', { timeout: 15_000 });

    await snapshotButton(page, 'Verse').click();
    await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'B').length, { timeout: 15_000 }).toBeGreaterThan(3);
    await expect(strip(page).locator('[data-test-snapshot][data-snapshot-state="active"]')).toContainText('Verse');

    const all = (await events(page)).filter((e) => e[3] === 0); // the primary sequence only
    const firstB = all.findIndex((e) => e[0] === 'B');
    const lastA = firstB - 1;
    expect(all.slice(firstB).every((e) => e[0] === 'B')).toBe(true); // the old snapshot stopped stepping at once
    // phase-aligned: B's first step is the step right after A's last (the 8-step loop kept its place)
    expect(all[firstB][1]).toBe((all[lastA][1] + 1) % 8);
    // no gap and no double step: the next step arrives about one step (250ms) after A's last
    expect(all[firstB][2] - all[lastA][2]).toBeLessThan(450);
    expect(all[firstB][2] - all[lastA][2]).toBeGreaterThan(100);
    // the new snapshot's tempo (60 bpm = 500ms per step) is in effect
    const b2 = all.slice(firstB);
    const gaps = b2.slice(1).map((e, i) => e[2] - b2[i][2]);
    expect(gaps.slice(-2).every((g) => g > 400 && g < 650)).toBe(true);
  });

  test('the old snapshot is torn down after a switch and rebuilt silently so switching back is instant', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setScript(page, track, 'onstep', recorder('A'));
    const b = await cloneViaApi(page, 'Verse');
    await setOnstepById(page, b.onstepScriptId, b.trackId, recorder('B'));
    await page.reload();
    const nodes = (selector: string) => page.evaluate((s) => (window as any).__(s).size(), selector);

    await page.getByRole('button', { name: 'play' }).click();
    await expect(snapshot(page, 'Verse')).toHaveAttribute('data-snapshot-state', 'ready', { timeout: 15_000 });
    expect(await nodes(`.track-id-${b.trackId}`)).toBeGreaterThan(0); // Verse is built while staged (silent)

    await snapshotButton(page, 'Verse').click();
    await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'B').length, { timeout: 15_000 }).toBeGreaterThan(2);
    // Main is rebuilt in the background: ready again, so switching back needs no wait
    await expect(snapshot(page, 'Main')).toHaveAttribute('data-snapshot-state', 'ready', { timeout: 15_000 });

    const before = (await events(page)).filter((e) => e[0] === 'A').length;
    await snapshotButton(page, 'Main').click();
    await expect.poll(async () => (await events(page)).filter((e) => e[0] === 'A').length, { timeout: 15_000 }).toBeGreaterThan(before + 2);
  });
});
