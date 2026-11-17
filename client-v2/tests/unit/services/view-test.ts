import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';

module('Unit | Service | view', function (hooks) {
  setupTest(hooks);

  test('it starts on the footer UI with the sequence pane', function (assert) {
    const view = this.owner.lookup('service:view');

    assert.false(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'sequence');
  });

  test('the script button swaps the footer between its UI and the script', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = true;

    view.toggleScript();
    assert.true(view.scriptOpen);
    assert.true(view.footerOpen);

    view.toggleScript();
    assert.false(view.scriptOpen);
    assert.true(view.footerOpen, 'the footer stays open');
  });

  test('the script button opens a collapsed footer on the script', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = false;

    view.toggleScript();
    assert.true(view.scriptOpen);
    assert.true(view.footerOpen, 'expanded');

    view.toggleFooter();
    view.toggleScript();
    assert.true(view.scriptOpen, 'still the script, not switched off unseen');
    assert.true(view.footerOpen);
  });

  test('the script choice and the footer pane are remembered in localStorage', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = true;
    view.toggleScript();
    view.setFooterPane('source');

    assert.deepEqual(
      JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null'),
      {
        scriptOpen: true,
        footerPane: 'source',
        collapsed: [],
        waveforms: {},
        snaps: {},
        lanes: {},
        rows: {},
      },
    );
  });

  test('the lane a track’s row shows is remembered per track; none is kept apart from not chosen', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.strictEqual(view.chosenLane('a'), undefined);
    view.chooseLane('a', 'q');
    view.chooseLane('b', null);
    assert.strictEqual(view.chosenLane('a'), 'q');
    assert.strictEqual(view.chosenLane('b'), '');
    assert.deepEqual(
      (
        JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null') as {
          lanes: unknown;
        }
      ).lanes,
      { a: 'q', b: '' },
    );
  });

  test('a remembered choice is restored', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ scriptOpen: true, footerPane: 'controls' }),
    );
    const view = this.owner.lookup('service:view');
    assert.true(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'controls');
  });

  test('broken JSON in storage falls back to the defaults', function (assert) {
    window.localStorage.setItem(VIEW_STORAGE_KEY, '{"scriptOpen":"yes"');
    const view = this.owner.lookup('service:view');
    assert.false(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'sequence');
  });

  test('remembered values that make no sense fall back to the defaults', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ scriptOpen: 'yes', footerPane: 'sideways' }),
    );
    const view = this.owner.lookup('service:view');
    assert.false(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'sequence');
  });

  test('which sections of the controls pane are closed is remembered, per scope', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.true(view.isSectionOpen('t-kick', 'filter'), 'open to start with');

    view.setSectionOpen('t-kick', 'filter', false);
    assert.false(view.isSectionOpen('t-kick', 'filter'));
    assert.true(
      view.isSectionOpen('t-snare', 'filter'),
      'another track’s is its own',
    );
    assert.deepEqual(
      (
        JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}') as {
          collapsed?: string[];
        }
      ).collapsed,
      ['t-kick/filter'],
    );

    view.setSectionOpen('t-kick', 'filter', true);
    assert.true(view.isSectionOpen('t-kick', 'filter'));
  });

  test('closed sections are restored', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ collapsed: ['t-kick/filter', 7] }),
    );
    const view = this.owner.lookup('service:view');
    assert.false(view.isSectionOpen('t-kick', 'filter'));
    assert.true(view.isSectionOpen('t-kick', 'level'));
  });

  test('which waveform a track’s source pane shows is remembered per track', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.strictEqual(view.chosenWaveform('t-kick'), undefined);
    view.chooseWaveform('t-kick', '#snare › waveform');
    assert.strictEqual(view.chosenWaveform('t-kick'), '#snare › waveform');
    assert.strictEqual(
      view.chosenWaveform('t-hat'),
      undefined,
      'another track’s is its own',
    );
    assert.deepEqual(
      (
        JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}') as {
          waveforms?: unknown;
        }
      ).waveforms,
      { 't-kick': '#snare › waveform' },
    );
  });
});
