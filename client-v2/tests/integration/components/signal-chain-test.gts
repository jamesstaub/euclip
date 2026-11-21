import { module, test } from 'qunit';
import {
  click,
  find,
  fillIn,
  findAll,
  render,
  settled,
  triggerKeyEvent,
  waitUntil,
} from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { PROJECT_SCOPE } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';
import type ChainMetersService from 'client-v2/services/chain-meters';

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
    view.setRowsView('chain');
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

  test('the footer’s tabs are source, controls, sequence', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.deepEqual(
      findAll('[data-test-footer-tab]').map((tab) =>
        tab.getAttribute('data-test-footer-tab'),
      ),
      ['source', 'controls', 'sequence'],
    );
  });

  test('the project bar has one Seq / Signal toggle for every row, and no title', async function (assert) {
    view.setRowsView('steps');
    await render(<template><AppShell /></template>);
    const bar = '[data-test-app-header] .project-bar';
    assert
      .dom('.project-bar__title')
      .doesNotExist('the title is not in the bar');
    assert.dom(`${bar} [data-test-project-title]`).hasClass('sr-only');
    assert.dom('[data-test-track-view]').doesNotExist('no toggle on a row');
    const options = [
      ...document.querySelectorAll(`${bar} [data-test-rows-view] button`),
    ];
    assert.deepEqual(
      options.map((o) => o.textContent?.trim()),
      ['Seq', 'Signal'],
    );
    assert.deepEqual(
      options.map((o) => o.getAttribute('aria-label')),
      ['Show steps', 'Show signal chains'],
    );
    assert.deepEqual(
      options.map((o) => o.getAttribute('aria-pressed')),
      ['true', 'false'],
    );
    assert
      .dom('[data-test-track="2"] [data-test-step]')
      .exists('steps are the default');
    assert.dom('[data-test-track="1"] [data-test-pane="chain"]').doesNotExist();
    assert
      .dom('[data-test-track="output"] [data-test-pane="chain"]')
      .doesNotExist('nor the main output’s buses, in Seq');

    await click(options[1]!);
    assert.deepEqual(
      options.map((o) => o.getAttribute('aria-pressed')),
      ['false', 'true'],
    );
    for (const row of ['1', '2', '3']) {
      assert
        .dom(`[data-test-track="${row}"] [data-test-pane="chain"]`)
        .exists(`track ${row}`);
      assert.dom(`[data-test-track="${row}"] [data-test-step]`).doesNotExist();
    }
    assert
      .dom('[data-test-track="output"] [data-test-pane="chain"]')
      .exists('the main output too');
    const stored = JSON.parse(
      window.localStorage.getItem('euclip:view') ?? '{}',
    ) as { rowsView?: string };
    assert.strictEqual(
      stored.rowsView,
      undefined,
      'not remembered: it opens on Seq',
    );
    assert.false(project.canUndo, 'not an undo step');
    await click(options[0]!);
    assert.dom('[data-test-track="3"] [data-test-step]').exists();
  });

  test('the transport is centred in the project bar', async function (assert) {
    await render(<template><AppShell /></template>);
    const bar = document
      .querySelector('[data-test-app-header] .project-bar')!
      .getBoundingClientRect();
    const transport = document
      .querySelector('[data-test-app-header] [data-test-transport]')!
      .getBoundingClientRect();
    assert.true(
      Math.abs(
        bar.left + bar.width / 2 - (transport.left + transport.width / 2),
      ) <= 1,
    );
  });

  module('meters', function (meterHooks) {
    let meters: ChainMetersService;
    meterHooks.beforeEach(function () {
      meters = this.owner.lookup('service:chain-meters');
      meters.forceRunning = true;
      meters.reducedMotion = false;
    });

    /** The pictures are watched for being on screen, which is told a moment after they are drawn. */
    async function seen(count: number): Promise<void> {
      await waitUntil(() => audio.ready && meters.visibleCount >= count, {
        timeout: 3000,
      });
    }

    test('taps are made only for pictures on screen, and go with them', async function (assert) {
      view.setRowsView('steps');
      await render(<template><AppShell /></template>);
      await seen(1);
      meters.step(0.02);
      assert.strictEqual(
        meters.visibleCount,
        1,
        'no row shows a chain in Seq, the main output included: only the channel strip’s meter',
      );
      assert.strictEqual(meters.tapCount, 1);

      view.setRowsView('chain');
      await seen(4);
      meters.step(0.02);
      assert.strictEqual(
        meters.tapCount,
        11,
        'three tracks of three nodes, the insert, and the channel strip',
      );

      view.setRowsView('steps');
      await settled();
      meters.step(2);
      meters.step(0.02);
      assert.strictEqual(
        meters.tapCount,
        1,
        'the rows that went take their taps (the strip’s stays)',
      );
    });

    test('a rebuilt script leaves no tap on a dead node', async function (assert) {
      await render(<template><AppShell /></template>);
      await seen(4);
      meters.step(0.02);
      assert.strictEqual(meters.tapCount, 11);
      await setScript(KICK, (text) =>
        text.replace(
          "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n",
          '',
        ),
      );
      await seen(4);
      meters.step(0.02);
      meters.step(2);
      meters.step(0.02);
      assert.strictEqual(meters.tapCount, 10, 'one node fewer');
    });

    test('the channel strip meters what leaves its track, after the fader, and follows the selected track', async function (assert) {
      view.setRowsView('steps');
      view.footerOpen = true;
      await render(<template><AppShell /></template>);
      await seen(1);
      meters.step(0.02);
      assert.dom('[data-test-strip-meter]').exists();
      assert.strictEqual(meters.tapCount, 1, 'one tap: the strip’s output');
      assert.notStrictEqual(audio.channelOutput('t-kick'), null);
      assert.strictEqual(
        (find('[data-test-strip-meter]') as HTMLElement).style.getPropertyValue(
          '--level',
        ),
        '0',
        'silent: nothing is playing',
      );
      await click('[data-test-track="2"] [data-test-track-select]');
      await seen(1);
      meters.step(2);
      meters.step(0.02);
      assert.strictEqual(
        meters.tapCount,
        1,
        'still one, now the other track’s',
      );
      assert.strictEqual(audio.channelOutput(PROJECT_SCOPE), null);
    });

    test('with reduced motion nothing flows', async function (assert) {
      meters.reducedMotion = true;
      await render(<template><AppShell /></template>);
      await seen(4);
      meters.step(0.3);
      assert.dom('[data-live="true"]').doesNotExist();
    });
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

  test('the selected track’s toolbar is always there, in the same place; others have none', async function (assert) {
    await render(<template><AppShell /></template>);
    const bar = `${pane} [data-test-chain-actions]`;
    assert.dom(bar).exists('the selected row, nothing chosen');
    assert.dom(bar).includesText('nothing chosen');
    assert
      .dom('[data-test-track="2"] [data-test-chain-actions]')
      .doesNotExist();
    assert
      .dom('[data-test-track="output"] [data-test-chain-actions]')
      .doesNotExist();
    const row = document.querySelector('[data-test-track="1"]')!;
    const height = row.getBoundingClientRect().height;
    const top =
      document.querySelector(`${bar}`)!.getBoundingClientRect().top -
      row.getBoundingClientRect().top;
    await click(`${pane} [data-test-chain-node="filter"]`);
    assert.dom(bar).includesText('lowpass · filter');
    assert.strictEqual(
      row.getBoundingClientRect().height,
      height,
      'the row is as tall with a choice',
    );
    assert.strictEqual(
      document.querySelector(bar)!.getBoundingClientRect().top -
        row.getBoundingClientRect().top,
      top,
      'and the toolbar has not moved',
    );
    await triggerKeyEvent(
      `${pane} [data-test-chain-node="filter"]`,
      'keydown',
      'Escape',
    );
    assert.dom(bar).exists('Escape clears the choice, not the toolbar');
    assert.dom(bar).includesText('nothing chosen');
    await click(`${pane} [data-test-chain-node="filter"]`);
    await click(pane);
    assert.dom(bar).includesText('nothing chosen');
    assert.strictEqual(row.getBoundingClientRect().height, height);
    await click('[data-test-track="2"] [data-test-chain-node="sampler"]');
    assert.dom(bar).doesNotExist('another track is selected now');
    assert.dom('[data-test-track="2"] [data-test-chain-actions]').exists();
  });

  test('the tab is called processors', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.dom('[data-test-footer-tab="controls"]').includesText('processors');
    assert
      .dom('[data-test-pane="controls"] .pane-heading')
      .includesText('Processors');
  });

  test('every action is an icon with a name, a tooltip on focus, and a label under it on touch', async function (assert) {
    await render(<template><AppShell /></template>);
    const tools = [
      ...document.querySelectorAll<HTMLButtonElement>(`${pane} .chain-tool`),
    ];
    assert.true(tools.length >= 9);
    assert.true(
      tools.every(
        (tool) =>
          (tool.getAttribute('aria-label') ?? '') !== '' &&
          tool.querySelector('svg'),
      ),
      'icon and name',
    );
    const first = tools.find((tool) => !tool.disabled)!;
    first.focus();
    await settled();
    assert.strictEqual(
      getComputedStyle(first, '::after').content,
      `"${first.getAttribute('data-label')}"`,
      'the tooltip shows on focus',
    );
    assert.true(
      tools.every((tool) => tool.querySelector('.chain-tool__label')),
      'the words are there for touch screens, shown where there is no hover',
    );
    assert
      .dom(`${pane} .chain-tool[data-test-chain-action="add-chain"]`)
      .isNotDisabled('chain-level action with nothing chosen');
    assert
      .dom(`${pane} .chain-tool[data-test-chain-action="modulate"]`)
      .isDisabled('needs a node');
  });

  test('a connection can be chosen, and Insert node here adds between the right two', async function (assert) {
    await render(<template><AppShell /></template>);
    const link = `${pane} [data-test-chain-link="row-0:1"]`;
    assert.dom(link).hasAria('label', 'Connection from filter to level');
    await click(link);
    assert.dom(link).hasAria('pressed', 'true');
    assert
      .dom(`${pane} [data-test-chain-actions]`)
      .includesText('filter → level');
    await click('[data-test-chain-action="insert"]');
    await click('[data-test-chain-type="delay"]');

    assert.true(
      project.doc.tracks[0]!.script.includes(
        "  .lowpass({ id: 'filter', frequency: 2000, q: 2 })\n  .delay({ id: 'delay' })\n  .gain({ id: 'level'",
      ),
    );
    assert.deepEqual(
      findAll(
        `${pane} [data-test-chain-row="chain"] [data-test-chain-node]`,
      ).map((n) => n.getAttribute('data-test-chain-node')),
      ['sampler', 'filter', 'delay', 'level'],
    );
  });

  test('the link into the destination reroutes by Send to…; a link between nodes branches without losing anything', async function (assert) {
    await render(<template><AppShell /></template>);
    await click(`${pane} [data-test-chain-link="row-0:2"]`);
    await click('[data-test-chain-action="route"]');
    assert.dom('[data-test-chain-send-to="main"]').exists();
    await click('[data-test-chain-send-close]');

    const before = project.doc.tracks[0]!.script;
    await click(`${pane} [data-test-chain-link="row-0:1"]`);
    assert
      .dom('[data-test-chain-action="route"]')
      .isDisabled('a link between nodes is not where a chain ends');
    await click('[data-test-chain-action="branch"]');
    assert.dom('[data-test-chain-send]').includesText('Branch to');
    await click('[data-test-chain-send-to="main"]');

    const after = project.doc.tracks[0]!.script;
    assert.true(after.includes("__('#filter').to('main');"));
    assert.true(
      after.includes(".gain({ id: 'level', gain: 0.9 })\n  .to('channel');"),
      'the chain is as it was',
    );
    assert.dom('[data-test-script-error]').doesNotExist();
    assert.strictEqual(
      findAll(`${pane} [data-test-chain-row="chain"]`).length,
      2,
      'the library draws the split: a second row from the filter',
    );
    project.undo();
    await settled();
    assert.strictEqual(project.doc.tracks[0]!.script, before);
  });

  test('Insert node here on a branch writes into the branch; the main chain statement is untouched', async function (assert) {
    await render(<template><AppShell /></template>);
    const kick = (): string => project.doc.tracks[0]!.script;
    const original = kick();
    const mainChain = (text: string): string =>
      text.slice(text.indexOf('__()'), text.indexOf(".to('channel');"));

    // a branch from the sampler to main, as the owner made it
    await click(`${pane} [data-test-chain-link="row-0:0"]`);
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-to="main"]');
    const branched = kick();
    assert.true(
      branched.includes("__('#sampler').to('main');"),
      'a: ' + branched,
    );
    assert.strictEqual(
      findAll(`${pane} [data-test-chain-row="chain"]`).length,
      2,
    );
    assert
      .dom(
        `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-node="sampler"]`,
      )
      .hasAttribute(
        'data-ref',
        'true',
        'the branch row says its start is the main chain’s',
      )
      .includesText('main chain');

    // the sampler drawn on the branch row: its remove is the branch's, and it cannot move
    const branchSampler = `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-node="sampler"]`;
    await click(branchSampler);
    assert.dom('[data-test-chain-action="move-right"]').isDisabled();
    assert.dom('[data-test-chain-action="add-before"]').isDisabled();
    assert.dom('[data-test-chain-action="remove-branch"]').isNotDisabled();
    assert.dom('[data-test-chain-action="add-after"]').isNotDisabled();

    // the link from the branch's start to where it goes
    await click(`${pane} [data-test-chain-link="row-1:0"]`);
    assert
      .dom(`${pane} [data-test-chain-link="row-1:0"]`)
      .hasAria('label', 'Connection from sampler to main');
    await click('[data-test-chain-action="insert"]');
    await click('[data-test-chain-type="delay"]');

    const after = kick();
    assert.strictEqual(
      mainChain(after),
      mainChain(original),
      'the main chain statement is as it was',
    );
    assert.true(
      after.includes(
        "__('#sampler')\n  .chain()\n  .delay({ id: 'delay' })\n  .to('main');",
      ),
      after,
    );
    assert.true(after.includes("controls('#delay');"));
    assert.dom('[data-test-script-error]').doesNotExist();
    assert.deepEqual(
      findAll(
        `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-node]`,
      ).map((n) => n.getAttribute('data-test-chain-node')),
      ['sampler', 'delay'],
    );

    // Send to on the branch's chip, and Remove on the node it made, change that statement only
    await click(
      `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-dest="main"]`,
    );
    await click('[data-test-chain-send-to="channel"]');
    assert.true(
      kick().includes(".delay({ id: 'delay' })\n  .to('channel');"),
      'b: ' + kick(),
    );
    assert.strictEqual(mainChain(kick()), mainChain(original));
    await click(
      `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-node="delay"]`,
    );
    await click('[data-test-chain-action="remove"]');
    assert.strictEqual(kick(), branched.replace("to('main')", "to('channel')"));

    // Remove branch (from its start), confirmed, takes the statement; undo gives it back
    await click(branchSampler);
    await click('[data-test-chain-action="remove-branch"]');
    assert.dom('[data-test-chain-confirm]').exists();
    await click('[data-test-chain-confirm-remove]');
    assert.strictEqual(kick(), original);
    assert.strictEqual(
      findAll(`${pane} [data-test-chain-row="chain"]`).length,
      1,
    );

    // one undo each step back to the branch, and back to the script before it
    project.undo();
    await settled();
    assert.true(
      kick().includes("__('#sampler').to('channel');"),
      'c: ' + kick(),
    );
    while (kick() !== original && project.canUndo) {
      project.undo();
      await settled();
    }
    assert.strictEqual(kick(), original, 'undo restores the script exactly');
  });

  test('removing a main node that a branch starts from takes the branch with it, after a confirm', async function (assert) {
    await render(<template><AppShell /></template>);
    await click(`${pane} [data-test-chain-link="row-0:1"]`);
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-to="main"]');
    assert.true(project.doc.tracks[0]!.script.includes("__('#filter')"));
    await click(
      `${pane} [data-test-chain-row="chain"]:not([data-branch]) [data-test-chain-node="filter"]`,
    );
    await click('[data-test-chain-action="remove"]');
    assert
      .dom('[data-test-chain-confirm]')
      .includesText('The branch that starts from it goes too.');
    await click('[data-test-chain-confirm-remove]');
    assert.false(project.doc.tracks[0]!.script.includes("__('#filter')"));
    assert.dom('[data-test-script-error]').doesNotExist();
  });

  test('the last connection offers Send to… (move the end) and Branch to… (add an output), and neither fails silently', async function (assert) {
    await render(<template><AppShell /></template>);
    const kick = (): string => project.doc.tracks[0]!.script;
    const original = kick();
    const last = `${pane} [data-test-chain-link="row-0:2"]`;
    const status = (): string =>
      document.querySelector('[data-test-chain-status]')?.textContent?.trim() ??
      '';

    await click(last);
    assert.dom(last).hasAria('label', 'Connection from level to channel');
    assert
      .dom('[data-test-chain-action="route"]')
      .hasAria('label', 'Send to…')
      .isNotDisabled();
    assert
      .dom('[data-test-chain-action="branch"]')
      .hasAria('label', 'Branch to…')
      .isNotDisabled();

    // to the bus it already goes to: nothing changes, it says so, and there is no undo step to take
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-to="channel"]');
    assert.strictEqual(status(), 'level already goes to channel.');
    assert.strictEqual(kick(), original);
    assert.false(project.canUndo, 'no undo step was made');
    await click('[data-test-chain-action="route"]');
    await click('[data-test-chain-send-to="channel"]');
    assert.strictEqual(status(), 'level already goes to channel.');
    assert.strictEqual(kick(), original);

    // to another bus: a second statement, the chain's own .to() alone, a second row
    await click(last);
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-to="main"]');
    const branched = kick();
    assert.strictEqual(
      branched.replace("__('#level').to('main');\n", ''),
      original,
      'the only change is the new statement',
    );
    assert.true(branched.includes(".to('channel');\n__('#level').to('main');"));
    assert.strictEqual(status(), '');
    const rows = findAll(`${pane} [data-test-chain-row="chain"]`);
    assert.strictEqual(rows.length, 2, 'a second row');
    assert
      .dom(
        `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-node="level"]`,
      )
      .hasAttribute('data-ref', 'true');

    // the same again is a no-op; a branch from the branch's own last link works and is editable
    await click(last);
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-to="main"]');
    assert.strictEqual(status(), 'level already goes to main.');
    assert.strictEqual(kick(), branched);
    await click(`${pane} [data-test-chain-link="row-1:2"]`);
    await click('[data-test-chain-action="insert"]');
    await click('[data-test-chain-type="delay"]');
    assert.true(
      kick().includes(
        "__('#level')\n  .chain()\n  .delay({ id: 'delay' })\n  .to('main');",
      ),
      kick(),
    );
    assert.true(
      kick().includes(".gain({ id: 'level', gain: 0.9 })\n  .to('channel');"),
    );
    await click(
      `${pane} [data-test-chain-row="chain"][data-branch="true"] [data-test-chain-link="row-1:3"]`,
    );
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-to="channel"]');
    assert.true(kick().includes("__('#delay').to('channel');"), kick());

    // a new bus
    await click(last);
    await click('[data-test-chain-action="branch"]');
    await click('[data-test-chain-send-new]');
    await fillIn('[data-test-chain-new-bus]', 'fx');
    await click('[data-test-chain-new-bus-create]');
    assert.true(kick().includes("__('#level').to('fx');"), kick());
    assert.true(project.doc.script.includes("__.bus('fx')"));
    assert.dom('[data-test-script-error]').doesNotExist();

    while (kick() !== original && project.canUndo) {
      project.undo();
      await settled();
    }
    assert.strictEqual(kick(), original, 'undo restores the script exactly');
  });

  test('a modulation link offers Retarget and Remove modulator', async function (assert) {
    await render(<template><AppShell /></template>);
    await click(`${pane} [data-test-chain-node="filter"]`);
    await click('[data-test-chain-action="modulate"]');
    await click('[data-test-chain-modulator="lfo"]');

    await click(
      `${pane} [data-test-chain-row="modulator"] [data-test-chain-link]`,
    );
    assert.dom('[data-test-chain-action="route"]').hasAria('label', 'Retarget');
    assert.dom('[data-test-chain-action="remove-modulator"]').isNotDisabled();
    await click('[data-test-chain-action="route"]');
    assert.dom('[data-test-chain-retarget]').exists();
    await click('[data-test-chain-retarget-close]');
    await click('[data-test-chain-action="remove-modulator"]');

    assert.dom(`${pane} [data-test-chain-row="modulator"]`).doesNotExist();
  });

  test('Add chain appends a conventional chain from a source picked from the sources', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-chain-action="add-chain"]');
    assert
      .dom('[data-test-chain-group="Filters"]')
      .doesNotExist('only sources are offered');
    await click('[data-test-chain-type="noise"]');

    assert.true(
      project.doc.tracks[0]!.script.includes(
        "__()\n  .noise({ id: 'noise' })\n  .to('channel');",
      ),
    );
    assert.dom(`${pane} [data-test-chain-node="noise"]`).exists();
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
      assert.dom('[data-test-chain-action="add-after"]').isDisabled();
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
