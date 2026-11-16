import { module, test } from 'qunit';
import {
  crumbsOf,
  folderPath,
  LibraryClient,
  LibraryError,
  parentOf,
} from 'client-v2/library/client';
import {
  BOSS_DR110,
  fakeFetch,
  NOT_A_FOLDER,
  ROOT,
  SEARCH_808,
  SEARCH_NOTHING,
} from 'client-v2/tests/fixtures/library';

const CONFIG = { api: '/v1', audio: 'https://cdn.example/audio/' };

module('Unit | Library | client', function () {
  test('a folder is its sub-folders and its audio files, asked for once', async function (assert) {
    const asked: string[] = [];
    const client = new LibraryClient(
      CONFIG,
      fakeFetch(
        { '/v1/files/': ROOT, '/v1/files/Boss%20DR110': BOSS_DR110 },
        asked,
      ),
    );
    const root = await client.folder('/');
    assert.deepEqual(root, {
      path: '/',
      folders: ['505, 707 & 727', 'Boss DR110', 'Roland', 'WAV drumloops'],
      files: [],
    });
    const boss = await client.folder('/Boss DR110/');
    assert.deepEqual(boss.folders, ['DR-110 (2)']);
    assert.deepEqual(boss.files[2], {
      name: '110KIK.mp3',
      path: '/Boss DR110/110KIK.mp3',
    });
    assert.strictEqual(
      boss.files.length,
      4,
      'images and the rest are left out',
    );
    await client.folder('Boss DR110');
    assert.deepEqual(
      asked,
      ['/v1/files/', '/v1/files/Boss%20DR110'],
      'each part of the path is encoded; a folder read once is not read again',
    );
  });

  test('paths with characters a URL cannot hold, and where a file’s audio is', function (assert) {
    const asked: string[] = [];
    const client = new LibraryClient(CONFIG, fakeFetch({}, asked));
    void client.folder('/505, 707 & 727/').catch(() => undefined);
    assert.deepEqual(asked, ['/v1/files/505%2C%20707%20%26%20727']);
    assert.strictEqual(
      client.audioUrl('/Boss DR110/110KIK.mp3'),
      'https://cdn.example/audio/Boss%20DR110/110KIK.mp3',
    );
    assert.strictEqual(folderPath('a/b'), '/a/b/');
    assert.strictEqual(folderPath(''), '/');
    assert.strictEqual(parentOf('/a/b/'), '/a/');
    assert.strictEqual(parentOf('/a/'), '/');
    assert.strictEqual(parentOf('/'), null);
    assert.deepEqual(crumbsOf('/Roland/Roland TR-808/'), [
      'Roland',
      'Roland TR-808',
    ]);
  });

  test('search gives files with their paths, and says whether there may be more', async function (assert) {
    const asked: string[] = [];
    const full = {
      results: [
        {
          folder: 'Big',
          files: Array.from({ length: 500 }, (_, index) => ({
            filename: `${index}.mp3`,
            path: `/Big/${index}.mp3`,
          })),
        },
      ],
    };
    const client = new LibraryClient(
      CONFIG,
      fakeFetch(
        {
          '/v1/files/search?q=808&page=0': SEARCH_808,
          '/v1/files/search?q=zzzz&page=0': SEARCH_NOTHING,
          '/v1/files/search?q=a%20b%26c&page=2': full,
        },
        asked,
      ),
    );
    const found = await client.search('808');
    assert.deepEqual(
      found.files.map((file) => file.path),
      [
        '/Roland/Roland TR-808/TR-808 Kit 02/TR808SN3.mp3',
        '/Roland/Roland TR-808/TR-808 Kit 03/cl_hihat.mp3',
        '/Ace Tone Rhythm Ace/KICK3.mp3',
      ],
    );
    assert.strictEqual(found.files[0]!.name, 'TR808SN3.mp3');
    assert.false(found.more);
    assert.deepEqual((await client.search('zzzz')).files, []);
    const page = await client.search('a b&c', 2);
    assert.true(page.more, 'a full page: there may be another');
    assert.strictEqual(asked[2], '/v1/files/search?q=a%20b%26c&page=2');
  });

  test('what goes wrong is said, and can be tried again', async function (assert) {
    const table: Record<string, unknown> = {
      '/v1/files/Roland%20TR-808': NOT_A_FOLDER,
      '/v1/files/Broken': 500,
      '/v1/files/Offline': new TypeError('Failed to fetch'),
    };
    const client = new LibraryClient(CONFIG, fakeFetch(table));
    const failure = async (path: string): Promise<LibraryError> => {
      try {
        await client.folder(path);
      } catch (error) {
        return error as LibraryError;
      }
      throw new Error('it did not fail');
    };
    assert.strictEqual((await failure('/Roland TR-808/')).status, 404);
    assert.strictEqual((await failure('/Nowhere/')).status, 404);
    assert.strictEqual((await failure('/Broken/')).status, 500);
    assert.true(
      /could not be reached/.test((await failure('/Offline/')).message),
    );
    // a failure is not remembered: when it works, it works
    table['/v1/files/Broken'] = BOSS_DR110;
    assert.strictEqual((await client.folder('/Broken/')).files.length, 4);
  });
});
