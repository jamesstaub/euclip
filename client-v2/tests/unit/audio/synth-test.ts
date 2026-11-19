import { module, test } from 'qunit';
import { noteToHz } from 'client-v2/controls/modes';
import { newSynthTrack } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  controlKey,
  emptyValues,
  type ProjectDocument,
} from 'client-v2/project/schema';
import {
  arrayDefaultProject,
  peak,
  rms,
  startProject,
  type Harness,
} from 'client-v2/tests/helpers/runner';

const ONE = 't-1';
const PITCH = controlKey('#osc', 'frequency');

function oneTrack(script: string): ProjectDocument {
  return {
    ...arrayDefaultProject(),
    script: '',
    tracks: [
      { id: ONE, name: 'one', script, level: 1, pan: 0, values: emptyValues() },
    ],
  };
}

const groups = (h: Harness): string[] => [
  ...new Set(h.runner.controls(ONE).map((control) => control.group.id)),
];
const sourceKeys = (h: Harness, node: string): string[] =>
  h.runner.sourceControls(ONE, node).map((control) => control.key);

const MIXED = `__().sampler({ id: 's', buffer: 'kick' }).to('channel');
__().sine({ id: 'osc', gate: 'closed' }).adsr({ id: 'env' }).lowpass({ id: 'filter' }).gain({ id: 'level', gain: 0.2 }).to('channel');
__().noise({ id: 'hiss' }).gain({ id: 'hissLevel', gain: 0.1 }).to('channel');
__().monosynth({ id: 'mono' }).to('channel');
__().lfo({ id: 'wobble', frequency: 2, depth: 10 }).modulate('#filter', 'frequency');
controls();`;

module('Unit | Audio | synth sources', function () {
  module('source versus processors', function () {
    test('a node of the source category, or a synth macro, is a source; its controls are the source tab’s and nothing is in both', async function (assert) {
      const h = await startProject(oneTrack(MIXED), 1);
      assert.strictEqual(h.runner.error(ONE), null);
      const node = (id: string) =>
        [...h.engine.scope(ONE).select(`#${id}`)][0]!;
      assert.deepEqual(
        ['s', 'osc', 'hiss', 'mono', 'env', 'filter', 'level', 'wobble'].map(
          (id) => h.runner.isSource(node(id)),
        ),
        [true, true, true, true, false, false, false, false],
        'sampler, oscillator, noise and the synth macro are sources; envelope, filter, gain and lfo are not',
      );
      assert.deepEqual(
        [...groups(h)].sort(),
        ['env', 'filter', 'hissLevel', 'level', 'wobble'],
        'the processors list no source',
      );
      assert.true(groups(h).includes('wobble'), 'a modulator stays there');
      assert.true(groups(h).includes('filter'));
      for (const id of ['s', 'osc', 'hiss', 'mono']) {
        assert.false(groups(h).includes(id), `${id} is not among processors`);
        assert.true(sourceKeys(h, id).length > 0, `${id} has source controls`);
      }
      const all = h.runner.allControls(ONE).map((control) => control.key);
      const split = [
        ...h.runner.controls(ONE).map((control) => control.key),
        ...['s', 'osc', 'hiss', 'mono'].flatMap((id) => sourceKeys(h, id)),
      ];
      assert.deepEqual(
        [...split].sort(),
        [...all].sort(),
        'every control is in exactly one of the two',
      );
      assert.strictEqual(new Set(split).size, split.length, 'none twice');
      assert.true(sourceKeys(h, 'osc').includes('#osc › detune'));
    });
  });

  module('synth()', function () {
    test('it declares an editor for an oscillator, with a pitch control made for the keyboard under the key a slider would use', async function (assert) {
      const h = await startProject(
        oneTrack(
          `__().sine({ id: 'osc' }).gain({ id: 'level', gain: 0.1 }).to('channel');\nsynth('#osc', { label: 'Lead' });`,
        ),
        1,
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      const [view] = h.runner.synths(ONE);
      assert.strictEqual(view!.label, 'Lead');
      assert.strictEqual(view!.pitchParam, 'frequency');
      assert.strictEqual(view!.pitch!.key, PITCH);
      assert.false(view!.playsNote);
      assert.deepEqual(
        h.runner.sources(ONE).map((source) => `${source.kind} ${source.key}`),
        ['synth #osc › synth'],
      );
      assert.deepEqual(
        h.runner.allControls(ONE).map((control) => control.key),
        [],
        'the pitch is the keyboard’s: it has no row of its own',
      );
    });

    test('the pitch option names another parameter; a stored pitch is applied on build', async function (assert) {
      const doc = applyOperation(
        oneTrack(
          `__().saw({ id: 'osc' }).to('channel');\nsynth('#osc', { pitch: 'detune' });`,
        ),
        {
          type: 'setControlValue',
          scope: ONE,
          key: '#osc › detune',
          value: 50,
        },
      );
      const h = await startProject(doc, 1);
      assert.strictEqual(h.runner.synths(ONE)[0]!.pitchParam, 'detune');
      assert.strictEqual(
        [...h.engine.scope(ONE).select('#osc')][0]!.param('detune').value,
        50,
      );
      await h.setScript(
        ONE,
        `__().saw({ id: 'osc' }).to('channel');\nsynth('#osc', { pitch: 'nope' });`,
      );
      assert.true(
        h.runner
          .warnings(ONE)
          .some((w) => /no parameter "nope"/.test(w.message)),
        'a pitch that is not a parameter is said, on its line',
      );
    });

    test('a slider of the script’s own for the pitch is the keyboard’s control, in the list as well', async function (assert) {
      const h = await startProject(
        oneTrack(
          `__().sine({ id: 'osc' }).to('channel');\nsynth('#osc');\nslider('#osc', 'frequency', { mode: 'note' });`,
        ),
        1,
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.strictEqual(h.runner.synths(ONE)[0]!.pitch!.key, PITCH);
      assert.false(h.runner.synths(ONE)[0]!.pitch!.implicit);
      assert.deepEqual(sourceKeys(h, 'osc'), [PITCH]);
    });

    test('a synth macro is played by note: no pitch parameter, no stored pitch', async function (assert) {
      const h = await startProject(
        oneTrack(
          `__().monosynth({ id: 'mono' }).to('channel');\nsynth('#mono');`,
        ),
        1,
      );
      const [view] = h.runner.synths(ONE);
      assert.true(view!.playsNote);
      assert.strictEqual(view!.pitchParam, null);
      assert.strictEqual(view!.pitch, null);
    });

    test('a sampler or a node that is not a source is a warning on its line, and the rest runs', async function (assert) {
      const h = await startProject(
        oneTrack(
          `__().sampler({ id: 's', buffer: 'kick' }).lowpass({ id: 'f' }).to('channel');\nsynth('#s');\nsynth('#f');\nsynth('#nothing');`,
        ),
        1,
      );
      assert.strictEqual(h.runner.error(ONE), null);
      const warnings = h.runner.warnings(ONE);
      assert.deepEqual(
        warnings.map((w) => w.line),
        [2, 3, 4],
      );
      assert.true(/waveform\('#s'\)/.test(warnings[0]!.message));
      assert.true(/no oscillator or synth macro/.test(warnings[1]!.message));
      assert.true(/matches no node/.test(warnings[2]!.message));
      assert.deepEqual(h.runner.synths(ONE), []);
    });

    test('controls() declares one for every oscillator and synth macro, a waveform for the sampler; an explicit synth wins', async function (assert) {
      const h = await startProject(oneTrack(MIXED), 1);
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.deepEqual(
        h.runner
          .sources(ONE)
          .map((source) => `${source.kind} ${source.nodeId}`),
        ['waveform s', 'synth osc', 'synth hiss', 'synth mono'],
      );
      const explicit = await startProject(
        oneTrack(
          `${MIXED}\nsynth('#osc', { label: 'Mine' });`.replace(
            'controls();\n',
            '',
          ),
        ),
        1,
      );
      assert.strictEqual(
        explicit.runner.synths(ONE).find((view) => view.nodeId === 'osc')!
          .label,
        'Mine',
        'its label, not the implicit one',
      );
      assert.strictEqual(
        explicit.runner.synths(ONE).filter((view) => view.nodeId === 'osc')
          .length,
        1,
        'one editor',
      );
    });
  });

  module('the keyboard', function () {
    test('a note is the stored pitch, in Hz, as a note-mode slider holds it; one undo step is the app’s (grouped), the parameter follows', async function (assert) {
      const h = await startProject(
        oneTrack(`__().sine({ id: 'osc' }).to('channel');\nsynth('#osc');`),
        1,
      );
      const hz = noteToHz(69);
      h.apply({ type: 'setControlValue', scope: ONE, key: PITCH, value: hz });
      assert.strictEqual(
        h.doc.tracks[0]!.values.controls[PITCH]?.value,
        hz,
        'stored',
      );
      assert.strictEqual(
        [...h.engine.scope(ONE).select('#osc')][0]!.param('frequency').value,
        hz,
        'applied, no rebuild',
      );
      assert.strictEqual(h.runner.synths(ONE)[0]!.pitch!.value, hz);
    });

    test('playNote triggers an oscillator and what follows it, releaseNote lets go; a macro is triggered with the note', async function (assert) {
      const GATED = `__().sine({ id: 'osc', gate: 'closed' }).adsr({ id: 'env', attack: 0.005, sustain: 0.8 }).gain({ id: 'level', gain: 0.3 }).to('channel');\nsynth('#osc');`;
      const silent = await startProject(oneTrack(GATED), 1);
      silent.engine.transport.stop();
      assert.true(
        rms(await silent.render(), 0, 1) < 1e-6,
        'nothing sounds without a note',
      );

      const h = await startProject(oneTrack(GATED), 1);
      h.engine.transport.stop();
      assert.true(
        h.runner.playNote(ONE, 'osc', {
          midi: 57,
          hz: 220,
          param: 'frequency',
        }),
      );
      const played = await h.render();
      assert.true(rms(played, 0.1, 0.9) > 0.01, 'the note is heard');
      assert.true(peak(played, 0, 1) < 1, 'and is not too loud');

      const released = await startProject(oneTrack(GATED), 1);
      released.engine.transport.stop();
      released.runner.playNote(ONE, 'osc', {
        midi: 57,
        hz: 220,
        param: 'frequency',
      });
      released.runner.releaseNote(ONE, 'osc');
      assert.true(
        rms(await released.render(), 0.5, 1) < 1e-4,
        'released: it dies away',
      );

      // an oscillator whose gate is open is sounding already: letting go of a key must not close it for good
      const open = await startProject(
        oneTrack(
          `__().sine({ id: 'osc' }).gain({ id: 'level', gain: 0.3 }).to('channel');\nsynth('#osc');`,
        ),
        1,
      );
      open.engine.transport.stop();
      open.runner.playNote(ONE, 'osc', {
        midi: 57,
        hz: 220,
        param: 'frequency',
      });
      open.runner.releaseNote(ONE, 'osc');
      assert.true(
        rms(await open.render(), 0.2, 0.9) > 0.05,
        'an open gate stays open after the key goes up',
      );

      const mono = await startProject(
        oneTrack(
          `__().monosynth({ id: 'mono' }).to('channel');\nsynth('#mono');`,
        ),
        1,
      );
      mono.engine.transport.stop();
      assert.true(
        mono.runner.playNote(ONE, 'mono', { midi: 60, hz: 261.6, param: null }),
      );
      assert.true(
        rms(await mono.render(), 0.1, 0.9) > 0.005,
        'the macro plays',
      );
    });
  });

  module('the Synth template', function () {
    test('it builds clean, declares its editor and grid, and makes sound that is not too loud', async function (assert) {
      const track = newSynthTrack('synth');
      const h = await startProject(
        { ...arrayDefaultProject(), script: '', tracks: [track] },
        2,
      );
      const id = track.id;
      assert.strictEqual(h.runner.error(id), null);
      assert.deepEqual(h.runner.warnings(id), []);
      assert.deepEqual(
        h.runner.sources(id).map((source) => `${source.kind} ${source.nodeId}`),
        ['synth osc'],
      );
      assert.deepEqual(
        h.runner.sourceControls(id, 'osc').map((control) => control.key),
        ['#osc › detune'],
      );
      assert.deepEqual(
        h.runner.controls(id).map((control) => control.key),
        [
          '#env › attack',
          '#env › release',
          '#filter › frequency',
          '#level › gain',
        ],
        'the processors keep the rest',
      );
      assert.deepEqual(
        h.runner.stepGrids(id).map((grid) => grid.steps.join('')),
        ['1001001010010100'],
      );
      const rendered = await h.render();
      assert.true(rms(rendered, 0, 2) > 0.005, 'it sounds');
      const top = Math.max(peak(rendered, 0, 2, 0), peak(rendered, 0, 2, 1));
      assert.true(top < 1, `peak ${top.toFixed(3)} is below 1`);
      assert.true(top > 0.05, 'and is not faint');
    });
  });
});
