import { module, test } from 'qunit';
import { mapping } from 'client-v2/controls/modes';
import { REGION_GAP, samplerRegion } from 'client-v2/controls/live-range';
import { STORED_BUFFER_CHOICE } from 'client-v2/controls/features';
import { applyOperation } from 'client-v2/project/operations';
import {
  emptyValues,
  LOOP_SLICES,
  type ProjectDocument,
} from 'client-v2/project/schema';
import {
  likeness as exact,
  makeWav,
  rms,
  startProject,
  type Harness,
  arrayDefaultProject,
} from 'client-v2/tests/helpers/runner';

const ONE = 't-1';
const TWO = 't-2';

function track(id: string, script: string) {
  return { id, name: id, script, level: 1, pan: 0, values: emptyValues() };
}

function project(...scripts: string[]): ProjectDocument {
  return {
    ...arrayDefaultProject(),
    // (no master compressor: what is rendered is what the samplers play)
    script: '',
    tracks: scripts.map((script, index) =>
      track(index === 0 ? ONE : TWO, script),
    ),
  };
}

const SAMPLER = (buffer = 'kick'): string =>
  `__().sampler({ id: 's', buffer: '${buffer}' }).to('channel');\n`;

function wave(h: Harness, scope = ONE) {
  const found = h.runner.waveforms(scope)[0];
  if (!found) throw new Error('No waveform is declared.');
  return found;
}

function numberOf(h: Harness, name: string, scope = ONE) {
  const control = wave(h, scope).params[name];
  if (!control || control.meta.kind !== 'number')
    throw new Error(`No ${name}.`);
  return {
    ...control,
    meta: control.meta,
    map: mapping(control.mode, control.meta),
  };
}

function set(
  h: Harness,
  name: string,
  value: number | boolean,
  scope = ONE,
): void {
  h.apply({
    type: 'setControlValue',
    scope,
    key: wave(h, scope).params[name]!.key,
    value,
  });
}

/** A render's first channel, whole: `likeness` below finds where in it the sound begins. */
function heardFrom(samples: Float32Array, length = 2000): Float32Array {
  return samples.subarray(0, length + 700);
}

/**
 * How like a stretch of a sound the start of a render is, wherever in its first moments the sound
 * begins: the first step is heard a little after 0, and a voice fades in over a few samples (so those
 * are left out of the comparison).
 */
function likeness(render: Float32Array, sound: Float32Array): number {
  let best = -1;
  for (let lag = 0; lag === 0 || lag + sound.length <= render.length; lag++) {
    best = Math.max(
      best,
      exact(render.subarray(lag + 64, lag + sound.length), sound.subarray(64)),
    );
  }
  return best;
}

module('Unit | Audio | waveform', function () {
  module('the declaration', function () {
    test('waveform(sampler) is one editor over ordinary controls, keyed as a slider for each would be', async function (assert) {
      const h = await startProject(project(`${SAMPLER()}waveform('#s');`));
      assert.deepEqual(h.runner.warnings(ONE), []);
      const view = wave(h);
      assert.strictEqual(view.key, '#s › waveform');
      assert.strictEqual(view.nodeId, 's');
      assert.strictEqual(view.line, 2);
      assert.deepEqual(
        Object.entries(view.params).map(
          ([name, control]) => `${name}: ${control!.key} (${control!.kind})`,
        ),
        [
          'start: #s › start (slider)',
          'end: #s › end (slider)',
          'loopStart: #s › loopStart (slider)',
          'loopEnd: #s › loopEnd (slider)',
          'loop: #s › loop (toggle)',
          'reverse: #s › reverse (toggle)',
          'speed: #s › speed (slider)',
        ],
      );
      assert.deepEqual(
        h.runner.controls(ONE),
        [],
        'its parts are not rows of the controls pane',
      );
      const declaration = h.runner
        .declarations(ONE)
        .find((d) => d.kind === 'waveform')!;
      assert.deepEqual(
        declaration.bindings.map((b) =>
          b.type === 'param'
            ? b.param
            : b.type === 'option'
              ? `option ${b.option}`
              : b.type,
        ),
        [
          'start',
          'end',
          'loopStart',
          'loopEnd',
          'loop',
          'reverse',
          'speed',
          'option buffer',
        ],
        'the declaration lists everything the widget is a view over, as plain data',
      );
      assert.false(
        JSON.stringify(h.runner.declarations(ONE)).includes('function'),
      );
      assert.deepEqual(view.sound, {
        key: 'kick',
        state: 'ready',
        duration: h.engine.buffers.get('kick')!.duration,
        slices: [0, h.engine.buffers.get('kick')!.duration!],
      });
    });

    test('a slider for the same parameter and the waveform are the same control', async function (assert) {
      const h = await startProject(
        project(
          `${SAMPLER()}waveform('#s');\nslider('#s', 'start', { label: 'Begin' });\ncontrols('#s', ['end', 'gain']);`,
        ),
      );
      assert.deepEqual(
        h.runner.controls(ONE).map((c) => `${c.key} ${c.label}`),
        ['#s › start Begin', '#s › end end', '#s › gain gain'],
        'the script’s own controls take over from the waveform’s parts, wherever they are in the script',
      );
      assert.strictEqual(
        wave(h).params['start']!.label,
        'Begin',
        'and the waveform uses them',
      );
      set(h, 'start', 0.1);
      assert.strictEqual(h.runner.controls(ONE)[0]!.value, 0.1);
      assert.strictEqual(h.runner.sampler(ONE, 's')!.param('start').value, 0.1);
      assert.deepEqual(
        h.doc.tracks[0]!.values.controls,
        { '#s › start': { value: 0.1 } },
        'one stored value',
      );

      await h.setScript(ONE, `${SAMPLER()}waveform('#s');`);
      assert.strictEqual(
        wave(h).params['start']!.value,
        0.1,
        'kept when the slider line goes',
      );
      assert.strictEqual(
        h.runner.sampler(ONE, 's')!.param('start').value,
        0.1,
        'and applied by the waveform declaration',
      );
    });

    test('several samplers get an editor each; a target with no sampler is a warning on its line', async function (assert) {
      const h = await startProject(
        project(`const a = __().sampler({ buffer: 'kick' }).lowpass(900).to('channel');
const b = __().sampler({ id: 'second', buffer: 'snare' }).to('channel');
waveform('sampler');
waveform(a.nodes.filter('lowpass'));
waveform('#nothing');
waveform(__.bus('channel'));
waveform();`),
      );
      assert.deepEqual(
        h.runner
          .waveforms(ONE)
          .map((w) =>
            `${w.nodeId} ${w.sound?.key} ${w.byPosition ? '(no id)' : ''}`.trim(),
          ),
        ['sampler-0 kick (no id)', 'second snare'],
      );
      const warnings = h.runner.warnings(ONE);
      assert.deepEqual(
        warnings.map((w) => w.line),
        [4, 5, 6, 7],
      );
      assert.true(
        warnings[0]!.message.includes(
          'there is no sampler there (found: lowpass)',
        ),
        warnings[0]!.message,
      );
      assert.true(
        warnings[1]!.message.includes('matches no node'),
        warnings[1]!.message,
      );
      assert.true(
        warnings[2]!.message.includes('needs a sampler'),
        warnings[2]!.message,
      );
      assert.true(warnings[3]!.message.includes('needs a sampler'));

      await h.setScript(
        ONE,
        `const a = __().sampler({ buffer: 'kick' }).lowpass(900).to('channel');\nwaveform(a);`,
      );
      assert.deepEqual(h.runner.warnings(ONE), []);
      assert.deepEqual(
        h.runner.waveforms(ONE).map((w) => w.nodeId),
        ['sampler-0'],
        'a chain: its samplers',
      );
    });

    test('the default tracks, and New Track, declare one', async function (assert) {
      const h = await startProject();
      for (const id of ['t-kick', 't-snare', 't-hat']) {
        assert.deepEqual(
          h.runner.waveforms(id).map((w) => w.nodeId),
          ['sampler'],
          id,
        );
        assert.deepEqual(h.runner.warnings(id), []);
      }
      assert.deepEqual(
        h.runner.controls('t-kick').map((c) => c.key),
        [
          '#sampler › speed',
          '#filter › frequency',
          '#filter › q',
          '#level › gain',
        ],
        'the controls pane is as it was',
      );
    });
  });

  module('region and loop', function () {
    test('samplerRegion: what the sampler plays for raw values', function (assert) {
      assert.deepEqual(
        samplerRegion({ start: 0, end: 0, loopStart: 0, loopEnd: 0 }, 2),
        { start: 0, end: 2, loopStart: 0, loopEnd: 2 },
        'the defaults: the whole sound, and the whole of it loops',
      );
      assert.deepEqual(
        samplerRegion({ start: 0.5, end: 1.5, loopStart: 0, loopEnd: 0 }, 2),
        { start: 0.5, end: 1.5, loopStart: 0.5, loopEnd: 1.5 },
      );
      assert.deepEqual(
        samplerRegion(
          { start: 0.5, end: 1.5, loopStart: 0.2, loopEnd: 1.9 },
          2,
        ),
        { start: 0.5, end: 1.5, loopStart: 0.5, loopEnd: 1.5 },
        'loop points are held inside the region',
      );
      assert.deepEqual(
        samplerRegion({ start: 0.5, end: 9, loopStart: 0.7, loopEnd: 1 }, 2),
        { start: 0.5, end: 2, loopStart: 0.7, loopEnd: 1 },
      );
      assert.deepEqual(
        samplerRegion({ start: 5, end: 1, loopStart: 0, loopEnd: 0 }, 2).start,
        2,
      );
    });

    test('the four points keep to their sides: start before end, loop points inside the region and in order', async function (assert) {
      const h = await startProject(
        project(`${SAMPLER('loop')}waveform('#s');`),
      );
      const length = 4;
      assert.strictEqual(numberOf(h, 'end').value, length);
      assert.strictEqual(
        numberOf(h, 'loopEnd').value,
        length,
        'a loop end of 0 stands at the end of the region',
      );
      assert.strictEqual(numberOf(h, 'loopStart').value, 0);

      set(h, 'start', 1);
      set(h, 'end', 3);
      assert.strictEqual(
        numberOf(h, 'loopStart').value,
        1,
        'with no loop of its own, the loop is the region',
      );
      assert.strictEqual(numberOf(h, 'loopEnd').value, 3);
      assert.strictEqual(numberOf(h, 'loopStart').meta.floor, 1);
      assert.strictEqual(numberOf(h, 'loopEnd').meta.ceiling, 3);

      set(h, 'loopStart', 1.5);
      set(h, 'loopEnd', 2.5);
      assert.strictEqual(
        numberOf(h, 'loopStart').map.toValue(1),
        2.5 - REGION_GAP,
        'loop start stops short of loop end',
      );
      assert.strictEqual(
        numberOf(h, 'loopStart').map.toValue(0),
        1,
        'and at the region’s start',
      );
      assert.strictEqual(
        numberOf(h, 'loopEnd').map.toValue(0),
        1.5 + REGION_GAP,
      );
      assert.strictEqual(
        numberOf(h, 'loopEnd').map.toValue(1),
        3,
        'loop end stops at the region’s end',
      );
      assert.strictEqual(numberOf(h, 'start').map.toValue(1), 3 - REGION_GAP);
      assert.strictEqual(
        numberOf(h, 'loopEnd').map.toPosition(2),
        0.5,
        'all on a travel that is the whole sound',
      );
      assert.deepEqual(
        numberOf(h, 'loopEnd').modes,
        ['seconds', 'ms', 'steps', 'percent', 'slice'],
        'the same units as start and end, slices too',
      );
      assert.strictEqual(
        mapping('slice', numberOf(h, 'loopEnd').meta).format(2.5),
        'slice 9',
        'an end is the slice it ends',
      );
      assert.strictEqual(
        mapping('slice', numberOf(h, 'loopStart').meta).format(1.5),
        'slice 6',
      );
    });
  });

  module('the sound it plays', function () {
    test('a chosen sound is stored like a control’s value and applied by the declaration; Reset returns to the script’s', async function (assert) {
      assert.true(
        STORED_BUFFER_CHOICE,
        'the switch is on (controls/features.ts)',
      );
      const h = await startProject(
        project(`${SAMPLER('kick')}waveform('#s');`),
      );
      const node = h.runner.sampler(ONE, 's')!;
      assert.true(wave(h).choosable);
      assert.false(wave(h).soundStored);
      assert.strictEqual(wave(h).soundKey, '#s › buffer');

      h.apply({
        type: 'setControlValue',
        scope: ONE,
        key: '#s › buffer',
        value: 'snare',
      });
      assert.strictEqual(node.buffer?.key, 'snare', 'changed in place');
      assert.strictEqual(h.runner.sampler(ONE, 's'), node, 'the same node');
      assert.strictEqual(wave(h).sound?.key, 'snare');
      assert.true(wave(h).soundStored);
      assert.strictEqual(
        numberOf(h, 'end').meta.max,
        h.engine.buffers.get('snare')!.duration,
        'the range follows the sound',
      );

      await h.setScript(
        ONE,
        `${SAMPLER('kick')}waveform('#s');\n// an edit elsewhere`,
      );
      assert.strictEqual(
        h.runner.sampler(ONE, 's')!.buffer?.key,
        'snare',
        'it survives the script running again',
      );
      assert.strictEqual(h.runner.sampler(ONE, 's'), node);
      await h.setScript(ONE, `${SAMPLER('hat')}waveform('#s');`);
      assert.strictEqual(
        h.runner.sampler(ONE, 's')!.buffer?.key,
        'snare',
        'and a change of the default in the code',
      );

      h.apply({ type: 'resetControl', scope: ONE, key: '#s › buffer' });
      await h.runner.run(ONE, true);
      assert.strictEqual(
        h.runner.sampler(ONE, 's')!.buffer?.key,
        'hat',
        'reset: what the script names',
      );
      assert.false(wave(h).soundStored);

      // with no waveform line the choice is dormant: the script's buffer plays
      h.apply({
        type: 'setControlValue',
        scope: ONE,
        key: '#s › buffer',
        value: 'clap',
      });
      await h.setScript(ONE, SAMPLER('hat'));
      assert.strictEqual(h.runner.sampler(ONE, 's')!.buffer?.key, 'hat');
      await h.setScript(ONE, `${SAMPLER('hat')}waveform('#s');`);
      assert.strictEqual(
        h.runner.sampler(ONE, 's')!.buffer?.key,
        'clap',
        'and applies again when the line returns',
      );
    });
  });

  module('slices are the sound’s', function () {
    test('two tracks that play one sound share its slices; a change reaches the buffer store and both editors', async function (assert) {
      const h = await startProject(
        project(
          `${SAMPLER('loop')}waveform('#s');`,
          `${SAMPLER('loop')}waveform('#s');`,
        ),
      );
      const ref = h.engine.buffers.get('loop')!;
      assert.deepEqual(
        [...ref.slices],
        [...LOOP_SLICES],
        'the document’s slices are given to the sound when it loads',
      );
      assert.deepEqual([...wave(h, ONE).sound!.slices], [...LOOP_SLICES]);

      h.apply({
        type: 'setSampleSlices',
        name: 'loop',
        slices: [0, 1, 2.5, 4],
      });
      assert.deepEqual([...ref.slices], [0, 1, 2.5, 4]);
      assert.deepEqual([...wave(h, ONE).sound!.slices], [0, 1, 2.5, 4]);
      assert.deepEqual(
        [...wave(h, TWO).sound!.slices],
        [0, 1, 2.5, 4],
        'the other track sees the same',
      );
      assert.deepEqual(h.doc.samples['loop']!.slices, [0, 1, 2.5, 4]);
      assert.deepEqual(
        h.derived,
        [],
        'the document’s own change is not sent back to it',
      );

      h.apply({ type: 'setSampleSlices', name: 'loop', slices: [] });
      assert.deepEqual(
        [...ref.slices],
        [0, 4],
        'cleared: one slice, the whole sound',
      );
      assert.strictEqual(h.doc.samples['loop']!.slices, undefined);
    });

    test('slices set by something else (a script) are taken into the document, without a step to undo', async function (assert) {
      const h = await startProject(
        project(`${SAMPLER('loop')}waveform('#s');`),
      );
      h.engine.buffers.get('loop')!.slices = [0, 2, 4];
      assert.deepEqual(h.doc.samples['loop']!.slices, [0, 2, 4]);
      assert.deepEqual(h.derived, [
        { type: 'setSampleSlices', name: 'loop', slices: [0, 2, 4] },
      ]);
      assert.deepEqual([...wave(h).sound!.slices], [0, 2, 4]);
    });

    test('the operation: sorted, without repeats, and one slice is nothing stored', function (assert) {
      const doc = arrayDefaultProject();
      const cut = applyOperation(doc, {
        type: 'setSampleSlices',
        name: 'kick',
        slices: [0.3, 0, 0.3, 0.1, 0.45, NaN, -1],
      });
      assert.deepEqual(cut.samples['kick'], {
        url: '/samples/kick.wav',
        slices: [0, 0.1, 0.3, 0.45],
      });
      assert.strictEqual(
        applyOperation(cut, {
          type: 'setSampleSlices',
          name: 'kick',
          slices: [0, 0.1, 0.3, 0.45],
        }),
        cut,
        'the same slices change nothing',
      );
      assert.deepEqual(
        applyOperation(cut, {
          type: 'setSampleSlices',
          name: 'kick',
          slices: [0, 0.45],
        }).samples['kick'],
        { url: '/samples/kick.wav' },
      );
      assert.strictEqual(
        applyOperation(doc, {
          type: 'setSampleSlices',
          name: 'nope',
          slices: [0, 1, 2],
        }),
        doc,
      );
    });
  });

  module('added files', function () {
    const tone = (): ArrayBuffer =>
      makeWav(1.5, (t) => 0.5 * Math.sin(2 * Math.PI * 220 * t));

    test('a sound that is a file is read from the file store before the scripts run, with its slices', async function (assert) {
      const doc: ProjectDocument = {
        ...project(`${SAMPLER('mine')}waveform('#s');`),
        samples: {
          ...arrayDefaultProject().samples,
          mine: { file: 'f-1', label: 'Mine.wav', slices: [0, 0.5, 1, 1.5] },
        },
      };
      const h = await startProject(doc, 2, [], {}, new Map([['f-1', tone()]]));
      assert.strictEqual(h.runner.error(ONE), null);
      const sound = wave(h).sound!;
      assert.strictEqual(sound.key, 'mine');
      assert.strictEqual(sound.state, 'ready');
      assert.true(Math.abs(sound.duration! - 1.5) < 0.001);
      assert.deepEqual([...sound.slices], [0, 0.5, 1, 1.5]);
      assert.deepEqual(h.runner.missingSamples(), []);
      assert.strictEqual(numberOf(h, 'end').meta.max, sound.duration);
    });

    test('a file that has gone from storage is said to be missing; the rest plays', async function (assert) {
      const doc: ProjectDocument = {
        ...project(`${SAMPLER('kick')}waveform('#s');`),
        samples: {
          ...arrayDefaultProject().samples,
          gone: { file: 'f-9', label: 'Gone.wav' },
        },
      };
      const h = await startProject(doc);
      assert.deepEqual(h.runner.missingSamples(), ['gone']);
      assert.strictEqual(wave(h).sound?.state, 'ready');
    });
  });

  module('what is heard', function () {
    const HIT = `${SAMPLER('kick')}__.transport.sequence('hit', { steps: [1, 0, 0, 0, 0, 0, 0, 0], step: '1/4' }, (ev) => { if (ev.value) __('#s').trigger(); });\nwaveform('#s');`;

    test('a moved start is where the sound begins', async function (assert) {
      const plain = await (await startProject(project(HIT), 1)).render();
      const h = await startProject(project(HIT), 1);
      set(h, 'start', 0.2);
      const moved = await h.render();
      const kick = h.engine.buffers.get('kick')!.buffer!.getChannelData(0);
      const at = (seconds: number, length = 2000) => {
        const from = Math.round(seconds * 44100);
        return kick.subarray(from, from + length);
      };
      const first = (buffer: AudioBuffer) =>
        heardFrom(buffer.getChannelData(0));
      assert.true(
        likeness(first(plain), at(0)) > 0.98,
        `unmoved: the kick from its beginning (${likeness(first(plain), at(0))})`,
      );
      assert.true(
        likeness(first(moved), at(0.2)) > 0.98,
        `moved: the kick from 0.2 s in (${likeness(first(moved), at(0.2))})`,
      );
      assert.true(likeness(first(moved), at(0)) < 0.6);
    });

    test('a moved end is where it stops', async function (assert) {
      const plain = await (await startProject(project(HIT), 1)).render();
      const h = await startProject(project(HIT), 1);
      set(h, 'end', 0.1);
      const cut = await h.render();
      assert.true(
        rms(plain, 0.15, 0.3) > 0.01,
        'the whole kick is still sounding at 0.15 s',
      );
      assert.true(rms(cut, 0.15, 0.3) < 1e-4, 'cut at 0.1 s: silence after');
      assert.true(rms(cut, 0, 0.09) > 0.05);
    });

    test('with loop on it goes round between the loop points', async function (assert) {
      const plain = await (await startProject(project(HIT), 1)).render();
      const h = await startProject(project(HIT), 1);
      set(h, 'loop', true);
      set(h, 'loopStart', 0.05);
      set(h, 'loopEnd', 0.1);
      const looped = await h.render();
      assert.true(rms(plain, 0.6, 0.9) < 1e-4, 'a kick is over by 0.6 s');
      assert.true(
        rms(looped, 0.6, 0.9) > 0.05,
        'looping: it is still going round',
      );
      // one turn of the loop later, the same samples again
      const turn = Math.round(0.05 * 44100);
      const from = Math.round(0.6 * 44100);
      const left = looped.getChannelData(0);
      assert.true(
        likeness(
          left.subarray(from, from + turn),
          left.subarray(from + turn, from + 2 * turn),
        ) > 0.99,
        'the same 50 ms, again and again',
      );
    });

    test('a step’s value chooses the slice that plays', async function (assert) {
      const sliced = (steps: string): string =>
        `${SAMPLER('loop')}__.transport.sequence('slices', { steps: [${steps}], step: '1/2' }, (ev) => { if (ev.value) __('#s').trigger({ slice: ev.value - 1 }); });\nstepGrid('slices');\nwaveform('#s');`;
      const h = await startProject(project(sliced('3, 0')), 1);
      const out = await h.render();
      const loop = h.engine.buffers.get('loop')!.buffer!.getChannelData(0);
      const slice = (index: number) => {
        const from = Math.round(LOOP_SLICES[index]! * 44100);
        return loop.subarray(from, from + 4000);
      };
      const heard = heardFrom(out.getChannelData(0), 4000);
      assert.true(
        likeness(heard, slice(2)) > 0.98,
        `step value 3: the third slice of the loop, its snare (${likeness(heard, slice(2))})`,
      );
      assert.true(likeness(heard, slice(0)) < 0.6, 'not the first');
      assert.true(
        rms(out, 0.3, 0.45) < 1e-4,
        'and only that slice: silence after its quarter second',
      );

      // cut the sound differently: the same step plays what is now the third slice
      const g = await startProject(project(sliced('3, 0')), 1);
      g.apply({
        type: 'setSampleSlices',
        name: 'loop',
        slices: [0, 1, 2, 3, 4],
      });
      const recut = heardFrom((await g.render()).getChannelData(0), 4000);
      const from = 2 * 44100;
      assert.true(
        likeness(recut, loop.subarray(from, from + 4000)) > 0.98,
        'the slices are the sound’s: recut, slice 3 starts at 2 s',
      );
    });
  });
});
