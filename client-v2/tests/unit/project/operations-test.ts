import { module, test } from 'qunit';
import { defaultProject, newTrack } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  controlKey,
  isProjectDocument,
  migrateProject,
  PROJECT_SCOPE,
  SCHEMA_VERSION,
  sequencerKey,
} from 'client-v2/project/schema';

const FREQUENCY = controlKey('#filter', 'frequency');

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
    for (const track of doc.tracks) {
      assert.true(
        track.script.includes("sequencer('steps')"),
        `${track.name} declares its grid`,
      );
      assert.true(
        track.script.includes("slider('#filter', 'frequency')"),
        `${track.name} declares controls`,
      );
    }
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
    assert.true(/^t-\w{8}$/.test(track.id), 'a generated id');
    assert.true(
      track.script.includes("sequencer('steps')"),
      'the template declares its grid',
    );
    assert.true(
      track.script.includes("knob('#level', 'gain'"),
      'and a control',
    );
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

  test('a control’s value is stored by key, and reset forgets it', function (assert) {
    const doc = defaultProject();
    let next = applyOperation(doc, {
      type: 'setControlValue',
      scope: 't-kick',
      key: FREQUENCY,
      value: 500,
    });
    assert.deepEqual(next.tracks[0]?.values.controls, {
      [FREQUENCY]: { value: 500 },
    });
    assert.strictEqual(
      applyOperation(next, {
        type: 'setControlValue',
        scope: 't-kick',
        key: FREQUENCY,
        value: 500,
      }),
      next,
      'the same value changes nothing',
    );

    next = applyOperation(next, {
      type: 'setControlValue',
      scope: 't-kick',
      key: 'density',
      value: 0.25,
    });
    next = applyOperation(next, {
      type: 'setControlValue',
      scope: 't-kick',
      key: 'fills',
      value: true,
    });
    assert.deepEqual(Object.keys(next.tracks[0]!.values.controls), [
      FREQUENCY,
      'density',
      'fills',
    ]);

    next = applyOperation(next, {
      type: 'resetControl',
      scope: 't-kick',
      key: FREQUENCY,
    });
    assert.notOk(
      FREQUENCY in next.tracks[0]!.values.controls,
      'nothing left behind',
    );
    assert.strictEqual(
      applyOperation(next, {
        type: 'resetControl',
        scope: 't-kick',
        key: FREQUENCY,
      }),
      next,
      'resetting what is not stored changes nothing',
    );

    const project = applyOperation(doc, {
      type: 'setControlValue',
      scope: PROJECT_SCOPE,
      key: controlKey('#glue', 'ratio'),
      value: 8,
    });
    assert.deepEqual(project.values.controls, {
      '#glue › ratio': { value: 8 },
    });
  });

  test('a sequencer’s pattern is a control value too, and a copy is kept', function (assert) {
    const doc = defaultProject();
    const key = sequencerKey('steps');
    const steps = [1, 1, 0, 0];
    let next = applyOperation(doc, {
      type: 'setControlValue',
      scope: 't-hat',
      key,
      value: steps,
    });
    assert.deepEqual(next.tracks[2]?.values.controls, {
      'sequencer › steps': { value: [1, 1, 0, 0] },
    });
    steps[0] = 9;
    assert.deepEqual(next.tracks[2]?.values.controls[key]?.value, [1, 1, 0, 0]);
    assert.strictEqual(
      applyOperation(next, {
        type: 'setControlValue',
        scope: 't-hat',
        key,
        value: [1, 1, 0, 0],
      }),
      next,
      'the same pattern changes nothing',
    );
    next = applyOperation(next, { type: 'resetControl', scope: 't-hat', key });
    assert.deepEqual(next.tracks[2]?.values.controls, {});
  });

  test('a control’s own settings are kept beside its value, and survive a reset', function (assert) {
    const doc = defaultProject();
    let next = applyOperation(doc, {
      type: 'setControlOptions',
      scope: 't-kick',
      key: FREQUENCY,
      options: { mode: 'note' },
    });
    assert.deepEqual(next.tracks[0]?.values.controls[FREQUENCY], {
      options: { mode: 'note' },
    });

    next = applyOperation(next, {
      type: 'setControlValue',
      scope: 't-kick',
      key: FREQUENCY,
      value: 440,
    });
    next = applyOperation(next, {
      type: 'resetControl',
      scope: 't-kick',
      key: FREQUENCY,
    });
    assert.deepEqual(
      next.tracks[0]?.values.controls[FREQUENCY],
      { options: { mode: 'note' } },
      'the mode stays',
    );

    assert.strictEqual(
      applyOperation(next, {
        type: 'setControlOptions',
        scope: 't-kick',
        key: FREQUENCY,
        options: { mode: 'note' },
      }),
      next,
    );
    next = applyOperation(next, {
      type: 'setControlOptions',
      scope: 't-kick',
      key: FREQUENCY,
      options: { mode: undefined },
    });
    assert.notOk(
      FREQUENCY in next.tracks[0]!.values.controls,
      'a setting given as undefined is removed',
    );
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

module('Unit | Project | migration', function () {
  /** A document as version 1 of the app saved it. */
  function version1(): unknown {
    return {
      schemaVersion: 1,
      name: 'Saved yesterday',
      bpm: 133,
      crackedUpVersion: '0.1.0',
      script: "__.bus('main').gain.set(0.8);\n",
      values: { sequences: {} },
      tracks: [
        {
          id: 't-kick',
          name: 'kick',
          script:
            "__().sampler({ id: 'sampler', buffer: 'kick' }).to('out');\n// .to( 'out' ) and bus('out') are left as written\n",
          level: 0.5,
          pan: -0.25,
          values: {
            sequences: {
              steps: { value: [1, 1, 0, 0], code: [1, 0, 0, 0] },
              fill: { value: [0, 2], code: [0, 0] },
            },
          },
        },
        {
          id: 't-hat',
          name: 'hat',
          script: '',
          level: 1,
          pan: 0,
          values: { sequences: {} },
        },
      ],
      samples: { kick: { url: '/samples/kick.wav' } },
    };
  }

  test('a version 1 document is brought up to date', function (assert) {
    const doc = migrateProject(version1());

    assert.ok(doc, 'it loads');
    assert.true(isProjectDocument(doc));
    assert.strictEqual(doc?.schemaVersion, 3);
    assert.strictEqual(doc?.name, 'Saved yesterday');
    assert.strictEqual(doc?.bpm, 133);
    assert.strictEqual(doc?.tracks[0]?.level, 0.5);
    assert.strictEqual(doc?.tracks[0]?.pan, -0.25);
    assert.deepEqual(
      doc?.tracks[0]?.values,
      {
        controls: {
          'sequencer › steps': { value: [1, 1, 0, 0] },
          'sequencer › fill': { value: [0, 2] },
        },
      },
      'step patterns become sequencer values, without the copy of the script’s pattern',
    );
    assert.deepEqual(doc?.tracks[1]?.values, { controls: {} });
    assert.deepEqual(doc?.values, { controls: {} });
    assert.strictEqual(
      doc?.tracks[0]?.script,
      "__().sampler({ id: 'sampler', buffer: 'kick' }).to('channel');\n// .to( 'out' ) and bus('out') are left as written\n",
      "the generated .to('out') becomes .to('channel'), and nothing else in a script is edited",
    );
  });

  test('a current document passes through, and anything else is not opened', function (assert) {
    const current = defaultProject();
    assert.strictEqual(migrateProject(current), current);
    assert.strictEqual(
      migrateProject({ ...current, schemaVersion: 4 }),
      null,
      'a newer version',
    );
    assert.strictEqual(
      migrateProject({ schemaVersion: 1, name: 'half a document' }),
      null,
    );
    assert.strictEqual(migrateProject(null), null);
    assert.strictEqual(migrateProject('text'), null);
  });
});
