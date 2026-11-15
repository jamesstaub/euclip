import { module, test } from 'qunit';
import { settled } from '@ember/test-helpers';
import { setupTest } from 'client-v2/tests/helpers';
import { newSlicedLoopTrack } from 'client-v2/project/default-project';
import { MAX_FILE_BYTES } from 'client-v2/project/pool';
import { LOOP_SLICES } from 'client-v2/project/schema';
import { IndexedDbStorage, MemoryFiles } from 'client-v2/project/storage';
import { makeWav, startProject } from 'client-v2/tests/helpers/runner';

const wavFile = (name: string, seconds = 1.2): File =>
  new File(
    [makeWav(seconds, (t) => 0.4 * Math.sin(2 * Math.PI * 330 * t))],
    name,
    { type: 'audio/wav' },
  );

module('Unit | Service | sounds', function (hooks) {
  setupTest(hooks);

  test('slices are edited through the store: one change for every track that plays the sound, and undone as one', async function (assert) {
    const audio = this.owner.lookup('service:audio');
    const project = this.owner.lookup('service:project');
    await audio.boot();
    const a = newSlicedLoopTrack('a');
    const b = newSlicedLoopTrack('b');
    project.apply({ type: 'addTrack', track: a });
    project.apply({ type: 'addTrack', track: b });
    await settled();
    const ref = audio.engine!.buffers.get('loop')!;
    await ref.ready;
    await settled();
    assert.deepEqual(
      [...audio.waveforms(a.id)[0]!.sound!.slices],
      [...LOOP_SLICES],
    );

    // a drag of one boundary: many operations, one gesture
    for (const time of [0.3, 0.32, 0.36]) {
      audio.setSlices(
        'loop',
        LOOP_SLICES.map((slice, index) => (index === 1 ? time : slice)),
        'drag-1',
      );
    }
    assert.strictEqual(ref.slices[1], 0.36);
    assert.strictEqual(audio.waveforms(a.id)[0]!.sound!.slices[1], 0.36);
    assert.strictEqual(
      audio.waveforms(b.id)[0]!.sound!.slices[1],
      0.36,
      'the other track’s editor shows it too',
    );
    assert.strictEqual(
      audio.pool().find((entry) => entry.name === 'loop')?.slices,
      16,
    );

    audio.setSlices('loop', [0, 2, 4]);
    assert.deepEqual([...ref.slices], [0, 2, 4]);

    project.undo();
    await settled();
    assert.strictEqual(
      ref.slices[1],
      0.36,
      'undo: the slices before the last change',
    );
    assert.strictEqual(ref.slices.length, 17);
    project.undo();
    await settled();
    assert.deepEqual(
      [...ref.slices],
      [...LOOP_SLICES],
      'undo again: the whole drag in one step',
    );
    assert.deepEqual(
      [...audio.waveforms(b.id)[0]!.sound!.slices],
      [...LOOP_SLICES],
    );
    project.redo();
    await settled();
    assert.strictEqual(ref.slices[1], 0.36);
  });

  test('a drag of a handle is one step to undo however long it takes', async function (assert) {
    const audio = this.owner.lookup('service:audio');
    const project = this.owner.lookup('service:project');
    await audio.boot();
    const start = audio.waveforms('t-kick')[0]!.params['start']!;
    audio.setControl('t-kick', start.key, 0.1, 'handle-1');
    await new Promise((resolve) => setTimeout(resolve, 1100)); // longer than the time that groups ungrouped edits
    audio.setControl('t-kick', start.key, 0.2, 'handle-1');
    audio.setControl('t-kick', start.key, 0.25, 'handle-2');
    assert.strictEqual(
      audio.waveforms('t-kick')[0]!.params['start']!.value,
      0.25,
    );
    project.undo();
    assert.strictEqual(
      project.doc.tracks[0]!.values.controls[start.key]?.value,
      0.2,
      'the second drag undone',
    );
    project.undo();
    assert.strictEqual(
      project.doc.tracks[0]!.values.controls[start.key],
      undefined,
      'the first drag, both its moves, undone in one',
    );
  });

  test('an audio file is added to the pool: named, decoded, its bytes kept beside the project and found again', async function (assert) {
    const audio = this.owner.lookup('service:audio');
    const project = this.owner.lookup('service:project');
    await audio.boot();

    const result = await audio.addFile(wavFile('My Break (take 2).wav'));
    assert.deepEqual(result, { name: 'my_break_take_2' });
    const source = project.doc.samples['my_break_take_2']!;
    assert.strictEqual(source.label, 'My Break (take 2).wav');
    assert.true(/^f-/.test(source.file ?? ''));
    assert.false(
      JSON.stringify(project.doc).includes('RIFF'),
      'the audio is not in the document',
    );
    assert.true(JSON.stringify(project.doc).length < 20000);
    const kept = await project.files.get(source.file!);
    assert.strictEqual(kept?.name, 'My Break (take 2).wav');
    assert.strictEqual(
      kept?.bytes.byteLength,
      44 + Math.round(1.2 * 44100) * 2,
      'every byte of the file',
    );
    const entry = audio
      .pool()
      .find((candidate) => candidate.name === 'my_break_take_2')!;
    assert.true(entry.added);
    assert.strictEqual(entry.state, 'ready');
    assert.true(Math.abs(entry.duration! - 1.2) < 0.001);

    assert.deepEqual(
      await audio.addFile(wavFile('My Break (take 2).wav')),
      { name: 'my_break_take_2_2' },
      'a second of the same name gets a name of its own',
    );

    // "reload": another engine, given the same document and the same file store
    audio.setSlices('my_break_take_2', [0, 0.4, 0.8, 1.2]);
    audio.setControl('t-kick', '#sampler › buffer', 'my_break_take_2');
    const files = project.files as MemoryFiles;
    const again = await startProject(
      JSON.parse(JSON.stringify(project.doc)) as typeof project.doc,
      2,
      [],
      {},
      new Map([...files.files].map(([id, file]) => [id, file.bytes])),
    );
    const restored = again.runner.waveforms('t-kick')[0]!.sound!;
    assert.strictEqual(restored.key, 'my_break_take_2', 'the chosen sound');
    assert.strictEqual(restored.state, 'ready', 'decoded from the kept bytes');
    assert.deepEqual(
      [...restored.slices].map((slice) => Number(slice.toFixed(3))),
      [0, 0.4, 0.8, 1.2],
      'with its slices',
    );
  });

  test('a file that is not audio, or too large, is refused in words and nothing is added', async function (assert) {
    const audio = this.owner.lookup('service:audio');
    const project = this.owner.lookup('service:project');
    await audio.boot();
    const before = Object.keys(project.doc.samples);

    const notAudio = await audio.addFile(
      new File(['this is a text file, not sound'], 'notes.wav', {
        type: 'audio/wav',
      }),
    );
    assert.true(
      /not audio this browser can decode/.test(notAudio.error ?? ''),
      JSON.stringify(notAudio),
    );

    const huge = {
      name: 'huge.wav',
      size: MAX_FILE_BYTES + 1,
      type: 'audio/wav',
    } as File;
    const tooBig = await audio.addFile(huge);
    assert.true(
      /The most a sound can be is 30 MB/.test(tooBig.error ?? ''),
      JSON.stringify(tooBig),
    );

    assert.deepEqual(Object.keys(project.doc.samples), before);
    assert.strictEqual(
      audio.engine!.buffers.get('notes'),
      undefined,
      'nothing is left in the buffer store',
    );
    assert.strictEqual((project.files as MemoryFiles).files.size, 0);
  });

  test('IndexedDB keeps a file’s bytes and the project’s slices, and gives them back', async function (assert) {
    const storage = new IndexedDbStorage(`euclip-test-files-${Date.now()}`);
    try {
      const bytes = makeWav(0.25, (t) => Math.sin(2 * Math.PI * 100 * t));
      assert.true(
        await storage.put('f-abc', {
          bytes,
          name: 'Thing.wav',
          type: 'audio/wav',
        }),
      );
      const back = await storage.get('f-abc');
      assert.strictEqual(back?.name, 'Thing.wav');
      assert.strictEqual(back?.type, 'audio/wav');
      assert.deepEqual(
        new Uint8Array(back!.bytes),
        new Uint8Array(bytes),
        'the same bytes',
      );
      assert.strictEqual(await storage.get('f-none'), null);

      const project = this.owner.lookup('service:project');
      const doc = {
        ...project.doc,
        samples: {
          ...project.doc.samples,
          thing: { file: 'f-abc', label: 'Thing.wav', slices: [0, 0.1, 0.25] },
        },
      };
      assert.true(await storage.save(doc));
      const loaded = await storage.load();
      assert.deepEqual(loaded?.samples['thing'], {
        file: 'f-abc',
        label: 'Thing.wav',
        slices: [0, 0.1, 0.25],
      });
      assert.deepEqual(loaded?.samples['loop']?.slices, [...LOOP_SLICES]);

      await storage.delete('f-abc');
      assert.strictEqual(await storage.get('f-abc'), null);
    } finally {
      await storage.clear();
    }
  });
});
