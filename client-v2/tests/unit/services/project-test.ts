import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';
import { defaultProject } from 'client-v2/project/default-project';
import { applyOperation } from 'client-v2/project/operations';
import { IndexedDbStorage, MemoryStorage } from 'client-v2/project/storage';
import type { ProjectChange } from 'client-v2/services/project';

module('Unit | Service | project', function (hooks) {
  setupTest(hooks);

  test('it starts with the default project, and every change goes through apply', function (assert) {
    const project = this.owner.lookup('service:project');
    const heard: ProjectChange[] = [];
    project.subscribe((change) => heard.push(change));

    assert.deepEqual(
      project.doc.tracks.map((track) => track.name),
      ['kick', 'snare', 'hat'],
    );
    project.apply({ type: 'setBpm', bpm: 100 });
    project.apply({ type: 'setBpm', bpm: 100 });

    assert.strictEqual(project.doc.bpm, 100);
    assert.deepEqual(
      heard,
      [{ kind: 'operation', op: { type: 'setBpm', bpm: 100 }, derived: false }],
      'listeners hear each change once; a change that changes nothing is not one',
    );
  });

  test('mute and solo are undo steps of their own, one per press', function (assert) {
    const project = this.owner.lookup('service:project');
    project.apply({ type: 'setTrackMute', id: 't-kick', mute: true });
    project.apply({ type: 'setTrackMute', id: 't-kick', mute: false });
    project.apply({ type: 'setTrackSolo', id: 't-kick', solo: true });
    project.undo();
    assert.notOk(project.doc.tracks[0]?.solo);
    project.undo();
    assert.true(project.doc.tracks[0]?.mute, 'the unmute is undone');
    project.undo();
    assert.notOk(project.doc.tracks[0]?.mute);
    project.redo();
    assert.true(project.doc.tracks[0]?.mute);
  });

  test('undo and redo', function (assert) {
    const project = this.owner.lookup('service:project');
    const heard: string[] = [];
    project.subscribe((change) =>
      heard.push(change.kind === 'replace' ? change.reason : change.op.type),
    );
    assert.false(project.canUndo);

    project.apply({ type: 'removeTrack', id: 't-snare' });
    project.apply({ type: 'renameTrack', id: 't-kick', name: 'boom' });
    assert.deepEqual(
      project.doc.tracks.map((track) => track.name),
      ['boom', 'hat'],
    );

    project.undo();
    assert.deepEqual(
      project.doc.tracks.map((track) => track.name),
      ['kick', 'hat'],
    );
    project.undo();
    assert.deepEqual(
      project.doc.tracks.map((track) => track.name),
      ['kick', 'snare', 'hat'],
    );
    assert.false(project.canUndo);
    assert.true(project.canRedo);

    project.redo();
    assert.deepEqual(
      project.doc.tracks.map((track) => track.name),
      ['kick', 'hat'],
    );
    project.apply({ type: 'setBpm', bpm: 90 });
    assert.false(project.canRedo, 'a new change forgets what was undone');
    assert.deepEqual(heard, [
      'removeTrack',
      'renameTrack',
      'undo',
      'undo',
      'redo',
      'setBpm',
    ]);
  });

  test('a run of edits to one thing undoes as one; derived operations are not steps to undo', function (assert) {
    const project = this.owner.lookup('service:project');
    const original = project.doc.tracks[0]!.script;

    for (const script of ['a', 'ab', 'abc']) {
      project.apply({ type: 'setScript', scope: 't-kick', script });
    }
    project.apply({ type: 'setScript', scope: 't-hat', script: 'x' });
    project.apply(
      { type: 'setControlValue', scope: 't-kick', key: 'density', value: 0.5 },
      { derived: true },
    );

    project.undo();
    assert.strictEqual(
      project.doc.tracks[2]?.script,
      defaultProject().tracks[2]?.script,
      'the hat edit',
    );
    assert.strictEqual(project.doc.tracks[0]?.script, 'abc');
    project.undo();
    assert.strictEqual(
      project.doc.tracks[0]?.script,
      original,
      'three keystrokes, one undo',
    );
    assert.false(project.canUndo);
  });

  test('changes are saved to storage, and a saved project is loaded', async function (assert) {
    const storage = new MemoryStorage();
    const project = this.owner.lookup('service:project');
    project.storage = storage;
    await project.load();
    assert.strictEqual(
      project.doc.name,
      'Untitled project',
      'nothing saved: the default',
    );

    project.apply({ type: 'setProjectName', name: 'Tuesday' });
    project.apply({ type: 'setBpm', bpm: 133 });
    assert.true(await project.flush());
    assert.strictEqual(storage.saved?.name, 'Tuesday');
    assert.strictEqual(storage.saved?.bpm, 133);
    assert.notStrictEqual(storage.saved, project.doc, 'a copy is stored');
  });

  test('a project round-trips through IndexedDB', async function (assert) {
    const storage = new IndexedDbStorage(`euclip-test-${Date.now()}`);
    try {
      assert.strictEqual(await storage.load(), null, 'nothing there yet');

      let doc = defaultProject();
      doc = applyOperation(doc, { type: 'setBpm', bpm: 77 });
      doc = applyOperation(doc, {
        type: 'setTrackPan',
        id: 't-kick',
        pan: -0.5,
      });
      doc = applyOperation(doc, {
        type: 'setControlValue',
        scope: 't-hat',
        key: 'stepGrid › steps',
        value: [1, 0, 2],
      });
      doc = applyOperation(doc, {
        type: 'setControlValue',
        scope: 't-kick',
        key: '#filter › frequency',
        value: 440,
      });
      assert.true(await storage.save(doc));

      const loaded = await storage.load();
      assert.deepEqual(loaded, doc);
      assert.notStrictEqual(loaded, doc);
    } finally {
      await storage.clear();
    }
  });

  test('what is in storage is only trusted if it is a document this version knows', async function (assert) {
    const project = this.owner.lookup('service:project');
    const storage = new MemoryStorage();
    storage.saved = { ...defaultProject(), schemaVersion: 99 } as never;
    // MemoryStorage hands back what it has; the real storage validates. Check the real one's rule:
    const real = new IndexedDbStorage(`euclip-test-bad-${Date.now()}`);
    try {
      await real.save({ ...defaultProject(), schemaVersion: 99 } as never);
      assert.strictEqual(
        await real.load(),
        null,
        'another schema version is not opened',
      );
    } finally {
      await real.clear();
    }
    assert.strictEqual(project.doc.schemaVersion, 6);
  });

  test('a storage that fails does not break the app', async function (assert) {
    const project = this.owner.lookup('service:project');
    project.storage = {
      load: () => Promise.resolve(null),
      save: () => Promise.resolve(false),
    };
    await project.load();
    project.apply({ type: 'setBpm', bpm: 101 });
    assert.false(await project.flush());
    assert.strictEqual(project.doc.bpm, 101, 'the change stands, in memory');
  });
});
