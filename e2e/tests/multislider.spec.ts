import { test, expect } from '@playwright/test';
import { apiHeaders, createProjectWithTrack, login, setSequence } from './helpers';

// Regression: multislider values were never sent to the API (controlArrayValue had lost its @attr),
// so edits beyond the first page, or any edit at all, were lost.
test('multislider values for a 32-step sequence persist across both pages and a reload', async ({ page }) => {
  const patches: number[][] = [];
  let speedControlId = '';
  page.on('request', (rq) => {
    if (rq.method() === 'PATCH' && /\/v1\/track-controls\/\d+/.test(rq.url())) {
      const values = rq.postDataJSON()?.data?.attributes?.['control-array-value'];
      if (values?.length) patches.push(values);
    }
  });
  page.on('response', async (r) => {
    if (r.request().method() === 'POST' && /\/v1\/track-controls$/.test(r.url())) {
      const j = await r.json().catch(() => null);
      if (j?.data?.attributes?.['node-attr'] === 'speed') speedControlId = j.data.id;
    }
  });

  await login(page);
  const track = await createProjectWithTrack(page);
  await setSequence(page, track, { steps: 32, hits: 4 });
  await page.reload();

  const openSpeedMultislider = async () => {
    await page.locator('[data-test-track-item]:not(:has-text("Main Output"))').first().click();
    await page.getByRole('button', { name: 'source' }).click(); // a sampler's controls live in the source tab
    const wrapper = page.locator('.controls-wrapper', { has: page.getByText('speed', { exact: true }) });
    await expect(wrapper).toBeVisible();
    return wrapper;
  };

  const speed = await openSpeedMultislider();
  await speed.getByRole('button', { name: 'Toggle Multislider Mode' }).click();
  const canvas = page.locator('.multislider-bg svg').first();
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(1500); // let the control re-layout before measuring it
  const box = (await canvas.boundingBox())!;
  const bar = async (i: number, frac: number) => {
    await page.mouse.click(box.x + (i + 0.5) * (box.width / 16), box.y + box.height * frac);
    await page.waitForTimeout(300);
  };

  await bar(2, 0.3); // page 1, step 3
  await page.locator('.multislider-wrapper').getByRole('button', { name: '2', exact: true }).first().click();
  await bar(4, 0.6); // page 2, step 21
  await expect.poll(() => patches.at(-1)?.length, { timeout: 10_000 }).toBe(32);

  // what the API stored
  const fetchStored = async () => {
    const res = await page.request.get(`/v1/track-controls/${speedControlId}`, { headers: await apiHeaders(page) });
    return (await res.json()).data.attributes['control-array-value'] as number[];
  };
  const stored = await fetchStored();
  expect(stored).toHaveLength(32);
  const base = stored[0];
  const changed = stored.map((v, i) => (v !== base ? i : -1)).filter((i) => i >= 0);
  expect(changed).toEqual([2, 20]); // one edit on each page, at the right absolute step

  const full = await (await page.request.get(`/v1/track-controls/${speedControlId}`, { headers: await apiHeaders(page) })).json();
  expect(full.data.attributes['interface-name']).toBe('multislider'); // the mode itself persists too
  // after a reload the client still has all 32 values: the next edit sends the complete array
  await page.reload();
  await openSpeedMultislider();
  await expect(page.locator('.multislider-bg svg').first()).toBeVisible(); // still a multislider after reload
  await page.waitForTimeout(500);
  patches.length = 0;
  const box2 = (await page.locator('.multislider-bg svg').first().boundingBox())!;
  await page.mouse.click(box2.x + 7.5 * (box2.width / 16), box2.y + box2.height * 0.5); // page 1, step 8
  await expect.poll(() => patches.at(-1)?.length, { timeout: 10_000 }).toBe(32);
  const after = patches.at(-1)!;
  expect(after[2]).toBe(stored[2]);
  expect(after[20]).toBe(stored[20]);
});
