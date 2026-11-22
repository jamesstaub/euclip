import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';
import { defaultProject } from 'client-v2/project/default-project';
import {
  EUCLIP_FILE_VERSION,
  ImportError,
  parseEuclipFile,
  shelveEmbedded,
} from 'client-v2/project/file';
import {
  IndexedDbStorage,
  MemoryFiles,
  MemoryStorage,
} from 'client-v2/project/storage';
import type Owner from '@ember/owner';
import type { ProjectChange } from 'client-v2/services/project';

const BYTES = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;

module('Unit | Service | many projects', function (hooks) {
  setupTest(hooks);

  function setup(owner: Owner) {
    const project = owner.lookup('service:project');
    project.storage = new MemoryStorage();
    project.files = new MemoryFiles();
    return project;
  }

  test('a single project saved by version 2 of the database becomes the first of the list, with nothing lost', async function (assert) {
    const name = `euclip-test-migrate-${Date.now()}`;
    const legacy = defaultProject();
    legacy.name = 'My old one';
    legacy.bpm = 91;
    // the database as the single-project build left it: version 2, one record under 'current'
    await new Promise<void>((resolve, reject) => {
      const opening = indexedDB.open(name, 2);
      opening.onupgradeneeded = () => {
        opening.result.createObjectStore('projects').put(legacy, 'current');
        opening.result.createObjectStore('files');
      };
      opening.onsuccess = () => {
        opening.result.close();
        resolve();
      };
      opening.onerror = () => reject(opening.error ?? new Error('open failed'));
    });
    const storage = new IndexedDbStorage(name);
    try {
      const list = await storage.listProjects();
      assert.strictEqual(list.length, 1);
      assert.strictEqual(list[0]?.name, 'My old one');
      assert.true(list[0]!.createdAt > 0);
      const record = await storage.readProject(list[0]!.id);
      assert.deepEqual(record?.doc, legacy, 'the document is unchanged');
      assert.strictEqual(await storage.openId(), list[0]!.id, 'and it is open');
      assert.deepEqual(await storage.load(), legacy);
    } finally {
      await storage.clear();
    }
  });

  test('IndexedDB keeps several projects, and which one was open', async function (assert) {
    const storage = new IndexedDbStorage(`euclip-test-many-${Date.now()}`);
    try {
      const a = defaultProject();
      const b = { ...defaultProject(), name: 'B' };
      await storage.writeProject('p-a', a);
      await storage.writeProject('p-b', b);
      await storage.setOpenId('p-a');
      assert.strictEqual((await storage.listProjects()).length, 2);
      assert.strictEqual(await storage.openId(), 'p-a');
      await storage.removeProject('p-a');
      assert.deepEqual(
        (await storage.listProjects()).map((info) => info.id),
        ['p-b'],
      );
    } finally {
      await storage.clear();
    }
  });

  test('new, switch, duplicate and delete', async function (assert) {
    const project = setup(this.owner);
    await project.load();
    const first = project.currentId;
    project.apply({ type: 'setProjectName', name: 'First' });
    project.apply({ type: 'setBpm', bpm: 99 });
    const heard: ProjectChange[] = [];
    project.subscribe((change) => heard.push(change));

    const second = await project.newProject();
    assert.notStrictEqual(second, first);
    assert.strictEqual(project.doc.name, 'Untitled project');
    assert.false(project.canUndo, 'history is cleared on switching');
    assert.deepEqual(
      heard.map((c) => c.kind === 'replace' && c.reason),
      ['switch'],
    );

    project.apply({ type: 'setBpm', bpm: 140 });
    assert.true(project.canUndo);
    assert.true(await project.openProject(first));
    assert.strictEqual(project.doc.name, 'First');
    assert.strictEqual(
      project.doc.bpm,
      99,
      'the first one was saved on leaving',
    );
    assert.false(project.canUndo);
    assert.false(project.canRedo);
    assert.true(await project.openProject(second));
    assert.strictEqual(project.doc.bpm, 140, 'and so was the second');

    const copy = await project.duplicateProject(first);
    assert.strictEqual(project.currentId, second, 'duplicating does not open');
    assert.strictEqual(
      (await project.projects()).length,
      3,
      'three projects now',
    );
    await project.openProject(copy!);
    assert.strictEqual(project.doc.name, 'First copy');
    assert.strictEqual(project.doc.bpm, 99);

    await project.deleteProject(first);
    assert.false((await project.projects()).some((info) => info.id === first));
    assert.strictEqual(
      project.currentId,
      copy,
      'deleting another leaves the open one',
    );
    await project.deleteProject(copy!);
    assert.strictEqual(
      project.currentId,
      second,
      'the open one is deleted: another opens',
    );
    await project.deleteProject(second);
    assert.strictEqual(
      project.doc.name,
      'Untitled project',
      'none left: a starter',
    );
    assert.strictEqual((await project.projects()).length, 1);
    assert.strictEqual(await project.storage.openId(), project.currentId);
  });

  test('the open project is remembered', async function (assert) {
    const project = setup(this.owner);
    await project.load();
    const second = await project.newProject();
    project.apply({ type: 'setProjectName', name: 'Second' });
    await project.flush();
    // a later visit: another service on the same storage
    const storage = project.storage;
    const record = await storage.load();
    assert.strictEqual(record?.name, 'Second');
    assert.strictEqual(await storage.openId(), second);
  });

  test('a sound two projects use is not deleted with one of them', async function (assert) {
    const project = setup(this.owner);
    await project.load();
    await project.files.put('f-shared', {
      bytes: BYTES,
      name: 'kick.wav',
      type: 'audio/wav',
    });
    const withSound = (name: string) => ({
      ...defaultProject(),
      name,
      samples: { mine: { file: 'f-shared', label: 'kick.wav' } },
    });
    await project.storage.writeProject('p-1', withSound('one'));
    await project.storage.writeProject('p-2', withSound('two'));
    await project.openProject('p-1');
    await project.deleteProject('p-1');
    assert.notStrictEqual(
      await project.files.get('f-shared'),
      null,
      'still on the shelf',
    );
    assert.strictEqual(
      (await project.storage.readProject('p-2'))?.doc.samples['mine']?.file,
      'f-shared',
      'and the other project still names it',
    );
  });

  test('export then import: a new project, with its own sound embedded and put on the shelf', async function (assert) {
    const project = setup(this.owner);
    await project.load();
    await project.files.put('f-mine', {
      bytes: BYTES,
      name: 'snap.wav',
      type: 'audio/wav',
    });
    project.apply({ type: 'setProjectName', name: 'Travels' });
    project.apply({
      type: 'duplicateSample',
      name: 'kick',
      as: 'kick2',
    });
    const doc = project.doc;
    const withFile = {
      ...doc,
      samples: { ...doc.samples, snap: { file: 'f-mine', label: 'snap.wav' } },
    };
    project.doc = withFile;
    const file = await project.exportFile();
    assert.strictEqual(file.format, 'euclip-project');
    assert.strictEqual(file.version, EUCLIP_FILE_VERSION);
    assert.strictEqual(
      file.sounds.length,
      1,
      'only the person’s own sound is embedded',
    );
    assert.strictEqual(file.sounds[0]?.id, 'f-mine');
    assert.strictEqual(
      file.project.samples['kick']?.url,
      '/samples/kick.wav',
      'built-ins stay references',
    );

    const before = project.currentId;
    assert.ok(before);
    // the other machine: nothing on its shelf
    const other = setup(this.owner);
    const id = await other.importFile(JSON.stringify(file));
    assert.notStrictEqual(id, 'p-none');
    assert.strictEqual(other.doc.name, 'Travels');
    const key = other.doc.samples['snap']?.file;
    assert.ok(key, 'the pool entry names a shelf key');
    const stored = await other.files.get(key!);
    assert.deepEqual(new Uint8Array(stored!.bytes), new Uint8Array(BYTES));
    assert.strictEqual(stored?.name, 'snap.wav');

    // importing it again: a second project, and the sound is not on the shelf twice
    await other.importFile(JSON.stringify(file));
    assert.strictEqual((await other.files.list()).length, 1);
    assert.strictEqual(
      (await other.projects()).length,
      3,
      'the one that was open, and two imports: never over any',
    );
    assert.notStrictEqual(before, other.currentId);
  });

  test('a file that is not one of ours is refused, and so is a newer one', async function (assert) {
    const project = setup(this.owner);
    await project.load();
    const refused = async (text: string): Promise<string> => {
      try {
        await project.importFile(text);
      } catch (error) {
        assert.true(error instanceof ImportError);
        return (error as Error).message;
      }
      return '';
    };
    assert.strictEqual(
      await refused('not json'),
      'This is not a Euclip project file.',
    );
    assert.strictEqual(
      await refused('{"format":"other"}'),
      'This is not a Euclip project file.',
    );
    assert.true(
      (
        await refused(
          JSON.stringify({
            format: 'euclip-project',
            version: 2,
            project: defaultProject(),
            sounds: [],
          }),
        )
      ).includes('newer Euclip'),
    );
    assert.true(
      (
        await refused(
          JSON.stringify({
            format: 'euclip-project',
            version: 1,
            project: { name: 1 },
          }),
        )
      ).includes('not one this version'),
    );
    assert.throws(
      () =>
        parseEuclipFile(
          JSON.stringify({
            format: 'euclip-project',
            version: 1,
            project: defaultProject(),
            sounds: [{ id: 1 }],
          }),
        ),
      /damaged/,
    );
    assert.strictEqual(
      (await project.projects()).length,
      1,
      'nothing was created',
    );
  });

  test('embedded sounds already on the shelf are not added again (same name and size and bytes)', async function (assert) {
    const files = new MemoryFiles();
    await files.put('f-old', { bytes: BYTES, name: 'a.wav', type: '' });
    const data = btoa(String.fromCharCode(...new Uint8Array(BYTES)));
    const keys = await shelveEmbedded(
      [
        { id: 'x', name: 'a.wav', type: '', size: 8, added: 0, data },
        // same name and size, other bytes: a different sound
        {
          id: 'y',
          name: 'a.wav',
          type: '',
          size: 8,
          added: 0,
          data: btoa('abcdefgh'),
        },
      ],
      files,
    );
    assert.strictEqual(keys.get('x'), 'f-old');
    assert.notStrictEqual(keys.get('y'), 'f-old');
    assert.strictEqual((await files.list()).length, 2);
  });

  test('the save state says what is true', async function (assert) {
    const project = setup(this.owner);
    await project.load();
    assert.strictEqual(project.saveState, 'saved');
    project.apply({ type: 'setBpm', bpm: 111 });
    assert.strictEqual(project.saveState, 'saving');
    await project.flush();
    assert.strictEqual(project.saveState, 'saved');
    (project.storage as MemoryStorage).writeProject = () =>
      Promise.resolve(null);
    project.apply({ type: 'setBpm', bpm: 112 });
    await project.flush();
    assert.strictEqual(project.saveState, 'failed');
  });
});
