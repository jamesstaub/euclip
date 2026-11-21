import { module, test } from 'qunit';
import {
  click,
  find,
  render,
  settled,
  triggerEvent,
  triggerKeyEvent,
  waitUntil,
} from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ViewService from 'client-v2/services/view';

const shown = (selector: string): boolean => {
  const element = find(selector);
  return !!element && element.getClientRects().length > 0;
};

module('Integration | Phone layout', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  hooks.beforeEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
    view = this.owner.lookup('service:view');
    view.footerOpen = false;
    view.footerPane = 'sequence';
    view.sheetSize = 'half';
  });
  hooks.afterEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
  });

  module('the rail and one track at a time', function () {
    test('at a desktop width there is no rail and every row is shown', async function (assert) {
      view.phone = false;
      await render(<template><AppShell /></template>);

      assert.dom('[data-test-track-rail]').doesNotExist();
      assert.dom('[data-test-app-shell]').hasAttribute('data-phone', 'false');
      assert.true(shown('[data-test-track="1"]'));
      assert.true(shown('[data-test-track="2"]'));
      assert.dom('[data-test-new-track]').isVisible();
    });

    test('the rail lists the tracks, M and +, and selects', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      assert
        .dom('[data-test-track-rail] [data-test-rail-track]')
        .exists({ count: 3 });
      assert.dom('[data-test-rail-output]').hasText('M');
      assert.dom('[data-test-rail-new]').hasText('+');
      assert
        .dom('[data-test-rail-track="1"]')
        .hasAria('label', /^Track 1 \w+/)
        .hasAttribute('aria-current', 'true');

      await click('[data-test-rail-track="2"]');
      assert
        .dom('[data-test-rail-track="2"]')
        .hasAttribute('aria-current', 'true');
      assert
        .dom('[data-test-rail-track="1"]')
        .doesNotHaveAttribute('aria-current');
      assert.dom('[data-test-track="2"]').hasClass('track--active');

      await click('[data-test-rail-output]');
      assert
        .dom('[data-test-rail-output]')
        .hasAttribute('aria-current', 'true');
    });

    test('only the selected row is shown', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      assert.true(shown('[data-test-track="1"]'));
      assert.false(shown('[data-test-track="2"]'));
      assert.false(shown('[data-test-track="output"]'));

      await click('[data-test-rail-track="2"]');
      assert.false(shown('[data-test-track="1"]'));
      assert.true(shown('[data-test-track="2"]'));

      await click('[data-test-rail-output]');
      assert.true(shown('[data-test-track="output"]'));
      assert.false(shown('[data-test-track="2"]'));
    });

    test('+ adds a track and selects it; the project bar keeps the kinds', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-rail-new]');
      assert.dom('[data-test-rail-track]').exists({ count: 4 });
      assert
        .dom('[data-test-rail-track="4"]')
        .hasAttribute('aria-current', 'true');
      assert.false(
        shown('[data-test-new-track]'),
        'the New Track button gives way to the rail',
      );

      await click('[data-test-new-track-kinds]');
      await click('[data-test-new-synth]');
      assert
        .dom('[data-test-rail-track="5"]')
        .hasAttribute('aria-current', 'true');
    });
  });

  module('the sheet', function () {
    test('closed, a tab opens it to half, the active tab closes, another switches', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'closed');
      assert.dom('[data-test-footer-body]').doesNotExist();

      await click('[data-test-footer-tab="sound"]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'half');
      assert.dom('[data-test-footer-tab="sound"]').hasAria('pressed', 'true');

      await click('[data-test-footer-tab="sequence"]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'half');
      assert
        .dom('[data-test-footer-tab="sequence"]')
        .hasAria('pressed', 'true');

      await click('[data-test-footer-tab="sequence"]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'closed');
    });

    test('the handle cycles half and full, and says which', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-footer-tab="sequence"]');
      assert.dom('[data-test-sheet-handle]').hasAria('expanded', 'false');
      await click('[data-test-sheet-handle]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'full');
      assert.dom('[data-test-sheet-handle]').hasAria('expanded', 'true');
      await click('[data-test-sheet-handle]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'half');
    });

    test('the handle opens a closed sheet to half; Hide and Escape close it', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-sheet-handle]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'half');
      await click('[data-test-footer-toggle]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'closed');

      await click('[data-test-sheet-handle]');
      await triggerKeyEvent(document, 'keydown', 'Escape');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'closed');
    });

    test('the script opens at full size, and the state is remembered', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-script-toggle]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'full');
      assert.dom('[data-test-footer-script]').exists();

      const stored = JSON.parse(
        window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}',
      ) as { sheetOpen?: boolean; sheetSize?: string };
      assert.true(stored.sheetOpen);
      assert.strictEqual(stored.sheetSize, 'full');
    });

    test('at a desktop width the sheet controls are absent and the tabs stay in the body', async function (assert) {
      view.phone = false;
      view.footerOpen = true;
      await render(<template><AppShell /></template>);

      assert.dom('[data-test-sheet-handle]').doesNotExist();
      assert
        .dom('[data-test-footer-body] [data-test-footer-tab]')
        .exists({ count: 2 });
      await click('[data-test-footer-tab="sound"]');
      await click('[data-test-footer-tab="sound"]');
      assert.dom('[data-test-footer-body]').exists('tabs do not close it');
    });
  });

  module('the toolbar', function (hooks) {
    hooks.beforeEach(function () {
      view.setRowsView('chain');
    });
    hooks.afterEach(function () {
      view.setRowsView('steps');
    });

    test('it is a column of icons without words, and the chosen name is a line above the chain', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      const bar = find('[data-test-chain-actions]')!;
      assert.strictEqual(getComputedStyle(bar).flexDirection, 'column');
      const tools = [...bar.querySelectorAll('.chain-tool')];
      assert.strictEqual(tools.length, 10, 'every action keeps its slot');
      for (const tool of tools) {
        assert.strictEqual(
          getComputedStyle(tool.querySelector('.chain-tool__label')!).display,
          'none',
          'no words under an icon',
        );
        assert.true(tool.hasAttribute('aria-label'), 'but each is named');
      }
      assert
        .dom('[data-test-chain-actions] [data-test-chain-chosen]')
        .doesNotExist();
      assert.dom('.chain-chosen[data-test-chain-chosen]').exists({ count: 1 });
      const left = bar.getBoundingClientRect().left;
      const chain = find('.signal-chain__body')!.getBoundingClientRect();
      assert.true(left >= chain.right - 1, 'the toolbar is beside the chain');
    });

    test('pressing and holding an icon shows its name and does not do the action', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-chain-node]');
      view.footerOpen = false;
      await settled();
      const tool = '[data-test-chain-action="add-after"]';
      await triggerEvent(tool, 'pointerdown');
      await waitUntil(() => document.querySelector('.chain-tip'), {
        timeout: 2000,
      });
      assert.dom(document.querySelector('.chain-tip')).hasText('Add after');
      await triggerEvent(tool, 'pointerup');
      await click(tool);
      assert
        .dom('[data-test-chain-picker]')
        .doesNotExist('the press that showed the name did nothing else');

      await waitUntil(() => !document.querySelector('.chain-tip'), {
        timeout: 2000,
      });
      await click(tool);
      assert.dom('[data-test-chain-picker]').exists('a tap does the action');
      await settled();
    });

    test('the "?" lists every icon with its name', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-chain-why] [data-test-hint-button]');
      assert.dom('[data-test-chain-legend] li').exists({ count: 10 });
      assert.dom('[data-test-chain-legend]').includesText('Add before');
    });

    test('at a desktop width the toolbar is the row it was, with the name in it', async function (assert) {
      view.phone = false;
      await render(<template><AppShell /></template>);

      const bar = find('[data-test-chain-actions]')!;
      assert.strictEqual(getComputedStyle(bar).flexDirection, 'row');
      assert.dom('[data-test-chain-actions] [data-test-chain-chosen]').exists();
      assert.dom('[data-test-chain-legend]').doesNotExist();
    });
  });

  module('small fixes', function () {
    test('Escape closes the sheet, but not from a text box, a select or the script editor', async function (assert) {
      view.phone = true;
      await render(<template><AppShell /></template>);

      await click('[data-test-footer-tab="sequence"]');
      await click('[data-test-grid-length] [data-test-number-entry]');
      await triggerKeyEvent('[data-test-number-input]', 'keydown', 'Escape');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'half');

      await triggerKeyEvent('[data-test-grid-step]', 'keydown', 'Escape');
      assert
        .dom('[data-test-app-shell]')
        .hasAttribute('data-sheet', 'half', 'a select keeps its Escape');

      await triggerKeyEvent(document, 'keydown', 'Escape');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'closed');
    });

    test('on the phone, tapping a chain node chooses what the sheet will show but does not open it', async function (assert) {
      view.phone = true;
      view.setRowsView('chain');
      await render(<template><AppShell /></template>);

      await click('[data-test-chain-node="filter"]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'closed');
      assert.strictEqual(view.footerPane, 'sound', 'the tab is ready');
      await click('[data-test-footer-tab="sound"]');
      assert.dom('[data-test-app-shell]').hasAttribute('data-sheet', 'half');
      view.setRowsView('steps');
    });

    test('a node whose id is its type is named once; otherwise “type · id”', async function (assert) {
      view.phone = true;
      view.setRowsView('chain');
      await render(<template><AppShell /></template>);

      await click('[data-test-chain-node="sampler"]');
      assert.dom('.chain-chosen').hasText('sampler');
      await click('[data-test-chain-node="filter"]');
      assert.dom('.chain-chosen').hasText('lowpass · filter');
      view.setRowsView('steps');
    });
  });
});
