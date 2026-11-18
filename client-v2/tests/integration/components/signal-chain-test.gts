import { module, test } from 'qunit';
import {
  click,
  fillIn,
  findAll,
  render,
  settled,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

const KICK = 't-kick';
const reasonText = (): string =>
  document.querySelector('[data-test-chain-reason]')?.textContent?.trim() ?? '';
const pane = '[data-test-track="1"] [data-test-pane="chain"]';
const master = '[data-test-track="output"] [data-test-pane="chain"]';

module('Integration | Component | signal chain', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  let project: ProjectService;
  let audio: AudioService;
  hooks.beforeEach(function () {
    view = this.owner.lookup('service:view');
    project = this.owner.lookup('service:project');
    audio = this.owner.lookup('service:audio');
    view.footerOpen = true;
    view.footerPane = 'controls';
    view.setRowView(KICK, 'chain');
  });

  /** The one sentence behind a "?": opened, and read. */
  async function why(): Promise<string> {
    await click('[data-test-chain-why] .hint__button');
    return reasonText();
  }

  /** Replaces a track's script as if it had been typed, and runs it. */
  async function setScript(
    scope: string,
    change: (text: string) => string,
  ): Promise<void> {
    const text =
      scope === 'project'
        ? project.doc.script
        : project.doc.tracks.find((track) => track.id === scope)!.script;
    project.apply({ type: 'setScript', scope, script: change(text) });
    await settled();
    await audio.runNow(scope);
    await settled();
  }

  test('the footer’s tabs are source, controls, sequence, and a row’s toggle is remembered', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.deepEqual(
      findAll('[data-test-footer-tab]').map((tab) =>
        tab.getAttribute('data-test-footer-tab'),
      ),
      ['source', 'controls', 'sequence'],
    );
    assert
      .dom('[data-test-track="1"] [data-test-track-view-option="signal"]')
      .hasAria('pressed', 'true');
    assert
      .dom('[data-test-track="2"] [data-test-track-view-option="signal"]')
      .hasAria('pressed', 'false');
    assert
      .dom('[data-test-track="2"] [data-test-step]')
      .exists('steps are the default');
    await click('[data-test-track="2"] [data-test-track-view-option="signal"]');
    assert.dom('[data-test-track="2"] [data-test-pane="chain"]').exists();
    assert.dom('[data-test-track="2"] [data-test-step]').doesNotExist();
    assert.strictEqual(view.rowView('t-snare'), 'chain');
    const stored = JSON.parse(
      window.localStorage.getItem('euclip:view') ?? '{}',
    ) as { rows: Record<string, string> };
    assert.strictEqual(
      stored.rows['t-snare'],
      'chain',
      'remembered, and not an undo step',
    );
    assert.false(project.canUndo);
    await click('[data-test-track="2"] [data-test-track-view-option="seq"]');
    assert.dom('[data-test-track="2"] [data-test-step]').exists();
  });

  test('a row’s toggle is seq | signal, right after its name button, and says which is shown', async function (assert) {
    await render(<template><AppShell /></template>);
    const row = '[data-test-track="2"]';
    const name = document.querySelector(`${row} [data-test-track-name]`)!;
    const toggle = document.querySelector(`${row} [data-test-track-view]`)!;
    assert.strictEqual(
      name.nextElementSibling,
      toggle,
      'it sits after the name button',
    );
    assert.strictEqual(toggle.getAttribute('role'), 'group');
    const options = [...toggle.querySelectorAll('button')];
    assert.deepEqual(
      options.map((o) => o.textContent?.trim()),
      ['seq', 'signal'],
    );
    assert.deepEqual(
      options.map((o) => o.getAttribute('aria-label')),
      ['Show steps', 'Show signal chain'],
    );
    assert.deepEqual(
      options.map((o) => o.getAttribute('aria-pressed')),
      ['true', 'false'],
    );
    await click(options[1]!);
    assert.deepEqual(
      options.map((o) => o.getAttribute('aria-pressed')),
      ['false', 'true'],
    );
    assert
      .dom('[data-test-track="output"] [data-test-track-view]')
      .doesNotExist('the main output has none');
    assert
      .dom(`${row} [data-test-chain-hint], ${row} [data-test-chain-why]`)
      .doesNotExist('no "?" until something is chosen');
  });

  test('the default kick track is drawn: sampler, filter, level, ending at channel', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.dom(`${pane} [data-test-chain-row="chain"]`).exists({ count: 1 });
    assert.deepEqual(
      findAll(`${pane} [data-test-chain-node]`).map((node) =>
        node.getAttribute('data-type'),
      ),
      ['sampler', 'lowpass', 'gain'],
    );
    assert
      .dom(`${pane} [data-test-chain-node="filter"]`)
      .includesText('filter');
    assert.dom(`${pane} [data-test-chain-dest="channel"]`).exists();
  });

  test('a modulator is a row of its own, naming the parameter it moves', async function (assert) {
    await render(<template><AppShell /></template>);
    await setScript(KICK, (text) =>
      text.replace(
        '// Sequences',
        "__().lfo({ id: 'wobble', frequency: 2, depth: 300 }).modulate('#filter', 'frequency');\n\n// Sequences",
      ),
    );
    assert
      .dom(`${pane} [data-test-chain-row="modulator"]`)
      .exists({ count: 1 });
    assert
      .dom(`${pane} [data-test-chain-row="modulator"] [data-test-row-title]`)
      .hasText('wobble → filter.frequency');
    assert
      .dom(
        `${pane} [data-test-chain-row="modulator"] [data-test-chain-dest="filter.frequency"]`,
      )
      .exists();
    assert.dom(`${pane} [data-test-chain-row="chain"]`).exists({ count: 1 });
  });

  test('tapping the sampler chooses its track and shows its waveform in the footer, with the chain still in view', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-track="2"] [data-test-track-view-option="signal"]');
    await click('[data-test-track="2"] [data-test-chain-node="sampler"]');
    assert.dom('[data-test-track="2"]').hasAria('current', 'true');
    assert.strictEqual(view.footerPane, 'source');
    assert.dom('[data-test-pane="source"]').exists();
    assert
      .dom('[data-test-track="2"] [data-test-chain-node="sampler"]')
      .exists();
    assert
      .dom('[data-test-chain-action="open"]')
      .doesNotExist('there is no Open step');
  });

  test('tapping the filter shows its section of the controls pane, outlined', async function (assert) {
    view.footerPane = 'sequence';
    await render(<template><AppShell /></template>);
    await click(`${pane} [data-test-chain-node="filter"]`);
    assert.strictEqual(view.footerPane, 'controls');
    assert
      .dom('[data-test-control-group="filter"]')
      .hasAttribute('data-located', 'true');
    assert
      .dom('[data-test-control-group="level"]')
      .doesNotHaveAttribute('data-located');
    assert
      .dom(`${pane} [data-test-chain-node="filter"]`)
      .hasAria('pressed', 'true');
  });

  test('Escape, or a tap on empty space, chooses nothing and hides the bar', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.dom(`${pane} [data-test-chain-actions]`).doesNotExist();
    await click(`${pane} [data-test-chain-node="filter"]`);
    assert.dom(`${pane} [data-test-chain-actions]`).exists();
    await triggerKeyEvent(
      `${pane} [data-test-chain-node="filter"]`,
      'keydown',
      'Escape',
    );
    assert.dom(`${pane} [data-test-chain-actions]`).doesNotExist();
    await click(`${pane} [data-test-chain-node="filter"]`);
    await click(pane);
    assert.dom(`${pane} [data-test-chain-actions]`).doesNotExist();
  });

  test('a script error shows a strip only in the script view, and a mark on the Script button otherwise', async function (assert) {
    await render(<template><AppShell /></template>);
    await setScript(KICK, (text) => `${text}\nthrow new Error('nope');\n`);
    assert
      .dom('[data-test-script-error]')
      .doesNotExist('no strip while the script is closed');
    assert.dom('[data-test-script-alert]').exists();
    assert
      .dom('[data-test-script-toggle]')
      .hasAria('label', 'Track 1 script: Script has an error');
    await click('[data-test-script-toggle]');
    assert.dom('[data-test-script-error]').exists();
  });

  test('the main output shows its buses with their inserts and where they go', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-track="output"] [data-test-track-select]');
    assert.dom(master).exists();
    assert
      .dom('[data-test-chain-row="bus"] [data-test-chain-node="glue"]')
      .exists();
    assert
      .dom('[data-test-chain-row="bus"] [data-test-chain-dest="dac"]')
      .exists();
  });

  module('editing', function () {
    const kickScript = (): string => project.doc.tracks[0]!.script;
    const nodes = (): string[] =>
      findAll(
        `${pane} [data-test-chain-row="chain"] [data-test-chain-node]`,
      ).map((node) => node.getAttribute('data-test-chain-node') ?? '');

    test('adding a lowpass after the sampler writes it, shows it and gives it controls; one undo restores the script', async function (assert) {
      await render(<template><AppShell /></template>);
      const before = kickScript();
      await click(`${pane} [data-test-chain-node="sampler"]`);
      await click('[data-test-chain-action="add-after"]');
      assert.dom('[data-test-chain-picker]').exists();
      assert.dom('[data-test-chain-group="Filters"]').exists();
      await fillIn('[data-test-chain-picker-search]', 'lowpass');
      assert.dom('[data-test-chain-type="lowpass"]').exists({ count: 1 });
      assert.dom('[data-test-chain-group="Filters"]').exists();
      await click('[data-test-chain-type="lowpass"]');

      assert.true(
        kickScript().includes(
          "  .sampler({ id: 'sampler' })\n  .lowpass({ id: 'lowpass' })\n  .lowpass({ id: 'filter'",
        ),
      );
      assert.true(
        kickScript().endsWith("waveform('#sampler');\ncontrols('#lowpass');\n"),
      );
      assert.deepEqual(nodes(), ['sampler', 'lowpass', 'filter', 'level']);
      assert.dom('[data-test-chain-node="lowpass"]').hasAria('pressed', 'true');
      assert.dom('[data-test-script-error]').doesNotExist();

      await click('[data-test-chain-node="lowpass"]');
      assert.dom('[data-test-control-group="lowpass"]').exists('its controls');

      project.undo();
      await settled();
      assert.strictEqual(kickScript(), before, 'one undo restores it exactly');
      assert.deepEqual(nodes(), ['sampler', 'filter', 'level']);
    });

    test('move and remove', async function (assert) {
      await render(<template><AppShell /></template>);
      await click(`${pane} [data-test-chain-node="filter"]`);
      await click('[data-test-chain-action="move-right"]');

      assert.deepEqual(nodes(), ['sampler', 'level', 'filter']);
      assert.dom('[data-test-chain-action="move-right"]').isDisabled();
      assert.true((await why()).includes('last node'));

      await click('[data-test-chain-action="remove"]');

      assert.deepEqual(nodes(), ['sampler', 'level']);
      assert.false(
        kickScript().includes("slider('#filter'"),
        'its controls go',
      );
    });

    test('removing the source asks first, and takes the whole chain', async function (assert) {
      await render(<template><AppShell /></template>);
      const before = kickScript();
      await click(`${pane} [data-test-chain-node="sampler"]`);
      await click('[data-test-chain-action="remove"]');
      assert.dom('[data-test-chain-confirm]').includesText('whole chain');
      assert.strictEqual(kickScript(), before, 'nothing yet');
      await click('[data-test-chain-confirm-cancel]');
      assert.dom('[data-test-chain-confirm]').doesNotExist();
      await click('[data-test-chain-action="remove"]');
      await click('[data-test-chain-confirm-remove]');

      assert.dom(`${pane} [data-test-chain-node]`).doesNotExist();
      project.undo();
      await settled();
      assert.strictEqual(kickScript(), before);
    });

    test('a node made by code Euclip cannot edit is marked, and its actions are off with the reason', async function (assert) {
      await render(<template><AppShell /></template>);
      await setScript(KICK, (text) =>
        text.replace(
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n",
          "  .lowpass({ id: 'f' + 1, frequency: 2000, q: 2 })\n",
        ),
      );
      assert
        .dom('[data-test-chain-node="f1"]')
        .hasAttribute('data-readonly', 'true');
      assert.dom('[data-test-chain-node="f1"]').includesText('edit in script');
      await click('[data-test-chain-node="f1"]');
      assert.dom('[data-test-chain-action="remove"]').isDisabled();
      assert.dom('[data-test-chain-action="add-after"]').isDisabled();
      assert.true((await why()).includes('cannot edit'));
      // the other nodes are still fine
      assert
        .dom('[data-test-chain-node="level"]')
        .doesNotHaveAttribute('data-readonly');
    });

    test('a script that fails to build keeps the old graph, and says so', async function (assert) {
      await render(<template><AppShell /></template>);
      await setScript(KICK, (text) => `${text}\nthrow new Error('nope');\n`);
      assert.dom('[data-test-chain-error]').exists();
      assert.deepEqual(
        nodes(),
        ['sampler', 'filter', 'level'],
        'the picture is the running version',
      );
      await click(`${pane} [data-test-chain-node="filter"]`);
      assert.dom('[data-test-chain-action="remove"]').isDisabled();
      assert.true((await why()).includes('has an error'));
    });

    test('the main output’s inserts can be added to like a chain’s', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-track="output"] [data-test-track-select]');
      await click(
        '[data-test-track="output"] [data-test-pane="chain"] [data-test-chain-node="glue"]',
      );
      await click('[data-test-chain-action="add-after"]');
      await click('[data-test-chain-type="delay"]');

      assert.true(
        project.doc.script.includes(
          ".compressor({ id: 'glue', threshold: -18, ratio: 3 })\n  .delay({ id: 'delay' });",
        ),
      );
      assert.deepEqual(
        findAll('[data-test-chain-row="bus"] [data-test-chain-node]').map((n) =>
          n.getAttribute('data-test-chain-node'),
        ),
        ['glue', 'delay'],
      );
    });
  });

  module('destinations', function () {
    const kickScript = (): string => project.doc.tracks[0]!.script;

    test('Send to… rewrites .to(), listing channel, main and the project’s buses', async function (assert) {
      await render(<template><AppShell /></template>);
      const before = kickScript();
      await click(`${pane} [data-test-chain-dest="channel"]`);
      assert
        .dom('[data-test-chain-send-to="channel"]')
        .hasAria('pressed', 'true');
      assert.dom('[data-test-chain-send-to="main"]').exists();
      assert.dom('[data-test-chain-send-new]').exists();
      await click('[data-test-chain-send-to="main"]');
      assert.true(kickScript().includes(".to('main');"));
      assert.dom(`${pane} [data-test-chain-dest="main"]`).exists();
      assert.dom('[data-test-script-error]').doesNotExist();
      project.undo();
      await settled();
      assert.strictEqual(kickScript(), before);
    });

    test('a new bus is made in the project script, the track is sent to it, and one undo takes back both', async function (assert) {
      await render(<template><AppShell /></template>);
      const trackBefore = kickScript();
      const projectBefore = project.doc.script;
      await click(`${pane} [data-test-chain-dest="channel"]`);
      await click('[data-test-chain-send-new]');
      await fillIn('[data-test-chain-new-bus]', 'not valid!');
      assert
        .dom('[data-test-chain-new-bus-problem]')
        .includesText('starts with a letter');
      assert.dom('[data-test-chain-new-bus-create]').isDisabled();
      await fillIn('[data-test-chain-new-bus]', 'drums');
      await click('[data-test-chain-new-bus-create]');

      assert.true(project.doc.script.includes("__.bus('drums');"));
      assert.true(kickScript().includes(".to('drums');"));
      assert
        .dom('[data-test-script-error]')
        .doesNotExist('the library made the bus where it was asked to');
      assert.dom(`${pane} [data-test-chain-dest="drums"]`).exists();

      project.undo();
      await settled();
      assert.strictEqual(kickScript(), trackBefore);
      assert.strictEqual(project.doc.script, projectBefore);
    });

    test('a bus’s own destination is changed where the script has a .to() on it', async function (assert) {
      await render(<template><AppShell /></template>);
      await setScript(
        'project',
        (text) =>
          `${text}\n__.bus('drums')\n  .compressor({ id: 'squash' })\n  .to('main');\n`,
      );
      await click('[data-test-track="output"] [data-test-track-select]');
      const drums = '[data-test-chain-row="bus"][data-test-chain-row] ';
      assert.dom(drums).exists();
      // main's own chip is the speakers: nothing to change
      await click(
        '[data-test-track="output"] [data-test-pane="chain"] [data-test-chain-dest="dac"]',
      );
      assert.dom('[data-test-chain-send]').doesNotExist('nothing to send');
      assert.true((await why()).includes('speakers'));
      // drums goes to main by its own .to('main')
      const dests = findAll(
        '[data-test-track="output"] [data-test-pane="chain"] [data-test-chain-dest="main"]',
      );
      assert.strictEqual(dests.length, 1);
      await click(dests[0]!);
      assert
        .dom('[data-test-chain-send-to="channel"]')
        .doesNotExist('the main output has no strip');
      await click('[data-test-chain-new-bus]'.replace('new-bus', 'send-new'));
      await fillIn('[data-test-chain-new-bus]', 'fx');
      await click('[data-test-chain-new-bus-create]');

      assert.true(project.doc.script.includes(".to('fx');"));
      assert.true(
        project.doc.script.includes("__.bus('fx');\n__.bus('drums')"),
      );
      assert.dom('[data-test-script-error]').doesNotExist();
    });
  });

  module('modulators', function () {
    const kickScript = (): string => project.doc.tracks[0]!.script;
    const modulated = (): boolean =>
      [
        ...audio.engine!.scope(KICK).scope('script').snapshot().graph.edges,
      ].some((edge) => 'param' in edge.to && edge.to.param === 'frequency');

    test('adding an lfo on the filter’s frequency writes the line and its controls, and the library shows the edge', async function (assert) {
      await render(<template><AppShell /></template>);
      const before = kickScript();
      await click(`${pane} [data-test-chain-node="filter"]`);
      await click('[data-test-chain-action="modulate"]');
      assert.dom('[data-test-chain-param="frequency"]').exists();
      assert.dom('[data-test-chain-param="q"]').exists();
      await click('[data-test-chain-param="frequency"]');
      await click('[data-test-chain-modulator="lfo"]');

      assert.true(
        kickScript().includes(
          "__().lfo({ id: 'lfo', frequency: 2, depth: 1000 }).modulate('#filter', 'frequency');",
        ),
        kickScript(),
      );
      assert.true(
        kickScript().endsWith("waveform('#sampler');\ncontrols('#lfo');\n"),
      );
      assert.true(modulated(), 'a modulation edge is in the snapshot');
      assert
        .dom(`${pane} [data-test-chain-row="modulator"] [data-test-row-title]`)
        .hasText('lfo → filter.frequency');
      assert.dom('[data-test-script-error]').doesNotExist();

      project.undo();
      await settled();
      assert.strictEqual(kickScript(), before);
      assert.false(modulated());
    });

    test('a modulator’s box offers Remove, and its destination box opens the retarget list', async function (assert) {
      await render(<template><AppShell /></template>);
      await click(`${pane} [data-test-chain-node="filter"]`);
      await click('[data-test-chain-action="modulate"]');
      await click('[data-test-chain-modulator="lfo"]');

      const withLfo = kickScript();
      assert
        .dom('[data-test-chain-chosen]')
        .includesText('lfo', 'the new modulator is chosen');
      assert.dom('[data-test-chain-action="retarget"]').doesNotExist();
      assert.dom('[data-test-chain-action="add-after"]').doesNotExist();
      await click(
        `${pane} [data-test-chain-row="modulator"] [data-test-chain-dest="filter.frequency"]`,
      );
      assert.dom('[data-test-chain-retarget]').exists();
      await click('[data-test-chain-target="level.gain"]');

      assert.true(kickScript().includes(".modulate('#level', 'gain');"));
      assert
        .dom(`${pane} [data-test-chain-row="modulator"] [data-test-row-title]`)
        .hasText('lfo → level.gain');

      await click('[data-test-chain-action="remove-modulator"]');

      assert.dom(`${pane} [data-test-chain-row="modulator"]`).doesNotExist();
      assert.false(kickScript().includes('lfo'));
      assert.false(kickScript().includes('controls('));

      project.undo();
      await settled();
      assert.true(kickScript().includes(".modulate('#level', 'gain');"));
      project.undo();
      await settled();
      assert.strictEqual(kickScript(), withLfo, 'each action was one step');
    });

    test('only the parameters the library can modulate are offered', async function (assert) {
      await render(<template><AppShell /></template>);
      await click(`${pane} [data-test-chain-node="sampler"]`);
      await click('[data-test-chain-action="modulate"]');
      assert.dom('[data-test-chain-param="gain"]').exists();
      assert
        .dom('[data-test-chain-param="speed"]')
        .doesNotExist('it is not an audio-rate parameter');
    });
  });
});
