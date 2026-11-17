import { module, test } from 'qunit';
import { click, fillIn, findAll, render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

const KICK = 't-kick';
const pane = '[data-test-pane="chain"]';

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
    view.footerPane = 'chain';
  });

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

  test('the tabs are signal chain, source, controls, sequence', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.deepEqual(
      findAll('[data-test-footer-tab]').map((tab) =>
        tab.getAttribute('data-test-footer-tab'),
      ),
      ['chain', 'source', 'controls', 'sequence'],
    );
    assert.dom('[data-test-footer-tab="chain"]').hasAria('pressed', 'true');
    assert.dom('[data-test-footer-tab="chain"]').includesText('signal chain');
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
      .dom(`${pane} [data-test-chain-row="modulator"] [data-test-chain-title]`)
      .hasText('wobble → filter.frequency');
    assert
      .dom(
        `${pane} [data-test-chain-row="modulator"] [data-test-chain-dest="filter.frequency"]`,
      )
      .exists();
    assert.dom(`${pane} [data-test-chain-row="chain"]`).exists({ count: 1 });
  });

  test('choosing the sampler opens the source pane on its waveform', async function (assert) {
    await render(<template><AppShell /></template>);
    await click(`${pane} [data-test-chain-node="sampler"]`);
    assert.strictEqual(view.footerPane, 'chain', 'the first tap chooses it');
    assert.dom('[data-test-chain-action="open"]').exists();
    await click('[data-test-chain-action="open"]');
    assert.strictEqual(view.footerPane, 'source');
    assert.dom('[data-test-pane="source"]').exists();
  });

  test('choosing the filter opens its section of the controls pane, outlined', async function (assert) {
    await render(<template><AppShell /></template>);
    await click(`${pane} [data-test-chain-node="filter"]`);
    await click(`${pane} [data-test-chain-node="filter"]`); // (the second tap is the shortcut)
    assert.strictEqual(view.footerPane, 'controls');
    assert
      .dom('[data-test-control-group="filter"]')
      .hasAttribute('data-located', 'true');
    assert
      .dom('[data-test-control-group="level"]')
      .doesNotHaveAttribute('data-located');
  });

  test('the main output shows its buses with their inserts and where they go', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-track="output"] [data-test-track-select]');
    assert.dom('[data-test-pane="master-chain"]').exists();
    assert
      .dom('[data-test-chain-row="bus"] [data-test-chain-node="glue"]')
      .exists();
    assert
      .dom('[data-test-chain-row="bus"] [data-test-chain-dest="speakers"]')
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

      await click('[data-test-chain-action="open"]');
      assert.dom('[data-test-control-group="lowpass"]').exists('its controls');

      project.undo();
      await settled();
      assert.strictEqual(kickScript(), before, 'one undo restores it exactly');
      view.footerPane = 'chain';
      await settled();
      assert.deepEqual(nodes(), ['sampler', 'filter', 'level']);
    });

    test('move and remove', async function (assert) {
      await render(<template><AppShell /></template>);
      await click(`${pane} [data-test-chain-node="filter"]`);
      await click('[data-test-chain-action="move-right"]');

      assert.deepEqual(nodes(), ['sampler', 'level', 'filter']);
      assert.dom('[data-test-chain-action="move-right"]').isDisabled();
      assert.dom('[data-test-chain-why]').includesText('last node');

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
      assert.dom('[data-test-chain-why]').includesText('cannot edit');
      assert.dom('[data-test-chain-action="open"]').isNotDisabled();
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
      assert.dom('[data-test-chain-why]').includesText('has an error');
    });

    test('the main output’s inserts can be added to like a chain’s', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-track="output"] [data-test-track-select]');
      await click(
        '[data-test-pane="master-chain"] [data-test-chain-node="glue"]',
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
      assert.dom('[data-test-chain-action="send"]').isNotDisabled();
      await click('[data-test-chain-action="send"]');
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
      await click('[data-test-chain-action="send"]');
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
        '[data-test-pane="master-chain"] [data-test-chain-dest="speakers"]',
      );
      assert.dom('[data-test-chain-action="send"]').isDisabled();
      assert.dom('[data-test-chain-why]').includesText('speakers');
      // drums goes to main by its own .to('main')
      const dests = findAll(
        '[data-test-pane="master-chain"] [data-test-chain-dest="main"]',
      );
      assert.strictEqual(dests.length, 1);
      await click(dests[0]!);
      await click('[data-test-chain-action="send"]');
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
        .dom(
          `${pane} [data-test-chain-row="modulator"] [data-test-chain-title]`,
        )
        .hasText('lfo → filter.frequency');
      assert.dom('[data-test-script-error]').doesNotExist();

      project.undo();
      await settled();
      assert.strictEqual(kickScript(), before);
      assert.false(modulated());
    });

    test('a modulator’s box offers Open, Retarget and Remove', async function (assert) {
      await render(<template><AppShell /></template>);
      await click(`${pane} [data-test-chain-node="filter"]`);
      await click('[data-test-chain-action="modulate"]');
      await click('[data-test-chain-modulator="lfo"]');

      const withLfo = kickScript();
      assert
        .dom('[data-test-chain-chosen]')
        .includesText('lfo', 'the new modulator is chosen');
      assert.dom('[data-test-chain-action="retarget"]').isNotDisabled();
      assert.dom('[data-test-chain-action="add-after"]').doesNotExist();
      await click('[data-test-chain-action="retarget"]');
      await click('[data-test-chain-target="level.gain"]');

      assert.true(kickScript().includes(".modulate('#level', 'gain');"));
      assert
        .dom(
          `${pane} [data-test-chain-row="modulator"] [data-test-chain-title]`,
        )
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
