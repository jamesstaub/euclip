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
  waitUntil,
} from '@ember/test-helpers';
import { EditorView } from '@codemirror/view';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { noteToHz } from 'client-v2/controls/modes';
import { controlKey, stepGridKey } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type SourceScopeService from 'client-v2/services/source-scope';
import type ViewService from 'client-v2/services/view';

const PITCH = controlKey('#osc', 'frequency');
const piano = '[data-test-piano]';
const key = (name: string): string => `[data-test-key="${name}"]`;

/** A pointer event at the middle of a key (low on a white one, where no black key covers it). */
function onKey(name: string, extra: Record<string, unknown> = {}) {
  // (the footer scrolls: a key must be on screen to be pressed)
  (find(key(name)) as HTMLElement).scrollIntoView({ block: 'nearest' });
  const rect = (find(key(name)) as HTMLElement).getBoundingClientRect();
  const black = name.includes('#');
  return {
    pointerId: 1,
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerType: 'touch',
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height * (black ? 0.3 : 0.9),
    ...extra,
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

module('Integration | Component | synth source', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  let project: ProjectService;
  let audio: AudioService;
  let scopes: SourceScopeService;
  let id: string;
  hooks.beforeEach(function () {
    view = this.owner.lookup('service:view');
    project = this.owner.lookup('service:project');
    audio = this.owner.lookup('service:audio');
    scopes = this.owner.lookup('service:source-scope');
    scopes.forceRunning = true;
    scopes.reducedMotion = false;
    view.footerOpen = true;
    view.footerPane = 'source';
  });

  const OSC = `__().saw({ id: 'osc', frequency: 110 }).to('channel');
__.transport.sequence('steps', { steps: 16 }, () => {});
stepGrid('steps');
synth('#osc');
`;
  const stored = (): unknown =>
    project.doc.tracks.at(-1)!.values.controls[PITCH]?.value;
  const steps = (): number[] =>
    project.doc.tracks.at(-1)!.values.controls[stepGridKey('steps')]
      ?.value as number[];
  const range = (): string => find('[data-test-key-range]')!.textContent.trim();

  /** The app with a Synth track added and selected, its editor drawn. */
  async function open(): Promise<void> {
    await render(<template><AppShell /></template>);
    await click('[data-test-new-track-kinds]');
    await click('[data-test-new-synth]');
    id = project.doc.tracks.at(-1)!.id;
    await waitUntil(() => find(piano), { timeout: 3000 });
    await settled();
  }

  /** The same track with an oscillator in place of the macro (no step values as notes). */
  async function useOscillator(): Promise<void> {
    await click('[data-test-script-toggle]');
    await typeScript(() => OSC);
    await click('[data-test-script-toggle]');
    await waitUntil(() => find('[data-test-synth="osc"]'), { timeout: 3000 });
    await settled();
  }

  const press = async (name: string): Promise<void> => {
    await triggerEvent(piano, 'pointerdown', onKey(name));
    await triggerEvent(piano, 'pointerup', onKey(name));
  };
  const cell = (n: number): string =>
    `[data-test-synth-steps] [data-test-step="${n - 1}"]`;

  test('New Track has a Synth: its source tab has a step strip, a scope, a keyboard and the source’s controls; nothing is left for processors', async function (assert) {
    await open();
    assert.dom('[data-test-synth="synth"]').exists();
    assert.dom('[data-test-synth-scope] canvas').exists();
    assert.dom(`${piano} [data-test-key]`).exists({ count: 24 });
    assert
      .dom('[data-test-synth-steps] [data-test-step]')
      .exists({ count: 16 });
    assert.dom(cell(1)).hasText('C2', 'a step shows its note');
    assert.dom(cell(2)).hasText('', 'a rest is empty');
    assert
      .dom('[data-test-source-controls="synth"] [data-test-control]')
      .exists({ count: 5 });
    assert.dom('[data-test-synth-hint]').exists('its hints are behind a ?');
    await click('[data-test-synth-hint] [data-test-hint-button]');
    assert.dom('[data-test-steps-hint]').includesText('ev.value');
    await click('[data-test-synth-hint] [data-test-hint-button]');
    assert.strictEqual(range(), 'C2 to B3', 'starts where the notes are');

    view.footerPane = 'controls';
    await settled();
    assert.dom('[data-test-control]').doesNotExist();
    assert.strictEqual(audio.error(id), null);
  });

  test('the octave changes only with the octave buttons: pressing every key in turn never moves the view', async function (assert) {
    await open();
    const before = range();
    const names = findAll(`${piano} [data-test-key]`).map((key) =>
      key.getAttribute('data-test-key')!,
    );
    for (const name of names) {
      await press(name);
      assert.strictEqual(range(), before, `${name} leaves the range`);
    }
    // and a drag from the first key to the last, a press at the right edge, a quick run of presses
    await triggerEvent(piano, 'pointerdown', onKey(names[0]!));
    await triggerEvent(piano, 'pointermove', onKey(names.at(-1)!));
    await triggerEvent(piano, 'pointerup', onKey(names.at(-1)!));
    for (let i = 0; i < 6; i++) await press('B3');
    assert.strictEqual(range(), before, 'repeated presses at the top');

    await click('[data-test-octave-up]');
    assert.strictEqual(range(), 'C3 to B4', 'the button moves it');
    await press('E3');
    assert.strictEqual(
      range(),
      'C3 to B4',
      'and pressing a key still does not',
    );
    await focus(piano);
    await triggerKeyEvent(piano, 'keydown', 'PageDown');
    assert.strictEqual(range(), before, 'PageDown is the same as the − button');
  });

  test('a step is chosen, then keys give it notes: each is one undo step, the next step is chosen, the grid in the row agrees', async function (assert) {
    await open();
    await click(cell(1));
    assert.dom(cell(1)).hasAttribute('data-selected', 'true');
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'C2');
    const start = steps();
    await press('E2');
    await press('G2');
    await press('A2');
    await press('C3');
    assert.deepEqual(steps().slice(0, 4), [40, 43, 45, 48]);
    assert.strictEqual(steps()[4], start[4], 'the next one is untouched');
    assert.dom(cell(1)).hasText('E2');
    assert.dom(cell(4)).hasText('C3');
    assert.dom(cell(5)).hasAttribute('data-selected', 'true', 'it moved on');
    assert.dom('[data-test-track="4"] [data-test-step]').exists({ count: 16 });
    assert.deepEqual(
      findAll('[data-test-track="4"] [data-test-step]')
        .slice(0, 4)
        .map((el) => el.getAttribute('aria-pressed')),
      ['true', 'true', 'true', 'true'],
      'the row’s grid holds the same pattern',
    );
    assert.strictEqual(stored(), undefined, 'no pitch was stored');

    project.undo();
    await settled();
    assert.strictEqual(steps()[3], start[3], 'one undo takes back one note');
    assert.strictEqual(steps()[2], 45);
    project.undo();
    project.undo();
    project.undo();
    await settled();
    assert.deepEqual(steps(), start, 'and four undo the line');
  });

  test('a double click on a strip cell opens the grid’s own value box: type 48, Enter; the cell, the grid and the undo agree', async function (assert) {
    await open();
    const row = (n: number): string =>
      `[data-test-track="4"] [data-test-step="${n}"]`;
    await click(cell(3));
    await click(cell(3));
    await triggerEvent(cell(3), 'dblclick');
    assert.dom('[data-test-synth-steps] .step-entry').exists('the box opens');
    assert
      .dom(cell(3))
      .hasAttribute('data-selected', 'true', 'and the cell is chosen');
    await fillIn('[data-test-synth-steps] .step-entry input', '48');
    await triggerKeyEvent(
      '[data-test-synth-steps] .step-entry input',
      'keydown',
      'Enter',
    );
    assert.strictEqual(steps()[2], 48);
    assert.dom(cell(3)).hasText('C3');
    assert
      .dom(cell(3))
      .hasAttribute('data-selected', 'true', 'it stays chosen');
    assert.dom(row(2)).hasAttribute('aria-pressed', 'true');
    assert.dom(row(2)).hasText('48', 'the row’s grid shows the raw number');
    project.undo();
    await settled();
    assert.strictEqual(steps()[2], 0, 'one undo restores it');
    assert.dom(cell(3)).hasText('');
  });

  test('the strip’s cells are the sequence pane grid’s steps: the same width', async function (assert) {
    await open();
    const width = (selector: string): number =>
      (find(selector) as HTMLElement).getBoundingClientRect().width;
    const strip = width('[data-test-synth-steps] [data-test-step="0"]');
    view.footerPane = 'sequence';
    await settled();
    const grid = width('[data-test-pane="sequence"] [data-test-step="0"]');
    assert.true(Math.abs(strip - grid) <= 1, `${strip} and ${grid}`);
  });

  test('rest, arrows, Escape, tapping again: choosing and clearing steps', async function (assert) {
    await open();
    await click(cell(1));
    await click('[data-test-step-rest]');
    assert.strictEqual(steps()[0], 0, 'Rest clears the step');
    assert.dom(cell(2)).hasAttribute('data-selected', 'true', 'and moves on');
    await triggerKeyEvent(cell(2), 'keydown', 'ArrowRight');
    assert.dom(cell(3)).hasAttribute('data-selected', 'true');
    await triggerKeyEvent(cell(3), 'keydown', 'ArrowLeft');
    assert.dom(cell(2)).hasAttribute('data-selected', 'true');
    await triggerKeyEvent(cell(2), 'keydown', 'ArrowLeft');
    await triggerKeyEvent(cell(1), 'keydown', 'ArrowLeft');
    assert.dom(cell(16)).hasAttribute('data-selected', 'true', 'wraps');
    await focus(piano);
    await triggerKeyEvent(piano, 'keydown', 'Backspace');
    assert
      .dom(cell(1))
      .hasAttribute('data-selected', 'true', 'Backspace on the keyboard too');
    await triggerKeyEvent(piano, 'keydown', 'Escape');
    assert.dom('[data-selected="true"]').doesNotExist('Escape lets go');
    await click(cell(4));
    await click(cell(4));
    assert.dom('[data-selected="true"]').doesNotExist('tapping again lets go');
    assert.dom('[data-test-step-rest]').isDisabled();
  });

  test('with no step chosen a macro synth plays and marks the last note, and keeps no pitch', async function (assert) {
    await open();
    const before = steps();
    await press('D2');
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'D2');
    assert.deepEqual(steps(), before, 'the pattern is untouched');
    assert.strictEqual(stored(), undefined);
  });

  test('a tapped new step takes the last note used, not 1; an off step comes back to its note', async function (assert) {
    await open();
    await click('[data-test-track="4"] [data-test-step]');
    assert.strictEqual(steps()[0], 0, 'step 1 went off');
    await click('[data-test-track="4"] [data-test-step]');
    assert.strictEqual(steps()[0], 36, 'and comes back to its note');
    const second = findAll('[data-test-track="4"] [data-test-step]')[1]!;
    await click(second);
    assert.strictEqual(steps()[1], 36, 'a new step takes the last note used');
  });

  test('an oscillator’s keyboard sets the stored pitch: a press and a drag are one undo step each', async function (assert) {
    await open();
    await useOscillator();
    assert.strictEqual(stored(), undefined, 'the script’s own pitch stands');
    await press('E2');
    assert.strictEqual(stored(), noteToHz(40));
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'E2');
    await triggerEvent(piano, 'pointerdown', onKey('C2'));
    await triggerEvent(piano, 'pointermove', onKey('D2'));
    await triggerEvent(piano, 'pointermove', onKey('F2'));
    await triggerEvent(piano, 'pointerup', onKey('F2'));
    assert.strictEqual(stored(), noteToHz(41), 'it glided on to F2');
    project.undo();
    await settled();
    assert.strictEqual(stored(), noteToHz(40));
    project.undo();
    await settled();
    assert.strictEqual(stored(), undefined);
  });

  test('a pitch between notes marks the nearest key and says how far off', async function (assert) {
    await open();
    await useOscillator();
    project.apply({
      type: 'setControlValue',
      scope: id,
      key: PITCH,
      value: 225,
    });
    await settled();
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'A3');
    assert.dom('[data-test-pitch-readout]').includesText('A3 +39 ct');
    assert.strictEqual(range(), 'C2 to B3', 'the view did not follow it');
  });

  test('an oscillator’s keyboard is reached by keys: arrows move a semitone (a step each), Enter plays', async function (assert) {
    await open();
    await useOscillator();
    await focus(piano);
    await triggerKeyEvent(piano, 'keydown', 'ArrowRight');
    assert.strictEqual(stored(), noteToHz(46), 'A#2, a semitone above A2');
    await triggerKeyEvent(piano, 'keydown', 'ArrowLeft');
    await triggerKeyEvent(piano, 'keydown', 'ArrowLeft');
    project.undo();
    await settled();
    assert.strictEqual(stored(), noteToHz(45), 'each press is a step');
    await triggerKeyEvent(piano, 'keydown', 'Enter');
    assert.dom(`${piano} [data-down="true"]`).exists('Enter holds the note');
    await triggerKeyEvent(piano, 'keyup', 'Enter');
    assert.dom(`${piano} [data-down="true"]`).doesNotExist('and lets go');
  });

  test('per step on the pitch: the keyboard sets the single value and says so', async function (assert) {
    await open();
    await useOscillator();
    await click('[data-test-script-toggle]');
    await typeScript((text) =>
      text.replace(
        "synth('#osc');",
        "synth('#osc');\nslider('#osc', 'frequency', { perStep: 'steps', mode: 'note' });",
      ),
    );
    await click('[data-test-script-toggle]');
    await waitUntil(() => find(piano));
    assert.dom('[data-test-pitch-status]').includesText('per step');
    await press('E2');
    assert.strictEqual(stored(), noteToHz(40));
  });

  test('the scope listens to the macro only while on screen; its tap goes with it, and with a rebuilt node', async function (assert) {
    await open();
    await waitUntil(() => scopes.visibleCount >= 1, { timeout: 3000 });
    scopes.step(0.02);
    assert.strictEqual(scopes.tapCount, 1, 'one tap, on the source');
    assert.strictEqual(scopes.lastPeak, 0, 'a flat line: nothing is playing');

    await click('[data-test-script-toggle]');
    await typeScript((text) => `${text}\n// again\n`);
    await click('[data-test-script-toggle]');
    await waitUntil(() => scopes.visibleCount >= 1, { timeout: 3000 });
    scopes.step(0.02);
    scopes.step(2);
    scopes.step(0.02);
    assert.strictEqual(scopes.tapCount, 1, 'the rebuilt node has the one tap');

    view.footerPane = 'controls';
    await settled();
    assert.strictEqual(scopes.visibleCount, 0, 'hidden: not registered');
    scopes.step(2);
    scopes.step(0.02);
    assert.strictEqual(scopes.tapCount, 0, 'no tap is left');
    await waitUntil(() => !scopes.looping, { timeout: 3000 });
    assert.false(scopes.looping, 'and no loop');
  });

  test('with reduced motion the scope redraws a few times a second, not every frame', async function (assert) {
    scopes.reducedMotion = true;
    await open();
    await waitUntil(() => scopes.visibleCount >= 1, { timeout: 3000 });
    const before = scopes.frames;
    scopes.step(0.016);
    scopes.step(0.016);
    assert.strictEqual(scopes.frames, before, 'frames in between are skipped');
    scopes.step(0.3);
    assert.strictEqual(scopes.frames, before + 1, 'one every quarter second');
  });

  test('a noise source shows a graphic: no keyboard, no steps, no scope tap; its name is in the tab list', async function (assert) {
    await open();
    await click('[data-test-script-toggle]');
    await typeScript(
      (text) =>
        `${text}\n__().noise({ id: 'hiss' }).to('channel');\nsynth('#hiss');\n`,
    );
    await click('[data-test-script-toggle]');
    await waitUntil(() => findAll('[data-test-waveform-tab]').length === 2, {
      timeout: 3000,
    });
    await click('[data-test-waveform-tab="hiss"]');
    assert.dom('[data-test-synth-noise]').exists();
    assert.dom('[data-test-synth-noise]').includesText('noise');
    assert.dom('[data-test-synth="hiss"] canvas').doesNotExist();
    assert.dom(piano).doesNotExist();
    assert.dom('[data-test-synth-steps]').doesNotExist();
  });

  test('several sources are listed together; the signal chain opens the right editor, and a processor opens processors', async function (assert) {
    await open();
    await click('[data-test-script-toggle]');
    await typeScript(
      (text) =>
        `${text}\n__().sampler({ id: 'kick' }).lowpass({ id: 'filter' }).to('channel');\nwaveform('#kick');\n`,
    );
    await click('[data-test-script-toggle]');
    await waitUntil(() => findAll('[data-test-waveform-tab]').length === 2, {
      timeout: 3000,
    });
    assert.deepEqual(
      findAll('[data-test-waveform-tab]').map((tab) =>
        tab.getAttribute('data-kind'),
      ),
      ['synth', 'waveform'],
      'a synth and a sampler in the order the script declared them',
    );
    await click('[data-test-waveform-tab="kick"]');
    assert.dom('[data-test-waveform="kick"]').exists();

    view.setRowsView('chain');
    await settled();
    await click('[data-test-chain-node="synth"]');
    assert.strictEqual(view.footerPane, 'source');
    assert.dom('[data-test-synth="synth"]').exists('the synth’s editor');
    await click('[data-test-chain-node="filter"]');
    assert.strictEqual(view.footerPane, 'controls');
  });
});
