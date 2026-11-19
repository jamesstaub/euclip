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
import { controlKey } from 'client-v2/project/schema';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type SourceScopeService from 'client-v2/services/source-scope';
import type ViewService from 'client-v2/services/view';

const PITCH = controlKey('#osc', 'frequency');
const piano = '[data-test-piano]';
const key = (name: string): string => `[data-test-key="${name}"]`;

/** A pointer event at the middle of a key (low on a white one, where no black key covers it). */
function onKey(name: string, extra: Record<string, unknown> = {}) {
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

  const stored = (): unknown =>
    project.doc.tracks.at(-1)!.values.controls[PITCH]?.value;

  /** The app with a Synth track added and selected, its editor drawn. */
  async function open(): Promise<void> {
    await render(<template><AppShell /></template>);
    await click('[data-test-new-track-kinds]');
    await click('[data-test-new-synth]');
    id = project.doc.tracks.at(-1)!.id;
    await waitUntil(() => find(piano), { timeout: 3000 });
    await settled();
  }

  test('New Track has a Synth: its source tab has a scope, a keyboard and the source’s controls; the rest are processors', async function (assert) {
    await open();
    assert.dom('[data-test-synth="osc"]').exists();
    assert.dom('[data-test-synth-scope] canvas').exists();
    assert.dom(piano).exists();
    assert.dom(`${piano} [data-test-key]`).exists({ count: 24 + 0 });
    assert
      .dom('[data-test-source-controls="osc"] [data-test-control]')
      .exists({ count: 1 }, 'detune: what the script declares for the source');
    assert
      .dom('[data-test-control="#osc › detune"]')
      .exists('with the app’s own row and menu');
    assert.dom('[data-test-synth-hint]').exists('its hints are behind a ?');

    view.footerPane = 'controls';
    await settled();
    assert.deepEqual(
      findAll('[data-test-control]').map((el) =>
        el.getAttribute('data-test-control'),
      ),
      [
        '#env › attack',
        '#env › release',
        '#filter › frequency',
        '#level › gain',
      ],
    );
    assert.strictEqual(audio.error(id), null);
  });

  test('pressing a key sets the stored pitch and marks the key; a drag across keys is one undo step, and so is a press', async function (assert) {
    await open();
    assert.strictEqual(stored(), undefined, 'the script’s own pitch stands');
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'A2', 'the key for 110 Hz');

    await triggerEvent(piano, 'pointerdown', onKey('E3'));
    await triggerEvent(piano, 'pointerup', onKey('E3'));
    assert.strictEqual(stored(), noteToHz(52));
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'E3');
    assert.dom('[data-test-pitch-readout]').includesText('E3');

    await triggerEvent(piano, 'pointerdown', onKey('C3'));
    await triggerEvent(piano, 'pointermove', onKey('D3'));
    await triggerEvent(piano, 'pointermove', onKey('F3'));
    await triggerEvent(piano, 'pointerup', onKey('F3'));
    assert.strictEqual(stored(), noteToHz(53), 'it glided on to F3');

    project.undo();
    await settled();
    assert.strictEqual(stored(), noteToHz(52), 'one step undone: the drag');
    project.undo();
    await settled();
    assert.strictEqual(stored(), undefined, 'and the press before it');
  });

  test('a pitch between notes marks the nearest key and says how far off', async function (assert) {
    await open();
    project.apply({
      type: 'setControlValue',
      scope: id,
      key: PITCH,
      value: 450,
    });
    await settled();
    assert
      .dom(`${piano} [data-current="true"]`)
      .hasAttribute('data-note', 'A4', 'the keyboard follows the pitch');
    await click('[data-test-octave-up]');
    assert
      .dom(`${piano} [data-current="true"]`)
      .doesNotExist('shifted away from it');
    await click('[data-test-octave-down]');
    assert.dom(`${piano} [data-current="true"]`).exists();
    assert.dom('[data-test-pitch-readout]').includesText('A4 +39 ct');
  });

  test('the keyboard is reached by keys: arrows move a semitone (a step each), Enter plays', async function (assert) {
    await open();
    await focus(piano);
    await triggerKeyEvent(piano, 'keydown', 'ArrowRight');
    assert.strictEqual(stored(), noteToHz(46), 'A#2, a semitone above A2');
    await triggerKeyEvent(piano, 'keydown', 'ArrowLeft');
    await triggerKeyEvent(piano, 'keydown', 'ArrowLeft');
    assert.strictEqual(stored(), noteToHz(45) / 2 ** (1 / 12));
    project.undo();
    await settled();
    assert.strictEqual(stored(), noteToHz(45), 'each press is a step');
    await triggerKeyEvent(piano, 'keydown', 'Enter');
    assert.dom(`${piano} [data-down="true"]`).exists('Enter holds the note');
    await triggerKeyEvent(piano, 'keyup', 'Enter');
    assert.dom(`${piano} [data-down="true"]`).doesNotExist('and lets go');
  });

  test('per step on the pitch: the keyboard sets the single value and says so; the lane is not rewritten', async function (assert) {
    await open();
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
    await triggerEvent(piano, 'pointerdown', onKey('E3'));
    await triggerEvent(piano, 'pointerup', onKey('E3'));
    assert.strictEqual(stored(), noteToHz(52));
    assert.dom('[data-test-pitch-status]').includesText('single value');
  });

  test('the scope listens only while it is on screen, and its tap goes with it, and with a rebuilt node', async function (assert) {
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

  test('several sources are listed together; the signal chain opens the right editor, and a processor opens processors', async function (assert) {
    await open();
    await click('[data-test-script-toggle]');
    await typeScript(
      (text) =>
        `${text}\n__().sampler({ id: 'kick' }).to('channel');\nwaveform('#kick');\n`,
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
    await click('[data-test-chain-node="osc"]');
    assert.strictEqual(view.footerPane, 'source');
    assert.dom('[data-test-synth="osc"]').exists('the oscillator’s editor');
    await click('[data-test-chain-node="filter"]');
    assert.strictEqual(view.footerPane, 'controls');
  });
});
