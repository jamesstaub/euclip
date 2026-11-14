import { module, test } from 'qunit';
import { defaultProject, newTrack } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  isProjectDocument,
  PROJECT_SCOPE,
  SCHEMA_VERSION,
} from 'client-v2/project/schema';

module('Unit | Project | operations', function () {
  test('the default project is a valid document', function (assert) {
    const doc = defaultProject();
    assert.true(isProjectDocument(doc));
    assert.strictEqual(doc.schemaVersion, SCHEMA_VERSION);
    assert.strictEqual(doc.tracks.length, 3);
    assert.deepEqual(Object.keys(doc.samples), [
      'kick',
      'snare',
      'hat',
      'openhat',
      'clap',
    ]);
    assert.true(
      isProjectDocument(JSON.parse(JSON.stringify(doc))),
      'it is plain JSON',
    );
    assert.false(isProjectDocument({ ...doc, schemaVersion: 99 }));
    assert.false(isProjectDocument({ ...doc, tracks: [{ id: 'x' }] }));
    assert.false(isProjectDocument(null));
  });

  test('an operation returns a new document and leaves the old one alone', function (assert) {
    const doc = defaultProject();
    const frozen = JSON.stringify(doc);
    const next = applyOperation(doc, { type: 'setBpm', bpm: 96 });

    assert.strictEqual(next.bpm, 96);
    assert.notStrictEqual(next, doc);
    assert.strictEqual(JSON.stringify(doc), frozen);
    assert.strictEqual(
      next.tracks,
      doc.tracks,
      'what did not change is shared',
    );
    assert.strictEqual(
      applyOperation(next, { type: 'setBpm', bpm: 96 }),
      next,
      'no change, same object',
    );
  });

  test('setBpm keeps the tempo a whole number in range', function (assert) {
    const doc = defaultProject();
    assert.strictEqual(applyOperation(doc, { type: 'setBpm', bpm: 0 }).bpm, 1);
    assert.strictEqual(
      applyOperation(doc, { type: 'setBpm', bpm: 9000 }).bpm,
      500,
    );
    assert.strictEqual(
      applyOperation(doc, { type: 'setBpm', bpm: 97.6 }).bpm,
      98,
    );
    assert.strictEqual(applyOperation(doc, { type: 'setBpm', bpm: NaN }), doc);
  });

  test('setScript sets a track’s script or the project’s', function (assert) {
    const doc = defaultProject();
    const a = applyOperation(doc, {
      type: 'setScript',
      scope: 't-snare',
      script: '// a',
    });
    assert.strictEqual(a.tracks[1]?.script, '// a');
    assert.strictEqual(a.tracks[0], doc.tracks[0]);
    const b = applyOperation(doc, {
      type: 'setScript',
      scope: PROJECT_SCOPE,
      script: '// b',
    });
    assert.strictEqual(b.script, '// b');
    assert.strictEqual(
      applyOperation(doc, { type: 'setScript', scope: 'nope', script: '' }),
      doc,
    );
  });

  test('tracks are added, renamed and removed', function (assert) {
    const doc = defaultProject();
    const track = newTrack('bass');
    assert.ok(/^t-\w{8}$/.test(track.id), 'a generated id');
    let next = applyOperation(doc, { type: 'addTrack', track });
    assert.deepEqual(
      next.tracks.map((t) => t.name),
      ['kick', 'snare', 'hat', 'bass'],
    );
    assert.strictEqual(
      applyOperation(next, { type: 'addTrack', track }),
      next,
      'not twice',
    );

    next = applyOperation(next, {
      type: 'renameTrack',
      id: track.id,
      name: 'sub',
    });
    assert.strictEqual(next.tracks[3]?.name, 'sub');

    next = applyOperation(next, { type: 'removeTrack', id: 't-snare' });
    assert.deepEqual(
      next.tracks.map((t) => t.name),
      ['kick', 'hat', 'sub'],
    );

    const first = applyOperation(doc, { type: 'addTrack', track, index: 0 });
    assert.strictEqual(first.tracks[0]?.id, track.id);
  });

  test('the channel strip is clamped', function (assert) {
    const doc = defaultProject();
    assert.strictEqual(
      applyOperation(doc, { type: 'setTrackLevel', id: 't-kick', level: -1 })
        .tracks[0]?.level,
      0,
    );
    assert.strictEqual(
      applyOperation(doc, { type: 'setTrackPan', id: 't-kick', pan: 4 })
        .tracks[0]?.pan,
      1,
    );
    assert.strictEqual(
      applyOperation(doc, { type: 'setTrackPan', id: 't-kick', pan: -0.5 })
        .tracks[0]?.pan,
      -0.5,
    );
  });

  test('step overrides are stored with the script’s pattern, and cleared', function (assert) {
    const doc = defaultProject();
    const steps = [1, 1, 0, 0];
    let next = applyOperation(doc, {
      type: 'setSteps',
      scope: 't-hat',
      sequence: 'steps',
      steps,
      code: [1, 0, 0, 0],
    });
    assert.deepEqual(next.tracks[2]?.values.sequences, {
      steps: { value: [1, 1, 0, 0], code: [1, 0, 0, 0] },
    });
    steps[0] = 9;
    assert.strictEqual(
      next.tracks[2]?.values.sequences['steps']?.value[0],
      1,
      'a copy is kept',
    );

    next = applyOperation(next, {
      type: 'clearSteps',
      scope: 't-hat',
      sequence: 'steps',
    });
    assert.deepEqual(next.tracks[2]?.values.sequences, {});
  });

  test('the sample pool is edited by name', function (assert) {
    const doc = defaultProject();
    let next = applyOperation(doc, {
      type: 'setSample',
      name: 'tom',
      url: '/samples/tom.wav',
    });
    assert.deepEqual(next.samples['tom'], { url: '/samples/tom.wav' });
    next = applyOperation(next, { type: 'removeSample', name: 'tom' });
    assert.notOk('tom' in next.samples);
  });
});
