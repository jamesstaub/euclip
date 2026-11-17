// Sweeps the viewport width and checks the app's fixed-layout rules in the real app:
//   - the waveform editor's values: no cell moves or changes size through interaction, no label is cut
//     short and every value is fully visible, in every unit, and the values stay inside the editor;
//   - the sequence pane: with Generate open on each tab nothing is cut off by the footer, and opening
//     it or changing tab does not move the grid.
// Usage: node scripts/sweep-layout.mjs <baseUrl> [open|closed] [mouse|touch] [from] [to] [step] [height]
// Needs Playwright: it is taken from the sibling cracked-up checkout.
/* global document */
import { createRequire } from 'node:module';
const require = createRequire(
  new URL('../../../cracked-up/package.json', import.meta.url),
);
const { chromium } = require('playwright');
const [
  base,
  sidebar = 'closed',
  pointer = 'mouse',
  from = '320',
  to = '2200',
  step = '40',
  tall = '900',
] = process.argv.slice(2);
const touch = pointer === 'touch';
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: +tall },
  hasTouch: touch,
  isMobile: touch,
  deviceScaleFactor: touch ? 2 : 1,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForSelector('[data-test-app-shell][data-ready="true"]');
const press = (l) => (touch ? l.tap() : l.click());
// a sliced loop track: every unit is on offer, and its speed is synced to its sequence
if (
  await page
    .locator('[data-test-sidebar-scrim]')
    .isVisible()
    .catch(() => false)
)
  await press(page.locator('[data-test-sidebar-close]'));
await press(page.locator('[data-test-new-track-kinds]'));
await press(page.locator('[data-test-new-sliced-loop]'));
await page.waitForTimeout(900);

const values = () =>
  page.evaluate(() => {
    const root = document.querySelector('.waveform__values');
    const wave = document
      .querySelector('[data-test-waveform]')
      .getBoundingClientRect();
    const pane = document.querySelector('.track-footer__pane');
    const v = root.getBoundingClientRect();
    const shown = (el) => el.getClientRects().length > 0;
    const round = (n) => Math.round(n * 2) / 2;
    const boxes = {};
    const cut = [];
    const hidden = [];
    for (const el of root.querySelectorAll(
      '[data-test-waveform-group], [data-test-waveform-value], .waveform__unit',
    )) {
      if (!shown(el)) continue;
      const name = el.dataset.testWaveformGroup
        ? `group-${el.dataset.testWaveformGroup}`
        : (el.dataset.testWaveformValue ?? 'unit');
      const r = el.getBoundingClientRect();
      boxes[name] =
        `${round(r.left - v.left)} ${round(r.top - v.top)} ${round(r.width)} ${round(r.height)}`;
      const label = el.querySelector(':scope > .waveform__label');
      if (label && shown(label) && label.scrollWidth > label.clientWidth + 0.5)
        cut.push(`${name} (${label.clientWidth}px for ${label.scrollWidth}px)`);
      const number = el.querySelector(
        ':scope > .number-entry-box .number-entry',
      );
      if (number && number.scrollWidth > number.clientWidth + 0.5)
        hidden.push(`${name} "${number.textContent.trim()}"`);
    }
    return {
      boxes,
      cut,
      hidden,
      outside: v.right > wave.right + 1 || v.bottom > wave.bottom + 1,
      scroll: pane.scrollHeight - pane.clientHeight,
    };
  });
const sequence = () =>
  page.evaluate(() => {
    const pane = document
      .querySelector('.track-footer__pane')
      .getBoundingClientRect();
    const card = document.querySelector(
      '[data-test-pane="sequence"] [data-test-sequence]',
    );
    const grid = card
      .querySelector('[data-test-step-grid]')
      .getBoundingClientRect();
    const gen = card
      .querySelector('[data-test-generators]')
      .getBoundingClientRect();
    const steps = [...card.querySelectorAll('[data-test-step]')].map((el) =>
      el.getBoundingClientRect(),
    );
    const rows = new Set(steps.map((r) => Math.round(r.top))).size;
    const scroller = document.querySelector('.track-footer__pane');
    return {
      grid: `${Math.round(grid.left - pane.left)} ${Math.round(grid.top - pane.top + scroller.scrollTop)} ${Math.round(grid.width)} ${Math.round(grid.height)}`,
      cutOff: Math.max(
        0,
        Math.round(
          gen.bottom -
            pane.bottom +
            (scroller.scrollHeight -
              scroller.clientHeight -
              scroller.scrollTop) *
              0,
        ),
      ),
      below: Math.round(
        gen.bottom + scroller.scrollTop - (pane.top + scroller.clientHeight),
      ),
      scroll: scroller.scrollHeight - scroller.clientHeight,
      rows,
      stepW: Math.round(steps[0].width * 10) / 10,
      stepH: Math.round(steps[0].height * 10) / 10,
      sideways: scroller.scrollWidth - scroller.clientWidth,
    };
  });

let bad = 0,
  checked = 0;
const scrolls = [];
for (let width = +from; width <= +to; width += +step) {
  await page.setViewportSize({ width, height: +tall });
  await page.waitForTimeout(120);
  const open = (await page.locator('[data-test-sound-browser]').count()) > 0;
  const drawer =
    open &&
    (await page
      .locator('[data-test-sidebar-scrim]')
      .isVisible()
      .catch(() => false));
  if (drawer) {
    await press(page.locator('[data-test-sidebar-close]'));
    if (sidebar === 'open') {
      console.log(`${width}: skipped (the sidebar is a drawer here)`);
      continue;
    }
  } else if (open !== (sidebar === 'open')) {
    await press(page.locator('[data-test-sidebar-toggle]'));
    await page.waitForTimeout(120);
    if (
      await page
        .locator('[data-test-sidebar-scrim]')
        .isVisible()
        .catch(() => false)
    ) {
      await press(page.locator('[data-test-sidebar-close]'));
      if (sidebar === 'open') {
        console.log(`${width}: skipped (the sidebar is a drawer here)`);
        continue;
      }
    }
  }
  if (
    (await page
      .locator('[data-test-footer-toggle]')
      .getAttribute('aria-expanded')) !== 'true'
  )
    await press(page.locator('[data-test-footer-toggle]'));
  const problems = [];
  // ---- the waveform's values
  await press(page.locator('[data-test-footer-tab="source"]'));
  await page.waitForSelector('[data-test-waveform-stage][data-ready]');
  await page.waitForTimeout(80);
  const start = await values();
  const expect = async (what) => {
    await page.waitForTimeout(40);
    const now = await values();
    const moved = Object.keys({ ...start.boxes, ...now.boxes }).filter(
      (k) => start.boxes[k] !== now.boxes[k],
    );
    if (moved.length)
      problems.push(
        `${what}: moved or resized: ${moved
          .slice(0, 3)
          .map((k) => `${k} ${start.boxes[k]} -> ${now.boxes[k]}`)
          .join('; ')}`,
      );
    if (now.cut.length)
      problems.push(`${what}: label cut short: ${now.cut.join(', ')}`);
    if (now.hidden.length)
      problems.push(`${what}: value not fully shown: ${now.hidden.join(', ')}`);
    if (now.outside)
      problems.push(`${what}: the values are outside the editor`);
  };
  await expect('at rest');
  if (start.scroll > 1) scrolls.push(`${width} source (${start.scroll}px)`);
  await press(page.locator('[data-test-waveform-loop]'));
  await expect('Loop on');
  const expanded = !(await page
    .locator('[data-test-waveform-unit]')
    .isVisible());
  if (expanded) {
    await press(page.locator('[data-test-waveform-expand]'));
    await page.waitForTimeout(150);
  }
  const base2 = expanded ? await values() : null;
  if (base2) Object.assign(start, base2);
  const unit = page.locator('[data-test-waveform-unit]');
  for (const mode of await unit
    .locator('option')
    .evaluateAll((os) => os.map((o) => o.value))) {
    await unit.selectOption(mode);
    await expect(`unit ${mode}`);
  }
  await unit.selectOption('ms');
  if (
    await page
      .locator('[data-test-speed-menu] [data-test-menu-button]')
      .isVisible()
  ) {
    for (const item of ['Semitones', 'Cents', 'Ratio', 'Sequence sync']) {
      await press(
        page.locator('[data-test-speed-menu] [data-test-menu-button]'),
      );
      await press(page.locator(`[data-test-menu-item="${item}"]`));
      await expect(`speed in ${item}`);
    }
  }
  await unit.selectOption('seconds');
  if (expanded) await press(page.locator('[data-test-waveform-expand]'));
  await press(page.locator('[data-test-waveform-loop]'));
  // ---- the sequence pane, with Generate open on each tab
  await press(page.locator('[data-test-footer-tab="sequence"]'));
  const gen = page
    .locator('[data-test-pane="sequence"] [data-test-generators]')
    .first();
  await gen.waitFor();
  if (
    (await gen
      .locator('[data-test-gen-toggle]')
      .getAttribute('aria-expanded')) === 'true'
  )
    await press(gen.locator('[data-test-gen-toggle]'));
  await page.waitForTimeout(80);
  const closed = await sequence();
  if (closed.rows !== 1)
    problems.push(`sequence: 16 steps are in ${closed.rows} rows`);
  if (closed.sideways > 1)
    problems.push(
      `sequence: the pane scrolls sideways by ${closed.sideways}px`,
    );
  await press(gen.locator('[data-test-gen-toggle]'));
  for (const tab of ['euclid', 'binary', 'onoff', 'sieve']) {
    await press(gen.locator(`[data-test-gen-tab="${tab}"]`));
    await page.waitForTimeout(60);
    const now = await sequence();
    if (now.grid !== closed.grid)
      problems.push(
        `Generate ${tab}: the grid moved (${closed.grid} -> ${now.grid})`,
      );
    if (now.sideways > 1)
      problems.push(`Generate ${tab}: sideways scroll ${now.sideways}px`);
    if (
      now.scroll > 1 &&
      !scrolls.includes(`${width} sequence (${now.scroll}px)`)
    )
      scrolls.push(`${width} sequence (${now.scroll}px)`);
  }
  await press(gen.locator('[data-test-gen-toggle]'));
  checked++;
  if (problems.length) {
    bad++;
    console.log(
      `${width}: FAIL ${problems.length} - ${problems.slice(0, 4).join(' | ')}`,
    );
  } else if ([320, 360, 400, 440].includes(width))
    console.log(
      `${width}: ok (a step is ${closed.stepW} x ${closed.stepH} px in the sequence pane)`,
    );
}
console.log(
  `sidebar ${sidebar}, ${pointer}, height ${tall}: ${checked} widths from ${from} to ${to}, ${bad} failing`,
);
console.log(
  `the pane scrolls at: ${scrolls.length ? scrolls.join(', ') : 'no width'}`,
);
if (errors.length) console.log('page errors:', errors.slice(0, 3).join(' | '));
await browser.close();
process.exitCode = bad ? 1 : 0;
