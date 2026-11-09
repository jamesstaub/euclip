import { test, expect, type Page } from '@playwright/test';
import { addFilepath, createProjectWithTrack, login, setScript, setSequence } from './helpers';

const LOOP = '/Roland/Roland CR-78 CompuRhythm/CR-78 Kit 03/LOOP1.mp3';
const rgb = (css: string) => (/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(css) ?? []).slice(1, 4).map(Number);

// A sampler with a filter, on its own track, with its row selected
async function openTrack(page: Page) {
  const track = await createProjectWithTrack(page);
  await setScript(page, track, 'init', `__().sampler({ path: this.files[0], loop: true }).lowpass({ frequency: 2000, q: 6 }).channelStrip().connect('#main-output');`);
  await addFilepath(page, track, 0, LOOP);
  await page.reload();
  await page.locator('[data-test-track-item]:not(:has-text("Main Output"))').first().click();
}

const tab = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();
const box = async (page: Page, selector: string) => (await page.locator(selector).first().boundingBox())!;

test.describe('footer layout', () => {
  let errors: string[] = [];
  test.beforeEach(async ({ page }) => {
    errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await login(page);
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test("the numbers in a parameter's settings menu can be read without clicking them", async ({ page }) => {
    await openTrack(page);
    await tab(page, 'controls');
    await page.locator('[data-test-control-config]').first().click();
    const input = page.locator('[data-test-control-config-panel] input').first();
    await expect(input).toBeVisible();
    const { color, background } = await input.evaluate((el) => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
    expect(rgb(color).every((channel) => channel >= 200)).toBe(true); // light text...
    expect(background).not.toBe('rgba(0, 0, 0, 0)'); // ...on a visible field, not on nothing
    expect(Math.max(...rgb(background))).toBeLessThan(120); // a dark one, to match the panel
  });

  test('parameter rows stack in the controls tab, each with its per-step button, and nothing overlaps', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTrack(page);
    await tab(page, 'controls');
    const rows = page.locator('[data-test-param]');
    await expect(rows).toHaveCount(2); // the filter's frequency and Q
    const [first, second] = [await rows.nth(0).boundingBox(), await rows.nth(1).boundingBox()] as any[];
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1); // one under the other...
    expect(Math.abs(second.x - first.x)).toBeLessThan(2); // ...in one column
    await expect(page.locator('[data-test-multislider-toggle]')).toHaveCount(2);

    // in the frequency row, the number and the unit menu are side by side, not on top of each other
    const number = (await rows.nth(0).locator('.slider-number input').boundingBox())!;
    const unit = (await rows.nth(0).locator('.nexus-select select').boundingBox())!;
    expect(number.x + number.width).toBeLessThanOrEqual(unit.x + 1);
  });

  test('on a wide screen the sampler card stays a sensible size, dark with a blue waveform and light text', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openTrack(page);
    await tab(page, 'source');
    const card = page.locator('[data-test-sampler-card]').first();
    await expect(card.locator('canvas')).toBeVisible();
    expect((await card.boundingBox())!.width).toBeLessThanOrEqual(22 * 16);

    const style = await card.locator('> *').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(rgb(style)).toEqual([51, 51, 51]); // dark-gray
    const text = await card.locator('[data-test-sampler-name]').evaluate((el) => getComputedStyle(el).color);
    expect(rgb(text).every((channel) => channel >= 240)).toBe(true);

    // the waveforms (the card's and the sample panel's) are drawn in blue
    const blueness = (selector: string) =>
      page.locator(selector).first().evaluate((canvas: HTMLCanvasElement) => {
        const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
        let blue = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 200 && data[i] < 140 && data[i + 1] > 180 && data[i + 2] > 220) blue++;
        return blue;
      });
    expect(await blueness('[data-test-sampler-card] canvas')).toBeGreaterThan(20);
    expect(await blueness('.waveform-canvas')).toBeGreaterThan(50);
    const panel = await page.locator('.waveform-area').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(rgb(panel)).toEqual([51, 51, 51]);
  });

  test('the sequencer type tabs match the other tabs and do not stretch across a wide screen', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openTrack(page);
    await tab(page, 'sequence');
    const kinds = page.locator('[data-test-sequencer-kinds]');
    await expect(kinds).toBeVisible();
    const buttons = kinds.getByRole('button');
    await expect(buttons).toHaveCount(3);
    // the three buttons together are compact (about 25rem), however wide the screen is, and the column is capped too
    const [firstButton, lastButton] = [await buttons.nth(0).boundingBox(), await buttons.nth(2).boundingBox()] as any[];
    expect(lastButton.x + lastButton.width - firstButton.x).toBeLessThan(500);
    expect((await kinds.boundingBox())!.width).toBeLessThanOrEqual(48 * 16 + 1);
    for (let i = 0; i < 3; i++) {
      expect(await buttons.nth(i).evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe('0px'); // square
    }
    const chosen = await buttons.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(rgb(chosen)).toEqual([51, 51, 51]); // the chosen one is dark, like a chosen node tab
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
  });

  test('on a phone the footer tabs put the icon beside the label and share borders', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await openTrack(page);
    const tabs = page.locator('.track-footer .tab-btn.vertical');
    await expect(tabs).toHaveCount(3);
    const [a, b] = [await tabs.nth(0).boundingBox(), await tabs.nth(1).boundingBox()] as any[];
    expect(b.y).toBeCloseTo(a.y, 0); // a row
    expect(b.x - (a.x + a.width)).toBeLessThanOrEqual(0); // no gap...
    expect(b.x - (a.x + a.width)).toBeGreaterThanOrEqual(-4); // ...and they overlap by one border, not by more

    const icon = (await tabs.nth(0).locator('svg').boundingBox())!;
    const label = (await tabs.nth(0).locator('p').boundingBox())!;
    expect(icon.x + icon.width).toBeLessThanOrEqual(label.x + 1); // beside the text, not above it
    expect(Math.abs(icon.y + icon.height / 2 - (label.y + label.height / 2))).toBeLessThan(8);
    expect(icon.width).toBeGreaterThanOrEqual(28); // and a little bigger than before

    // the strip and the channel strip leave the same gutter at the edge of the footer
    const strip = (await page.locator('.track-footer > .channel-strip-w').boundingBox())!;
    const menu = (await page.locator('.track-footer > .tab-menu').boundingBox())!;
    expect(Math.abs(strip.y - menu.y)).toBeLessThan(6);
    expect(menu.x + menu.width).toBeLessThanOrEqual(640 - 3);
  });

  test('on a phone a parameter row fits the screen', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await openTrack(page);
    await tab(page, 'controls');
    const row = page.locator('[data-test-param]').first();
    await expect(row).toBeVisible();
    const rowBox = (await row.boundingBox())!;
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(640);
    const menu = (await row.locator('[data-test-control-config]').boundingBox())!;
    expect(menu.x + menu.width).toBeLessThanOrEqual(640);
  });

  test('a sound row: the play triangle is centred in its circle, and its buttons add no hover colour of their own', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTrack(page);
    await tab(page, 'source');
    await page.locator('[data-test-source-kind]').first().click(); // opens the sound browser
    await page.locator('[data-test-segment="pool"]').click(); // the project's own sounds
    const row = page.locator('[data-test-sound-row], [data-test-pool-sample]').first();
    await expect(row).toBeVisible();

    const circle = (await row.locator('[data-test-sound-play]').boundingBox())!;
    const triangle = (await row.locator('[data-test-play-icon]').boundingBox())!;
    // a triangle looks centred a little right of its box's middle: within a pixel and a half either way
    expect(Math.abs(triangle.x + triangle.width / 2 - (circle.x + circle.width / 2))).toBeLessThanOrEqual(1.6);
    expect(Math.abs(triangle.y + triangle.height / 2 - (circle.y + circle.height / 2))).toBeLessThanOrEqual(1);

    // hovering the row's name button leaves it transparent (the row itself shows the hover)
    const name = row.locator('button.no-hover-bg').first();
    await name.hover();
    expect(await name.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  });

  test('sequence pages sit to the right of the steps; on a phone above them; the steps stay left-aligned', async ({ page }) => {
    const track = await createProjectWithTrack(page);
    await setSequence(page, track, { steps: 32, hits: 8 }); // two pages
    await page.reload();
    const row = page.locator('[data-test-track-item]:not(:has-text("Main Output"))').first();
    await expect(row.locator('.track-sequencer .sequencer-width')).toBeVisible();
    const steps = row.locator('.track-sequencer .sequencer-width');
    const pager = row.locator('.track-sequencer > .w-100').first();
    await expect(pager.getByRole('button').first()).toBeVisible();

    // a wide screen: the pager is after the steps, on the same line
    await page.setViewportSize({ width: 1440, height: 900 });
    let [s, p] = [(await steps.boundingBox())!, (await pager.boundingBox())!];
    expect(p.x).toBeGreaterThanOrEqual(s.x + s.width - 1);
    expect(Math.abs(p.y + p.height / 2 - (s.y + s.height / 2))).toBeLessThan(s.height);

    // a phone: the pager is on top and the steps are under it, both starting at the same left edge
    await page.setViewportSize({ width: 480, height: 900 });
    await page.waitForTimeout(300);
    [s, p] = [(await steps.boundingBox())!, (await pager.boundingBox())!];
    expect(p.y + p.height).toBeLessThanOrEqual(s.y + 1);
    expect(Math.abs(p.x - s.x)).toBeLessThan(2);
    const item = (await row.boundingBox())!;
    expect(s.x - item.x).toBeLessThan(item.width / 2); // the steps are on the left half of the row, not centred or pushed right
  });

  test('per-step sliders are drawn to fit their panel, at any window height', async ({ page }) => {
    await openTrack(page);
    await tab(page, 'source');
    for (const name of ['speed', 'loop']) await page.locator(`[data-test-param="${name}"] [data-test-multislider-toggle]`).click();
    const panels = page.locator('.controls-wrapper.multislider-wrapper');
    await expect(panels).toHaveCount(2);

    for (const height of [900, 700, 560]) {
      await page.setViewportSize({ width: 1440, height });
      await page.waitForTimeout(900); // the sliders re-draw once the new space is measured
      const fits = await panels.evaluateAll((els) =>
        els.map((el) => {
          const panel = el.getBoundingClientRect();
          const bars = el.querySelector('.multislider-bg svg')!.getBoundingClientRect();
          return { overflow: bars.bottom - panel.bottom, overflowRight: bars.right - panel.right, barsHeight: bars.height, barsWidth: bars.width };
        })
      );
      fits.forEach(({ overflow, overflowRight, barsHeight, barsWidth }) => {
        expect(overflow, `at ${height}px tall the bars end inside the panel`).toBeLessThanOrEqual(1);
        expect(overflowRight).toBeLessThanOrEqual(1); // and so do their right ends: the panel is as wide as its steps
        expect(barsWidth).toBeGreaterThanOrEqual(240); // (eight steps of about 32px)
        expect(barsHeight).toBeGreaterThanOrEqual(56); // and stay usable
      });
    }
  });

  test('an on/off parameter is a toggle again after per-step mode, and its per-step values are only ever 0 or 1', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const patches: number[][] = [];
    page.on('request', (rq) => {
      // a new control's first save is a POST, later ones PATCH
      if (!['POST', 'PATCH'].includes(rq.method()) || !/\/v1\/track-controls/.test(rq.url())) return;
      const attributes = rq.postDataJSON()?.data?.attributes;
      if (attributes?.['node-attr'] === 'loop' && attributes['control-array-value']?.length) patches.push(attributes['control-array-value']);
    });
    await openTrack(page);
    await tab(page, 'source');

    const loop = page.locator('[data-test-param="loop"]');
    await expect(loop.locator('[data-test-toggle-control]')).toHaveCount(1); // a toggle, not a slider with a number
    await expect(loop.locator('.slider-number')).toHaveCount(0);

    // per-step: the bars take only two values, however they are dragged
    await loop.getByRole('button', { name: 'Toggle Multislider Mode' }).click();
    const panel = page.locator('.controls-wrapper.multislider-wrapper').filter({ hasText: /loop/i });
    const bars = panel.locator('.multislider-bg svg');
    await expect(bars).toBeVisible();
    await page.waitForTimeout(800);
    const b = (await bars.boundingBox())!;
    // (loop: true starts every step at 1; clicking low on a bar would store 0.1 or 0.3 if the slider were continuous)
    for (const [i, fraction] of [[0, 0.9], [1, 0.1], [2, 0.7], [3, 0.4]] as const) {
      await page.mouse.click(b.x + (i + 0.5) * (b.width / 8), b.y + b.height * fraction);
      await page.waitForTimeout(150);
    }
    await expect.poll(() => patches.length, { timeout: 10_000 }).toBeGreaterThan(0);
    patches.flat().forEach((value) => expect([0, 1]).toContain(value));
    expect(patches.flat()).toContain(0); // a low click did make a step off

    // and back: an on/off, so a toggle again (it used to come back as a slider)
    await panel.getByRole('button', { name: 'Toggle Multislider Mode' }).click();
    await expect(page.locator('[data-test-param="loop"] [data-test-toggle-control]')).toHaveCount(1);
    await expect(page.locator('[data-test-param="loop"] .slider-number')).toHaveCount(0);
  });

  test("a wide per-step panel does not squash the parameter rows beside it: the footer scrolls sideways instead", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openTrack(page);
    await tab(page, 'source');
    const speed = page.locator('[data-test-param="speed"]');
    await expect(speed).toBeVisible();
    const before = (await speed.boundingBox())!.width;

    await page.locator('[data-test-param="loop"] [data-test-multislider-toggle]').click();
    await expect(page.locator('.controls-wrapper.multislider-wrapper')).toHaveCount(1);
    await page.waitForTimeout(600);

    // the row keeps its width (name, slider, value, unit and menu all still fit: it is not squashed)...
    const after = (await speed.boundingBox())!.width;
    expect(after).toBeGreaterThanOrEqual(Math.min(before, 30 * 16) - 2);
    expect(after).toBeGreaterThanOrEqual(28 * 16);
    // ...and it is the container that scrolls
    const scrolls = await page.locator('.node-controls').evaluate((el) => ({ scroll: el.scrollWidth, shown: el.clientWidth }));
    expect(scrolls.scroll).toBeGreaterThan(scrolls.shown);
  });

  test('the snapshots bar is hidden until its toolbar button is pressed, and the choice is remembered', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await createProjectWithTrack(page);
    const bar = page.locator('[data-test-snapshot-strip]');
    const toggle = page.locator('[data-test-snapshots-toggle]');

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle.locator('svg')).toHaveCount(1); // an icon button
    await expect(bar).toHaveCount(0); // not showing by default

    await toggle.click();
    await expect(bar).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // remembered across a reload...
    await page.reload();
    await expect(bar).toBeVisible();
    await expect(page.locator('[data-test-snapshots-toggle]')).toHaveAttribute('aria-pressed', 'true');

    // ...until it is turned off again
    await page.locator('[data-test-snapshots-toggle]').click();
    await expect(bar).toHaveCount(0);
    await page.reload();
    await expect(bar).toHaveCount(0);
  });

  test('the footer sits on the bottom of the window at every screen size', async ({ page }) => {
    await createProjectWithTrack(page);
    await page.locator('[data-test-track-item]').first().click();
    for (const [width, height] of [[1440, 900], [1000, 800], [900, 780], [800, 900], [600, 900], [390, 844], [700, 600]]) {
      await page.setViewportSize({ width, height });
      await expect.poll(async () => Math.round((await box(page, '.track-footer')).y + (await box(page, '.track-footer')).height), { message: `${width}x${height}` }).toBeGreaterThanOrEqual(
        // a phone scrolls its column, so there the footer's bottom is the column's bottom, not the window's
        width < 768 ? (await box(page, '.project-main')).y : height - 1,
      );
      if (width >= 768) expect(Math.round((await box(page, '.track-footer')).y + (await box(page, '.track-footer')).height), `${width}x${height}`).toBeLessThanOrEqual(height);
    }
  });
});
