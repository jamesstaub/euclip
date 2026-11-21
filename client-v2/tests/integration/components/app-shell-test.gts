import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  waitUntil,
  findAll,
  focus,
  render,
  select,
  settled,
  triggerEvent,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { EditorView } from '@codemirror/view';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { defaultProject } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import { controlKey, stepGridKey } from 'client-v2/project/schema';
import { MemoryStorage } from 'client-v2/project/storage';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ViewService from 'client-v2/services/view';

const FREQUENCY = controlKey('#filter', 'frequency');
const STEPS = stepGridKey('steps');
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
    view.footerPane = 'sound';
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
      assert.dom('[data-test-footer-name]').hasValue('kick');
      assert.dom('[data-test-footer-body]').doesNotExist();
      await click('[data-test-footer-toggle]');
      assert.dom('[data-test-footer-body]').exists();
      await click('[data-test-footer-toggle]');
      assert.dom('[data-test-footer-body]').doesNotExist();
    });
  });

  module('step grids', function () {
    module('a step’s value', function () {
      const step = (index: number): string =>
        `[data-test-track="1"] [data-test-step="${index}"]`;
      const steps = (): number[] =>
        project.doc.tracks[0]!.values.controls[STEPS]?.value as number[];
      const live = (): readonly number[] => audio.stepGrids('t-kick')[0]!.steps;
      const type = async (text: string, key = 'Enter'): Promise<void> => {
        await fillIn('[data-test-step-entry] [data-test-number-input]', text);
        await triggerKeyEvent(
          '[data-test-step-entry] [data-test-number-input]',
          'keydown',
          key,
        );
      };

      test('a double click opens a number box on the step; Enter commits, and the whole thing is one step to undo', async function (assert) {
        await render(<template><AppShell /></template>);
        assert.strictEqual(
          live()[1],
          0,
          'the second step is off to begin with',
        );

        // a double click is two clicks and then the double click
        await click(step(1));
        assert.strictEqual(
          live()[1],
          1,
          'the first click toggles at once: nothing waits',
        );
        await click(step(1));
        await triggerEvent(step(1), 'dblclick');
        assert
          .dom('[data-test-step-entry]')
          .exists('the box is open on the step');
        assert.strictEqual(live()[1], 1, 'and the step is on, with 1');
        assert
          .dom('[data-test-step-entry] [data-test-number-input]')
          .isFocused();
        assert
          .dom('[data-test-step-entry] [data-test-number-input]')
          .hasValue('1');
        assert
          .dom('[data-test-step-entry] [data-test-number-input]')
          .hasAria('label', 'Step 2 value');

        await type('3');
        assert
          .dom('[data-test-step-entry]')
          .doesNotExist('Enter commits and closes');
        assert.strictEqual(steps()[1], 3);
        assert.dom(step(1)).hasText('3', 'the step shows its value');
        assert.dom(step(1)).hasAria('pressed', 'true');
        assert.dom(step(1)).isFocused('focus is back on the step');

        project.undo();
        await settled();
        assert.strictEqual(
          live()[1],
          0,
          'one undo takes back the clicks and the value together',
        );
        assert.false(project.canUndo);
      });

      test('two quick taps on neighbouring steps are two taps, not a double click on the second', async function (assert) {
        await render(<template><AppShell /></template>);
        const step = (index: number): string =>
          `[data-test-track="2"] [data-test-step="${index}"]`;
        await click(step(1));
        await click(step(2));
        // (what a browser sends when two taps land close together, as they do on narrow steps)
        await triggerEvent(step(2), 'dblclick');
        assert.dom('[data-test-step-entry]').doesNotExist('no value box');
        assert.deepEqual(
          pressedSteps(2).filter((index) => index === 1 || index === 2),
          [1, 2],
          'each tap toggled its own step',
        );
      });

      test('a double click that changes nothing leaves nothing to undo; Escape gives up; 0 turns the step off', async function (assert) {
        await render(<template><AppShell /></template>);
        assert.strictEqual(live()[0], 1);
        await click(step(0));
        await click(step(0));
        await triggerEvent(step(0), 'dblclick');
        assert.strictEqual(live()[0], 1, 'on, as it was');
        await type('7', 'Escape');
        assert.dom('[data-test-step-entry]').doesNotExist();
        assert.strictEqual(live()[0], 1, 'Escape gives up what was typed');
        assert.false(
          project.canUndo,
          'two toggles that cancel out are not a step to undo',
        );

        await triggerKeyEvent(step(0), 'keydown', 'Enter');
        assert
          .dom('[data-test-step-entry]')
          .exists('Enter on a focused step opens the box');
        await type('0');
        assert.strictEqual(steps()[0], 0);
        assert.dom(step(0)).hasAria('pressed', 'false', '0 is off');

        await triggerKeyEvent(step(4), 'keydown', '5');
        const field = '[data-test-step-entry] [data-test-number-input]';
        assert
          .dom(field)
          .hasValue('5', 'a digit opens the box with that digit in it');
        assert
          .dom(field)
          .hasAttribute('inputmode', 'numeric', 'a phone shows its digit pad');
        assert.dom(field).hasAttribute('maxlength', '3');
        // only digits get in: a point, a minus, an exponent and letters are dropped as they are typed
        const input = find(field) as HTMLInputElement;
        for (const [typed, kept] of [
          ['1.5', '15'],
          ['-7', '7'],
          ['1e3', '13'],
          ['loud', ''],
          ['12345', '123'],
        ] as const) {
          input.value = typed;
          await triggerEvent(field, 'input');
          assert.strictEqual(input.value, kept, `"${typed}" is "${kept}"`);
        }
        await type('12');
        assert.strictEqual(steps()[4], 12, 'a whole number');
        assert.dom(step(4)).hasText('12');

        await triggerKeyEvent(step(4), 'keydown', '.');
        assert
          .dom('[data-test-step-entry]')
          .doesNotExist(
            'a point does not open the box: values are whole numbers',
          );
        await triggerKeyEvent(step(4), 'keydown', 'Enter');
        await type('999');
        assert.strictEqual(steps()[4], 999, 'up to 999');
        await triggerKeyEvent(step(4), 'keydown', 'Enter');
        await type('');
        assert
          .dom('[data-test-step-entry]')
          .doesNotExist('nothing typed: nothing changed');
        assert.strictEqual(steps()[4], 999);
        await triggerKeyEvent(step(4), 'keydown', ' ');
        assert
          .dom('[data-test-step-entry]')
          .doesNotExist('Space is still the key that toggles');
      });

      test('a long press with a finger opens the box, and lifting the finger does not toggle', async function (assert) {
        await render(<template><AppShell /></template>);
        const touch = {
          pointerType: 'touch',
          pointerId: 5,
          isPrimary: true,
          clientX: 10,
          clientY: 10,
        };
        await triggerEvent(step(2), 'pointerdown', touch);
        await triggerEvent(step(2), 'pointerup', touch);
        await click(step(2));
        assert.strictEqual(
          live()[2],
          1,
          'a tap toggles at once, as a click does',
        );
        assert.dom('[data-test-step-entry]').doesNotExist();

        await triggerEvent(step(2), 'pointerdown', touch);
        await new Promise((resolve) => setTimeout(resolve, 650));
        await settled();
        assert.dom('[data-test-step-entry="2"]').exists('held: the box opens');
        await triggerEvent(step(2), 'pointerup', touch);
        await triggerEvent(step(2), 'click');
        assert.strictEqual(
          live()[2],
          1,
          'the click that ends the press is not a toggle',
        );
        assert
          .dom('[data-test-step-entry]')
          .exists('and the box is still open');
        await type('4');
        assert.strictEqual(steps()[2], 4);

        // a finger that moves off (a scroll) is not a long press
        await triggerEvent(step(3), 'pointerdown', touch);
        await triggerEvent(step(3), 'pointermove', { ...touch, clientY: 60 });
        await new Promise((resolve) => setTimeout(resolve, 650));
        assert.dom('[data-test-step-entry]').doesNotExist();

        // the same grid in the sequence pane opens the same box
        view.footerPane = 'sequence';
        await settled();
        await triggerKeyEvent(
          '[data-test-pane="sequence"] [data-test-step="6"]',
          'keydown',
          'Enter',
        );
        assert
          .dom('[data-test-pane="sequence"] [data-test-step-entry="6"]')
          .exists();
        await type('2');
        assert.strictEqual(steps()[6], 2);
        assert.dom(step(6)).hasText('2', 'and the track row’s grid shows it');
      });
    });

    test('a track row shows the step grids its script declares', async function (assert) {
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
      assert.dom('[data-test-no-step-grid]').doesNotExist();
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
        [
          ...audio
            .engine!.scope('t-kick')
            .scope('script')
            .transport.get('steps')!.steps,
        ].slice(0, 5),
        [0, 0, 1, 0, 1],
        'the running sequence',
      );
      assert.deepEqual(
        (
          project.doc.tracks[0]?.values.controls[stepGridKey('steps')]
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

    test('a track with no stepGrid() line has a quiet hint instead of a grid, though its sequence runs', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript((text) => text.replace("stepGrid('steps');\n", ''));

      assert.dom('[data-test-track="1"] [data-test-step-grid]').doesNotExist();
      assert
        .dom('[data-test-track="1"] [data-test-no-step-grid]')
        .hasText('No step grid declared');
      assert.strictEqual(
        audio.engine!.scope('t-kick').scope('script').transport.sequences
          .length,
        1,
        'the sequence is still there',
      );
      assert.dom('[data-test-track="2"] [data-test-step-grid]').exists();
    });

    test('a sequence written with a count has an empty grid that the person fills; undoing the first step empties it again', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        () =>
          `__().sampler({ id: 'sampler', buffer: 'kick' }).to('channel');
__.transport.sequence('beat', { steps: 8 }, (ev) => { if (ev.value) __('#sampler').trigger(); });
stepGrid('beat');
__.transport.sequence('ones', { steps: [1, 1, 1, 1] }, () => {});
stepGrid('ones');
`,
      );
      const pressed = (name: string): number[] =>
        findAll(
          `[data-test-track="1"] [data-test-step-grid="${name}"] [data-test-step][aria-pressed="true"]`,
        ).map((el) => Number(el.getAttribute('data-test-step')));
      assert
        .dom(
          '[data-test-track="1"] [data-test-step-grid="beat"] [data-test-step]',
        )
        .exists({ count: 8 });
      assert.deepEqual(pressed('beat'), [], 'a count: eight steps, none on');
      assert.deepEqual(
        pressed('ones'),
        [0, 1, 2, 3],
        'four written on are four on',
      );
      assert.strictEqual(
        project.doc.tracks[0]!.values.controls['stepGrid › beat'],
        undefined,
        'the empty pattern is not written anywhere',
      );

      await click(
        '[data-test-track="1"] [data-test-step-grid="beat"] [data-test-step="3"]',
      );
      assert.deepEqual(pressed('beat'), [3]);
      assert.deepEqual(
        project.doc.tracks[0]!.values.controls['stepGrid › beat']?.value,
        [0, 0, 0, 1, 0, 0, 0, 0],
        'the first step set stores the pattern',
      );
      project.undo();
      await settled();
      assert.deepEqual(pressed('beat'), [], 'undone: empty again');
      assert.strictEqual(
        project.doc.tracks[0]!.values.controls['stepGrid › beat'],
        undefined,
      );
    });

    test('a grid in the sequence pane has pattern generators: a dial writes the pattern as it moves, one step to undo, and the dials are remembered', async function (assert) {
      view.footerPane = 'sequence';
      await render(<template><AppShell /></template>);
      const gen = '[data-test-pane="sequence"] [data-test-generators="steps"]';
      const seq = '[data-test-pane="sequence"] [data-test-sequence="steps"]';
      const pattern = (): string =>
        audio
          .stepGrids('t-kick')[0]!
          .steps.map((step) => (step ? 'x' : '.'))
          .join('');
      const options = (): Record<string, unknown> | undefined =>
        project.doc.tracks[0]!.values.controls[STEPS]?.options?.generator;
      assert.dom(gen).exists('with the grid, in the sequence pane');
      assert
        .dom('[data-test-track="1"] [data-test-generators]')
        .doesNotExist('the track row’s compact grid is steps only');
      assert.dom('[data-test-gen-summary]').doesNotExist('no summary line');
      assert.dom('[data-test-gen-toggle]').doesNotExist('no Generate toggle');
      assert
        .dom(`${gen} [data-test-gen-panel]`)
        .exists('the dials are always shown');
      assert.strictEqual(
        findAll(
          '[data-test-pane="sequence"] [data-test-generators], [data-test-pane="sequence"] [data-test-step-grid]',
        )[0]?.getAttribute('data-test-generators'),
        'steps',
        'the generators come before the grid in the card',
      );
      assert
        .dom('[data-test-pane="sequence"] [data-test-sequence="steps"] ')
        .doesNotIncludeText('steps on', 'no count in the header');
      assert.deepEqual(
        findAll(`${seq} [data-test-gen-kind] option`).map((option) =>
          option.textContent.trim(),
        ),
        ['Euclidean', 'Binary', 'On / off', 'Sieve'],
      );
      assert.dom(`${seq} [data-test-gen-kind]`).hasValue('euclid');
      assert.dom(`${seq} [data-test-gen-kind]`).hasAria('label', 'Generator');
      assert
        .dom(`${seq} [data-test-gen-combine]`)
        .hasAria('label', 'Combine with existing pattern');
      assert
        .dom(`${gen} [data-test-gen-dial="hits"] [data-test-number-entry]`)
        .hasText('4', 'the dials start from the pattern that is there');
      assert.strictEqual(
        options(),
        undefined,
        'opening the panel writes nothing',
      );
      assert.false(project.canUndo);

      // typed: five hits
      const hits = `${gen} [data-test-gen-dial="hits"]`;
      await click(`${hits} [data-test-number-entry]`);
      await fillIn(`${hits} [data-test-number-input]`, '5');
      await triggerKeyEvent(
        `${hits} [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      const five = pattern();
      assert.strictEqual(five.split('x').length - 1, 5, `five hits (${five})`);
      assert.deepEqual(
        pressedSteps(1).length,
        5,
        'the track row’s grid follows',
      );
      assert.strictEqual(options()?.['hits'], 5);
      assert.strictEqual(options()?.['made'], five);

      // a key step on the rotate dial: live, and its own step to undo
      await triggerKeyEvent(
        `${gen} [data-test-gen-dial="rotate"] [data-test-slider]`,
        'keydown',
        'ArrowUp',
      );
      assert.notStrictEqual(pattern(), five, 'rotated');
      assert.strictEqual(pattern().split('x').length - 1, 5);
      project.undo();
      await settled();
      assert.strictEqual(pattern(), five, 'one undo: the rotation');
      assert.strictEqual(options()?.['rotate'], 0, 'the dial with it');
      project.undo();
      await settled();
      assert.strictEqual(
        pattern(),
        'x...x...x...x...',
        'and again: the five hits',
      );
      project.redo();
      await settled();

      // a dial dragged: every move writes, the whole drag is one step
      const entry = `${hits} [data-test-slider]`;
      const rect = find(entry)!.getBoundingClientRect();
      const at = (along: number) => ({
        pointerId: 1,
        button: 0,
        buttons: 1,
        isPrimary: true,
        pointerType: 'mouse',
        clientX: rect.left + along * rect.width,
        clientY: rect.top + rect.height / 2,
      });
      await triggerEvent(entry, 'pointerdown', at(0.5));
      await triggerEvent(document.body, 'pointermove', at(0.7));
      const midway = pattern();
      await triggerEvent(document.body, 'pointermove', at(0.9));
      await triggerEvent(document.body, 'pointerup', at(0.9));
      assert.notStrictEqual(
        midway,
        five,
        'it changed while the dial was still being dragged',
      );
      assert.notStrictEqual(pattern(), midway);
      project.undo();
      await settled();
      assert.strictEqual(pattern(), five, 'the drag is one step to undo');

      // a step changed by hand: "edited", and nothing is overwritten until a dial moves
      await click('[data-test-pane="sequence"] [data-test-step="1"]');
      const byHand = pattern();
      assert.strictEqual(pattern(), byHand);

      // another generator: its tab shows its dials, and writes when one moves
      await select(`${seq} [data-test-gen-kind]`, 'onoff');
      assert.strictEqual(pattern(), byHand, 'turning to a tab writes nothing');
      await triggerKeyEvent(
        `${gen} [data-test-gen-dial="off"] [data-test-slider]`,
        'keydown',
        'ArrowDown',
      );
      assert.strictEqual(
        pattern(),
        'x..x..x..x..x..x',
        'one on, two off, repeated to fill',
      );

      // the dials are remembered with the grid: the pane redrawn shows the same tab and numbers
      view.footerPane = 'sound';
      await settled();
      view.footerPane = 'sequence';
      await settled();
      assert.dom(`${seq} [data-test-gen-kind]`).hasValue('onoff');
      assert
        .dom(`${gen} [data-test-gen-dial="off"] [data-test-number-entry]`)
        .hasText('2');
    });

    test('the tools turn the pattern; Or, And and Xor meet what is there; a step’s value is kept', async function (assert) {
      view.footerPane = 'sequence';
      await render(<template><AppShell /></template>);
      const gen = '[data-test-pane="sequence"] [data-test-generators="steps"]';
      const seq = '[data-test-pane="sequence"] [data-test-sequence="steps"]';
      const steps = (): number[] => audio.stepGrids('t-kick')[0]!.steps;
      const pattern = (): string =>
        steps()
          .map((step) => (step ? 'x' : '.'))
          .join('');
      audio.setStep('t-kick', 'steps', 4, 7);
      await settled();

      await click(`${seq} [data-test-gen-tool="right"]`);
      assert.strictEqual(pattern(), '.x...x...x...x..');
      assert.strictEqual(steps()[5], 7, 'the value went round with its step');
      await click(`${seq} [data-test-gen-tool="left"]`);
      assert.strictEqual(pattern(), 'x...x...x...x...');
      await click(`${seq} [data-test-gen-tool="reverse"]`);
      assert.strictEqual(pattern(), '...x...x...x...x');
      await click(`${seq} [data-test-gen-tool="invert"]`);
      assert.strictEqual(pattern(), 'xxx.xxx.xxx.xxx.');
      project.undo();
      await settled();
      assert.strictEqual(
        pattern(),
        '...x...x...x...x',
        'each tool is one step to undo',
      );
      project.undo();
      await settled();
      assert.strictEqual(steps()[4], 7);

      // Or: the generated rhythm is laid over what is there; the 7 stays on its step
      await select(`${seq} [data-test-gen-combine]`, 'or');
      assert.strictEqual(
        pattern(),
        'x...x...x...x...',
        'four evenly, Or-ed with the same four',
      );
      await select(`${seq} [data-test-gen-kind]`, 'binary');
      const number = `${gen} [data-test-gen-dial="number"]`;
      await click(`${number} [data-test-number-entry]`);
      await fillIn(`${number} [data-test-number-input]`, '2');
      await triggerKeyEvent(
        `${number} [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      assert.strictEqual(
        pattern(),
        'x.x.x.x.x.x.x.x.',
        '2 is x. over and over, added to what was there',
      );
      assert.strictEqual(steps()[4], 7, 'a step that stays on keeps its value');
      assert.strictEqual(steps()[2], 1, 'a new hit is 1');
      await select(`${seq} [data-test-gen-combine]`, 'and');
      assert.strictEqual(
        pattern(),
        'x...x...x...x...',
        'And: only where both hit',
      );
      await select(`${seq} [data-test-gen-combine]`, 'xor');
      assert.strictEqual(pattern(), '..x...x...x...x.');
      await select(`${seq} [data-test-gen-combine]`, 'replace');
      assert.strictEqual(pattern(), 'x.x.x.x.x.x.x.x.');
    });

    test('each grid of a track has its own generators; a track’s menu leads to them', async function (assert) {
      view.footerPane = 'sound';
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\n__.transport.sequence('fill', { steps: [0, 0, 1, 0, 0, 0] }, () => {});\nstepGrid('fill');`,
      );
      await click('[data-test-script-toggle]');
      await click(
        '[data-test-track="1"] .track__actions [data-test-menu-button]',
      );
      await click('[data-test-menu-item="Pattern generators"]');
      assert
        .dom('[data-test-pane="sequence"]')
        .exists('the sequence pane, where they are');
      assert.dom('[data-test-generators]').exists({ count: 2 });
      // the array in the script is the default; a generated pattern is stored and wins
      const fill = '[data-test-generators="fill"]';
      await triggerKeyEvent(
        `${fill} [data-test-gen-dial="hits"] [data-test-slider]`,
        'keydown',
        'ArrowUp',
      );
      assert.deepEqual(
        audio.stepGrids('t-kick')[1]!.steps,
        [1, 0, 0, 1, 0, 0],
        'two of six, on the second grid',
      );
      assert.true(audio.stepGrids('t-kick')[1]!.stored);
      assert
        .dom(
          '[data-test-generators="steps"] [data-test-gen-dial="hits"] [data-test-number-entry]',
        )
        .hasText('4', 'the other grid is as it was');
    });

    test('a lane has its own menu, the control’s menu plus Clear all steps and Hide lane; the track’s row draws no lanes', async function (assert) {
      view.footerPane = 'sound';
      await render(<template><AppShell /></template>);
      const labels = (): (string | null)[] =>
        findAll('[data-test-menu-item]').map((item) =>
          item.getAttribute('data-test-menu-item'),
        );
      await click(`${row(FREQUENCY)} [data-test-menu-button]`);
      const control = labels();
      await triggerKeyEvent(document.body, 'keydown', 'Escape');
      await click(`${row(FREQUENCY)} [data-test-lane-button]`);

      const inRow = `${row(FREQUENCY)} [data-test-lane-menu="${FREQUENCY}"]`;
      await click(`${inRow} [data-test-menu-button]`);
      assert.deepEqual(
        labels(),
        [...control, 'Clear all steps', 'Hide lane'],
        'the control’s items, then the lane’s own',
      );
      assert
        .dom('[data-test-menu-item="Clear all steps"]')
        .hasAria('disabled', 'true', 'no step holds a value of its own yet');
      // fully opaque, all the way up
      const menu = find('[data-test-menu]') as HTMLElement;
      for (let el: HTMLElement | null = menu; el; el = el.parentElement) {
        assert.strictEqual(
          getComputedStyle(el).opacity,
          '1',
          `${el.className || el.tagName} is opaque`,
        );
      }
      // a unit chosen here is the control's
      await click('[data-test-menu-item="Note"]');
      assert.strictEqual(
        audio.controls('t-kick').find((c) => c.key === FREQUENCY)!.mode,
        'note',
      );
      assert
        .dom(
          `${row(FREQUENCY)} [data-test-lane="${FREQUENCY}"] [data-test-lane-caption]`,
        )
        .includesText('note');
      assert
        .dom('[data-track-id="t-kick"] [data-lane-step]')
        .doesNotExist('the track’s row draws steps only');

      // the lane's Clear all button is there while a step is set, and clears them
      assert
        .dom(`${row(FREQUENCY)} [data-test-lane-clear]`)
        .hasAttribute('hidden');
      audio.setLaneValue('t-kick', FREQUENCY, 3, 500);
      await settled();
      assert
        .dom(`${row(FREQUENCY)} [data-test-lane-clear]`)
        .doesNotHaveAttribute('hidden');
      await click(`${row(FREQUENCY)} [data-test-lane-clear]`);
      assert.strictEqual(
        (
          project.doc.tracks[0]!.values.controls[FREQUENCY]?.options as
            { stepValues?: unknown[] } | undefined
        )?.stepValues,
        undefined,
        'Clear all',
      );
      project.undo();
      await settled();

      // Clear all steps from the menu: every step follows the control again, one step to undo
      await click(`${inRow} [data-test-menu-button]`);
      await click('[data-test-menu-item="Clear all steps"]');
      const values = (): unknown =>
        (
          project.doc.tracks[0]!.values.controls[FREQUENCY]?.options as
            { stepValues?: unknown[] } | undefined
        )?.stepValues;
      assert.strictEqual(values(), undefined);
      project.undo();
      await settled();
      assert.strictEqual((values() as number[])[3], 500, 'one undo step');

      // Hide lane hides it under the control
      await click(`${inRow} [data-test-menu-button]`);
      await click('[data-test-menu-item="Hide lane"]');
      assert.dom(inRow).doesNotExist();
      assert
        .dom(`${row(FREQUENCY)} [data-test-lane-button]`)
        .hasAttribute('aria-pressed', 'false');
      assert
        .dom(`${row(FREQUENCY)} [data-test-lane-button]`)
        .hasAttribute(
          'data-active',
          'true',
          'the button still says a step is set',
        );
    });

    test('a slider’s lane: the control stays, painted steps hold their own value, the others follow it, one step to undo', async function (assert) {
      view.footerPane = 'sound';
      await render(<template><AppShell /></template>);
      const options = (): Record<string, unknown> | undefined =>
        project.doc.tracks[0]!.values.controls[FREQUENCY]?.options as
          Record<string, unknown> | undefined;
      assert
        .dom(`${row(FREQUENCY)} [data-test-lane-button]`)
        .doesNotHaveAttribute('data-active');
      await click(`${row(FREQUENCY)} [data-test-lane-button]`);
      assert.strictEqual(
        options(),
        undefined,
        'opening the lane stores nothing',
      );
      assert
        .dom(`${row(FREQUENCY)} [data-test-slider]`)
        .exists('the control stays');
      assert.true(
        view.isLaneShown('t-kick', FREQUENCY, false),
        'the lane is open for the track',
      );
      view.footerPane = 'sequence';
      await settled();

      const pane = '[data-test-pane="sequence"] [data-test-step-grid="steps"]';
      assert
        .dom(`${pane} [data-test-lane="${FREQUENCY}"]`)
        .includesText('frequency');
      const bars = findAll(`${pane} [data-lane-step]`);
      assert.strictEqual(bars.length, 16, 'a bar for every step');
      assert.dom(`${pane} [data-locked]`).doesNotExist('every step follows');
      // each bar stands under its step: the same horizontal centre
      const centre = (el: Element): number => {
        const rect = el.getBoundingClientRect();
        return rect.left + rect.width / 2;
      };
      const stepsIn = findAll(`${pane} [data-test-step]`);
      const off = Math.max(
        ...bars.map((bar, index) =>
          Math.abs(centre(bar) - centre(stepsIn[index]!)),
        ),
      );
      assert.true(
        off < 1,
        `bars are in their steps’ columns (worst ${off.toFixed(2)} px)`,
      );

      // a drag across the bars paints them: down on the first, along to the third, low in the bar
      const at = (index: number, share: number) => {
        const rect = bars[index]!.getBoundingClientRect();
        return {
          pointerId: 1,
          button: 0,
          buttons: 1,
          isPrimary: true,
          pointerType: 'mouse',
          clientX: rect.left + rect.width / 2,
          clientY: rect.bottom - share * rect.height,
        };
      };
      await triggerEvent(bars[0]!, 'pointerdown', at(0, 0.5));
      await triggerEvent(document.body, 'pointermove', at(1, 0.25));
      assert
        .dom(`${pane} [data-test-lane-says]`)
        .includesText(
          'step 2',
          'the lane says the value of the bar being dragged',
        );
      await triggerEvent(document.body, 'pointermove', at(2, 0.75));
      await triggerEvent(document.body, 'pointerup', at(2, 0.75));
      const painted = options()!['stepValues'] as (number | null)[];
      assert.true(
        painted.slice(0, 3).every((value) => typeof value === 'number'),
        'three bars set in one drag',
      );
      assert.true(painted[1]! < painted[0]!, 'lower in a bar is a lower value');
      assert.true(painted[2]! > painted[0]!);
      assert.strictEqual(painted[3], null, 'the rest follow the control');
      assert.dom(`${pane} [data-locked]`).exists({ count: 3 });
      project.undo();
      await settled();
      assert.strictEqual(
        options()?.['stepValues'],
        undefined,
        'the whole drag is one step to undo',
      );

      // a double click opens the number box on the bar, in the control's unit
      await triggerEvent(bars[4]!, 'pointerdown', at(4, 0.5));
      await triggerEvent(document.body, 'pointerup', at(4, 0.5));
      await triggerEvent(bars[4]!, 'pointerdown', at(4, 0.5));
      await triggerEvent(document.body, 'pointerup', at(4, 0.5));
      assert.dom(`${pane} [data-test-lane-entry]`).exists();
      await fillIn(
        `${pane} [data-test-lane-entry] [data-test-number-input]`,
        '440',
      );
      await triggerKeyEvent(
        `${pane} [data-test-lane-entry] [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      assert.strictEqual((options()!['stepValues'] as number[])[4], 440);
      assert.strictEqual(
        frequencyOf('t-kick'),
        2000,
        'stopped on the first step, which follows the control',
      );
      // Delete on a bar: it follows the control again
      await triggerKeyEvent(bars[4]!, 'keydown', 'Delete');
      assert.strictEqual(options()?.['stepValues'], undefined);
      await triggerKeyEvent(bars[4]!, 'keydown', 'ArrowUp');

      // the track’s row draws steps only
      assert.dom('[data-test-track="1"] [data-lane-step]').doesNotExist();
      view.footerPane = 'sound';
      await settled();
      assert
        .dom(`${row(FREQUENCY)} [data-test-lane-button]`)
        .hasAttribute(
          'data-active',
          'true',
          'the control says a step holds its own value',
        );
    });

    test('the sequence card header does not move when the length changes, and the generators stand above the grid', async function (assert) {
      view.footerPane = 'sequence';
      await render(<template><AppShell /></template>);
      const card = '[data-test-pane="sequence"] [data-test-sequence="steps"]';
      const boxes = (): string =>
        findAll(`${card} .sequence-card__head > *`)
          .map((el) => {
            const box = el.getBoundingClientRect();
            return `${box.left.toFixed(1)}+${box.width.toFixed(1)}`;
          })
          .join(' ');
      const length = async (value: string): Promise<void> => {
        await click(`${card} [data-test-grid-length] [data-test-number-entry]`);
        await fillIn(
          `${card} [data-test-grid-length] [data-test-number-input]`,
          value,
        );
        await triggerKeyEvent(
          `${card} [data-test-grid-length] [data-test-number-input]`,
          'keydown',
          'Enter',
        );
      };
      await length('9');
      const nine = boxes();
      await length('10');
      assert.strictEqual(boxes(), nine, '9 to 10: nothing moves or resizes');
      assert.dom(`${card} [data-test-grid-script]`).exists('the note’s cell');
      const gen = find(`${card} [data-test-generators]`)!;
      const grid = find(`${card} [data-test-step-grid]`)!;
      assert.true(
        gen.getBoundingClientRect().bottom <= grid.getBoundingClientRect().top,
        'the generators are above the grid',
      );
    });

    test('a grid has a Length dial and a Step menu: stored with the grid, applied at once, and Reset returns to the script’s', async function (assert) {
      view.footerPane = 'sequence';
      await render(<template><AppShell /></template>);
      const card = '[data-test-pane="sequence"] [data-test-sequence="steps"]';
      const sequence = () =>
        audio.engine!.scope('t-kick').scope('script').transport.get('steps')!;
      const options = (): Record<string, unknown> | undefined =>
        project.doc.tracks[0]!.values.controls[STEPS]?.options as
          Record<string, unknown> | undefined;
      assert
        .dom(`${card} [data-test-grid-length] [data-test-number-entry]`)
        .hasText('16');
      assert.dom(`${card} [data-test-grid-step]`).hasValue('1/16');
      assert.dom(`${card} [data-test-grid-script]`).hasText('');

      // typed: twelve steps. The pattern is kept as far as it goes.
      await click(`${card} [data-test-grid-length] [data-test-number-entry]`);
      await fillIn(
        `${card} [data-test-grid-length] [data-test-number-input]`,
        '12',
      );
      await triggerKeyEvent(
        `${card} [data-test-grid-length] [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      assert.strictEqual(sequence().steps.length, 12);
      assert.deepEqual(
        pressedSteps(1),
        [0, 4, 8],
        'the track’s row has twelve steps, the same pattern',
      );
      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 12 });
      assert.strictEqual(options()?.['length'], 12);
      assert
        .dom(`${card} [data-test-grid-script]`)
        .hasText('script: 16 steps', 'what the script says, said quietly');
      assert.true(
        project.doc.tracks[0]!.script.includes('steps: 16'),
        'the script is not touched',
      );

      // the dial by keys; the Step menu
      await triggerKeyEvent(
        `${card} [data-test-grid-length] [data-test-knob]`,
        'keydown',
        'ArrowUp',
      );
      assert.strictEqual(sequence().steps.length, 13);
      await select(`${card} [data-test-grid-step]`, '1/8t');
      assert.strictEqual(sequence().options.step, '1/8t');
      assert
        .dom(`${card} [data-test-grid-script]`)
        .hasText('script: 16 steps, 1/16');
      project.undo();
      await settled();
      assert.strictEqual(
        sequence().options.step,
        '1/16',
        'one undo: the step length',
      );
      project.undo();
      await settled();
      assert.strictEqual(sequence().steps.length, 12, 'and again: the dial');

      // the generator's dials refit: five of twelve becomes five of sixteen
      const gen = `${card} [data-test-generators="steps"]`;
      for (let i = 0; i < 2; i++) {
        await triggerKeyEvent(
          `${gen} [data-test-gen-dial="hits"] [data-test-slider]`,
          'keydown',
          'ArrowUp',
        );
      }
      assert
        .dom(`${gen} [data-test-gen-dial="hits"] [data-test-number-entry]`)
        .hasText('5');
      await click(`${card} [data-test-grid-length] [data-test-number-entry]`);
      await fillIn(
        `${card} [data-test-grid-length] [data-test-number-input]`,
        '16',
      );
      await triggerKeyEvent(
        `${card} [data-test-grid-length] [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      assert
        .dom(`${gen} [data-test-gen-dial="hits"] [data-test-number-entry]`)
        .hasText('5');
      assert.strictEqual(
        pressedSteps(1).length,
        5,
        'made again for the new length',
      );

      // Reset: the pattern, the length and the step length, in one step
      await select(`${card} [data-test-grid-step]`, '1/8');
      await click(`${card} [data-test-steps-reset]`);
      assert.strictEqual(sequence().steps.length, 16);
      assert.strictEqual(sequence().options.step, '1/16');
      assert.strictEqual(options()?.['length'], undefined);
      assert.strictEqual(options()?.['step'], undefined);
      project.undo();
      await settled();
      assert.strictEqual(
        sequence().options.step,
        '1/8',
        'one undo brings all of it back',
      );
      assert.strictEqual(pressedSteps(1).length, 5);
    });

    test('the footer’s sequence pane lists them, with Reset for a stored pattern; two step grids are named', async function (assert) {
      view.footerPane = 'sequence';
      await render(<template><AppShell /></template>);

      assert
        .dom('[data-test-pane="sequence"] [data-test-sequence="steps"]')
        .exists();
      assert
        .dom('[data-test-pane="sequence"] [data-test-step]')
        .exists({ count: 16 });
      assert
        .dom('[data-test-steps-reset]')
        .exists(
          'the starting pattern is the grid’s own: stored, not in the script',
        );
      assert.deepEqual(pressedSteps(1), [0, 4, 8, 12]);

      await click('[data-test-pane="sequence"] [data-test-step="1"]');
      assert.deepEqual(
        pressedSteps(1),
        [0, 1, 4, 8, 12],
        'the row’s grid follows',
      );
      await click('[data-test-steps-reset]');

      assert.deepEqual(
        pressedSteps(1),
        [],
        'reset: the script gives a count and no pattern, so the grid is empty',
      );
      assert.strictEqual(
        project.doc.tracks[0]?.values.controls['stepGrid › steps'],
        undefined,
      );
      assert.dom('[data-test-steps-reset]').doesNotExist();
      project.undo();
      await settled();
      assert.deepEqual(pressedSteps(1), [0, 1, 4, 8, 12], 'undone');

      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\n__.transport.sequence('fill', { steps: [0, 0, 1] }, () => {});\nstepGrid('fill', { label: 'Fill' });`,
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
        .doesNotExist('one step grid needs no name');
    });
  });

  module('controls', function () {
    test('the controls pane lists what the script declares, grouped by node, in order', async function (assert) {
      await render(<template><AppShell /></template>);

      assert.deepEqual(
        findAll('[data-test-control-group]').map((group) =>
          group.getAttribute('data-test-control-group'),
        ),
        ['filter', 'level'],
        'in the order of the chain the script wrote, not of the declarations; the sampler is a source: its controls are in the source tab',
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
        ['#filter › frequency', '#filter › q', '#level › gain'],
        'the sampler’s speed is not listed here: it is in the source tab',
      );
      assert
        .dom('[data-test-control-group="filter"] [data-test-group-type]')
        .hasText('lowpass', 'a section leads with what the node is');
      assert
        .dom('[data-test-control-group="filter"] [data-test-group-id]')
        .hasText('filter', 'then the id the script gave it');
      assert.dom('[data-test-by-position]').doesNotExist();
      assert
        .dom('[data-test-chain-title]')
        .doesNotExist('one chain needs no name');
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

      assert.strictEqual(
        frequencyOf('t-kick'),
        440,
        `stored ${JSON.stringify(project.doc.tracks[0]?.values.controls[FREQUENCY])}; field still open: ${String(find(`${row(FREQUENCY)} [data-test-number-input]`) !== null)}; focus on ${document.activeElement?.tagName}.${document.activeElement?.className}`,
      );
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
          'Hz',
          'Note',
          'Note and cents',
          'Glide: off…',
          'Reset glide',
          'Reset',
          'Show in script',
          'Learn MIDI (coming)',
        ],
      );
      assert
        .dom('[data-test-menu-item="Hz"]')
        .hasAria('checked', 'true', 'the units a frequency can be shown in');
      assert
        .dom('[data-test-menu-item="Reset"]')
        .hasAria('disabled', 'true', 'nothing stored: nothing to reset');
      assert
        .dom('[data-test-menu-item="Learn MIDI (coming)"]')
        .hasAria('disabled', 'true');

      await click('[data-test-menu-item="Note"]');
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
      assert.dom('[data-test-menu-item="Note"]').hasAria('checked', 'true');
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

    test('controls() gives every node a section; sections close, and stay closed; a control of its own is in the Track section', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\ncontrols();\nconst density = slider('density', { min: 0, max: 1, default: 0.5 });\ntoggle('fills', { default: true });`,
      );
      await click('[data-test-script-toggle]');

      const sections = (): (string | null)[] =>
        findAll('[data-test-control-group]').map((group) =>
          group.getAttribute('data-test-control-group'),
        );
      assert.deepEqual(
        sections(),
        ['own', 'filter', 'level'],
        'the Track section first, then a section per node that is not a source',
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
      assert
        .dom('[data-test-control-more]')
        .doesNotExist('no "more": everything is in its section');

      assert
        .dom('[data-test-control-group="sampler"]')
        .doesNotExist('a source has no section among the processors');
      const sampler = '[data-test-control-group="filter"]';
      assert
        .dom(`${row('#level › gain')} [data-test-knob]`)
        .exists('the explicit knob wins over the slider controls() would give');
      assert
        .dom(
          '[data-test-pane="controls"] [data-test-control="#euclip-pan › pan"]',
        )
        .doesNotExist();

      assert.dom(sampler).hasAttribute('open', '', 'open by default');
      await click(`${sampler} summary`);
      assert.dom(sampler).doesNotHaveAttribute('open');
      assert.false(view.isSectionOpen('t-kick', 'filter'));
      await click('[data-test-track="2"] [data-test-track-select]');
      await click('[data-test-track="1"] [data-test-track-select]');
      assert
        .dom(sampler)
        .doesNotHaveAttribute('open', 'still closed after looking elsewhere');
      assert.dom('[data-test-control-group="level"]').hasAttribute('open', '');

      await click(`${row('fills')} [data-test-toggle]`);
      assert.false(project.doc.tracks[0]?.values.controls['fills']?.value);
    });

    test('an error or a warning is laid over the foot of the footer: nothing above it moves', async function (assert) {
      await render(<template><AppShell /></template>);
      const top = (selector: string): number =>
        Math.round(find(selector)!.getBoundingClientRect().top);
      const left = (selector: string): number =>
        Math.round(find(selector)!.getBoundingClientRect().left);
      const grid = '[data-test-track="1"] [data-test-step-grid]';
      const before = {
        pane: top('[data-test-pane="controls"]'),
        firstRow: top(row(FREQUENCY)),
        footer: top('[data-test-track-footer]'),
        gridLeft: left(grid),
        gridTop: top(grid),
        list: find('[data-test-track-list]')!.getBoundingClientRect().height,
      };
      await click('[data-test-script-toggle]');
      const good = project.doc.tracks[0]!.script;
      const editorTop = top('[data-test-code-editor]');
      const scriptButton = find(
        '[data-test-script-toggle]',
      )!.getBoundingClientRect();
      const editorHeight = find(
        '[data-test-code-editor]',
      )!.getBoundingClientRect().height;

      await typeScript(
        (text) =>
          `${text}\nthrow new Error('${'a very long message '.repeat(20)}');\n`,
      );
      assert.dom('[data-test-script-error]').exists();
      assert.strictEqual(
        top('[data-test-code-editor]'),
        editorTop,
        'the editor’s top edge has not moved',
      );
      assert.strictEqual(
        find('[data-test-code-editor]')!.getBoundingClientRect().height,
        editorHeight,
        'nor has it changed size',
      );
      assert.strictEqual(
        top('[data-test-track-footer]'),
        before.footer,
        'nor the footer',
      );
      assert.strictEqual(
        left(grid),
        before.gridLeft,
        'the track row’s "!" does not push its grid along',
      );
      assert.strictEqual(top(grid), before.gridTop);
      assert.dom('[data-test-track="1"] [data-test-track-error]').exists();
      assert.deepEqual(
        find('[data-test-script-toggle]')!.getBoundingClientRect().toJSON(),
        scriptButton.toJSON(),
        'nor does the Script button change size or place for its "!"',
      );

      const status = find('[data-test-footer-status]')!.getBoundingClientRect();
      const footer = find('[data-test-track-footer]')!.getBoundingClientRect();
      assert.true(
        status.bottom <= footer.bottom + 1,
        'the strip is at the foot of the footer',
      );
      assert.true(status.top >= footer.top, 'and inside it');
      assert.true(
        status.height < 60,
        `one line of a long message to start with (${status.height}px)`,
      );
      assert
        .dom('[data-test-script-error]')
        .hasAttribute(
          'title',
          /a very long message a very long message/,
          'the whole of it is there to be read',
        );
      await click('[data-test-status-toggle]');
      assert.true(
        find('[data-test-footer-status]')!.getBoundingClientRect().height >
          status.height,
        '"More" shows the whole message',
      );
      // (pressing More can scroll the small test page to keep the button in view: measure inside the footer)
      assert.strictEqual(
        top('[data-test-code-editor]') - top('[data-test-track-footer]'),
        editorTop - before.footer,
        'still without moving the editor',
      );
      await click('[data-test-status-toggle]');
      // Put back whatever the test page scrolled to bring the button into view; nothing of the app's
      // own may have scrolled.
      const scrolled: string[] = [];
      for (
        let el = find('[data-test-track-footer]');
        el;
        el = el.parentElement
      ) {
        if (el.scrollTop !== 0) {
          scrolled.push(el.id || el.className || el.tagName);
          el.scrollTop = 0;
        }
      }
      assert.deepEqual(
        scrolled.filter((name) => !/ember-testing|HTML|BODY/i.test(name)),
        [],
        'nothing in the app scrolled',
      );

      await click('[data-test-script-toggle]');
      assert.strictEqual(
        top('[data-test-pane="controls"]'),
        before.pane,
        'the panes have not moved either',
      );
      assert.strictEqual(top(row(FREQUENCY)), before.firstRow);

      await click('[data-test-script-toggle]');
      await typeScript(() => `${good}slider('#nope', 'frequency');\n`);
      assert.dom('[data-test-script-error]').doesNotExist();
      assert
        .dom('[data-test-script-warnings]')
        .exists('a warning is shown the same way');
      assert.strictEqual(top('[data-test-code-editor]'), editorTop);

      await typeScript(() => good);
      assert.dom('[data-test-footer-status]').doesNotExist('cleared');
      assert.strictEqual(
        top('[data-test-code-editor]'),
        editorTop,
        'and clearing moves nothing',
      );
      assert.strictEqual(
        find('[data-test-track-list]')!.getBoundingClientRect().height,
        before.list,
      );
    });

    test('a declaration that cannot work is a warning with its line; the rest of the script runs', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}slider('#nope', 'frequency');\nstepGrid('missing');\n`,
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

    test('an empty pane says so; how to add a control is behind its "?"', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        () => `__().sampler({ id: 's', buffer: 'kick' }).to('channel');`,
      );
      await click('[data-test-script-toggle]');

      assert
        .dom('[data-test-pane="controls"] [data-test-pane-empty]')
        .hasText(
          'This script declares no controls.',
          'what is so, and no more',
        );
      assert.dom('[data-test-control]').doesNotExist();
      assert
        .dom('[data-test-hint]')
        .doesNotExist('no help until it is asked for');
      await click('[data-test-controls-hint] [data-test-hint-button]');
      assert
        .dom('[data-test-controls-hint] [data-test-hint]')
        .includesText("slider('#filter', 'frequency')");
      assert
        .dom('[data-test-controls-hint] [data-test-hint]')
        .includesText('controls()');
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
      assert.strictEqual(scope.bus('channel').gain.value, 0);
      assert.strictEqual(
        [...scope.bus('channel').inserts][0]?.param('pan').value,
        -1,
      );
    });

    test('chains are separate blocks, a bus is a block with its level first, and a node with no id says so', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        () => `__.bus('drums').compressor({ id: 'squash' }).to('channel');
__().sampler({ buffer: 'kick' }).lowpass(900).highpass({ id: 'thin', frequency: 80 }).lowpass(4000).to('drums');
__().sine(60).gain(0).to('channel');
controls();
slider(__.bus('drums'), 'gain');
`,
      );
      await click('[data-test-script-toggle]');
      assert.dom('[data-test-footer-status]').doesNotExist();

      const blocks = findAll('[data-test-control-chain]').map((chain) => ({
        title:
          chain.querySelector('[data-test-chain-title]')?.textContent?.trim() ??
          null,
        sections: [...chain.querySelectorAll('summary')].map((summary) =>
          (summary.textContent ?? '').replace(/\s+/g, ' ').trim(),
        ),
      }));
      assert.deepEqual(blocks, [
        { title: 'drums bus', sections: ['level', 'compressor squash'] },
        {
          title: 'chain 1',
          sections: ['lowpass 1 no id', 'highpass thin', 'lowpass 2 no id'],
        },
        { title: 'chain 2', sections: ['gain no id'] },
      ]);
      assert.false(
        find('[data-test-pane="controls"]')!.textContent.includes('lowpass-'),
        'an automatic id is never shown',
      );
      assert
        .dom('[data-test-control-group="lowpass-1"] [data-test-by-position]')
        .hasAttribute(
          'title',
          /its stored values follow its position in the script/,
        );
      await click('[data-test-controls-hint] [data-test-hint-button]');
      assert
        .dom('[data-test-controls-hint] [data-test-hint]')
        .includesText(
          'Give it one',
          'what "no id" means is in the pane’s hints',
        );
      await click('[data-test-controls-hint] [data-test-hint-button]');
      assert
        .dom(
          `[data-test-control-chain][data-bus="drums"] ${row('bus drums › gain')} [data-test-slider]`,
        )
        .hasAria('valuenow', '1');
    });

    test('a speed’s menu (in the source tab, with the waveform) has a sequence sync item for each named sequence; choosing one is one step to undo', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) =>
          `${text}\n__.transport.sequence('fills', { steps: 8, step: '1/16' }, () => {});\n`,
      );
      await click('[data-test-script-toggle]');
      view.footerPane = 'sound';
      await waitUntil(() =>
        find('[data-test-speed-menu] [data-test-menu-button]'),
      );
      const speedOf = (): number =>
        [
          ...audio.engine!.scope('t-kick').scope('script').select('#sampler'),
        ][0]!.param('speed').value as number;
      await click('[data-test-speed-menu] [data-test-menu-button]');
      assert.deepEqual(
        findAll('[data-test-menu-item]')
          .map((item) => item.textContent?.trim())
          .slice(0, 5),
        [
          'Ratio',
          'Semitones',
          'Cents',
          'Sequence sync: steps',
          'Sequence sync: fills',
        ],
      );
      const length = audio.engine!.buffers.get('kick')!.duration!;
      await click('[data-test-menu-item="Sequence sync: fills"]');
      // eight sixteenths at 120 are 1 s; the speed was 1, and the nearest allowed multiplier of
      // (the sound's length / 1 s) to that is what the control now holds
      const state = project.doc.tracks[0]!.values.controls['#sampler › speed']!;
      assert.deepEqual(state.options, {
        mode: 'sequence-sync',
        sequence: 'fills',
      });
      const multiplier = state.value as number;
      assert.true(
        Math.abs(speedOf() - length * multiplier) < 1e-6,
        `the speed is the multiplier (${multiplier}) of length / sequence (${speedOf()})`,
      );

      project.undo();
      await settled();
      assert.strictEqual(
        project.doc.tracks[0]!.values.controls['#sampler › speed'],
        undefined,
        'one undo: the unit and the number together',
      );
      assert.strictEqual(speedOf(), 1, 'and the speed it had');
    });

    test('Glide in a control’s menu opens a time box; the time is kept with the control, marked on its row, and undone as one step', async function (assert) {
      await render(<template><AppShell /></template>);
      const frequency = row(FREQUENCY);
      const stored = (): unknown =>
        project.doc.tracks[0]!.values.controls[FREQUENCY]?.options;
      await click(`${frequency} [data-test-menu-button]`);
      assert.dom('[data-test-menu-item="Glide: off…"]').exists();
      assert
        .dom('[data-test-menu-item="Reset glide"]')
        .hasAria('disabled', 'true');
      await click('[data-test-menu-item="Glide: off…"]');
      assert.dom(`${frequency} [data-test-glide-box]`).exists();
      await click(
        `${frequency} [data-test-glide-box] [data-test-number-entry]`,
      );
      await fillIn(
        `${frequency} [data-test-glide-box] [data-test-number-input]`,
        '1s',
      );
      await triggerKeyEvent(
        `${frequency} [data-test-glide-box] [data-test-number-input]`,
        'keydown',
        'Enter',
      );
      assert.deepEqual(stored(), { glide: 1 });
      assert
        .dom(`${frequency} [data-test-glide-box] [data-test-number-entry]`)
        .hasText('1 s');
      await click(`${frequency} [data-test-glide-done]`);
      assert.dom(`${frequency} [data-test-glide-box]`).doesNotExist();

      // the arrow keys step it, as on the other value boxes
      await click(`${frequency} [data-test-menu-button]`);
      await click('[data-test-menu-item="Glide: 1 s…"]');
      await triggerKeyEvent(
        `${frequency} [data-test-glide-box] [data-test-number-entry]`,
        'keydown',
        'ArrowDown',
      );
      const stepped = (stored() as { glide: number }).glide;
      assert.true(stepped < 1, `a step shorter (${stepped})`);
      assert.true(stepped > 0.5);
      await triggerKeyEvent(document.body, 'keydown', 'Escape');
      assert
        .dom(`${frequency} [data-test-glide-box]`)
        .doesNotExist('Escape closes it');

      project.undo();
      await settled();
      assert.deepEqual(stored(), { glide: 1 }, 'undo: the step before');
      project.undo();
      await settled();
      assert.strictEqual(stored(), undefined, 'and again: no glide');
      project.redo();
      await settled();

      await click(`${frequency} [data-test-menu-button]`);
      await click('[data-test-menu-item="Reset glide"]');
      assert.strictEqual(stored(), undefined, 'Reset glide forgets it');

      // a toggle has no such entry
      await click('[data-test-script-toggle]');
      await typeScript(
        (text) => `${text}\ntoggle('fills', { default: true });\n`,
      );
      await click('[data-test-script-toggle]');
      await click(`${row('fills')} [data-test-menu-button]`);
      assert.false(
        findAll('[data-test-menu-item]').some((item) =>
          /glide/i.test(item.textContent ?? ''),
        ),
        'no Glide for a toggle',
      );
    });

    test('a control’s menu offers the units its parameter can be shown in; the value stays in the parameter’s own', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await click('[data-test-script-toggle]');

      const units = async (key: string): Promise<(string | undefined)[]> => {
        await click(`${row(key)} [data-test-menu-button]`);
        const items = findAll('[data-test-menu-item]')
          .map((item) => item.textContent?.trim())
          .filter(
            (label) =>
              label !== 'Reset' &&
              !/glide/i.test(label ?? '') &&
              !/^(Single value|Per step)/.test(label ?? '') &&
              label !== 'Show in script' &&
              label !== 'Learn MIDI (coming)',
          );
        await triggerKeyEvent('[role="menu"]', 'keydown', 'Escape');
        return items;
      };
      assert.deepEqual(await units('#level › gain'), ['Linear', 'Decibels']);
      assert.deepEqual(await units('#filter › q'), [
        'Linear',
        'Exponential',
        'Stepped',
      ]);
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
        .includesText("sampler({ id: 'sampler' })");
      assert.dom('[data-test-footer-ui]').doesNotExist();

      await click('[data-test-track="3"] [data-test-track-select]');
      assert
        .dom('[data-test-footer-script] .cm-content')
        .includesText('frequency: 6000');

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
          .replace("{ steps: 16, step: '1/16' }", '{ steps: 6 }')
          .replace(
            ".lowpass({ id: 'filter', frequency: 2000, q: 2 })",
            ".highpass({ id: 'filter', frequency: 90, q: 1 })",
          ),
      );

      assert
        .dom('[data-test-track="1"] [data-test-step]')
        .exists({ count: 6 }, 'the grid has the new length');
      assert.deepEqual(
        pressedSteps(1),
        [0, 4],
        'the grid’s pattern, as far as it goes',
      );
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
    test('a click on a row’s background selects its track; its controls keep to their own jobs', async function (assert) {
      await render(<template><AppShell /></template>);
      const current = (): string =>
        find('[data-test-track][aria-current="true"]')!.getAttribute(
          'data-test-track',
        )!;
      await click('[data-test-track="1"] [data-test-track-select]');
      assert.strictEqual(current(), '1');

      // the row itself (its padding and gaps), and what is in it that is not a control
      await click('[data-test-track="2"] [data-test-track-row]');
      assert.strictEqual(current(), '2', 'the row’s background');
      await click('[data-test-track="3"] .track__sequence');
      assert.strictEqual(current(), '3', 'the space the grid sits in');
      await click('[data-test-track="1"] .track__source');
      assert.strictEqual(current(), '1', 'beside the name');
      await click('[data-test-track="output"] [data-test-track-row]');
      assert.strictEqual(current(), 'output', 'the main output’s row too');
      assert.false(project.canUndo, 'selecting is not something to undo');

      // a step toggles, once, and (as before) does not select
      const before = pressedSteps(2);
      await click('[data-test-track="2"] [data-test-step="5"]');
      assert.deepEqual(
        pressedSteps(2),
        [...before, 5].sort((a, b) => a - b),
        'a step is toggled exactly once',
      );
      assert.strictEqual(current(), 'output', 'and selects nothing');
      await click('[data-test-track="2"] .step-grid');
      assert.strictEqual(
        current(),
        'output',
        'nor does the grid between steps',
      );

      // the row is not a button, and has none inside one
      assert.dom('[data-test-track-row][role]').doesNotExist();
      assert.dom('[data-test-track-row][tabindex]').doesNotExist();
      assert
        .dom('[data-test-track="2"] [data-test-track-select]')
        .hasTagName('button', 'the number is still the control that selects');
    });

    test('a track is called after its sound until it is named in the footer; Duplicate copies it, just after', async function (assert) {
      await render(<template><AppShell /></template>);
      const names = (): string[] =>
        findAll('[data-test-track-name]').map((name) =>
          name.textContent.trim(),
        );
      const before = names();
      await click('[data-test-new-track]');
      const order = before.length + 1;
      assert.strictEqual(project.tracks[order - 1]!.name, '');
      assert.strictEqual(names()[order - 1], 'kick', 'called after its sound');
      assert.dom('[data-test-footer-name]').hasValue('');
      assert.dom('[data-test-footer-name]').hasAttribute('placeholder', 'kick');

      await fillIn('[data-test-footer-name]', '  Boom  ');
      assert.strictEqual(project.tracks[order - 1]!.name, 'Boom');
      assert.strictEqual(names()[order - 1], 'Boom');
      assert.dom('[data-test-footer-name]').hasValue('Boom');
      await fillIn('[data-test-footer-name]', '');
      assert.strictEqual(
        names()[order - 1],
        'kick',
        'emptied: its sound again',
      );
      await fillIn('[data-test-footer-name]', 'Boom');

      await click(
        `[data-test-track="${order}"] .track__actions [data-test-menu-button]`,
      );
      await click('[data-test-menu-item="Duplicate"]');
      const copy = project.tracks[order]!;
      const original = project.tracks[order - 1]!;
      assert.strictEqual(names()[order], 'Boom copy', 'just after it');
      assert.notStrictEqual(copy.id, original.id);
      assert.strictEqual(copy.script, original.script);
      assert.deepEqual(copy.values, original.values);
      assert
        .dom(`[data-test-track="${order + 1}"]`)
        .hasAria('current', 'true', 'and selected');
      project.undo();
      await settled();
      assert.strictEqual(project.tracks.length, order, 'one undo');
    });

    test('New Track adds a track from the template, with its grid and controls, and selects it', async function (assert) {
      await render(<template><AppShell /></template>);

      await click('[data-test-new-track]');

      assert.dom('[data-test-track]').exists({ count: 5 });
      assert.dom('[data-test-track="4"]').hasAria('current', 'true');
      assert
        .dom('[data-test-track="4"] [data-test-track-name]')
        .hasText('kick', 'unnamed: called after its sound');
      assert
        .dom('[data-test-track="4"] [data-test-step]')
        .exists({ count: 16 });
      assert.deepEqual(pressedSteps(4), [0]);
      assert.dom('[data-test-footer-title]').includesText('Track 4');
      assert.deepEqual(
        findAll('[data-test-control]').map((el) =>
          el.getAttribute('data-test-control'),
        ),
        ['#level › gain'],
        'playable without typing (the sampler’s controls are in the source tab)',
      );
      const id = project.doc.tracks[3]!.id;
      assert.strictEqual(audio.error(id), null, 'and it runs');
      assert.deepEqual(audio.warnings(id), []);
    });

    test('a track is removed from its menu, and Undo brings it back', async function (assert) {
      await render(<template><AppShell /></template>);

      await click(
        '[data-test-track="2"] .track__actions [data-test-menu-button]',
      );
      assert
        .dom('[data-test-track="2"] .track__actions [data-test-menu-button]')
        .hasAria('expanded', 'true');
      await click('[data-test-track="2"] [data-test-menu-item="Remove"]');

      assert.dom('[data-test-track]').exists({ count: 3 });
      assert.dom('[data-test-track="2"] [data-test-track-name]').hasText('hat');
      assert.deepEqual(
        audio.stepGrids('t-snare'),
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

    test('removing the selected track from its menu moves the selection to a neighbour; Undo brings it back with its values; Pattern generators selects the track and shows the sequence pane', async function (assert) {
      view.footerPane = 'sound';
      await render(<template><AppShell /></template>);
      await click('[data-test-track="2"] [data-test-track-select]');
      assert.dom('[data-test-track="2"]').hasAttribute('aria-current', 'true');
      await click(
        '[data-test-track="2"] .track__actions [data-test-menu-button]',
      );
      await click('[data-test-track="2"] [data-test-menu-item="Remove"]');
      assert.dom('[data-test-track]').exists({ count: 3 });
      assert
        .dom('[data-test-track="2"]')
        .hasAttribute('aria-current', 'true', 'the next track is selected');
      assert.dom('[data-test-track="2"] [data-test-track-name]').hasText('hat');
      await click('[data-test-undo]');
      assert
        .dom('[data-test-track="2"] [data-test-track-name]')
        .hasText('snare');
      assert.deepEqual(pressedSteps(2), [4, 12, 15], 'its pattern is back');

      await click(
        '[data-test-track="1"] .track__actions [data-test-menu-button]',
      );
      await click(
        '[data-test-track="1"] [data-test-menu-item="Pattern generators"]',
      );
      assert.strictEqual(view.footerPane, 'sequence');
      assert.dom('[data-test-track="1"]').hasAttribute('aria-current', 'true');
    });

    test('the tempo field is the person’s while they type in it: nothing writes into it until they are done', async function (assert) {
      await render(<template><AppShell /></template>);
      const tempo = '[data-test-transport-tempo]';
      const field = find(tempo) as HTMLInputElement;
      /** One key's worth of typing: the field's text becomes this, as a key press makes it. */
      const typed = async (text: string): Promise<void> => {
        field.value = text;
        await triggerEvent(tempo, 'input');
      };
      /** Something else changes the project, as a script's callback does while it plays. */
      const elsewhere = async (level: number): Promise<void> => {
        project.apply(
          { type: 'setTrackLevel', id: 't-kick', level },
          { derived: true },
        );
        await settled();
      };

      await focus(tempo);
      assert.dom(tempo).hasValue('120');
      // Backspace, Backspace, Backspace: the project changing between the keys
      await typed('12');
      await elsewhere(0.9);
      assert
        .dom(tempo)
        .hasValue(
          '12',
          'after one Backspace, with the project changing under it',
        );
      await typed('1');
      await elsewhere(0.8);
      assert.dom(tempo).hasValue('1');
      await typed('');
      await elsewhere(0.7);
      assert
        .dom(tempo)
        .hasValue('', 'empty stays empty: the old tempo is not written back');
      assert.strictEqual(
        project.doc.bpm,
        120,
        'and nothing has been committed',
      );
      await typed('9');
      await elsewhere(0.6);
      assert.dom(tempo).hasValue('9');
      await typed('96');
      await elsewhere(0.5);
      assert.dom(tempo).hasValue('96');
      assert.strictEqual(
        project.doc.bpm,
        120,
        'still not committed: half a number is not a tempo',
      );
      const undoable = project.canUndo;
      await triggerEvent(tempo, 'change'); // Enter, or leaving the field
      assert.strictEqual(project.doc.bpm, 96, 'committed');
      assert.strictEqual(audio.engine!.transport.bpm, 96);
      assert.dom(tempo).hasValue('96');
      project.undo();
      await settled();
      assert.strictEqual(
        project.doc.bpm,
        120,
        'one step to undo for the whole edit',
      );
      assert.strictEqual(project.canUndo, undoable);
      assert
        .dom(tempo)
        .hasValue(
          '96',
          'the field has focus still: an undo does not write into it either',
        );
      await triggerEvent(tempo, 'blur');
      await new Promise((resolve) => setTimeout(resolve, 20));
      field.blur();
      await settled();
      await new Promise((resolve) => setTimeout(resolve, 20));
      assert
        .dom(tempo)
        .hasValue(
          '120',
          'once focus has left, it shows the tempo the project has',
        );

      // not focused: a change from elsewhere (an undo, a script) shows at once
      project.apply({ type: 'setBpm', bpm: 140 });
      await settled();
      assert.dom(tempo).hasValue('140');

      // Escape gives up what was typed; nothing, or nonsense, puts the stored tempo back
      await focus(tempo);
      await typed('7');
      await triggerKeyEvent(tempo, 'keydown', 'Escape');
      assert.dom(tempo).hasValue('140', 'Escape restores');
      assert.strictEqual(project.doc.bpm, 140);
      await typed('');
      await triggerEvent(tempo, 'change');
      assert
        .dom(tempo)
        .hasValue('140', 'nothing typed: the stored tempo again');
      assert.strictEqual(project.doc.bpm, 140);
      await typed('9999');
      await triggerEvent(tempo, 'change');
      assert.strictEqual(
        project.doc.bpm,
        500,
        'out of range is brought into it',
      );
      assert.dom(tempo).hasValue('500');
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

    test('Stop stops everything in one press: the sequencer, and the rest of the sound', async function (assert) {
      await render(<template><AppShell /></template>);
      const transport = audio.engine!.transport;
      const stop = '[data-test-transport-stop]';
      const silenced: number[] = [];
      const silence = audio.runner!.silence.bind(audio.runner);
      audio.runner!.silence = () => {
        silenced.push(1);
        silence();
      };
      const before = JSON.stringify(project.doc);
      const level = audio.engine!.root.bus('main').gain.value;
      const undoable = project.canUndo;

      assert.dom(stop).hasAttribute('aria-label', 'Stop');
      await click('[data-test-transport-play]');
      await click(stop);
      assert.strictEqual(transport.state, 'stopped');
      assert.deepEqual(silenced, [1], 'one press silences');
      assert.false(audio.playing);
      assert.dom(stop).hasAttribute('aria-label', 'Stop', 'no second stage');

      await click(stop);
      assert.deepEqual(
        silenced,
        [1, 1],
        'a press with nothing going is harmless',
      );
      assert.strictEqual(audio.engine!.root.bus('main').gain.value, level);

      assert.strictEqual(
        JSON.stringify(project.doc),
        before,
        'nothing written',
      );
      assert.strictEqual(project.canUndo, undoable, 'no step to undo');
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
        key: stepGridKey('steps'),
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
