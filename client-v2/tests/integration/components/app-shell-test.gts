import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  findAll,
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
import { MemoryStorage } from 'client-v2/project/storage';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ViewService from 'client-v2/services/view';

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
  });

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

  module('what the scripts make', function () {
    test('track rows come from the project, with a step grid for each track’s sequence', async function (assert) {
      await render(<template><AppShell /></template>);

      assert
        .dom('[data-test-track]')
        .exists({ count: 4 }, 'three tracks and the main output');
      assert
        .dom('[data-test-track="1"] [data-test-track-name]')
        .hasText('kick');
      assert.dom('[data-test-track="3"] [data-test-track-name]').hasText('hat');
      assert
        .dom('[data-test-track-list] [data-test-step-grid]')
        .exists({ count: 3 });
      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 16 });
      assert.deepEqual(pressedSteps(1), [0, 4, 8, 12]);
      assert.deepEqual(pressedSteps(2), [4, 12, 15]);
      assert
        .dom('[data-test-track="output"] [data-test-step-grid]')
        .doesNotExist();
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
        .hasAttribute('data-overridden', 'true');
      assert.deepEqual(
        [...audio.engine!.scope('t-kick').transport.get('steps')!.steps].slice(
          0,
          5,
        ),
        [0, 0, 1, 0, 1],
        'the running sequence',
      );
      const stored = project.doc.tracks[0]?.values.sequences['steps'];
      assert.deepEqual(stored?.value.slice(0, 5), [0, 0, 1, 0, 1]);
      assert.deepEqual(stored?.code.slice(0, 5), [1, 0, 0, 0, 1]);
    });

    test('the footer’s sequence pane lists the track’s sequences; source and controls are empty states for now', async function (assert) {
      await render(<template><AppShell /></template>);

      assert
        .dom('[data-test-footer-tab="sequence"]')
        .hasAria('pressed', 'true');
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
      assert.deepEqual(project.doc.tracks[0]?.values.sequences, {});

      await click('[data-test-footer-tab="controls"]');
      assert
        .dom('[data-test-pane="controls"] [data-test-pane-empty]')
        .includesText('Controls are coming');
      assert
        .dom('[data-test-pane="controls"] input')
        .doesNotExist('no parameter controls yet');
      await click('[data-test-footer-tab="source"]');
      assert.dom('[data-test-pane="source"] [data-test-pane-empty]').exists();
    });

    test('the channel strip sets the track’s level and pan', async function (assert) {
      await render(<template><AppShell /></template>);

      const level = find('[data-test-strip-level]') as HTMLInputElement;
      level.value = '0.5';
      await triggerEvent(level, 'input');
      const pan = find('[data-test-strip-pan]') as HTMLInputElement;
      pan.value = '-1';
      await triggerEvent(pan, 'input');

      assert.strictEqual(project.doc.tracks[0]?.level, 0.5);
      assert.strictEqual(project.doc.tracks[0]?.pan, -1);
      const scope = audio.engine!.scope('t-kick');
      assert.strictEqual(scope.bus('out').gain.value, 0.5);
      assert.strictEqual(
        [...scope.bus('out').inserts][0]?.param('pan').value,
        -1,
      );
    });

    test('the main output is selectable, and its script is the project script', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-track="output"] [data-test-track-select]');

      assert.dom('[data-test-track="output"]').hasAria('current', 'true');
      assert.dom('[data-test-footer-title]').includesText('Main output');
      assert.dom('[data-test-channel-strip]').doesNotExist();
      assert.dom('[data-test-footer-tab]').doesNotExist();
      assert.dom('[data-test-pane="master"] [data-test-pane-empty]').exists();

      await click('[data-test-script-toggle]');
      assert
        .dom('[data-test-script-toggle]')
        .hasAria('label', 'Project script');
      assert
        .dom('[data-test-footer-script] .cm-content')
        .includesText("__.bus('main')");

      await typeScript((text) => text.replace('set(0.8)', 'set(0.5)'));
      assert.strictEqual(
        audio.engine!.bus('main').gain.value,
        0.5,
        'an edit to the project script runs',
      );
      assert.true(project.doc.script.includes('set(0.5)'));
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
            ".highpass({ id: 'hp', frequency: 90 })",
          ),
      );

      assert.true(
        project.doc.tracks[0]?.script.includes("id: 'hp'"),
        'the document has the text',
      );
      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 6 }, 'the grid has the new length');
      assert.deepEqual(pressedSteps(1), [0, 1, 3]);
      assert
        .dom('[data-test-track="1"] [data-test-step="3"]')
        .hasText('2', 'a step holding 2 says so');
      assert.dom('[data-test-script-error]').doesNotExist();
      const ids = [...audio.engine!.scope('t-kick').select('*')].map(
        (node) => node.id,
      );
      assert.true(ids.includes('hp'), 'the new node is running');
      assert.false(ids.includes('filter'), 'the old one is gone');
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
        .exists({ count: 16 }, 'the old sequence is still there');
      assert.strictEqual(
        [...audio.engine!.scope('t-kick').select('#filter')].length,
        1,
        'and the old nodes',
      );

      await typeScript(() => good);
      assert.dom('[data-test-script-error]').doesNotExist();
      assert.dom('[data-test-track-error]').doesNotExist();
    });

    test('a track with two sequences has a named grid for each', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\n__.transport.sequence('fill', { steps: [0, 0, 1] }, () => {});`,
      );

      assert
        .dom('[data-test-track="1"] [data-test-step-grid]')
        .exists({ count: 2 });
      assert
        .dom(
          '[data-test-track="1"] [data-test-step-grid="fill"] [data-test-step]',
        )
        .exists({ count: 3 });
      assert
        .dom('[data-test-track="1"] .track__grid-name')
        .exists({ count: 2 });
      assert
        .dom('[data-test-track="2"] .track__grid-name')
        .doesNotExist('one sequence needs no name');
    });
  });

  module('tracks and transport', function () {
    test('New Track adds a track from the template and selects it', async function (assert) {
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
      assert.true(
        project.doc.tracks[3]?.script.includes(".to('out')"),
        'its chain ends at out',
      );
      assert.strictEqual(
        audio.error(project.doc.tracks[3]!.id),
        null,
        'and it runs',
      );
    });

    test('a track is removed from its menu, and Undo brings it back', async function (assert) {
      await render(<template><AppShell /></template>);

      await click('[data-test-track="2"] [data-test-track-menu]');
      assert
        .dom('[data-test-track="2"] [data-test-track-menu]')
        .hasAria('expanded', 'true');
      await click('[data-test-track-remove]');

      assert.dom('[data-test-track]').exists({ count: 3 });
      assert.dom('[data-test-track="2"] [data-test-track-name]').hasText('hat');
      assert.deepEqual(
        audio.sequences('t-snare'),
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
        .dom('[data-test-track="output"] [data-test-track-menu]')
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
    });

    test('a saved project is what opens', async function (assert) {
      let saved = defaultProject();
      saved = applyOperation(saved, {
        type: 'setProjectName',
        name: 'Saved one',
      });
      saved = applyOperation(saved, { type: 'removeTrack', id: 't-hat' });
      saved = applyOperation(saved, {
        type: 'setSteps',
        scope: 't-kick',
        sequence: 'steps',
        steps: [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        code: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
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
        'the stored pattern is applied to the running sequence',
      );
      assert
        .dom('[data-test-track="1"] [data-test-step-grid]')
        .hasAttribute('data-overridden', 'true');
    });
  });
});
