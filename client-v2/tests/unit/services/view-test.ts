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
        laneSets: {},
        rowsView: 'steps',
        sheetSize: 'half',
      },
    );
  });

  const ROW = { grids: ['g1', 'g2'], lanes: ['q', 'f'] };

  test('with no choice a track shows all its grids and its first lane', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.deepEqual([...view.shownLanes('a', ROW)], ['g1', 'g2', 'q']);
  });

  test('lanes are checked and unchecked per track, and remembered', function (assert) {
    const view = this.owner.lookup('service:view');
    view.setLane('a', ROW, 'f', true);
    view.setLane('a', ROW, 'g1', false);
    assert.deepEqual([...view.shownLanes('a', ROW)], ['g2', 'q', 'f']);
    assert.deepEqual(
      [...view.shownLanes('b', ROW)],
      ['g1', 'g2', 'q'],
      'another track is as it was',
    );
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null',
    ) as { laneSets: Record<string, { keys: string[] }> };
    assert.deepEqual(stored.laneSets['a']!.keys, ['g2', 'q', 'f']);
  });

  test('everything can be unchecked; what is gone is ignored; what is new is shown', function (assert) {
    const view = this.owner.lookup('service:view');
    for (const key of ['g1', 'g2', 'q']) view.setLane('a', ROW, key, false);
    assert.strictEqual(view.shownLanes('a', ROW).size, 0);
    const later = { grids: ['g2', 'g3'], lanes: ['f', 'n'] };
    assert.deepEqual(
      [...view.shownLanes('a', later)],
      ['g3', 'n'],
      'g1 and q are gone from the row; g3 and n are new, so shown; f stays unchecked',
    );
  });

  test('Show lane checks a lane without unchecking the others', function (assert) {
    const view = this.owner.lookup('service:view');
    view.setLane('a', ROW, 'g1', false);
    view.revealLane('a', ROW, 'f');
    assert.deepEqual([...view.shownLanes('a', ROW)], ['g2', 'q', 'f']);
  });

  test('a single choice from an earlier version becomes that lane and all the grids', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ lanes: { a: 'f', b: '' } }),
    );
    const view = this.owner.lookup('service:view');
    assert.deepEqual([...view.shownLanes('a', ROW)], ['g1', 'g2', 'f']);
    assert.deepEqual([...view.shownLanes('b', ROW)], ['g1', 'g2']);
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
