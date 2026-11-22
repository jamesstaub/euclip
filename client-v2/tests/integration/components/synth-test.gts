import { module, test } from 'qunit';
import {
  click,
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
import { SYNTH_PITCH } from 'client-v2/project/default-project';
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
    view.footerPane = 'sound';
  });

  const OSC = `__().saw({ id: 'osc', frequency: 110 }).to('channel');
__.transport.sequence('steps', { steps: 16 }, () => {});
stepGrid('steps');
synth('#osc');
`;
  const stored = (): unknown =>
    project.doc.tracks.at(-1)!.values.controls[PITCH]?.value;
  const pitchOf = (): unknown =>
    project.doc.tracks.at(-1)!.values.controls[SYNTH_PITCH]?.value;
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

  test('New Track has a Synth: its source tab has a scope, a keyboard and the source’s controls, and no step strip; nothing is left for processors', async function (assert) {
    await open();
    assert.dom('[data-test-synth="synth"]').exists();
    assert.dom('[data-test-synth-scope] canvas').exists();
    assert.dom(`${piano} [data-test-key]`).exists({ count: 24 });
    assert
      .dom('[data-test-synth] [data-test-step]')
      .doesNotExist('no strip of steps: the melody is the pitch’s lane');
    assert
      .dom('[data-test-source-controls="synth"] [data-test-control]')
      .exists({ count: 5 });
    assert.dom('[data-test-synth-hint]').exists('its hints are behind a ?');
    await click('[data-test-synth-hint] [data-test-hint-button]');
    assert.dom('[data-test-steps-hint]').includesText('steps button');
    await click('[data-test-synth-hint] [data-test-hint-button]');
    assert.strictEqual(range(), 'C2 to B3', 'starts where the pitch is');
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'C2', 'the keyboard’s pitch');

    assert
      .dom('[data-test-pane="controls"] [data-test-control]')
      .doesNotExist('nothing is left for the processors');
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

  test('a synth macro’s keyboard keeps the pitch it plays (its frequency); the melody is the pitch’s lane', async function (assert) {
    await open();
    const before = steps();
    await press('D2');
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'D2');
    assert.deepEqual(steps(), before, 'the pattern is untouched');
    assert.true(
      Math.abs((pitchOf() as number) - noteToHz(38)) < 0.01,
      'the pitch is kept, in Hz',
    );
    await click('[data-test-lane-switch-lanes]');
    assert
      .dom(`.synth__keyboard [data-test-source-lane="${SYNTH_PITCH}"]`)
      .exists(
        'the steps button shows the pitch’s lane, in the keyboard’s place',
      );
    assert
      .dom('[data-test-source-lane] [data-locked]')
      .exists({ count: 3 }, 'the template’s three other notes');
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

  test('the keyboard’s lane switch shows the lane of the control last touched in the keyboard’s place', async function (assert) {
    await open();
    assert
      .dom('[data-test-source-controls="synth"] [data-test-lane-button]')
      .doesNotExist('no lane button in the synth’s rows');
    const rows = findAll(
      '[data-test-source-controls="synth"] [data-test-control]',
    );
    assert.true(rows.length >= 2, 'the synth has controls');
    assert.dom('[data-test-lane-switch-picture]').hasAria('pressed', 'true');
    await click('[data-test-lane-switch-lanes]');
    assert.dom('.synth__keyboard [data-test-source-lane]').exists();
    assert
      .dom('[data-test-source-controls] [data-test-control-steps]')
      .doesNotExist('not under the row');
    const key = rows[1]!.getAttribute('data-test-control')!;
    await triggerEvent(rows[1]!, 'pointerdown');
    assert.dom('[data-test-source-lane]').exists({ count: 1 });
    assert
      .dom(`[data-test-source-lane="${key}"]`)
      .exists('touching a row shows its lane');
    await click('[data-test-lane-switch-picture]');
    assert.dom('[data-test-source-lane]').doesNotExist('the keyboard again');
    assert.dom('[data-test-piano]').exists();
  });

  test('steps of the pitch set: the keyboard sets the others and says so', async function (assert) {
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
    audio.setLaneValue(
      project.doc.tracks.at(-1)!.id,
      '#osc › frequency',
      0,
      440,
    );
    await settled();
    assert.dom('[data-test-pitch-status]').includesText('1 of 16 steps');
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

    view.footerPane = 'sequence';
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
    assert.strictEqual(view.footerPane, 'sound');
    assert.dom('[data-test-synth="synth"]').exists('the synth’s editor');
    await click('[data-test-chain-node="filter"]');
    assert.strictEqual(view.footerPane, 'sound');
  });
});
