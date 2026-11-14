import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  findAll,
  focus,
  render,
  settled,
  triggerEvent,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { EditorView } from '@codemirror/view';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { defaultProject } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import { controlKey, sequencerKey } from 'client-v2/project/schema';
import { MemoryStorage } from 'client-v2/project/storage';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ViewService from 'client-v2/services/view';

const FREQUENCY = controlKey('#filter', 'frequency');
const row = (key: string): string => `[data-test-control="${key}"]`;

/** Replaces the whole text of the footer's editor, as if typed, and waits for it to run. */
async function typeScript(change: (text: string) => string): Promise<void> {
  const content = find('[data-test-footer-script] .cm-content');
  const editor = content
    ? EditorView.findFromDOM(content as HTMLElement)
    : null;
  if (!editor) throw new Error('The footer is not showing an editor.');
  const text = editor.state.doc.toString();
  editor.dispatch({
    changes: { from: 0, to: text.length, insert: change(text) },
    userEvent: 'input.type',
  });
  await settled(); // includes the pause before a script is run again
}

function pressedSteps(track: number): number[] {
  return findAll(`[data-test-track="${track}"] [data-test-step]`)
    .map((step, index) =>
      step.getAttribute('aria-pressed') === 'true' ? index : -1,
    )
    .filter((index) => index >= 0);
}

module('Integration | Component | app-shell', function (hooks) {
  setupRenderingTest(hooks);

  // The audio service runs the project on an OfflineAudioContext in tests: the same graph, no sound card.
  let view: ViewService;
  let project: ProjectService;
  let audio: AudioService;
  hooks.beforeEach(function () {
    view = this.owner.lookup('service:view');
    project = this.owner.lookup('service:project');
    audio = this.owner.lookup('service:audio');
    view.footerOpen = true;
    view.footerPane = 'controls';
  });

  const frequencyOf = (track: string): unknown =>
    [...audio.engine!.scope(track).select('#filter')][0]?.param('frequency')
      .value;

  module('the frame', function () {
    test('it renders the header, sidebar, track list and footer, with the transport in the header', async function (assert) {
      await render(
        <template><AppShell @initialSidebarOpen={{true}} /></template>,
      );

      assert.dom('[data-test-app-shell]').hasAttribute('data-sidebar', 'open');
      assert.dom('[data-test-app-shell]').hasAttribute('data-ready', 'true');
      assert
        .dom('[data-test-app-header] [data-test-transport]')
        .exists({ count: 1 });
      assert.dom('[data-test-sound-browser]').exists({ count: 1 });
      assert.dom('[data-test-track-list]').exists({ count: 1 });
      assert.dom('[data-test-track-footer]').exists({ count: 1 });
      assert.dom('[data-test-project-title]').hasText('Untitled project');
      assert.dom('[data-test-script-error]').doesNotExist();
      assert.dom('[data-test-script-warnings]').doesNotExist();
    });

    test('the sidebar opens and closes', async function (assert) {
      await render(
        <template><AppShell @initialSidebarOpen={{false}} /></template>,
      );
      const toggle = '[data-test-sidebar-toggle]';

      assert.dom('[data-test-sound-browser]').doesNotExist();
      await click(toggle);
      assert.dom('[data-test-sound-browser]').exists();
      assert.dom(toggle).hasAria('expanded', 'true');
      await click('[data-test-sidebar-close]');
      assert.dom('[data-test-sound-browser]').doesNotExist();
      await click(toggle);
      await triggerKeyEvent(document.body, 'keydown', 'Escape');
      assert.dom('[data-test-sound-browser]').doesNotExist('Escape');
    });

    test('the footer collapses to its bar and expands again', async function (assert) {
      view.footerOpen = false;
      await render(<template><AppShell /></template>);

      assert.dom('[data-test-footer-title]').includesText('Track 1');
      assert.dom('[data-test-footer-title]').includesText('kick');
      assert.dom('[data-test-footer-body]').doesNotExist();
      await click('[data-test-footer-toggle]');
      assert.dom('[data-test-footer-body]').exists();
      await click('[data-test-footer-toggle]');
      assert.dom('[data-test-footer-body]').doesNotExist();
    });
  });

  module('sequencers', function () {
    test('a track row shows the sequencers its script declares', async function (assert) {
      await render(<template><AppShell /></template>);

      assert
        .dom('[data-test-track]')
        .exists({ count: 4 }, 'three tracks and the main output');
      assert
        .dom('[data-test-track="1"] [data-test-track-name]')
        .hasText('kick');
      assert
        .dom('[data-test-track-list] [data-test-step-grid]')
        .exists({ count: 3 });
      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 16 });
      assert.deepEqual(pressedSteps(1), [0, 4, 8, 12]);
      assert.deepEqual(pressedSteps(2), [4, 12, 15]);
      assert.dom('[data-test-no-sequencer]').doesNotExist();
      assert
        .dom('[data-test-track-list] .cm-editor')
        .doesNotExist('no scripts in the list');
    });

    test('pressing a step edits the pattern live and stores it in the project', async function (assert) {
      await render(<template><AppShell /></template>);

      await click('[data-test-track="1"] [data-test-step="2"]');
      await click('[data-test-track="1"] [data-test-step="0"]');

      assert.deepEqual(pressedSteps(1), [2, 4, 8, 12]);
      assert
        .dom('[data-test-track="1"] [data-test-step-grid]')
        .hasAttribute('data-stored', 'true');
      assert.deepEqual(
        [...audio.engine!.scope('t-kick').transport.get('steps')!.steps].slice(
          0,
          5,
        ),
        [0, 0, 1, 0, 1],
        'the running sequence',
      );
      assert.deepEqual(
        (
          project.doc.tracks[0]?.values.controls[sequencerKey('steps')]
            ?.value as number[]
        ).slice(0, 5),
        [0, 0, 1, 0, 1],
      );

      project.undo();
      await settled();
      assert.deepEqual(
        pressedSteps(1),
        [0, 2, 4, 8, 12],
        'each step pressed is a step to undo',
      );
    });

    test('a track with no sequencer() line has a quiet hint instead of a grid, though its sequence runs', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript((text) => text.replace("sequencer('steps');\n", ''));

      assert.dom('[data-test-track="1"] [data-test-step-grid]').doesNotExist();
      assert
        .dom('[data-test-track="1"] [data-test-no-sequencer]')
        .hasText('No sequencer declared');
      assert.strictEqual(
        audio.engine!.scope('t-kick').transport.sequences.length,
        1,
        'the sequence is still there',
      );
      assert.dom('[data-test-track="2"] [data-test-step-grid]').exists();
    });

    test('the footer’s sequence pane lists them, with Reset for a stored pattern; two sequencers are named', async function (assert) {
      view.footerPane = 'sequence';
      await render(<template><AppShell /></template>);

      assert
        .dom('[data-test-pane="sequence"] [data-test-sequence="steps"]')
        .exists();
      assert
        .dom('[data-test-pane="sequence"] [data-test-step]')
        .exists({ count: 16 });
      assert.dom('[data-test-steps-reset]').doesNotExist();

      await click('[data-test-pane="sequence"] [data-test-step="1"]');
      assert.deepEqual(
        pressedSteps(1),
        [0, 1, 4, 8, 12],
        'the row’s grid follows',
      );
      await click('[data-test-steps-reset]');

      assert.deepEqual(
        pressedSteps(1),
        [0, 4, 8, 12],
        'reset to the script’s pattern',
      );
      assert.deepEqual(project.doc.tracks[0]?.values.controls, {});

      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\n__.transport.sequence('fill', { steps: [0, 0, 1] }, () => {});\nsequencer('fill', { label: 'Fill' });`,
      );
      assert
        .dom('[data-test-track="1"] [data-test-step-grid]')
        .exists({ count: 2 });
      assert
        .dom(
          '[data-test-track="1"] [data-test-step-grid="fill"] [data-test-step]',
        )
        .exists({ count: 3 });
      assert.deepEqual(
        findAll('[data-test-track="1"] .track__grid-name').map((el) =>
          el.textContent?.trim(),
        ),
        ['steps', 'Fill'],
      );
      assert
        .dom('[data-test-track="2"] .track__grid-name')
        .doesNotExist('one sequencer needs no name');
    });
  });

  module('controls', function () {
    test('the controls pane lists what the script declares, grouped by node, in order', async function (assert) {
      await render(<template><AppShell /></template>);

      assert.deepEqual(
        findAll('[data-test-control-group]').map((group) =>
          group.getAttribute('data-test-control-group'),
        ),
        ['filter', 'level', 'sampler'],
      );
      assert
        .dom('[data-test-control-group="filter"] .control-group__title')
        .includesText('filter');
      assert
        .dom('[data-test-control-group="filter"] .control-group__title')
        .includesText('lowpass');
      assert.deepEqual(
        findAll('[data-test-control]').map((el) =>
          el.getAttribute('data-test-control'),
        ),
        [
          '#filter › frequency',
          '#filter › q',
          '#level › gain',
          '#sampler › speed',
        ],
      );
      assert
        .dom(`${row(FREQUENCY)} [data-test-slider]`)
        .hasAria('valuenow', '2000');
      assert
        .dom(`${row(FREQUENCY)} [data-test-slider]`)
        .hasAria('valuetext', '2 kHz');
      assert.dom(`${row(FREQUENCY)} [data-test-number-entry]`).hasText('2 kHz');
      assert
        .dom(`${row('#level › gain')} [data-test-knob]`)
        .hasAria('valuenow', '0.9');
      assert
        .dom('[data-test-pane="controls"] input[type="range"]')
        .doesNotExist('no native range inputs');
      assert.dom('[data-test-control-more]').doesNotExist();
    });

    test('moving a slider sets the parameter and stores the value; one drag is one undo', async function (assert) {
      await render(<template><AppShell /></template>);
      const slider = `${row(FREQUENCY)} [data-test-slider]`;

      await focus(slider);
      await triggerKeyEvent(slider, 'keydown', 'Home');
      assert.strictEqual(frequencyOf('t-kick'), 20, 'the live parameter');
      assert.strictEqual(
        project.doc.tracks[0]?.values.controls[FREQUENCY]?.value,
        20,
      );
      assert.dom(row(FREQUENCY)).hasAttribute('data-stored', 'true');
      assert.dom(`${row(FREQUENCY)} [data-test-number-entry]`).hasText('20 Hz');

      await triggerKeyEvent(slider, 'keydown', 'ArrowRight');
      await triggerKeyEvent(slider, 'keydown', 'ArrowRight');
      assert.true((frequencyOf('t-kick') as number) > 20);

      project.undo();
      await settled();
      assert.strictEqual(
        frequencyOf('t-kick'),
        2000,
        'the whole gesture is undone at once, back to the code’s value',
      );
      assert.dom(row(FREQUENCY)).doesNotHaveAttribute('data-stored');
      assert.false(project.canUndo);
    });

    test('typing a value, in the way the mode reads it', async function (assert) {
      await render(<template><AppShell /></template>);

      await click(`${row(FREQUENCY)} [data-test-number-entry]`);
      await fillIn(`${row(FREQUENCY)} [data-test-number-input]`, '440');
      await triggerKeyEvent(
        `${row(FREQUENCY)} [data-test-number-input]`,
        'keydown',
        'Enter',
      );

      assert.strictEqual(frequencyOf('t-kick'), 440);
      assert
        .dom(`${row(FREQUENCY)} [data-test-number-entry]`)
        .hasText('440 Hz');
      assert
        .dom(`${row(FREQUENCY)} [data-test-slider]`)
        .hasAria('valuenow', '440');
    });

    test('the control menu: choose a mode, and reset', async function (assert) {
      await render(<template><AppShell /></template>);
      const menu = `${row(FREQUENCY)} [data-test-menu-button]`;

      await click(menu);
      assert.deepEqual(
        findAll('[data-test-menu-item]').map((item) =>
          item.textContent?.trim(),
        ),
        [
          'Exponential',
          'Linear',
          'MIDI note',
          'Stepped',
          'Reset',
          'Learn MIDI (coming)',
        ],
      );
      assert
        .dom('[data-test-menu-item="Exponential"]')
        .hasAria('checked', 'true');
      assert
        .dom('[data-test-menu-item="Reset"]')
        .hasAria('disabled', 'true', 'nothing stored: nothing to reset');
      assert
        .dom('[data-test-menu-item="Learn MIDI (coming)"]')
        .hasAria('disabled', 'true');

      await click('[data-test-menu-item="MIDI note"]');
      assert
        .dom(`${row(FREQUENCY)} [data-test-number-entry]`)
        .hasText('B6', '2 kHz is nearest B6');
      assert.strictEqual(
        frequencyOf('t-kick'),
        2000,
        'changing the mode does not change the sound',
      );
      assert.deepEqual(project.doc.tracks[0]?.values.controls[FREQUENCY], {
        options: { mode: 'note' },
      });

      await click(`${row(FREQUENCY)} [data-test-number-entry]`);
      await fillIn(`${row(FREQUENCY)} [data-test-number-input]`, 'A4');
      await triggerKeyEvent(
        `${row(FREQUENCY)} [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      assert.strictEqual(
        frequencyOf('t-kick'),
        440,
        'a note name is read, and stored as Hz',
      );

      await click(menu);
      assert
        .dom('[data-test-menu-item="MIDI note"]')
        .hasAria('checked', 'true');
      await click('[data-test-menu-item="Reset"]');

      assert.strictEqual(
        frequencyOf('t-kick'),
        2000,
        'back to the number in the script',
      );
      assert.dom(row(FREQUENCY)).doesNotHaveAttribute('data-stored');
      assert.deepEqual(
        project.doc.tracks[0]?.values.controls[FREQUENCY],
        { options: { mode: 'note' } },
        'the mode is kept',
      );
    });

    test('a right click or a long press on the control opens its menu', async function (assert) {
      await render(<template><AppShell /></template>);
      await triggerEvent(`${row(FREQUENCY)} [data-test-slider]`, 'contextmenu');
      assert.dom(`${row(FREQUENCY)} [data-test-menu]`).exists();
      await triggerKeyEvent(
        `${row(FREQUENCY)} [data-test-menu]`,
        'keydown',
        'Escape',
      );
      assert.dom('[data-test-menu]').doesNotExist();
    });

    test('controls(selector) puts every parameter under "more"; a control of its own is in the Track group', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\ncontrols('#sampler');\nconst density = slider('density', { min: 0, max: 1, default: 0.5 });\ntoggle('fills', { default: true });`,
      );
      await click('[data-test-script-toggle]');

      assert.deepEqual(
        findAll('[data-test-control-group]').map((group) =>
          group.getAttribute('data-test-control-group'),
        ),
        ['own', 'filter', 'level', 'sampler'],
        'the Track group comes first',
      );
      assert
        .dom('[data-test-control-group="own"] .control-group__title')
        .includesText('Track');
      assert
        .dom(`${row('density')} [data-test-slider]`)
        .hasAria('valuenow', '0.5');
      assert
        .dom(`${row('fills')} [data-test-toggle]`)
        .hasAria('checked', 'true');

      const more =
        '[data-test-control-group="sampler"] [data-test-control-more]';
      assert.dom(`${more} summary`).hasText('More (5)');
      assert.dom(more).doesNotHaveAttribute('open', 'collapsed to start with');
      assert
        .dom(`${more} ${row('#sampler › loop')} [data-test-toggle]`)
        .exists('a true-or-false parameter gets a toggle');
      assert
        .dom(
          `[data-test-control-group="sampler"] > .control-list ${row('#sampler › speed')}`,
        )
        .exists('the explicit slider stays above');
      assert
        .dom(`${more} ${row('#sampler › speed')}`)
        .doesNotExist('and is not repeated under "more"');

      await click(`${row('fills')} [data-test-toggle]`);
      assert.false(project.doc.tracks[0]?.values.controls['fills']?.value);
    });

    test('a declaration that cannot work is a warning with its line; the rest of the script runs', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}slider('#nope', 'frequency');\nsequencer('missing');\n`,
      );

      assert.dom('[data-test-script-error]').doesNotExist('not an error');
      assert.dom('[data-test-script-warnings] li').exists({ count: 2 });
      assert
        .dom('[data-test-script-warnings]')
        .includesText(
          "slider('#nope', 'frequency'): the selector matches no node",
        );
      assert
        .dom('[data-test-script-warnings]')
        .includesText('there is no sequence called "missing"');
      assert.true(
        /Line \d+\./.test(
          find('[data-test-script-warnings]')?.textContent ?? '',
        ),
        'with the line',
      );
      assert
        .dom('[data-test-track="1"] [data-test-step-grid]')
        .exists('the rest still works');
    });

    test('an empty state explains how to add a control', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        () => `__().sampler({ id: 's', buffer: 'kick' }).to('out');`,
      );
      await click('[data-test-script-toggle]');

      assert
        .dom('[data-test-pane="controls"] [data-test-pane-empty]')
        .includesText("slider('#filter', 'frequency')");
      assert.dom('[data-test-control]').doesNotExist();
    });

    test('control.set() from a script is stored but is not a step to undo', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript((text) =>
        text.replace(
          "slider('#filter', 'q');",
          "const q = slider('#filter', 'q');\nq.set(7);",
        ),
      );

      assert.strictEqual(
        project.doc.tracks[0]?.values.controls[controlKey('#filter', 'q')]
          ?.value,
        7,
      );
      assert.strictEqual(
        [...audio.engine!.scope('t-kick').select('#filter')][0]?.param('q')
          .value,
        7,
      );
      project.undo();
      await settled();
      assert.false(
        project.doc.tracks[0]?.script.includes('q.set(7)'),
        'undo took back the typing, the only step there was',
      );
      assert.false(project.canUndo);
    });

    test('the channel strip sets the track’s level and pan with the app’s own sliders', async function (assert) {
      await render(<template><AppShell /></template>);
      const level = '[data-test-strip-level]';
      const pan = '[data-test-strip-pan]';

      assert.dom(level).hasAttribute('role', 'slider');
      assert.dom(level).hasAria('valuetext', '0.0 dB');
      assert.dom(pan).hasAria('valuenow', '0');
      assert.dom('[data-test-channel-strip] input').doesNotExist();

      await focus(level);
      await triggerKeyEvent(level, 'keydown', 'Home');
      await focus(pan);
      await triggerKeyEvent(pan, 'keydown', 'Home');

      assert.strictEqual(project.doc.tracks[0]?.level, 0);
      assert.strictEqual(project.doc.tracks[0]?.pan, -1);
      const scope = audio.engine!.scope('t-kick');
      assert.strictEqual(scope.bus('out').gain.value, 0);
      assert.strictEqual(
        [...scope.bus('out').inserts][0]?.param('pan').value,
        -1,
      );
    });

    test('the main output shows the project script’s controls, and its script is the project script', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-track="output"] [data-test-track-select]');

      assert.dom('[data-test-track="output"]').hasAria('current', 'true');
      assert.dom('[data-test-footer-title]').includesText('Main output');
      assert.dom('[data-test-channel-strip]').doesNotExist();
      assert.dom('[data-test-footer-tab]').doesNotExist();
      assert
        .dom('[data-test-pane="master"] [data-test-control-group="glue"]')
        .exists();
      const threshold = row(controlKey('#glue', 'threshold'));
      assert.dom(`${threshold} [data-test-slider]`).hasAria('valuenow', '-18');

      await focus(`${threshold} [data-test-slider]`);
      await triggerKeyEvent(
        `${threshold} [data-test-slider]`,
        'keydown',
        'End',
      );
      const glue = [...audio.engine!.root.select('#glue')][0];
      assert.strictEqual(glue?.param('threshold').value, 0);
      assert.strictEqual(
        project.doc.values.controls[controlKey('#glue', 'threshold')]?.value,
        0,
      );

      await click('[data-test-script-toggle]');
      assert
        .dom('[data-test-script-toggle]')
        .hasAria('label', 'Project script');
      assert
        .dom('[data-test-footer-script] .cm-content')
        .includesText("__.bus('main')");
    });
  });

  module('scripts', function () {
    test('the script button swaps the footer between its UI and the editor', async function (assert) {
      await render(<template><AppShell /></template>);
      assert.dom('.cm-editor').doesNotExist('no editor until it is asked for');

      await click('[data-test-script-toggle]');
      assert.dom('[data-test-script-toggle]').hasAria('pressed', 'true');
      assert.dom('[data-test-footer-script] .cm-editor').exists({ count: 1 });
      assert
        .dom('[data-test-footer-script] .cm-content')
        .includesText("buffer: 'kick'");
      assert.dom('[data-test-footer-ui]').doesNotExist();

      await click('[data-test-track="3"] [data-test-track-select]');
      assert
        .dom('[data-test-footer-script] .cm-content')
        .includesText("buffer: 'hat'");

      await click('[data-test-script-toggle]');
      assert.dom('.cm-editor').doesNotExist();
      assert.dom('[data-test-footer-ui]').exists();
      const remembered = JSON.parse(
        window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}',
      ) as { scriptOpen?: boolean };
      assert.false(
        remembered.scriptOpen,
        'the choice is remembered on this device',
      );
    });

    test('an edit runs after a pause, and the grid follows the script', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');

      await typeScript((text) =>
        text
          .replace(
            /\{ steps: \[[^\]]*\], step: '1\/16' \}/,
            '{ steps: [1, 1, 0, 2, 0, 0] }',
          )
          .replace(
            ".lowpass({ id: 'filter', frequency: 2000, q: 2 })",
            ".highpass({ id: 'filter', frequency: 90, q: 1 })",
          ),
      );

      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 6 }, 'the grid has the new length');
      assert.deepEqual(pressedSteps(1), [0, 1, 3]);
      assert
        .dom('[data-test-track="1"] [data-test-step="3"]')
        .hasText('2', 'a step holding 2 says so');
      assert.dom('[data-test-script-error]').doesNotExist();
      assert.strictEqual(frequencyOf('t-kick'), 90, 'the new node is running');

      await click('[data-test-script-toggle]');
      assert
        .dom('[data-test-control-group="filter"] .control-group__title')
        .includesText('highpass', 'the controls follow');
      assert
        .dom(`${row(FREQUENCY)} [data-test-slider]`)
        .hasAria('valuenow', '90');
    });

    test('a script with an error keeps the last version running and says so until it is fixed', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      const good = project.doc.tracks[0]!.script;

      await typeScript((text) => `${text}\n__().sine(`);

      assert.dom('[data-test-script-error]').includesText('SyntaxError');
      assert
        .dom('[data-test-script-error]')
        .includesText('Still running the last version that worked');
      assert
        .dom('[data-test-track="1"] [data-test-track-error]')
        .exists('the track is marked');
      assert
        .dom('[data-test-track="2"] [data-test-track-error]')
        .doesNotExist();
      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 16 }, 'the old grid is still there');
      assert.strictEqual(frequencyOf('t-kick'), 2000, 'and the old nodes');

      await typeScript(() => good);
      assert.dom('[data-test-script-error]').doesNotExist();
      assert.dom('[data-test-track-error]').doesNotExist();
    });
  });

  module('tracks and transport', function () {
    test('New Track adds a track from the template, with its grid and controls, and selects it', async function (assert) {
      await render(<template><AppShell /></template>);

      await click('[data-test-new-track]');

      assert.dom('[data-test-track]').exists({ count: 5 });
      assert.dom('[data-test-track="4"]').hasAria('current', 'true');
      assert
        .dom('[data-test-track="4"] [data-test-track-name]')
        .hasText('track 4');
      assert
        .dom('[data-test-track="4"] [data-test-step]')
        .exists({ count: 16 });
      assert.deepEqual(pressedSteps(4), [0]);
      assert.dom('[data-test-footer-title]').includesText('Track 4');
      assert.deepEqual(
        findAll('[data-test-control]').map((el) =>
          el.getAttribute('data-test-control'),
        ),
        ['#level › gain', '#sampler › speed'],
        'playable without typing',
      );
      const id = project.doc.tracks[3]!.id;
      assert.strictEqual(audio.error(id), null, 'and it runs');
      assert.deepEqual(audio.warnings(id), []);
    });

    test('a track is removed from its menu, and Undo brings it back', async function (assert) {
      await render(<template><AppShell /></template>);

      await click('[data-test-track="2"] [data-test-menu-button]');
      assert
        .dom('[data-test-track="2"] [data-test-menu-button]')
        .hasAria('expanded', 'true');
      await click('[data-test-track="2"] [data-test-menu-item="Remove"]');

      assert.dom('[data-test-track]').exists({ count: 3 });
      assert.dom('[data-test-track="2"] [data-test-track-name]').hasText('hat');
      assert.deepEqual(
        audio.sequencers('t-snare'),
        [],
        'it is no longer running',
      );
      assert.dom('[data-test-notice]').includesText('Removed snare');

      await click('[data-test-undo]');
      assert.dom('[data-test-track]').exists({ count: 4 });
      assert
        .dom('[data-test-track="2"] [data-test-track-name]')
        .hasText('snare');
      assert.deepEqual(pressedSteps(2), [4, 12, 15], 'and running again');
      assert.dom('[data-test-notice]').doesNotExist();
      assert
        .dom('[data-test-track="output"] [data-test-menu-button]')
        .doesNotExist('the main output cannot be removed');
    });

    test('play, stop and tempo', async function (assert) {
      await render(<template><AppShell /></template>);
      const transport = audio.engine!.transport;

      assert.dom('[data-test-transport-tempo]').hasValue('120');
      await fillIn('[data-test-transport-tempo]', '98');
      assert.strictEqual(project.doc.bpm, 98);
      assert.strictEqual(transport.bpm, 98);
      await fillIn('[data-test-transport-tempo]', '9999');
      assert
        .dom('[data-test-transport-tempo]')
        .hasValue('500', 'out of range is brought in');

      await click('[data-test-transport-play]');
      assert.strictEqual(transport.state, 'started');
      assert.dom('[data-test-transport]').hasAttribute('data-playing', 'true');
      await click('[data-test-transport-stop]');
      assert.strictEqual(transport.state, 'stopped');

      await triggerKeyEvent(document.body, 'keydown', ' ');
      assert.strictEqual(transport.state, 'started', 'Space plays');
      await triggerKeyEvent(document.body, 'keydown', ' ');
      assert.strictEqual(transport.state, 'stopped', 'and stops');

      await triggerKeyEvent('[data-test-transport-tempo]', 'keydown', ' ');
      assert.strictEqual(
        transport.state,
        'stopped',
        'not when focus is in a field',
      );
      await triggerKeyEvent(
        `${row(FREQUENCY)} [data-test-slider]`,
        'keydown',
        ' ',
      );
      assert.strictEqual(transport.state, 'stopped', 'nor on a control');
    });

    test('a saved project is what opens, with its control values and patterns applied', async function (assert) {
      let saved = defaultProject();
      saved = applyOperation(saved, {
        type: 'setProjectName',
        name: 'Saved one',
      });
      saved = applyOperation(saved, { type: 'removeTrack', id: 't-hat' });
      saved = applyOperation(saved, {
        type: 'setControlValue',
        scope: 't-kick',
        key: sequencerKey('steps'),
        value: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
      saved = applyOperation(saved, {
        type: 'setControlValue',
        scope: 't-kick',
        key: FREQUENCY,
        value: 321,
      });
      const storage = new MemoryStorage();
      await storage.save(saved);
      project.storage = storage;

      await render(<template><AppShell /></template>);

      assert.dom('[data-test-project-title]').hasText('Saved one');
      assert
        .dom('[data-test-track]')
        .exists({ count: 3 }, 'two tracks and the main output');
      assert.deepEqual(
        pressedSteps(1),
        [1, 2],
        'the stored pattern is running',
      );
      assert.strictEqual(
        frequencyOf('t-kick'),
        321,
        'and the stored control value',
      );
      assert
        .dom(`${row(FREQUENCY)} [data-test-slider]`)
        .hasAria('valuenow', '321');
      assert.dom(row(FREQUENCY)).hasAttribute('data-stored', 'true');
    });
  });
});
