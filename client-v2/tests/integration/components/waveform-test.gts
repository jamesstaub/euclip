import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  findAll,
  focus,
  render,
  select,
  settled,
  triggerEvent,
  triggerKeyEvent,
  waitFor,
} from '@ember/test-helpers';
import { EditorView } from '@codemirror/view';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { newSlicedLoopTrack } from 'client-v2/project/default-project';
import { LOOP_SLICES } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

const STAGE = '[data-test-waveform-stage]';
const handle = (id: string): string => `[data-test-waveform-handle="${id}"]`;
const value = (id: string): string =>
  `[data-test-waveform-value="${id}"] [data-test-number-entry]`;

/**
 * A pointer event on the stage: a share of the way along it (plus `px` of the stage's own pixels), and
 * `fromTop` of its own pixels down. (The test page draws the app at half size; the editor works in its
 * own pixels whatever the scale.)
 */
function at(
  along: number,
  fromTop: number,
  more: { px?: number } & Record<string, unknown> = {},
) {
  const stage = find(STAGE) as HTMLElement;
  const rect = stage.getBoundingClientRect();
  const scaleX = rect.width / stage.offsetWidth;
  const scaleY = rect.height / stage.offsetHeight;
  const { px = 0, ...rest } = more;
  return {
    pointerId: 1,
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerType: 'mouse',
    // (inside the stage's border, where the picture is)
    clientX:
      rect.left + (stage.clientLeft + along * stage.clientWidth + px) * scaleX,
    clientY: rect.top + (stage.clientTop + fromTop) * scaleY,
    ...rest,
  };
}

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
  await settled();
}

module('Integration | Component | waveform', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  let project: ProjectService;
  let audio: AudioService;
  let loopId: string;
  hooks.beforeEach(function () {
    view = this.owner.lookup('service:view');
    project = this.owner.lookup('service:project');
    audio = this.owner.lookup('service:audio');
    view.footerOpen = true;
    view.footerPane = 'source';
  });

  /** The app with a sliced-loop track added and selected, its waveform drawn. */
  async function open(): Promise<void> {
    await render(<template><AppShell /></template>);
    await click('[data-test-new-track-kinds]');
    await click('[data-test-new-sliced-loop]');
    loopId = project.doc.tracks.at(-1)!.id;
    await waitFor(`${STAGE}[data-ready]`);
    await settled();
  }

  const param = (name: string): unknown =>
    audio.sampler(loopId, 'sampler')!.param(name).value;
  const stored = (key: string): unknown =>
    project.doc.tracks.at(-1)!.values.controls[key]?.value;

  test('the source pane shows a waveform for each one the script declares, and says how to get one', async function (assert) {
    await render(<template><AppShell /></template>);
    await waitFor(`${STAGE}[data-ready]`);
    assert
      .dom('[data-test-pane="source"] [data-test-waveform]')
      .exists({ count: 1 });
    assert
      .dom('[data-test-waveform="sampler"]')
      .hasAria('label', '#sampler waveform');
    assert.dom('[data-test-sound-select]').hasValue('kick');
    assert.dom(`${STAGE} canvas`).exists();

    await click('[data-test-script-toggle]');
    await typeScript((text) => text.replace("waveform('#sampler');", ''));
    await click('[data-test-script-toggle]');
    assert.dom('[data-test-waveform]').doesNotExist();
    assert
      .dom('[data-test-pane="source"] [data-test-pane-empty] span')
      .hasText('This script declares no source.');
    await click('[data-test-source-hint] [data-test-hint-button]');
    assert
      .dom('[data-test-source-hint] [data-test-hint]')
      .includesText("waveform('#sampler')");
  });

  test('New Track’s other kind is a sliced loop, which plays', async function (assert) {
    await open();
    assert.strictEqual(project.doc.tracks.length, 4);
    assert.dom('[data-test-footer-title]').includesText('Track 4');
    assert.dom('[data-test-sound-select]').hasValue('loop');
    assert.strictEqual(audio.error(loopId), null);
    assert.deepEqual(audio.warnings(loopId), []);
    assert.dom('[data-test-slices-toggle]').hasText('Slices (16)');
    assert
      .dom('[data-test-slice-marker]')
      .exists(
        { count: 15 },
        'a flag for each boundary between the sound’s ends',
      );
    assert.dom(handle('start')).hasAria('valuenow', '0');
    assert.dom(handle('end')).hasAria('valuenow', '4');
    assert.dom(handle('end')).hasAria('valuetext', '4 s');
    assert
      .dom(handle('loopStart'))
      .doesNotExist('the loop’s handles are there while the loop is on');
  });

  test('a handle is dragged by its tab, follows the pointer off the editor, and is one step to undo', async function (assert) {
    await open();
    // the start handle's tab hangs from the top, to the right of its line at the left edge
    await triggerEvent(STAGE, 'pointerdown', at(0, 26, { px: 6 }));
    assert.strictEqual(param('start'), 0, 'pressing a handle does not move it');
    await triggerEvent(document.body, 'pointermove', at(0.25, 400, { px: 6 }));
    assert.true(
      Math.abs((param('start') as number) - 1) < 0.01,
      `a quarter of the way along: 1 s (${String(param('start'))})`,
    );
    await triggerEvent(document.body, 'pointermove', at(0.5, -300, { px: 6 }));
    assert.true(
      Math.abs((param('start') as number) - 2) < 0.01,
      'it follows the pointer off the editor',
    );
    await triggerEvent(document.body, 'pointermove', at(3, 30));
    assert.strictEqual(
      param('start'),
      4 - 0.001,
      'and stops just short of the end',
    );
    await triggerEvent(document.body, 'pointermove', at(0.5, 30, { px: 6 }));
    await triggerEvent(document.body, 'pointerup', at(0.5, 30));
    await triggerEvent(STAGE, 'pointermove', at(0.9, 30));
    assert.true(
      Math.abs((param('start') as number) - 2) < 0.01,
      'released: it has let go',
    );
    assert.dom(handle('start')).hasAria('valuetext', /^2(\.\d+)? s$/);
    assert.true(
      Math.abs((stored('#sampler › start') as number) - 2) < 0.01,
      'stored under the key a slider for it would have',
    );

    project.undo();
    await settled();
    assert.strictEqual(
      stored('#sampler › start'),
      undefined,
      'the whole drag is one step',
    );
    assert.strictEqual(param('start'), 0);
  });

  test('handles are sliders for the keyboard, and their values can be typed in the chosen unit', async function (assert) {
    await open();
    assert.dom(handle('start')).hasAttribute('role', 'slider');
    assert.dom(handle('start')).hasAttribute('tabindex', '0');
    await focus(handle('end'));
    await triggerKeyEvent(handle('end'), 'keydown', 'ArrowLeft');
    assert.strictEqual(
      param('end'),
      3.96,
      'an arrow is a hundredth of the travel',
    );
    await triggerKeyEvent(handle('end'), 'keydown', 'PageDown');
    assert.true(Math.abs((param('end') as number) - 3.56) < 1e-9);
    await triggerKeyEvent(handle('end'), 'keydown', 'Home');
    assert.strictEqual(
      param('end'),
      0.001,
      'Home: as far as it goes, just past start',
    );
    await triggerKeyEvent(handle('end'), 'keydown', 'End');
    assert.strictEqual(param('end'), 4);

    await click(value('start'));
    await fillIn(
      '[data-test-waveform-value="start"] [data-test-number-input]',
      '0.5',
    );
    await triggerKeyEvent(
      '[data-test-waveform-value="start"] [data-test-number-input]',
      'keydown',
      'Enter',
    );
    assert.strictEqual(param('start'), 0.5);

    await select('[data-test-waveform-unit]', 'slice');
    assert
      .dom(value('start'))
      .hasText('slice 2', 'the Slice unit, with real slices');
    assert.dom(value('end')).hasText('slice 15');
    await click(value('end'));
    await fillIn(
      '[data-test-waveform-value="end"] [data-test-number-input]',
      '7',
    );
    await triggerKeyEvent(
      '[data-test-waveform-value="end"] [data-test-number-input]',
      'keydown',
      'Enter',
    );
    assert.strictEqual(
      param('end'),
      2,
      'slice 7 ends at 2 s: stored in seconds',
    );
    await focus(handle('start'));
    await triggerKeyEvent(handle('start'), 'keydown', 'ArrowRight');
    assert.strictEqual(param('start'), 0.75, 'in slices an arrow is a slice');

    await select('[data-test-waveform-unit]', 'percent');
    assert.dom(value('end')).hasText('50%');
    assert.strictEqual(
      project.doc.tracks.at(-1)!.values.controls['#sampler › loopEnd']?.options
        ?.mode,
      'percent',
      'the four points keep one unit',
    );
  });

  test('loop: its two handles appear, stay inside the region, and the toggles are the sampler’s own', async function (assert) {
    await open();
    await click('[data-test-waveform-loop]');
    assert.true(param('loop'));
    assert.dom(handle('loopStart')).exists();
    assert.dom(handle('loopEnd')).hasAria('valuenow', '4');

    // the loop start's tab stands on the bottom, right of its line; start's hangs from the top at the same place
    await triggerEvent(
      STAGE,
      'pointerdown',
      at(0, (find(STAGE) as HTMLElement).clientHeight - 6, { px: 6 }),
    );
    await triggerEvent(document.body, 'pointermove', at(0.5, 0, { px: 6 }));
    await triggerEvent(document.body, 'pointerup', at(0.5, 0));
    assert.true(
      Math.abs((param('loopStart') as number) - 2) < 0.01,
      'the loop start moved',
    );
    assert.strictEqual(
      param('start'),
      0,
      'not the start, though they were at the same moment',
    );

    await focus(handle('loopEnd'));
    await triggerKeyEvent(handle('loopEnd'), 'keydown', 'Home');
    assert.true(
      Math.abs((param('loopEnd') as number) - 2.001) < 0.01,
      'loop end stops just past loop start',
    );
    await click('[data-test-waveform-reverse]');
    assert.true(param('reverse'));
  });

  test('slices: add, move, remove, make them all at once; they are the sound’s', async function (assert) {
    await open();
    const ref = audio.engine!.buffers.get('loop')!;
    const rect = find(STAGE)!.getBoundingClientRect();

    // a flag in the ruler is taken and dragged; it stays between its neighbours
    const first = find('[data-test-slice-marker="1"]')!.getBoundingClientRect();
    const flagX = first.left + first.width / 2;
    await triggerEvent(STAGE, 'pointerdown', at(0, 5, { clientX: flagX }));
    await triggerEvent(
      document.body,
      'pointermove',
      at(0, 5, { clientX: flagX + rect.width * 0.02 }),
    );
    assert.true(
      Math.abs(ref.slices[1]! - 0.33) < 0.01,
      `moved to 0.33 s (${ref.slices[1]})`,
    );
    await triggerEvent(document.body, 'pointermove', at(0.9, 5));
    assert.true(ref.slices[1]! < 0.5, 'not past the next boundary');
    assert.strictEqual(ref.slices.length, 17, 'and the count is the same');
    await triggerEvent(document.body, 'pointerup', at(0.9, 5));
    assert
      .dom('[data-test-slice-marker="1"]')
      .hasAria('pressed', 'true', 'the one taken is selected');

    await click('[data-test-slice-remove]');
    assert.strictEqual(ref.slices.length, 16);
    assert.dom('[data-test-slices-toggle]').hasText('Slices (15)');
    assert.deepEqual(
      project.doc.samples['loop']!.slices,
      [...ref.slices],
      'stored with the sound, in the pool',
    );

    await focus('[data-test-slice-marker="3"]');
    await triggerKeyEvent('[data-test-slice-marker="3"]', 'keydown', 'Delete');
    assert.strictEqual(
      ref.slices.length,
      15,
      'Delete removes the selected boundary',
    );

    // a double click on the sound adds one there
    await triggerEvent(STAGE, 'pointerdown', at(0.03, 80));
    await triggerEvent(document.body, 'pointerup', at(0.03, 80));
    await triggerEvent(STAGE, 'pointerdown', at(0.03, 80));
    await triggerEvent(document.body, 'pointerup', at(0.03, 80));
    assert.strictEqual(ref.slices.length, 16);
    assert.true(
      Math.abs(ref.slices[1]! - 0.12) < 0.01,
      `added at 0.12 s (${ref.slices[1]})`,
    );

    // the slice menu: a disclosure, with one way of cutting showing at a time
    assert.dom('[data-test-slices-toggle]').hasAria('expanded', 'false');
    assert.dom('[data-test-slices-panel]').doesNotExist();
    await click('[data-test-slices-toggle]');
    assert.dom('[data-test-slices-toggle]').hasAria('expanded', 'true');
    assert
      .dom('[data-test-slices-toggle]')
      .hasClass('is-open', 'and looks open');
    assert.deepEqual(
      findAll('[data-test-slice-tab]').map(
        (tab) =>
          `${tab.textContent.trim()}${tab.getAttribute('aria-selected') === 'true' ? '*' : ''}`,
      ),
      ['Equal parts*', 'Tempo', 'Onsets'],
    );
    assert
      .dom('[data-test-grid-count]')
      .exists('Equal parts shows its own setting');
    assert.dom('[data-test-tempo-step]').doesNotExist('and not the others’');
    assert.dom('[data-test-onset-sensitivity]').doesNotExist();
    assert
      .dom('[data-test-slices-apply]')
      .exists({ count: 1 }, 'with one Apply');

    await fillIn('[data-test-grid-count]', '8');
    assert
      .dom('[data-test-slices-count]')
      .hasText('8 slices', 'what Apply would give, as it is set');
    assert
      .dom('[data-test-slice-marker]')
      .doesNotExist('the flags give way to the preview');
    const before = ref.slices.length;
    assert.strictEqual(ref.slices.length, before, 'a preview changes nothing');
    await click('[data-test-slices-apply]');
    assert.deepEqual([...ref.slices], [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]);
    assert
      .dom('[data-test-slices-panel]')
      .exists('applying leaves the panel open');
    assert.dom('[data-test-slice-tab="equal"]').hasAria('selected', 'true');
    assert.dom('[data-test-slices-toggle]').hasText('Slices (8)');
    assert
      .dom('[data-test-slice-marker]')
      .exists({ count: 7 }, 'the preview has become the sound’s own flags');
    assert
      .dom('[data-test-slices-apply]')
      .isDisabled('nothing new to apply until a setting changes');

    await click('[data-test-slice-tab="tempo"]');
    assert.dom('[data-test-slice-tab="tempo"]').hasAria('selected', 'true');
    assert.dom('[data-test-tempo-step]').exists();
    assert.dom('[data-test-grid-count]').doesNotExist();
    assert
      .dom('[data-test-slices-count]')
      .hasText('32 slices', 'sixteenths at 120: 32 of them in 4 s');
    await click('[data-test-slices-apply]');
    assert.strictEqual(ref.slices.length, 33);

    await triggerKeyEvent(
      '[data-test-slice-tab="tempo"]',
      'keydown',
      'ArrowRight',
    );
    assert
      .dom('[data-test-slice-tab="onsets"]')
      .hasAria('selected', 'true', 'arrow keys move along the tabs');
    assert.dom('[data-test-onset-sensitivity]').exists();
    const found = Number(
      find('[data-test-slices-count]')!.textContent.trim().split(/\s+/)[0],
    );
    assert.true(found >= 12, `the detector finds the loop’s hits (${found})`);
    assert.strictEqual(ref.slices.length, 33, 'a preview changes nothing');
    await click('[data-test-slices-apply]');
    assert.strictEqual(ref.slices.length, found + 1);
    assert.true(
      [...ref.slices]
        .slice(1, -1)
        .every(
          (time) => Math.abs(time / 0.125 - Math.round(time / 0.125)) < 0.05,
        ),
      'on the sixteenths the hits are on',
    );

    project.undo();
    await settled();
    assert.strictEqual(ref.slices.length, 33, 'undone as one step');
  });

  test('Clear removes the sound’s slices and leaves the panel open on its tab', async function (assert) {
    await open();
    const ref = audio.engine!.buffers.get('loop')!;
    assert.strictEqual(ref.slices.length, 17, 'a sound with slices');
    await click('[data-test-slices-toggle]');
    await click('[data-test-slice-tab="tempo"]');
    const preview = find('[data-test-slices-count]')!.textContent.trim();
    assert.dom('[data-test-slice-clear]').isNotDisabled();

    await click('[data-test-slice-clear]');
    assert.deepEqual([...ref.slices], [0, 4], 'the slices are gone');
    assert.strictEqual(project.doc.samples['loop']!.slices, undefined);
    assert.dom('[data-test-slices-panel]').exists('the panel is still open');
    assert.dom('[data-test-slices-toggle]').hasAria('expanded', 'true');
    assert.dom('[data-test-slices-toggle]').hasText('Slices (1)');
    assert
      .dom('[data-test-slice-tab="tempo"]')
      .hasAria('selected', 'true', 'on the same tab');
    assert
      .dom('[data-test-slices-count]')
      .hasText(preview, 'with its preview as it was');
    assert.dom('[data-test-slice-clear]').isDisabled('nothing left to clear');
    assert
      .dom('[data-test-slices-apply]')
      .isNotDisabled('and the first cut can be made from here');

    project.undo();
    await settled();
    assert.strictEqual(ref.slices.length, 17, 'undo brings them back');
    assert.dom('[data-test-slices-panel]').exists();
    assert.dom('[data-test-slice-clear]').isNotDisabled();

    // from no slices: the first cut
    await click('[data-test-slice-clear]');
    await click('[data-test-slices-apply]');
    assert.strictEqual(ref.slices.length, 33, 'sixteenths at 120 in 4 s');
    assert.dom('[data-test-slices-panel]').exists();
  });

  test('the values are three named groups, left to right: speed; the places with their unit; the switches', async function (assert) {
    await open();
    const groups = findAll('[data-test-waveform-group]');
    assert.deepEqual(
      groups.map(
        (group) =>
          `${group.getAttribute('data-test-waveform-group')}: ${group.getAttribute('role')} “${group.getAttribute('aria-label')}” [${[
            ...group.querySelectorAll(
              '[data-test-waveform-unit], [data-test-waveform-value]',
            ),
          ]
            .map((el) =>
              el.hasAttribute('data-test-waveform-unit')
                ? 'unit'
                : el.getAttribute('data-test-waveform-value'),
            )
            .join(' ')}]`,
      ),
      [
        'speed: group “Speed” [speed]',
        'time: group “Region and loop points” [unit start end loopStart loopEnd]',
        'toggles: group “Loop and reverse” [loop reverse]',
      ],
    );
    const left = (group: Element): number => group.getBoundingClientRect().left;
    assert.true(
      left(groups[0]!) < left(groups[1]!),
      'speed is to the left of the places',
    );
    // the loop's points are faint and not to be changed while Loop is off, wherever they stand
    assert
      .dom('[data-test-waveform-value="loopStart"]')
      .hasClass('waveform__value--faint');
    assert.dom(value('loopStart')).isDisabled();
    await click('[data-test-waveform-loop]');
    assert
      .dom('[data-test-waveform-value="loopStart"]')
      .doesNotHaveClass('waveform__value--faint');
  });

  test('the speed has its unit menu here, and is not repeated in the processors', async function (assert) {
    await open();
    const stored = (): unknown =>
      project.doc.tracks.at(-1)!.values.controls['#sampler › speed']?.options;
    await click('[data-test-speed-menu] [data-test-menu-button]');
    const items = findAll('[data-test-menu-item]').map((item) =>
      item.textContent.trim(),
    );
    assert.deepEqual(items, [
      'Ratio',
      'Semitones',
      'Cents',
      'Sequence sync',
      'Per stepNot with sequence sync: choose another unit first',
      'GlideSet per trigger; cannot glide',
      'Reset',
      'Show in script',
    ]);
    assert
      .dom('[data-test-menu-item="Glide"]')
      .hasAria('disabled', 'true', 'a speed does not glide: it says so');
    await click('[data-test-menu-item="Semitones"]');
    assert.deepEqual(stored(), { mode: 'semitones' });
    assert
      .dom(value('speed'))
      .hasText('0 st', 'the cell shows it in the unit chosen');

    // the speed is a source's control: the controls pane does not list it again
    view.footerPane = 'controls';
    await settled();
    assert
      .dom('[data-test-control="#sampler › speed"]')
      .doesNotExist(
        'a sampler’s controls are in the source tab, not the processors',
      );
    view.footerPane = 'source';
    await settled();
    await waitFor(`${STAGE}[data-ready]`);
    await click('[data-test-speed-menu] [data-test-menu-button]');
    assert.dom('[data-test-menu-item="Semitones"]').hasAria('checked', 'true');
    await click('[data-test-menu-item="Cents"]');
    assert.dom(value('speed')).hasText('0 ct');
    project.undo();
    await settled();
    assert.deepEqual(
      stored(),
      { mode: 'semitones' },
      'each choice is one step to undo',
    );
  });

  test('the speed can be per step from its menu here: a stub in the same cell, its lane in the track’s row, in the unit chosen', async function (assert) {
    await open();
    const cell = find('[data-test-waveform-value="speed"]') as HTMLElement;
    const before = cell.getBoundingClientRect();
    await click('[data-test-speed-menu] [data-test-menu-button]');
    await click('[data-test-menu-item="Semitones"]');
    await click('[data-test-speed-menu] [data-test-menu-button]');
    assert
      .dom('[data-test-menu-item="Per step"]')
      .exists('the menu offers Per step');
    await click('[data-test-menu-item="Per step"]');
    const options = project.doc.tracks.at(-1)!.values.controls[
      '#sampler › speed'
    ]?.options as { perStep?: string; stepValues?: number[] };
    assert.strictEqual(typeof options.perStep, 'string');
    assert.true(options.stepValues!.length > 1, 'a value for every step');
    assert.true(
      options.stepValues!.every((step) => step === 1),
      'each from the speed it had',
    );
    assert.dom(value('speed')).hasText('per step');
    const after = cell.getBoundingClientRect();
    assert.strictEqual(after.width, before.width, 'the cell does not change');
    assert.strictEqual(after.height, before.height);
    assert
      .dom(`[data-test-lane="#sampler › speed"]`)
      .exists('its lane is under the grid, in the track’s row');
    assert
      .dom(
        '[data-test-lane="#sampler › speed"] [data-test-lane-entry], [data-test-lane="#sampler › speed"]',
      )
      .exists();
    await click('[data-test-speed-menu] [data-test-menu-button]');
    assert.dom('[data-test-menu-item="Show lane"]').exists();
    assert.false(
      findAll('[data-test-menu-item]').some((item) =>
        /Sequence sync/.test(item.textContent ?? ''),
      ),
      'sequence sync and per step are one or the other',
    );
    await click('[data-test-menu-item="Single value"]');
    assert.dom(value('speed')).hasText('0 st');
  });

  test('Snap is a label and three choices; untouched it follows the sound, chosen it is kept', async function (assert) {
    await open();
    assert.dom('[data-test-snap-label]').hasText('Snap');
    assert.deepEqual(
      [...find('[data-test-snap]')!.querySelectorAll('option')].map((option) =>
        option.textContent.trim(),
      ),
      ['Zero crossing', 'Slices', 'None'],
    );
    assert
      .dom('[data-test-snap]')
      .hasValue('slices', 'a sound with slices: Slices');
    // its slices cleared: the untouched menu moves to zero crossings; cut again, back to slices
    await click('[data-test-slices-toggle]');
    await click('[data-test-slice-clear]');
    assert.dom('[data-test-snap]').hasValue('zero', 'no slices: Zero crossing');
    await click('[data-test-slices-apply]');
    assert.dom('[data-test-snap]').hasValue('slices');
    // another sound, with none
    await select('[data-test-sound-select]', 'kick');
    assert.dom('[data-test-snap]').hasValue('zero', 'it follows the sound');
    await select('[data-test-sound-select]', 'loop');
    assert.dom('[data-test-snap]').hasValue('slices');

    // chosen by the person: kept, whatever the sound has
    await select('[data-test-snap]', 'off');
    await select('[data-test-sound-select]', 'kick');
    assert
      .dom('[data-test-snap]')
      .hasValue('off', 'the person’s choice is kept');
    await select('[data-test-sound-select]', 'loop');
    assert.dom('[data-test-snap]').hasValue('off');
    await select('[data-test-snap]', 'slices');
    await select('[data-test-sound-select]', 'kick');
    assert
      .dom('[data-test-snap]')
      .hasValue(
        'slices',
        'Slices kept on a sound with none: it then snaps to nothing',
      );
    assert.notStrictEqual(
      project.canUndo,
      false,
      'choosing sounds was the only thing to undo',
    );
    assert.strictEqual(
      view.chosenSnap(loopId, audio.waveforms(loopId)[0]!.key),
      'slices',
      'kept with how things are looked at',
    );
  });

  test('the values are in their order, and a number dragged in its box moves its handle with it', async function (assert) {
    await open();
    assert.deepEqual(
      findAll('[data-test-waveform-value]').map((cell) =>
        cell.getAttribute('data-test-waveform-value'),
      ),
      ['speed', 'start', 'end', 'loopStart', 'loopEnd', 'loop', 'reverse'],
    );
    await select('[data-test-waveform-unit]', 'percent');
    const entry = '[data-test-waveform-value="start"] [data-test-number-entry]';
    const rect = find(entry)!.getBoundingClientRect();
    const point = (dx: number) => ({
      pointerId: 1,
      button: 0,
      buttons: 1,
      isPrimary: true,
      pointerType: 'mouse',
      clientX: rect.left + rect.width / 2 + dx,
      clientY: rect.top + rect.height / 2,
    });
    const handle = (): number =>
      parseFloat(
        (find('[data-handle="start"]') as HTMLElement).style.getPropertyValue(
          '--x',
        ),
      );
    const began = find(entry)!.textContent.trim();
    const from = handle();
    await triggerEvent(entry, 'pointerdown', point(0));
    await triggerEvent(entry, 'pointermove', point(5));
    await triggerEvent(document.body, 'pointermove', point(55));
    await triggerEvent(document.body, 'pointermove', point(100));
    await triggerEvent(document.body, 'pointerup', point(100));
    // 100 px of 200: half the sample
    assert.dom(entry).hasText('50%');
    assert.true(
      handle() > from + 10,
      `the handle on the picture went too (${from} to ${handle()})`,
    );
    project.undo();
    await settled();
    assert.dom(entry).hasText(began, 'the whole drag is one step to undo');
    project.redo();
    await settled();
    assert.dom(entry).hasText('50%');
    assert
      .dom('[data-test-number-input]')
      .doesNotExist('and the field did not open');

    // by slices: whole ones
    await select('[data-test-waveform-unit]', 'slice');
    const before = find(entry)!.textContent.trim();
    await triggerEvent(entry, 'pointerdown', point(0));
    await triggerEvent(entry, 'pointermove', point(5));
    await triggerEvent(document.body, 'pointermove', point(-25));
    await triggerEvent(document.body, 'pointerup', point(-25));
    const after = find(entry)!.textContent.trim();
    assert.notStrictEqual(after, before, 'a drag steps through the slices');
    assert.true(/^\D*\d+\D*$/.test(after), `a whole slice (${after})`);
  });

  test('a point taken past its partner changes roles with it: start is always the lower, end the higher', async function (assert) {
    await open();
    const type = async (id: string, text: string): Promise<void> => {
      await click(value(id));
      const input = `[data-test-waveform-value="${id}"] [data-test-number-input]`;
      await fillIn(input, text);
      await triggerKeyEvent(input, 'keydown', 'Enter');
    };
    const near = (name: string, to: number): boolean =>
      Math.abs((param(name) as number) - to) < 0.011;
    const region = (start: number, end: number): boolean =>
      near('start', start) ? near('end', end) : false;
    await type('end', '2');
    assert.strictEqual(param('end'), 2);
    assert.strictEqual(param('start'), 0);

    // the start's tab, dragged across the end at 2 s
    await triggerEvent(STAGE, 'pointerdown', at(0, 26, { px: 6 }));
    await triggerEvent(document.body, 'pointermove', at(0.25, 26, { px: 6 }));
    assert.true(near('start', 1), 'on its own side it is the start');
    await triggerEvent(document.body, 'pointermove', at(0.75, 26, { px: 6 }));
    assert.true(
      region(2, 3),
      `across: the end stands where it was as the start (${String(param('start'))}), and the dragged one is the end (${String(param('end'))})`,
    );
    assert
      .dom(handle('end'))
      .hasClass('is-active', 'the handle under the pointer is the E now');
    assert.dom(value('start')).hasText('2 s', 'the values follow');
    assert.dom(value('end')).hasText('3 s');
    // exactly onto the other: never the same value
    await triggerEvent(document.body, 'pointermove', at(0.5, 26, { px: 6 }));
    assert.strictEqual(param('end'), 2.001, 'held the gap away');
    assert.strictEqual(param('start'), 2);
    // back across in the same drag: the roles go back
    await triggerEvent(document.body, 'pointermove', at(0.125, 26, { px: 6 }));
    assert.true(
      region(0.5, 2),
      `back across (${String(param('start'))}, ${String(param('end'))})`,
    );
    assert.dom(handle('start')).hasClass('is-active');
    await triggerEvent(document.body, 'pointermove', at(0.875, 26, { px: 6 }));
    await triggerEvent(document.body, 'pointerup', at(0.875, 26));
    assert.true(region(2, 3.5), 'let go across');
    assert.deepEqual(
      [stored('#sampler › start'), stored('#sampler › end')].map(
        (v) => Math.round((v as number) * 10) / 10,
      ),
      [2, 3.5],
      'stored as the lower and the higher',
    );
    project.undo();
    await settled();
    assert.strictEqual(param('start'), 0, 'one undo for the whole drag');
    assert.strictEqual(param('end'), 2, 'both back');

    // typed past the other
    await type('start', '3.5');
    assert.strictEqual(param('start'), 2, 'typed past the end: they swap');
    assert.strictEqual(param('end'), 3.5);
    project.undo();
    await settled();
    assert.strictEqual(param('start'), 0);
    assert.strictEqual(param('end'), 2, 'one step');
    await type('end', '0');
    assert.strictEqual(param('end'), 0.001, 'typed onto the start: the gap');

    // the keys on a handle: past the other, focus goes with the line
    await type('end', '0.1');
    (find(handle('start')) as HTMLElement).focus();
    for (let i = 0; i < 6; i++) {
      await triggerKeyEvent(document.activeElement!, 'keydown', 'ArrowRight');
    }
    assert.true(
      region(0.1, param('end') as number)
        ? (param('end') as number) > 0.1
        : false,
      `the keys carry it across (${String(param('start'))}, ${String(param('end'))})`,
    );
    assert.strictEqual(
      document.activeElement,
      find(handle('end')),
      'focus is on the handle it has become',
    );
  });

  test('the loop’s points swap between themselves, inside the region; a swap lands on snap points', async function (assert) {
    await open();
    const type = async (id: string, text: string): Promise<void> => {
      await click(value(id));
      const input = `[data-test-waveform-value="${id}"] [data-test-number-input]`;
      await fillIn(input, text);
      await triggerKeyEvent(input, 'keydown', 'Enter');
    };
    await click('[data-test-waveform-loop]');
    await type('start', '0.5');
    await type('end', '3.5');
    await type('loopEnd', '2');
    await type('loopStart', '1');
    assert.deepEqual([param('loopStart'), param('loopEnd')], [1, 2]);
    await type('loopStart', '3');
    assert.deepEqual(
      [param('loopStart'), param('loopEnd')],
      [2, 3],
      'typed past the loop end: they swap',
    );
    await type('loopEnd', '0');
    assert.deepEqual(
      [param('loopStart'), param('loopEnd')],
      [0.5, 2],
      'past the loop start, as far as the region goes: swapped, and kept inside the region',
    );
    assert.deepEqual(
      [param('start'), param('end')],
      [0.5, 3.5],
      'the region is as it was',
    );

    // snapping to slices (every 0.25 s): the dragged point, across, lands on one
    await click('[data-test-waveform-loop]');
    await select('[data-test-snap]', 'slices');
    await triggerEvent(STAGE, 'pointerdown', at(0.125, 26, { px: 6 }));
    await triggerEvent(document.body, 'pointermove', at(0.94, 26, { px: 6 }));
    await triggerEvent(document.body, 'pointerup', at(0.94, 26));
    assert.strictEqual(param('start'), 3.5, 'the old end is the start');
    assert.strictEqual(
      param('end'),
      3.75,
      'the dragged point, on a slice boundary',
    );
  });

  test('the strip under the picture is dragged, and the picture follows on every move, before it is let go', async function (assert) {
    await open();
    await click('[data-test-zoom-in]');
    await click('[data-test-zoom-in]');
    const mini = '[data-test-waveform-mini]';
    const rect = find(mini)!.getBoundingClientRect();
    const point = (along: number, more: object = {}) => ({
      pointerId: 1,
      button: 0,
      buttons: 1,
      isPrimary: true,
      pointerType: 'mouse',
      clientX: rect.left + along * rect.width,
      clientY: rect.top + rect.height / 2,
      ...more,
    });
    const left = (): number =>
      parseFloat(
        (find('.waveform__mini-view') as HTMLElement).style.getPropertyValue(
          '--left',
        ),
      );
    const drawn = (): string =>
      find('[data-test-waveform]')!.getAttribute('data-view') ?? '';
    const width = parseFloat(
      (find('.waveform__mini-view') as HTMLElement).style.getPropertyValue(
        '--width',
      ),
    );
    const undoable = project.canUndo;
    // pressed on the window: it does not jump, and then goes with the pointer
    const start = left();
    const grab = (start + width / 2) / 100;
    await triggerEvent(mini, 'pointerdown', point(grab));
    assert.true(Math.abs(left() - start) < 0.01, 'held where it was pressed');
    const seen: number[] = [];
    const views: string[] = [drawn()];
    for (const by of [0.05, 0.1, 0.15, 0.2]) {
      await triggerEvent(document.body, 'pointermove', point(grab + by));
      seen.push(Math.round(left() - start));
      views.push(drawn());
    }
    assert.deepEqual(
      seen,
      [5, 10, 15, 20],
      'the window is where the pointer has taken it, on each move',
    );
    assert.strictEqual(
      new Set(views).size,
      5,
      'and the picture’s view with it, before the button is up',
    );
    await triggerEvent(document.body, 'pointerup', point(grab + 0.2));
    await triggerEvent(
      document.body,
      'pointermove',
      point(0.1, { buttons: 0 }),
    );
    assert.strictEqual(Math.round(left() - start), 20, 'let go: it stays');
    // pressed outside the window: its middle goes there
    await triggerEvent(mini, 'pointerdown', point(0.05));
    await triggerEvent(document.body, 'pointerup', point(0.05));
    assert.true(left() < 1, 'a press elsewhere looks there');
    assert.strictEqual(project.canUndo, undoable, 'nothing to undo');
  });

  test('zoom and scroll: buttons, the wheel around the pointer, and where it is shown', async function (assert) {
    await open();
    assert
      .dom('[data-test-waveform-mini]')
      .doesNotExist('all of it is in view');
    assert.dom('[data-test-zoom-out]').isDisabled();
    await click('[data-test-zoom-in]');
    assert.dom('[data-test-waveform]').hasAttribute('data-zoomed', 'true');
    assert.dom('[data-test-waveform-mini]').exists();
    assert
      .dom(handle('start'))
      .hasAttribute(
        'hidden',
        '',
        'a handle scrolled out of view is not there to take',
      );
    assert
      .dom('[data-test-slice-marker]')
      .exists({ count: 9 }, 'the middle half: 1 s to 3 s');

    const x = (id: string): number =>
      find(`[data-test-slice-marker="${id}"]`)!.getBoundingClientRect().left;
    const before = x('8'); // the boundary at 2 s, in the middle
    const rect = find(STAGE)!.getBoundingClientRect();
    await triggerEvent(STAGE, 'wheel', {
      deltaY: -100,
      ctrlKey: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + 50,
      cancelable: true,
      bubbles: true,
    });
    assert.true(
      Math.abs(x('8') - before) < 1,
      'pinch on a trackpad zooms around the pointer: what is under it stays',
    );
    assert.true(findAll('[data-test-slice-marker]').length < 9, 'closer');

    await triggerEvent(STAGE, 'wheel', {
      deltaX: 80,
      deltaY: 0,
      clientX: rect.left + 10,
      clientY: rect.top + 50,
      cancelable: true,
      bubbles: true,
    });
    assert.true(x('8') < before - 10, 'a sideways wheel scrolls');

    await click('[data-test-zoom-all]');
    assert.dom('[data-test-waveform-mini]').doesNotExist();
    await focus(handle('start'));
    await click(value('start'));
    await fillIn(
      '[data-test-waveform-value="start"] [data-test-number-input]',
      '1',
    );
    await triggerKeyEvent(
      '[data-test-waveform-value="start"] [data-test-number-input]',
      'keydown',
      'Enter',
    );
    await click(value('end'));
    await fillIn(
      '[data-test-waveform-value="end"] [data-test-number-input]',
      '2',
    );
    await triggerKeyEvent(
      '[data-test-waveform-value="end"] [data-test-number-input]',
      'keydown',
      'Enter',
    );
    await click('[data-test-zoom-region]');
    const start = find(handle('start'))!
      .querySelector('.waveform__handle-line')!
      .getBoundingClientRect().left;
    const end = find(handle('end'))!
      .querySelector('.waveform__handle-line')!
      .getBoundingClientRect().left;
    const stage = find(STAGE)!.getBoundingClientRect();
    assert.true(start - stage.left > 5, 'Region: start and end in view');
    assert.true(start - stage.left < stage.width * 0.2, 'with a little room');
    assert.true(stage.right - end < stage.width * 0.2);

    await click('[data-test-waveform-expand]');
    assert.dom('[data-test-waveform]').hasClass('waveform--expanded');
    assert.dom('[data-test-waveform-expand]').hasText('Done');
    await triggerKeyEvent('[data-test-waveform]', 'keydown', 'Escape');
    assert.dom('[data-test-waveform]').doesNotHaveClass('waveform--expanded');
  });

  test('another sound is chosen here, kept in the project, and Reset returns to the script’s', async function (assert) {
    await open();
    await select('[data-test-sound-select]', 'snare');
    assert.strictEqual(audio.sampler(loopId, 'sampler')!.buffer?.key, 'snare');
    assert.strictEqual(stored('#sampler › buffer'), 'snare');
    assert
      .dom('[data-test-slices-toggle]')
      .hasText('Slices (1)', 'the slices shown are the new sound’s');
    assert
      .dom(handle('end'))
      .hasAria(
        'valuemax',
        String(audio.engine!.buffers.get('snare')!.duration),
      );

    await click('[data-test-script-toggle]');
    await typeScript((text) => `${text}\n// still the snare`);
    await click('[data-test-script-toggle]');
    assert.strictEqual(
      audio.sampler(loopId, 'sampler')!.buffer?.key,
      'snare',
      'through a run of the script',
    );

    // the track's script names no sound (the project holds the choice): nothing to reset to
    assert.dom('[data-test-sound-reset]').doesNotExist();
    // a script that does name one: that is the default, and Reset returns to it
    await click('[data-test-script-toggle]');
    await typeScript((text) =>
      text.replace(
        ".sampler({ id: 'sampler' })",
        ".sampler({ id: 'sampler', buffer: 'loop' })",
      ),
    );
    await click('[data-test-script-toggle]');
    assert.strictEqual(
      audio.sampler(loopId, 'sampler')!.buffer?.key,
      'snare',
      'the stored choice still wins',
    );
    await click('[data-test-sound-reset]');
    assert.strictEqual(audio.sampler(loopId, 'sampler')!.buffer?.key, 'loop');
    assert.dom('[data-test-sound-reset]').doesNotExist();

    // the sidebar's "Use", on the project's real pool
    if (!find('[data-test-sound-browser]')) {
      await click('[data-test-sidebar-toggle]');
    }
    await click('[data-test-sounds-tab="project"]');
    assert.dom('[data-test-sound-row]').exists({ count: 6 });
    assert
      .dom('[data-test-sound-row="loop"]')
      .hasAttribute('data-current', 'true');
    assert.dom('[data-test-sound-row="loop"]').includesText('4 s');
    await click('[data-test-sound-use="clap"]');
    assert.strictEqual(audio.sampler(loopId, 'sampler')!.buffer?.key, 'clap');
    assert.dom('[data-test-sound-select]').hasValue('clap');
  });

  test('a tap on the sound plays the slice it is in', async function (assert) {
    await open();
    const node = audio.sampler(loopId, 'sampler')!;
    const heard: unknown[] = [];
    const trigger = node.trigger.bind(node);
    node.trigger = (options?: unknown) => {
      heard.push(options);
      return trigger(options as never);
    };
    await triggerEvent(STAGE, 'pointerdown', at(0.4, 80));
    await triggerEvent(document.body, 'pointerup', at(0.4, 80));

    assert.deepEqual(heard, [{ slice: 6 }], '1.6 s is in the seventh slice');
    assert.dom('[data-test-waveform-notice]').doesNotExist();
  });

  test('two tracks on one sound see the same slices', async function (assert) {
    await open();
    const other = newSlicedLoopTrack('other');
    project.apply({ type: 'addTrack', track: other });
    await settled();
    await click('[data-test-slices-toggle]');
    await click('[data-test-slice-clear]');
    assert.dom('[data-test-slices-toggle]').hasText('Slices (1)');
    await click('[data-test-track="5"] [data-test-track-select]');
    await waitFor(`${STAGE}[data-ready]`);
    assert
      .dom('[data-test-slices-toggle]')
      .hasText('Slices (1)', 'cleared on the other track too');
    project.undo();
    await settled();
    assert.dom('[data-test-slices-toggle]').hasText('Slices (16)');
    assert.deepEqual(
      [...audio.waveforms(other.id)[0]!.sound!.slices],
      [...LOOP_SLICES],
    );
  });

  test('region and slices are both there; what each is for is in the editor’s hints, not on show', async function (assert) {
    await open();
    assert
      .dom(handle('start'))
      .exists('the region’s handles are there on a sliced sound too');
    assert.dom(handle('end')).exists();
    assert
      .dom('[data-test-waveform]')
      .doesNotIncludeText('trigger()', 'no explanation on show');
    await click('[data-test-waveform-hint] [data-test-hint-button]');
    assert
      .dom('[data-test-waveform-hint] [data-test-hint]')
      .includesText('trigger()');
    assert
      .dom('[data-test-waveform-hint] [data-test-hint]')
      .includesText('trigger({ slice })');
    assert
      .dom('[data-test-waveform-hint] [data-test-hint]')
      .includesText('every track that plays it shares them');
  });

  test('the menus keep their options: drawing the editor again does not make them anew', async function (assert) {
    await open();
    const options = (selector: string): Element[] => [
      ...find(selector)!.querySelectorAll('option'),
    ];
    const unit = find('[data-test-waveform-unit]');
    const sound = find('[data-test-sound-select]');
    const before = {
      unit: options('[data-test-waveform-unit]'),
      sound: options('[data-test-sound-select]'),
      snap: options('[data-test-snap]'),
    };
    assert.true(before.unit.length >= 4);
    // every node added to or taken from a menu, from now on
    let touched = 0;
    const watch = new MutationObserver((records) => {
      for (const record of records) {
        touched += record.addedNodes.length + record.removedNodes.length;
      }
    });
    for (const selector of [
      '[data-test-waveform-unit]',
      '[data-test-sound-select]',
      '[data-test-snap]',
    ]) {
      watch.observe(find(selector)!, { childList: true, subtree: true });
    }

    // things that draw the editor again: a value moves, the transport plays, a play cursor's frame passes
    audio.setControl(loopId, '#sampler › start', 0.5);
    audio.setControl(loopId, '#level › gain', 0.4);
    audio.play();
    await settled();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    audio.stop();
    await settled();

    const same = (now: Element[], then: Element[]): boolean =>
      now.length === then.length &&
      now.every((option, index) => option === then[index]);
    assert.strictEqual(
      find('[data-test-waveform-unit]'),
      unit,
      'the unit menu is the same element',
    );
    assert.true(
      same(options('[data-test-waveform-unit]'), before.unit),
      'with the same option elements',
    );
    assert.strictEqual(find('[data-test-sound-select]'), sound);
    assert.true(
      same(options('[data-test-sound-select]'), before.sound),
      'the sound menu’s too',
    );
    assert.true(same(options('[data-test-snap]'), before.snap));

    watch
      .takeRecords()
      .forEach(
        (record) =>
          (touched += record.addedNodes.length + record.removedNodes.length),
      );
    assert.strictEqual(
      touched,
      0,
      'and not one node of any menu was added or removed while the editor was drawn again',
    );

    // choosing a unit: the options stay, the choice shows, and it is one step
    await select('[data-test-waveform-unit]', 'ms');
    assert.true(
      same(options('[data-test-waveform-unit]'), before.unit),
      'still the same options after choosing one',
    );
    assert.dom('[data-test-waveform-unit]').hasValue('ms');
    assert.dom(value('start')).hasText('500 ms');
    project.undo();
    await settled();
    assert
      .dom('[data-test-waveform-unit]')
      .hasValue('seconds', 'one undo: all four points back in seconds');
    assert.strictEqual(
      project.doc.tracks.at(-1)!.values.controls['#sampler › loopEnd']?.options,
      undefined,
    );
    assert.true(same(options('[data-test-waveform-unit]'), before.unit));
    watch
      .takeRecords()
      .forEach(
        (record) =>
          (touched += record.addedNodes.length + record.removedNodes.length),
      );
    watch.disconnect();
    assert.strictEqual(touched, 0, 'nor by choosing a unit and undoing it');
  });

  test('the values are cells of a fixed grid: toggling, a unit, a long value or focus moves and resizes nothing', async function (assert) {
    await open();
    // each cell's box within the values area (the small test page may scroll the pane under a click)
    const cells = (): string[] => {
      const area = find('.waveform__values')!;
      const origin = area.getBoundingClientRect();
      return [
        `area ${origin.width.toFixed(1)} ${origin.height.toFixed(1)}`,
        ...[...area.children]
          .filter((cell) => getComputedStyle(cell).display !== 'none')
          .map((cell) => {
            const rect = cell.getBoundingClientRect();
            return [
              rect.left - origin.left,
              rect.top - origin.top,
              rect.width,
              rect.height,
            ]
              .map((n) => n.toFixed(1))
              .join(' ');
          }),
      ];
    };
    const before = cells();
    assert
      .dom('[data-test-waveform-value="loopStart"]')
      .exists('the loop’s points have their cells while the loop is off');
    assert
      .dom('[data-test-waveform-value="loopStart"] [data-test-number-entry]')
      .isDisabled('not to be changed then');
    assert
      .dom('[data-test-waveform-value="loopStart"]')
      .hasClass('waveform__value--faint');

    await click('[data-test-waveform-loop]');
    assert.deepEqual(
      cells(),
      before,
      'Loop on: every cell where it was, the size it was',
    );
    assert
      .dom('[data-test-waveform-value="loopStart"] [data-test-number-entry]')
      .isNotDisabled();
    await click('[data-test-waveform-reverse]');
    assert.deepEqual(cells(), before, 'Reverse on');
    for (const unit of ['ms', 'steps', 'percent', 'slice', 'seconds']) {
      await select('[data-test-waveform-unit]', unit);
      assert.deepEqual(cells(), before, `shown in ${unit}`);
    }
    await click(value('loopEnd'));
    assert.deepEqual(cells(), before, 'a field focused');
    await fillIn(
      '[data-test-waveform-value="loopEnd"] [data-test-number-input]',
      '1234567.8901234567',
    );
    assert.deepEqual(cells(), before, 'a long value typed');
    await triggerKeyEvent(
      '[data-test-waveform-value="loopEnd"] [data-test-number-input]',
      'keydown',
      'Escape',
    );
    audio.setControl(loopId, '#sampler › speed', 0.123456789);
    await settled();
    assert.deepEqual(cells(), before, 'a value with many digits');
    await click('[data-test-waveform-loop]');
    await click('[data-test-waveform-reverse]');
    assert.deepEqual(cells(), before, 'and off again');
  });

  test('typing a value takes no more room than reading it: nothing beside it moves', async function (assert) {
    await open();
    const box = (selector: string): string => {
      const rect = find(selector)!.getBoundingClientRect();
      return [rect.left, rect.top, rect.width, rect.height]
        .map((n) => n.toFixed(2))
        .join(' ');
    };
    const around = (): Record<string, string> => ({
      start: box('[data-test-waveform-value="start"]'),
      end: box('[data-test-waveform-value="end"]'),
      loop: box('[data-test-waveform-loop]'),
      values: box('.waveform__values'),
      stage: box(STAGE),
    });
    const before = around();
    const entry = box('[data-test-waveform-value="start"] .number-entry-box');
    await click(value('start'));
    assert
      .dom('[data-test-waveform-value="start"] [data-test-number-input]')
      .isFocused();
    assert.strictEqual(
      box('[data-test-waveform-value="start"] .number-entry-box'),
      entry,
      'the box is the same box',
    );
    assert.strictEqual(
      box('[data-test-waveform-value="start"] [data-test-number-input]'),
      entry,
      'and the field fills exactly it',
    );
    assert.deepEqual(
      around(),
      before,
      'its neighbours, the row and the picture are where they were',
    );
    await fillIn(
      '[data-test-waveform-value="start"] [data-test-number-input]',
      '0.123456789',
    );
    assert.deepEqual(around(), before, 'however much is typed');
    await triggerKeyEvent(
      '[data-test-waveform-value="start"] [data-test-number-input]',
      'keydown',
      'Escape',
    );
    assert.deepEqual(around(), before);
  });

  module('several samplers on one track', function () {
    const THREE = `// three samplers, each with a sound of its own
__().sampler({ id: 'kick', buffer: 'kick' }).to('channel');
__().sampler({ id: 'snare', buffer: 'snare' }).to('channel');
const hat = __().sampler({ buffer: 'hat' }).to('channel');
waveform('#kick');
waveform('#snare', { label: 'Backbeat' });
waveform(hat);
`;

    async function three(): Promise<void> {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await waitFor('[data-test-footer-script] .cm-content');
      await typeScript(() => THREE);
      await click('[data-test-script-toggle]');
      await waitFor(`${STAGE}[data-ready]`);
      await settled();
    }

    const tabs = (): string[] =>
      findAll('[data-test-waveform-tab]').map(
        (tab) =>
          `${tab.textContent.trim()}${tab.getAttribute('aria-selected') === 'true' ? '*' : ''}`,
      );

    test('one waveform: no list', async function (assert) {
      await render(<template><AppShell /></template>);
      await waitFor(`${STAGE}[data-ready]`);
      assert.dom('[data-test-waveform-tabs]').doesNotExist();
      assert.dom('[data-test-waveform-picker]').doesNotExist();
      assert.dom('[data-test-waveform]').exists({ count: 1 });
    });

    test('a list down the left names each, and one editor shows at a time', async function (assert) {
      await three();
      assert.deepEqual(audio.warnings('t-kick'), []);
      assert.dom('[data-test-waveform-tabs]').hasAttribute('role', 'tablist');
      assert
        .dom('[data-test-waveform-tabs]')
        .hasAria('orientation', 'vertical');
      assert.deepEqual(
        tabs(),
        ['#kick*', 'Backbeat', 'sampler 3'],
        'its label if it has one, else the selector that names it; a sampler with no id by its type and which of them it is',
      );
      assert.dom('[data-test-waveform]').exists({ count: 1 }, 'one at a time');
      assert.dom('[data-test-waveform="kick"]').exists();
      assert.dom('[data-test-sound-select]').hasValue('kick');

      await click('[data-test-waveform-tab="snare"]');
      assert.deepEqual(tabs(), ['#kick', 'Backbeat*', 'sampler 3']);
      assert.dom('[data-test-waveform="snare"]').exists();
      assert.dom('[data-test-waveform="kick"]').doesNotExist();
      assert
        .dom('[data-test-sound-select]')
        .hasValue('snare', 'each has its own sound');
      const steps = project.doc;
      await triggerKeyEvent(
        '[data-test-waveform-tab="snare"]',
        'keydown',
        'ArrowDown',
      );
      assert.deepEqual(
        tabs(),
        ['#kick', 'Backbeat', 'sampler 3*'],
        'the arrow keys move down the list',
      );
      assert.dom('[data-test-sound-select]').hasValue('hat');
      assert.strictEqual(
        project.doc,
        steps,
        'and nothing of the document changed',
      );
      assert.strictEqual(
        view.chosenWaveform('t-kick'),
        '#sampler-0 › waveform',
      );

      // the same choice as a picker in the editor's bar, for a narrow footer
      assert.deepEqual(
        [
          ...find('[data-test-waveform-picker]')!.querySelectorAll('option'),
        ].map(
          (option) =>
            `${option.textContent.trim()}${option.selected ? '*' : ''}`,
        ),
        ['#kick', 'Backbeat', 'sampler 3*'],
      );
      await select('[data-test-waveform-picker]', '#kick › waveform');
      assert.deepEqual(tabs(), ['#kick*', 'Backbeat', 'sampler 3']);
      assert.dom('[data-test-waveform="kick"]').exists();
    });

    test('the choice is the track’s own, is kept while looking elsewhere, and falls back when its sampler goes', async function (assert) {
      await three();
      await click('[data-test-waveform-tab="snare"]');
      await click('[data-test-track="2"] [data-test-track-select]');
      await waitFor(`${STAGE}[data-ready]`);
      assert
        .dom('[data-test-waveform-tabs]')
        .doesNotExist('another track, with one sampler');
      assert.dom('[data-test-waveform="sampler"]').exists();
      await click('[data-test-track="1"] [data-test-track-select]');
      await waitFor(`${STAGE}[data-ready]`);
      assert.deepEqual(
        tabs(),
        ['#kick', 'Backbeat*', 'sampler 3'],
        'back on the first: still the one chosen',
      );

      await click('[data-test-script-toggle]');
      await typeScript((text) =>
        text.replace("waveform('#snare', { label: 'Backbeat' });\n", ''),
      );
      await click('[data-test-script-toggle]');
      await waitFor(`${STAGE}[data-ready]`);
      assert.deepEqual(
        tabs(),
        ['#kick*', 'sampler 3'],
        'the one chosen has gone from the script: the first shows',
      );
      assert.dom('[data-test-waveform="kick"]').exists();

      await click('[data-test-script-toggle]');
      await typeScript((text) => text.replace('waveform(hat);\n', ''));
      await click('[data-test-script-toggle]');
      await waitFor(`${STAGE}[data-ready]`);
      assert
        .dom('[data-test-waveform-tabs]')
        .doesNotExist('down to one: no list');
      assert.dom('[data-test-waveform="kick"]').exists();
    });
  });

  test('the editor fits the pane: its numbers are inside the footer, not scrolled out of it', async function (assert) {
    await open();
    const pane = find('.track-footer__pane')!;
    const values = find('.waveform__values')!.getBoundingClientRect();
    const footer = find('[data-test-track-footer]')!.getBoundingClientRect();
    assert.true(
      pane.scrollHeight <= pane.clientHeight + 1,
      `the pane has nothing to scroll (${pane.scrollHeight} in ${pane.clientHeight})`,
    );
    assert.true(
      values.bottom <= footer.bottom + 1,
      'the numbers end inside the footer',
    );
    assert.dom('[data-test-waveform-value="start"]').isVisible();
    assert.dom('[data-test-waveform-loop]').isVisible();
    const stage = find(STAGE) as HTMLElement;
    assert.true(
      stage.clientHeight >= 76,
      `and the picture still has room to be worked (${stage.clientHeight}px)`,
    );
  });

  module('code and controls, linked', function () {
    test('"show in script" turns to the script on the declaration’s line; coming back marks the control the cursor was on', async function (assert) {
      await render(<template><AppShell /></template>);
      await waitFor(`${STAGE}[data-ready]`);
      await click('[data-test-waveform] [data-test-show-in-script]');
      await waitFor('[data-test-footer-script] .cm-content');
      await settled();
      const editor = EditorView.findFromDOM(
        find('[data-test-footer-script] .cm-content') as HTMLElement,
      )!;
      const line = editor.state.doc.lineAt(editor.state.selection.main.head);
      assert.strictEqual(
        line.text,
        "waveform('#sampler');",
        'the cursor is on the waveform line',
      );
      assert
        .dom('.cm-content .cu-flash-line')
        .exists('and the line is flashed');

      // the person moves the cursor to the frequency slider's line, and goes back to the UI
      const text = editor.state.doc.toString();
      const target = text.indexOf("slider('#filter', 'frequency')");
      editor.dispatch({
        selection: { anchor: target + 3 },
        userEvent: 'select',
      });
      view.footerPane = 'controls';
      await click('[data-test-script-toggle]');
      assert
        .dom(`[data-test-control="#filter › frequency"]`)
        .hasAttribute('data-linked', 'true');
      assert.dom('[data-linked]').exists({ count: 1 });

      await click(`[data-test-control="#filter › q"] [data-test-menu-button]`);
      await click('[data-test-menu-item="Show in script"]');
      await waitFor('[data-test-footer-script] .cm-content');
      await settled();
      const again = EditorView.findFromDOM(
        find('[data-test-footer-script] .cm-content') as HTMLElement,
      )!;
      assert.strictEqual(
        again.state.doc.lineAt(again.state.selection.main.head).text,
        "slider('#filter', 'q');",
      );

      view.footerPane = 'sequence';
      await click('[data-test-script-toggle]');
      await click('[data-test-sequence="steps"] [data-test-show-in-script]');
      await waitFor('[data-test-footer-script] .cm-content');
      await settled();
      const third = EditorView.findFromDOM(
        find('[data-test-footer-script] .cm-content') as HTMLElement,
      )!;
      assert.strictEqual(
        third.state.doc.lineAt(third.state.selection.main.head).text,
        "stepGrid('steps');",
      );
    });

    test('a declaration that cannot work is underlined on its line in the editor, as well as said in the strip', async function (assert) {
      await render(<template><AppShell /></template>);
      await click('[data-test-script-toggle]');
      await waitFor('[data-test-footer-script] .cm-content');
      await typeScript(
        (text) =>
          `${text}slider('#nope', 'frequency');\nwaveform('#filter');\n`,
      );
      assert.dom('[data-test-script-warnings] li').exists({ count: 2 });
      // (the underline is over the line's text, which the highlighter has in several pieces)
      const underlined = (): (string | null | undefined)[] => [
        ...new Set(
          findAll('.cm-content .cu-diagnostic-warning').map(
            (mark) => mark.closest('.cm-line')?.textContent,
          ),
        ),
      ];
      assert.deepEqual(underlined(), [
        "slider('#nope', 'frequency');",
        "waveform('#filter');",
      ]);

      await typeScript((text) =>
        text.replace("slider('#nope', 'frequency');\n", ''),
      );
      assert.deepEqual(
        underlined(),
        ["waveform('#filter');"],
        'they follow the script as it is fixed',
      );
      await typeScript((text) => text.replace("waveform('#filter');\n", ''));
      assert.dom('.cm-content .cu-diagnostic-warning').doesNotExist();
    });
  });
});
