import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  findAll,
  render,
  select,
  settled,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ViewService from 'client-v2/services/view';

const rect = (selector: string): number[] => {
  const box = find(selector)!.getBoundingClientRect();
  return [box.left, box.top, box.width, box.height].map((n) => Math.round(n));
};

/** The host the app is drawn in is this wide (the app's layout follows its own width, not the test window's). */
function sized(width: number): void {
  const host = find('.sweep-host') as HTMLElement;
  host.style.width = `${width}px`;
  host.style.height = '900px';
  host.style.overflow = 'hidden';
}

const overlap = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right - 1 &&
  b.left < a.right - 1 &&
  a.top < b.bottom - 1 &&
  b.top < a.bottom - 1;

module('Integration | Sequence pane layout', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  hooks.beforeEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
    view = this.owner.lookup('service:view');
    view.phone = false;
    view.footerOpen = true;
    view.footerPane = 'sequence';
  });
  hooks.afterEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
  });

  const card = '[data-test-pane="sequence"] [data-test-sequence="steps"]';

  test('the generator is a band under the grid; turning to another changes no place', async function (assert) {
    await render(<template><AppShell /></template>);

    assert.dom(`${card} [role="tablist"]`).doesNotExist('no tab strip');
    assert
      .dom(`${card} .sequence-card__head [data-test-gen-kind]`)
      .doesNotExist('the header is the sequence’s own');
    assert.dom(`${card} .step-gen [data-test-gen-kind]`).exists();
    assert.dom(`${card} .step-gen [data-test-gen-combine]`).exists();
    assert.true(
      find(`${card} .step-gen`)!.getBoundingClientRect().top >=
        find(`${card} [data-test-gen-tools]`)!.getBoundingClientRect().bottom -
          1,
      'under the grid and its tools',
    );

    const grid = `${card} [data-test-step-grid]`;
    const dials = `${card} [data-test-gen-panel]`;
    const before = [rect(grid), rect(dials)];
    const counts: Record<string, number> = {};
    for (const kind of ['onoff', 'sieve', 'euclid']) {
      await select(`${card} [data-test-gen-kind]`, kind);
      counts[kind] = findAll(`${card} [data-test-gen-dial]`).length;
      assert.deepEqual(
        rect(grid),
        before[0],
        `${kind}: the grid has not moved`,
      );
      assert.deepEqual(rect(dials), before[1], `${kind}: the row is as tall`);
    }
    // (Binary's whole number is one more cell in the band's head: on a narrow pane its sliders are a
    // line lower. The grid, above, never moves.)
    await select(`${card} [data-test-gen-kind]`, 'binary');
    counts['binary'] = findAll(`${card} [data-test-gen-dial]`).length;
    assert.deepEqual(rect(grid), before[0], 'binary: the grid has not moved');
    assert.deepEqual(counts, { onoff: 2, sieve: 4, euclid: 2, binary: 4 });
  });

  test('the tools bar is under the grid, after it in the card', async function (assert) {
    await render(<template><AppShell /></template>);

    const grid = find(`${card} [data-test-step-grid]`)!;
    const tools = find(`${card} [data-test-gen-tools]`)!;
    assert.true(
      !!(
        grid.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING
      ),
      'after the grid in the document',
    );
    assert.true(
      tools.getBoundingClientRect().top >=
        grid.getBoundingClientRect().bottom - 1,
      'and below it',
    );
    assert.dom(`${card} [data-test-gen-tool]`).exists({ count: 4 });
    assert.dom(`${card} [data-test-gen-hint] [data-test-hint-button]`).exists();
  });

  test('the header’s cells keep their places when the length changes', async function (assert) {
    await render(<template><AppShell /></template>);

    const cells = [
      `${card} [data-test-grid-step]`,
      `${card} [data-test-show-in-script]`,
    ];
    const before = cells.map(rect);
    await click(`${card} [data-test-grid-length] [data-test-number-entry]`);
    await fillIn(
      `${card} [data-test-grid-length] [data-test-number-input]`,
      '9',
    );
    await triggerKeyEvent(
      `${card} [data-test-grid-length] [data-test-number-input]`,
      'keydown',
      'Enter',
    );
    assert.dom(`${card} [data-test-step]`).exists({ count: 9 });
    assert.deepEqual(cells.map(rect), before);
  });

  module('the phone sheet at every width below 48rem', function () {
    for (const width of [400, 480, 560, 650, 720, 767]) {
      test(`${width}px: tabs in one row, the strip lying down, nothing overlapping`, async function (assert) {
        view.phone = true;
        view.sheetSize = 'half';
        await render(
          <template>
            <div class="sweep-host">
              <AppShell />
            </div>
          </template>,
        );
        sized(width);
        for (const tab of ['sound', 'sequence'] as const) {
          view.footerOpen = true;
          view.footerPane = tab;
          await settled();
          const footer = find(
            '[data-test-track-footer]',
          )!.getBoundingClientRect();
          const tabs = findAll('.footer-tab');
          assert.strictEqual(
            new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top)))
              .size,
            1,
            `${tab}: the tabs are one row`,
          );
          const strip = find('.channel-strip')!.getBoundingClientRect();
          assert.true(strip.height < 100, `${tab}: the strip lies down`);
          assert.true(strip.width > footer.width / 2, `${tab}: and is wide`);

          const parts = [
            '.track-footer__bar',
            '.channel-strip',
            '.track-footer__pane',
          ].map((selector) => find(selector)!.getBoundingClientRect());
          for (let i = 0; i < parts.length; i++) {
            for (let j = i + 1; j < parts.length; j++) {
              assert.false(
                overlap(parts[i]!, parts[j]!),
                `${tab}: ${i} and ${j} apart`,
              );
            }
          }
          for (const el of findAll(
            '.track-footer__bar *, .channel-strip *, .footer-tab',
          )) {
            const box = el.getBoundingClientRect();
            if (box.width === 0) continue;
            const inside =
              box.right <= footer.right + 1 && box.left >= footer.left - 1;
            assert.true(
              inside,
              `${tab}: ${el.className} stays inside the sheet`,
            );
          }
        }
      });
    }

    test('768 to 900: the desktop layout does not overlap either', async function (assert) {
      view.phone = false;
      for (const width of [768, 820, 900]) {
        await render(
          <template>
            <div class="sweep-host">
              <AppShell />
            </div>
          </template>,
        );
        sized(width);
        await settled();
        const parts = [
          '.channel-strip',
          '.footer-tabs',
          '.track-footer__pane',
        ].map((selector) => find(selector)!.getBoundingClientRect());
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            assert.false(
              overlap(parts[i]!, parts[j]!),
              `${width}: ${i} and ${j}`,
            );
          }
        }
      }
    });
  });
});
