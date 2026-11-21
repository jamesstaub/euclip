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
      },
    );
  });

  const ROW = { grids: ['g1', 'g2'], lanes: ['q', 'f', 'n'], active: ['f'] };

  test('with no choice a track shows its grids and the lanes in play', function (assert) {
    const view = this.owner.lookup('service:view');
    assert.deepEqual([...view.shownLanes('a', ROW)], ['g1', 'g2', 'f']);
    assert.true(view.isLaneShown('a', 'f', true));
    assert.false(view.isLaneShown('a', 'q', false));
  });

  test('lanes are opened and hidden per track, and remembered', function (assert) {
    const view = this.owner.lookup('service:view');
    view.setLane('a', 'q', true);
    view.setLane('a', 'f', false);
    view.setLane('a', 'g1', false);
    assert.deepEqual([...view.shownLanes('a', ROW)], ['g2', 'q']);
    assert.deepEqual(
      [...view.shownLanes('b', ROW)],
      ['g1', 'g2', 'f'],
      'another track is as it was',
    );
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null',
    ) as { laneView: Record<string, { open: string[]; closed: string[] }> };
    assert.deepEqual(stored.laneView['a'], {
      open: ['q'],
      closed: ['f', 'g1'],
    });
  });

  test('a lane that comes into play is shown unless it was hidden; one opened stays open when cleared', function (assert) {
    const view = this.owner.lookup('service:view');
    view.setLane('a', 'q', false);
    view.setLane('a', 'f', true);
    const later = { ...ROW, active: ['q', 'n'] };
    assert.deepEqual(
      [...view.shownLanes('a', later)],
      ['g1', 'g2', 'f', 'n'],
      'q was hidden; f was opened (and is no longer in play); n came into play',
    );
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
