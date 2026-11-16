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
      .dom('[data-test-pane="source"] [data-test-pane-empty]')
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
      .doesNotExist('applying closes the panel');
    assert.dom('[data-test-slices-toggle]').hasAria('expanded', 'false');

    await click('[data-test-slices-toggle]');
    await click('[data-test-slice-tab="tempo"]');
    assert.dom('[data-test-slice-tab="tempo"]').hasAria('selected', 'true');
    assert.dom('[data-test-tempo-step]').exists();
    assert.dom('[data-test-grid-count]').doesNotExist();
    assert
      .dom('[data-test-slices-count]')
      .hasText('32 slices', 'sixteenths at 120: 32 of them in 4 s');
    await click('[data-test-slices-apply]');
    assert.strictEqual(ref.slices.length, 33);

    await click('[data-test-slices-toggle]');
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
    await click('[data-test-slices-toggle]');
    await click('[data-test-slice-clear]');
    assert.deepEqual([...ref.slices], [0, 4]);
    assert.strictEqual(project.doc.samples['loop']!.slices, undefined);
    project.undo();
    await settled();
    assert.strictEqual(ref.slices.length, 33);
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

    await click('[data-test-sound-reset]');

    assert.strictEqual(audio.sampler(loopId, 'sampler')!.buffer?.key, 'loop');
    assert.dom('[data-test-sound-reset]').doesNotExist();

    // the sidebar's "Use", on the project's real pool
    if (!find('[data-test-sound-browser]')) {
      await click('[data-test-sidebar-toggle]');
    }
    await click('[data-test-sounds-project]');
    assert.dom('[data-test-pool-row]').exists({ count: 6 });
    assert
      .dom('[data-test-pool-row="loop"]')
      .hasAttribute('data-current', 'true');
    assert.dom('[data-test-pool-row="loop"]').includesText('4 s');
    await click('[data-test-pool-use="clap"]');
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

  test('region and slices are told apart, and one line says which trigger plays which', async function (assert) {
    await open();
    assert.dom('[data-test-waveform-hint]').includesText('trigger()');
    assert.dom('[data-test-waveform-hint]').includesText('trigger({ slice })');
    assert
      .dom(handle('start'))
      .exists('the region’s handles are there on a sliced sound too');
    assert.dom(handle('end')).exists();
    await select('[data-test-sound-select]', 'kick');
    assert
      .dom('[data-test-waveform-hint]')
      .doesNotExist('a sound that is one slice needs no such line');
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
