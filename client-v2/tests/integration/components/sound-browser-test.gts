import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  findAll,
  render,
  settled,
  triggerEvent,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { LibraryClient } from 'client-v2/library/client';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';
import {
  BOSS_DR110,
  fakeFetch,
  ROOT,
  SEARCH_808,
  SEARCH_NOTHING,
} from 'client-v2/tests/fixtures/library';

/** A folder of the library whose files are the app's own built-in sounds: audio that is really there. */
const REAL = {
  dirs: [],
  audio: ['kick.wav', 'snare.wav', 'hat.wav'],
  img: [],
  path: '/samples/',
};

const rowNames = (): string[] =>
  findAll('[data-test-sound-row]').map(
    (row) => row.getAttribute('data-test-sound-row') ?? '',
  );

module('Integration | Component | sound-browser', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  let project: ProjectService;
  let audio: AudioService;
  let asked: string[];

  hooks.beforeEach(function () {
    view = this.owner.lookup('service:view');
    project = this.owner.lookup('service:project');
    audio = this.owner.lookup('service:audio');
    view.footerOpen = true;
    view.footerPane = 'source';
    asked = [];
    audio.library = new LibraryClient(
      { api: '/v1', audio: '' },
      fakeFetch(
        {
          '/v1/files/': { ...ROOT, dirs: [...ROOT.dirs, 'samples'] },
          '/v1/files/Boss%20DR110': BOSS_DR110,
          '/v1/files/samples': REAL,
          '/v1/files/search?q=808&page=0': SEARCH_808,
          '/v1/files/search?q=zzzz&page=0': SEARCH_NOTHING,
          '/v1/files/search?q=broken&page=0': 500,
        },
        asked,
      ),
    );
  });

  const show = async (): Promise<void> => {
    await render(
      <template><AppShell @initialSidebarOpen={{true}} /></template>,
    );
  };
  const soundOf = (track: string): string | undefined =>
    audio.sampler(track, 'sampler')?.buffer?.key;

  test('the library is browsed by folder: open, up, crumbs, and what is wrong is said', async function (assert) {
    await show();
    assert.dom('[data-test-sounds-tab="library"]').hasAria('selected', 'true');
    assert.deepEqual(rowNames(), [
      '505, 707 & 727',
      'Boss DR110',
      'Roland',
      'WAV drumloops',
      'samples',
    ]);
    assert.dom('[data-test-library-up]').isDisabled();
    await click('[data-test-sound-folder="Boss DR110"]');
    assert.deepEqual(rowNames(), [
      'DR-110 (2)',
      '110CHH.mp3',
      '110CYM.mp3',
      '110KIK.mp3',
      '110OHH.mp3',
    ]);
    assert.deepEqual(
      findAll('[data-test-library-crumb]').map((crumb) =>
        crumb.textContent.trim(),
      ),
      ['Library', 'Boss DR110'],
    );
    // a folder the server does not have
    await click('[data-test-sound-folder="DR-110 (2)"]');
    assert.dom('[data-test-library-status]').includesText('not in the library');
    assert.dom('[data-test-library-retry]').exists();
    await click('[data-test-library-up]');
    assert.strictEqual(rowNames().length, 5, 'up: the folder it was in');
    await click('[data-test-library-crumb="/"]');
    assert.strictEqual(rowNames().length, 5);
    assert.strictEqual(
      asked.filter((url) => url === '/v1/files/').length,
      1,
      'a folder read once is not asked for again',
    );
    assert.false(project.canUndo, 'browsing changes nothing');
  });

  test('Use puts a library sound in the project under a name of its own and gives it to the sampler; again, it is the same sound', async function (assert) {
    await show();
    await click('[data-test-sound-folder="samples"]');
    assert.dom('[data-test-sound-target]').includesText('Track 1');
    await click('[data-test-sound-use="snare.wav"]');
    // the built-in snare is another source (a URL of the app's): this is the library's file
    assert.deepEqual(project.doc.samples['snare_2'], {
      library: '/samples/snare.wav',
      label: 'snare.wav',
    });
    assert.strictEqual(soundOf('t-kick'), 'snare_2');
    assert.dom('[data-test-pool-notice]').includesText("now plays 'snare_2'");
    assert
      .dom('[data-test-sound-row="snare.wav"] [data-test-sound-detail]')
      .includesText('in project as ‘snare_2’ · in T1');
    assert
      .dom('[data-test-sound-add="snare.wav"]')
      .doesNotExist('it is in already');

    // the same file for another track: no second entry
    await click('[data-test-track="2"] [data-test-track-select]');
    await click('[data-test-sound-use="snare.wav"]');
    assert.strictEqual(soundOf('t-snare'), 'snare_2');
    assert.strictEqual(Object.keys(project.doc.samples).length, 7);
    assert
      .dom('[data-test-sound-row="snare.wav"] [data-test-sound-detail]')
      .includesText('in T1, T2');

    project.undo();
    await settled();
    assert.strictEqual(soundOf('t-snare'), 'snare', 'one undo: the choice');
    project.undo();
    await settled();
    assert.strictEqual(
      project.doc.samples['snare_2'],
      undefined,
      'and the first Use, whole',
    );
    assert.strictEqual(soundOf('t-kick'), 'kick');

    // Add: into the project, given to nothing
    await click('[data-test-sound-add="hat.wav"]');
    assert.deepEqual(project.doc.samples['hat_2']?.library, '/samples/hat.wav');
    assert.strictEqual(soundOf('t-snare'), 'snare');
    await click('[data-test-sounds-tab="project"]');
    assert
      .dom('[data-test-sound-row="hat_2"] [data-test-sound-unused]')
      .exists();
    assert
      .dom('[data-test-sound-row="hat_2"] [data-test-sound-detail]')
      .includesText('library');
  });

  test('Hear plays one sound at a time and changes nothing; a sound that cannot be fetched says so, with Retry', async function (assert) {
    await show();
    await click('[data-test-sound-folder="samples"]');
    await click('[data-test-sound-hear="kick.wav"]');
    assert.dom('[data-test-sound-hear="kick.wav"]').hasAria('pressed', 'true');
    await click('[data-test-sound-hear="snare.wav"]');
    assert
      .dom('[data-test-sound-hear="kick.wav"]')
      .hasAria('pressed', 'false', 'one at a time');
    assert.dom('[data-test-sound-hear="snare.wav"]').hasAria('pressed', 'true');
    await click('[data-test-sound-hear="snare.wav"]');
    assert
      .dom('[data-test-sound-hear="snare.wav"]')
      .hasAria('pressed', 'false', 'a second press stops it');
    assert.false(project.canUndo);
    assert.strictEqual(Object.keys(project.doc.samples).length, 6);

    await click('[data-test-library-crumb="/"]');
    await click('[data-test-sound-folder="Boss DR110"]');
    await click('[data-test-sound-hear="110KIK.mp3"]');
    assert
      .dom('[data-test-sound-row="110KIK.mp3"] [data-test-sound-failed]')
      .exists();
    assert.dom('[data-test-sound-retry="110KIK.mp3"]').exists();
    // used all the same: in the project, in its failed state, with a way to try again
    await click('[data-test-sound-use="110CHH.mp3"]');

    await click('[data-test-sounds-tab="project"]');
    await audio.runner!.samplesReady();
    await settled();
    assert
      .dom('[data-test-sound-row="s_110chh"] [data-test-sound-failed]')
      .exists();
    assert.dom('[data-test-sound-retry="s_110chh"]').exists();
  });

  test('what is heard is the row that was pressed, each time; a slow sound pressed earlier never plays over a later one', async function (assert) {
    await show();
    await click('[data-test-sound-folder="samples"]');
    const buffers = audio.engine!.buffers;
    const lengthOf = async (name: string): Promise<number> =>
      (await buffers.get(name)!.ready).length;
    await click('[data-test-sound-hear="kick.wav"]');
    assert.strictEqual(audio.runner!.heard?.length, await lengthOf('kick'));
    await click('[data-test-sound-hear="snare.wav"]');
    assert.strictEqual(
      audio.runner!.heard?.length,
      await lengthOf('snare'),
      'the second row plays the second sound',
    );
    await click('[data-test-sound-hear="hat.wav"]');
    assert.strictEqual(audio.runner!.heard?.length, await lengthOf('hat'));
    // across tabs: a project sound
    await click('[data-test-sounds-tab="project"]');
    await click('[data-test-sound-hear="loop"]');
    assert.strictEqual(audio.runner!.heard?.length, await lengthOf('loop'));

    // a race: one sound asked for, then another before the first has arrived
    const first = audio.hear({
      kind: 'library',
      path: '/samples/openhat.wav',
      name: 'openhat.wav',
    });
    const second = audio.hear({ kind: 'project', name: 'clap' });
    await Promise.all([first, second]);
    await settled();
    assert.strictEqual(
      audio.runner!.heard?.length,
      await lengthOf('clap'),
      'only the last one asked for is heard',
    );
    assert.strictEqual(audio.hearing?.id, 'project:clap');

    // one that fails: said on its row, and what was playing is not played in its place
    await click('[data-test-sounds-tab="library"]');
    await click('[data-test-library-crumb="/"]');
    await click('[data-test-sound-folder="Boss DR110"]');
    await click('[data-test-sound-hear="110KIK.mp3"]');
    assert
      .dom('[data-test-sound-row="110KIK.mp3"] [data-test-sound-failed]')
      .exists();
    assert.strictEqual(audio.hearing, null, 'nothing is playing');
    assert.strictEqual(
      buffers.list().filter((ref) => ref.key.startsWith('~hear')).length,
      1,
      'heard sounds do not pile up in the buffer store',
    );
    assert.strictEqual(
      Object.keys(project.doc.samples).length,
      6,
      'nor join the project',
    );
  });

  test('a row is one size and its text stays put: idle, loading, playing, failed, in the project, missing', async function (assert) {
    await show();
    await click('[data-test-sound-folder="samples"]');
    const boxes = (name: string): string =>
      [
        '',
        ' .sound-row__title',
        ' [data-test-sound-detail]',
        ' .sound-row__play',
        ' [data-test-sound-use]',
      ]
        .map((part) => {
          const list = find('[data-test-sound-list]')!.getBoundingClientRect();
          const rect = find(
            `[data-test-sound-row="${name}"]${part}`,
          )!.getBoundingClientRect();
          return [
            rect.left - list.left,
            rect.top - list.top,
            rect.width,
            rect.height,
          ]
            .map((n) => n.toFixed(1))
            .join(' ');
        })
        .join(' | ');
    const idle = boxes('hat.wav');

    // its audio held on the way: the loading state, for as long as we like
    const real = window.fetch.bind(window);
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => (release = resolve));
    window.fetch = async (input, init) => {
      if (typeof input === 'string' && input.endsWith('/samples/hat.wav')) {
        await held;
      }
      return real(input, init);
    };
    try {
      const hearing = click('[data-test-sound-hear="hat.wav"]');
      await new Promise((resolve) => setTimeout(resolve, 30));
      assert
        .dom('[data-test-sound-row="hat.wav"]')
        .hasAttribute('data-state', 'loading');
      assert
        .dom('[data-test-sound-row="hat.wav"] [data-test-sound-loading]')
        .exists('said on the Hear button');
      assert.strictEqual(
        boxes('hat.wav'),
        idle,
        'loading: nothing moved or changed size',
      );
      release();
      await hearing;
    } finally {
      window.fetch = real;
    }
    assert
      .dom('[data-test-sound-row="hat.wav"]')
      .hasAttribute('data-state', 'playing');
    assert.strictEqual(boxes('hat.wav'), idle, 'playing: the same');
    await click('[data-test-sound-add="hat.wav"]');
    assert.strictEqual(
      boxes('hat.wav'),
      idle,
      'in the project, its add button gone: the same',
    );

    // failed, with Retry in the slot
    await click('[data-test-library-crumb="/"]');
    await click('[data-test-sound-folder="Boss DR110"]');
    const before = boxes('110KIK.mp3');
    await click('[data-test-sound-hear="110KIK.mp3"]');
    assert.dom('[data-test-sound-retry="110KIK.mp3"]').exists();
    assert.strictEqual(boxes('110KIK.mp3'), before, 'failed: the same');

    // a long name is cut short inside its place
    assert.strictEqual(
      find('[data-test-sound-row="110KIK.mp3"]')!.getBoundingClientRect()
        .height,
      find('[data-test-sound-row="110CHH.mp3"]')!.getBoundingClientRect()
        .height,
    );
  });

  test('search asks the library after a pause, and says when there is nothing, or something went wrong', async function (assert) {
    await show();
    await fillIn('[data-test-sound-search]', '808');
    assert.deepEqual(rowNames(), ['TR808SN3.mp3', 'cl_hihat.mp3', 'KICK3.mp3']);
    assert.dom('[data-test-search-status]').includesText('3 found');
    assert
      .dom('[data-test-sound-row="cl_hihat.mp3"] [data-test-sound-detail]')
      .includesText('Roland/Roland TR-808/TR-808 Kit 03');
    await fillIn('[data-test-sound-search]', 'zzzz');
    assert.deepEqual(rowNames(), []);
    assert
      .dom('[data-test-search-status]')
      .includesText('Nothing in the library');
    await fillIn('[data-test-sound-search]', 'broken');
    assert.dom('[data-test-search-status]').includesText('error (500)');
    assert.dom('[data-test-search-retry]').exists();
    await click('[data-test-search-clear]');
    assert.strictEqual(rowNames().length, 5, 'back to the folders');
    assert.dom('[data-test-sound-search]').hasValue('');
  });

  test('the keys of the list: down and up hear, right opens, left goes up, Enter uses', async function (assert) {
    await show();
    const list = '[data-test-sound-list]';
    for (let i = 0; i < 5; i++)
      await triggerKeyEvent(list, 'keydown', 'ArrowDown');
    assert
      .dom('[data-test-sound-row="samples"]')
      .hasAttribute('data-selected', 'true');
    await triggerKeyEvent(list, 'keydown', 'ArrowRight');
    assert.deepEqual(rowNames(), ['kick.wav', 'snare.wav', 'hat.wav']);
    await triggerKeyEvent(list, 'keydown', 'ArrowDown');
    await triggerKeyEvent(list, 'keydown', 'ArrowDown');

    assert
      .dom('[data-test-sound-hear="snare.wav"]')
      .hasAria('pressed', 'true', 'moving hears');
    await triggerKeyEvent(list, 'keydown', 'Enter');
    assert.strictEqual(soundOf('t-kick'), 'snare_2', 'Enter uses');
    await triggerKeyEvent(list, 'keydown', 'ArrowLeft');
    assert.strictEqual(rowNames().length, 5, 'left: up one folder');
  });

  test('My sounds is the person’s shelf: a file added there is in no project until it is used', async function (assert) {
    await show();
    await click('[data-test-sounds-tab="mine"]');
    assert.dom('[data-test-shelf-empty]').exists();
    const bytes = await (await fetch('/samples/clap.wav')).arrayBuffer();
    const file = new File([bytes], 'My Clap!.wav', { type: 'audio/wav' });
    await triggerEvent('[data-test-shelf-add-file]', 'change', {
      files: [file],
    });

    assert.deepEqual(rowNames(), ['My Clap!.wav']);
    assert.dom('[data-test-pool-notice]').includesText('Added to My sounds');
    assert.strictEqual(
      Object.keys(project.doc.samples).length,
      6,
      'not in the project',
    );
    assert.false(project.canUndo);

    await click('[data-test-sound-use="My Clap!.wav"]');
    assert.strictEqual(soundOf('t-kick'), 'my_clap');
    const id = project.doc.samples['my_clap']!.file!;
    assert.deepEqual(project.doc.samples['my_clap'], {
      file: id,
      label: 'My Clap!.wav',
    });
    await audio.runner!.samplesReady();
    assert.strictEqual(audio.engine!.buffers.get('my_clap')?.state, 'ready');

    // too big, or not audio: refused, said, and not on the shelf
    const junk = new File([new Uint8Array(64)], 'notes.txt', {
      type: 'text/plain',
    });
    await triggerEvent('[data-test-shelf-add-file]', 'change', {
      files: [junk],
    });

    assert
      .dom('[data-test-pool-notice]')
      .includesText('not audio this browser can decode');
    assert.deepEqual(rowNames(), ['My Clap!.wav']);
  });

  test('a project sound whose file is not in this browser is missing, and can be supplied again', async function (assert) {
    const { defaultProject } =
      await import('client-v2/project/default-project');
    const { MemoryStorage } = await import('client-v2/project/storage');
    const storage = new MemoryStorage();
    const doc = defaultProject();
    storage.saved = {
      ...doc,
      samples: { ...doc.samples, take: { file: 'f-gone', label: 'take.wav' } },
    };
    project.storage = storage;
    await show();
    await click('[data-test-sounds-tab="project"]');
    assert
      .dom('[data-test-sound-row="take"] [data-test-sound-missing]')
      .exists();
    const bytes = await (await fetch('/samples/clap.wav')).arrayBuffer();
    await triggerEvent('[data-test-sound-supply="take"]', 'change', {
      files: [new File([bytes], 'take.wav', { type: 'audio/wav' })],
    });

    await audio.runner!.samplesReady();
    await settled();
    assert
      .dom('[data-test-sound-row="take"] [data-test-sound-missing]')
      .doesNotExist();
    assert.strictEqual(audio.engine!.buffers.get('take')?.state, 'ready');
    assert.strictEqual(
      project.doc.samples['take']!.file,
      'f-gone',
      'the same entry, its file back',
    );
  });

  test('This project: used by, rename (scripts only by "rename and update"), duplicate, and remove asked when in use', async function (assert) {
    await show();
    await click('[data-test-sounds-tab="project"]');
    assert
      .dom('[data-test-sound-row="kick"] [data-test-sound-detail]')
      .includesText('in T1');
    assert
      .dom('[data-test-sound-row="clap"] [data-test-sound-unused]')
      .exists();

    // rename a sound a sampler has by choice: nothing of a script to touch
    await click('[data-test-sound-row="kick"] [data-test-menu-button]');
    await click('[data-test-menu-item="Rename…"]');
    await fillIn('[data-test-sound-rename-field]', 'Boom');
    assert
      .dom('[data-test-sound-rename-commit]')
      .isDisabled('not a name a script can type');
    await fillIn('[data-test-sound-rename-field]', 'snare');
    assert.dom('[data-test-sound-rename-commit]').isDisabled('taken');
    await fillIn('[data-test-sound-rename-field]', 'boom');
    assert.dom('[data-test-sound-rename-commit]').hasText('Rename');
    await click('[data-test-sound-rename-commit]');
    assert.strictEqual(soundOf('t-kick'), 'boom');
    assert.true('boom' in project.doc.samples);

    // one a script names: only as "rename and update"
    project.apply({
      type: 'setScript',
      scope: 't-hat',
      script: `__().sampler({ id: 'sampler', buffer: 'snare' }).to('channel');\nwaveform('#sampler');`,
    });
    await settled();
    await click('[data-test-sound-row="snare"] [data-test-menu-button]');
    await click('[data-test-menu-item="Rename…"]');
    await fillIn('[data-test-sound-rename-field]', 'crack');
    assert.dom('[data-test-rename-scripts]').includesText('Track 3');
    assert
      .dom('[data-test-sound-rename-commit]')
      .hasText('Rename and update 1 script');
    await click('[data-test-sound-rename-commit]');
    assert.true(project.doc.tracks[2]!.script.includes("buffer: 'crack'"));
    project.undo();
    await settled();
    assert.true(
      project.doc.tracks[2]!.script.includes("buffer: 'snare'"),
      'one undo: the name and the script',
    );
    assert.true('snare' in project.doc.samples);

    // duplicate: the same sound, slices of its own
    await click('[data-test-sound-row="loop"] [data-test-menu-button]');
    await click('[data-test-menu-item="Duplicate"]');
    assert.deepEqual(
      project.doc.samples['loop_2'],
      project.doc.samples['loop'],
    );

    // remove: at once when unused, asked when in use; undo brings it back
    await click('[data-test-sound-row="clap"] [data-test-menu-button]');
    await click('[data-test-menu-item="Remove…"]');
    assert.false('clap' in project.doc.samples);
    await click('[data-test-sound-row="boom"] [data-test-menu-button]');
    await click('[data-test-menu-item="Remove…"]');
    assert.dom('[data-test-sound-remove]').includesText('in use');
    assert.true('boom' in project.doc.samples, 'not yet');
    await click('[data-test-sound-remove-confirm]');
    assert.false('boom' in project.doc.samples);
    project.undo();
    await settled();
    assert.true('boom' in project.doc.samples, 'undo brings it back');
  });

  test('Browse… in a sampler’s picker opens the library aimed at that sampler; a track with several can change which', async function (assert) {
    await render(
      <template><AppShell @initialSidebarOpen={{false}} /></template>,
    );
    project.apply({
      type: 'setScript',
      scope: 't-kick',
      script: `__().sampler({ id: 'a' }).to('channel');\n__().sampler({ id: 'b' }).to('channel');\nwaveform('#a');\nwaveform('#b');`,
    });
    await settled();
    assert.dom('[data-test-waveform-empty]').includesText('No sound is chosen');
    assert.dom('[data-test-sound-browser]').doesNotExist();
    // the second sampler's editor
    view.chooseWaveform('t-kick', audio.waveforms('t-kick')[1]!.key);
    await settled();
    await click('[data-test-waveform-browse]');
    assert.dom('[data-test-sound-browser]').exists('the sidebar opens');
    assert.dom('[data-test-sounds-tab="library"]').hasAria('selected', 'true');
    assert
      .dom('[data-test-sound-target-choice]')
      .hasValue(audio.waveforms('t-kick')[1]!.key);
    await click('[data-test-sound-folder="samples"]');
    await click('[data-test-sound-use="hat.wav"]');
    assert.strictEqual(audio.sampler('t-kick', 'b')?.buffer?.key, 'hat_2');
    assert.strictEqual(
      audio.sampler('t-kick', 'a')?.buffer,
      null,
      'not the other one',
    );
    assert.notStrictEqual(find('[data-test-sound-select]'), null);
  });
});
