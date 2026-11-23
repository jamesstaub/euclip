import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';
import ViewService, { VIEW_STORAGE_KEY } from 'client-v2/services/view';

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

  test('the selected track is remembered, so a reload comes back to it', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.strictEqual(view.selectedTrack, undefined, 'none yet');
    view.selectTrack('t-snare');
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}',
    ) as { selectedTrack?: string };
    assert.strictEqual(stored.selectedTrack, 't-snare');
    // a page loaded later reads it back
    assert.strictEqual(new ViewService(this.owner).selectedTrack, 't-snare');
  });

  test('the script choice and the footer pane are remembered in localStorage', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = true;
    view.toggleScript();
    view.setFooterPane('sound');

    assert.deepEqual(
      JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null'),
      {
        scriptOpen: true,
        footerPane: 'sound',
        collapsed: [],
        waveforms: {},
        snaps: {},
        laneView: {},
        sheetSize: 'half',
        welcomeSeen: false,
        referenceOpen: false,
      },
    );
  });

  test('whether the script reference is open is remembered', function (assert) {
    this.owner.lookup('service:view').setReferenceOpen(true);
    assert.true(
      (
        JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}') as {
          referenceOpen?: boolean;
        }
      ).referenceOpen,
    );
  });

  test('a control’s lane is shown while it is in play, unless hidden; one opened stays open', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.true(view.isLaneShown('a', 'f', true), 'in play: shown');
    assert.false(view.isLaneShown('a', 'q', false), 'not in play: not shown');
    view.setLane('a', 'q', true);
    view.setLane('a', 'f', false);
    assert.true(view.isLaneShown('a', 'q', false), 'opened');
    assert.false(view.isLaneShown('a', 'f', true), 'hidden');
    assert.true(view.isLaneShown('b', 'f', true), 'another track is as it was');
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null',
    ) as { laneView: Record<string, { open: string[]; closed: string[] }> };
    assert.deepEqual(stored.laneView['a'], { open: ['q'], closed: ['f'] });
  });

  test('one lane at a time over a track’s source', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.strictEqual(view.sourceLane('a'), null);
    view.setSourceLane('a', 'speed');
    view.setSourceLane('a', 'start');
    assert.strictEqual(
      view.sourceLane('a'),
      'start',
      'the other takes its place',
    );
    assert.strictEqual(view.sourceLane('b'), null);
    view.setSourceLane('a', null);
    assert.strictEqual(view.sourceLane('a'), null);
  });

  test('a remembered choice is restored', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ scriptOpen: true, footerPane: 'controls' }),
    );
    const view = this.owner.lookup('service:view');
    assert.true(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'sound');
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
