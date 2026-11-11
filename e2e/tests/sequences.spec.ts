import { test, expect } from '@playwright/test';
import { addSequence, createProjectWithTrack, login, setScript, setSequence } from './helpers';

// A track can have several sequences; each steps independently and the play script is told which one fired.
test('a track steps all of its sequences and the play script knows which one fired', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);

  await setScript(page, track, 'onstep', `
    window.__seq = window.__seq || {};
    const seen = window.__seq[sequenceIndex] || { calls: 0 };
    window.__seq[sequenceIndex] = { calls: seen.calls + 1, length: array.length };
  `);
  await addSequence(page, track, { steps: 4, hits: 2 });
  await page.reload();
  await expect(page.locator('[data-test-track-item]:not(:has-text("Main Output"))')).toHaveCount(1);

  await page.getByRole('button', { name: 'play' }).click();
  const seen = () => page.evaluate(() => (window as any).__seq as Record<string, { calls: number; length: number }>);
  await expect.poll(async () => Object.keys((await seen()) ?? {}).sort().join(',')).toBe('0,1');

  const result = await seen();
  expect(result['0'].length).toBe(8); // the primary sequence (8 steps)
  expect(result['1'].length).toBe(4); // the second one, stepping on its own loop
  expect(result['0'].calls).toBeGreaterThan(0);
  expect(result['1'].calls).toBeGreaterThan(0);
});

// A sequence's clock rate divides or multiplies the project's clock, per sequence, without moving it off the grid.
test('a sequence runs at its clock rate: double, half', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);

  await setScript(page, track, 'onstep', `
    window.__rate = window.__rate || {};
    window.__rate[sequenceIndex] = (window.__rate[sequenceIndex] || 0) + 1;
  `);
  await addSequence(page, track, { steps: 8, hits: 8, rate: 2 });
  await addSequence(page, track, { steps: 8, hits: 8, rate: 0.5 });
  await page.reload();
  await expect(page.locator('[data-test-track-item]:not(:has-text("Main Output"))')).toHaveCount(1);

  await page.getByRole('button', { name: 'play' }).click();
  const calls = () => page.evaluate(() => (window as any).__rate as Record<string, number>);
  await expect.poll(async () => (await calls())?.['0'] ?? 0, { timeout: 30_000 }).toBeGreaterThanOrEqual(8);

  const seen = await calls(); // 0 steps with the clock, 1 twice per tick, 2 on every other tick
  expect(Math.abs(seen['1'] - seen['0'] * 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(seen['2'] - seen['0'] / 2)).toBeLessThanOrEqual(1);
});

// A step can hold more than on / off: click cycles its value up, right click down, and the play script gets it as `data`.
test('steps hold values up to the sequence max: click and right click cycle them, scripts read them', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);

  await setSequence(page, track, { steps: 8, hits: 2, 'max-value': 3, 'custom-sequence': [1, 0, 2, 0, 3, 0, 0, 0] } as any);
  await setScript(page, track, 'onstep', `
    window.__data = window.__data || [];
    window.__data[index] = data;
  `);
  await page.reload();
  const steps = page.locator('[data-test-track-item]:not(:has-text("Main Output")) .track-sequencer svg');
  const values = () => steps.evaluateAll((els) => els.map((el) => el.querySelector('[data-test-step-value]')?.textContent ?? ''));
  await expect.poll(values).toEqual(['1', '', '2', '', '3', '', '', '']);

  await steps.nth(4).click(); // 3 is the highest: back to a rest
  await steps.nth(5).click({ button: 'right' }); // a rest, backwards: the highest value
  await steps.nth(0).click({ button: 'right' }); // 1 -> 0
  await expect.poll(values).toEqual(['', '', '2', '', '', '3', '', '']);

  await page.getByRole('button', { name: 'play' }).click();
  await expect.poll(() => page.evaluate(() => ((window as any).__data ?? []).filter((d: unknown) => d !== undefined).length), { timeout: 30_000 }).toBe(8);
  expect(await page.evaluate(() => (window as any).__data)).toEqual([0, 0, 2, 0, 0, 3, 0, 0]);
});

// Scripts write steps with this.setStep, wrapping around the sequence and clamped to the sequence's max value.
test('a script can write steps with this.setStep', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);

  await setSequence(page, track, { steps: 4, hits: 0, 'max-value': 2 });
  await setScript(page, track, 'onstep', `this.setStep(index + 1, 9); // clamped to 2, and the last step wraps to the first`);
  await page.reload();
  const steps = page.locator('[data-test-track-item]:not(:has-text("Main Output")) .track-sequencer svg');

  await page.getByRole('button', { name: 'play' }).click();
  await expect(steps.locator('[data-test-step-value]')).toHaveCount(4, { timeout: 30_000 });
  await expect(steps.locator('[data-test-step-value]').first()).toHaveText('2');
});

// this.sequences[i] is the steps plus the sequencer's own settings: setting them moves the dials and changes the pattern.
test('a script can set the sequencer dials and generators through this.sequences', async ({ page }) => {
  await login(page);
  const track = await createProjectWithTrack(page);

  await setSequence(page, track, { steps: 8, hits: 0 });
  await setScript(page, track, 'onstep', `
    const sequence = this.sequences[0];
    window.__hits = sequence.hits; // readable like a control
    if (index === array.length - 1 && sequence.length === 8) {
      sequence.euclidean(5, 12, 1); // the dials: 5 hits, 12 steps, offset 1
    } else if (index === array.length - 1) {
      window.__plain = this.euclidean(3, 8).join(''); // the generator as a plain function
      sequence.length = 4; // resize: the steps become hand-made
    }
  `);
  await page.reload();
  const steps = page.locator('[data-test-track-item]:not(:has-text("Main Output"))').last().locator('.track-sequencer svg');

  await page.getByRole('button', { name: 'play' }).click();
  await expect(steps).toHaveCount(12, { timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => (window as any).__hits)).toBe(5);
  await expect(steps).toHaveCount(4, { timeout: 30_000 });
  expect(await page.evaluate(() => (window as any).__plain)).toBe('10010010');
});
