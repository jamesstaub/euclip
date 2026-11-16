import { module, test } from 'qunit';
import { defaultProject } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import {
  nameOfSource,
  nameProblem,
  renameInScript,
  sampleNameFor,
  sourceId,
  usesOf,
} from 'client-v2/project/pool';

module('Unit | Project | pool', function () {
  test('a name a script can type is made from the file’s, and never one that is taken', function (assert) {
    assert.strictEqual(sampleNameFor('110KIK.mp3', []), 's_110kik');
    assert.strictEqual(
      sampleNameFor('TR808 SN3 (long).wav', []),
      'tr808_sn3_long',
    );
    assert.strictEqual(
      sampleNameFor('Ünïcödé snäre.flac', []),
      'unicode_snare',
    );
    assert.strictEqual(sampleNameFor('kick.wav', ['kick', 'kick_2']), 'kick_3');
    assert.strictEqual(sampleNameFor('???.mp3', []), 'sound');
  });

  test('what a name may be, said in words', function (assert) {
    assert.strictEqual(nameProblem('my_kick2', ['kick']), null);
    assert.true(/needs a name/.test(nameProblem('', []) ?? ''));
    assert.true(/lower-case/.test(nameProblem('Kick', []) ?? ''));
    assert.true(/lower-case/.test(nameProblem('2kick', []) ?? ''));
    assert.true(/lower-case/.test(nameProblem('my kick', []) ?? ''));
    assert.true(/already/.test(nameProblem('kick', ['kick']) ?? ''));
    assert.true(/32/.test(nameProblem('a'.repeat(33), []) ?? ''));
  });

  test('the same source is the same sound: joining twice reuses the name', function (assert) {
    const samples = {
      kick: { url: '/samples/kick.wav' },
      dr: { library: '/Boss DR110/110KIK.mp3', label: '110KIK.mp3' },
      mine: { file: 'f-1', label: 'take.wav' },
    };
    assert.strictEqual(sourceId(samples.dr), 'library:/Boss DR110/110KIK.mp3');
    assert.strictEqual(
      nameOfSource(samples, 'library:/Boss DR110/110KIK.mp3'),
      'dr',
    );
    assert.strictEqual(nameOfSource(samples, 'file:f-1'), 'mine');
    assert.strictEqual(nameOfSource(samples, 'url:/samples/kick.wav'), 'kick');
    assert.strictEqual(nameOfSource(samples, 'file:f-2'), undefined);
  });

  test('where a sound is used: named by a script, or chosen for a sampler', function (assert) {
    let doc = defaultProject();
    // the default project's tracks have their sounds by choice, not by name
    assert.deepEqual(usesOf(doc, 'kick'), [
      { scope: 't-kick', label: 'Track 1', written: 0, chosen: true },
    ]);
    doc = applyOperation(doc, {
      type: 'setScript',
      scope: 't-hat',
      script: `__().sampler({ buffer: "kick" }).to('channel');\n__().sampler({buffer:'kick'}).to('channel'); // kick`,
    });
    assert.deepEqual(usesOf(doc, 'kick')[1], {
      scope: 't-hat',
      label: 'Track 3',
      written: 2,
      chosen: false,
    });
    assert.deepEqual(usesOf(doc, 'clap'), [], 'unused');
    assert.strictEqual(
      renameInScript(
        `a({ buffer: 'kick' }); b({buffer:"kick"}); 'kick'; buffer: 'kicker'`,
        'kick',
        'boom',
      ),
      `a({ buffer: 'boom' }); b({buffer:"boom"}); 'kick'; buffer: 'kicker'`,
      'only where a script names it as a buffer',
    );
  });

  test('renaming: the pool keeps its order, choices follow, scripts only when asked; duplicating has slices of its own', function (assert) {
    let doc = defaultProject();
    doc = applyOperation(doc, {
      type: 'setScript',
      scope: 't-hat',
      script: `__().sampler({ id: 'sampler', buffer: 'kick' }).to('channel');`,
    });
    const order = Object.keys(doc.samples);
    const plain = applyOperation(doc, {
      type: 'renameSample',
      from: 'kick',
      to: 'boom',
      scripts: false,
    });
    assert.deepEqual(
      Object.keys(plain.samples),
      order.map((name) => (name === 'kick' ? 'boom' : name)),
    );
    assert.strictEqual(
      plain.tracks[0]!.values.controls['#sampler › buffer']?.value,
      'boom',
      'the chosen sound follows',
    );
    assert.true(
      plain.tracks[2]!.script.includes("buffer: 'kick'"),
      'a script is not rewritten unasked',
    );
    const all = applyOperation(doc, {
      type: 'renameSample',
      from: 'kick',
      to: 'boom',
      scripts: true,
    });
    assert.true(all.tracks[2]!.script.includes("buffer: 'boom'"));
    assert.strictEqual(
      applyOperation(doc, {
        type: 'renameSample',
        from: 'kick',
        to: 'snare',
        scripts: true,
      }),
      doc,
      'not onto a name that is taken',
    );

    const twice = applyOperation(doc, {
      type: 'duplicateSample',
      name: 'loop',
      as: 'loop_2',
    });
    assert.deepEqual(twice.samples['loop_2'], doc.samples['loop']);
    assert.notStrictEqual(
      twice.samples['loop_2']!.slices,
      doc.samples['loop']!.slices,
    );
    const cut = applyOperation(twice, {
      type: 'setSampleSlices',
      name: 'loop_2',
      slices: [0, 2, 4],
    });
    assert.deepEqual(
      cut.samples['loop']!.slices,
      doc.samples['loop']!.slices,
      'the other keeps its own',
    );
  });
});
