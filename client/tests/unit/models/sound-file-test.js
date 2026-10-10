import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';
import SoundFileModel from 'euclip/models/sound-file';

module('Unit | Model | sound-file', function (hooks) {
  setupTest(hooks);

  let realFetch;
  hooks.beforeEach(function () {
    realFetch = window.fetch;
  });
  hooks.afterEach(function () {
    window.fetch = realFetch;
  });

  const audio = () => new Response(new Blob(['x'], { type: 'audio/mpeg' }), { status: 200 });

  test('a failed download is retried on the same record instead of creating a duplicate', async function (assert) {
    const store = this.owner.lookup('service:store');
    let calls = 0;
    window.fetch = async () => (++calls === 1 ? new Response('nope', { status: 404 }) : audio());

    const first = await SoundFileModel.findOrDownload('/Roland/kick.mp3', store);
    assert.false(first.isDownloaded, 'first attempt failed (HTTP 404)');

    const second = await SoundFileModel.findOrDownload('/Roland/kick.mp3', store);
    assert.strictEqual(second, first, 'same record is reused');
    assert.true(second.isDownloaded, 'and the retry succeeded');
    assert.strictEqual(store.peekAll('sound-file').length, 1, 'only one record exists');
  });

  test('concurrent requests for the same file share one record', async function (assert) {
    const store = this.owner.lookup('service:store');
    window.fetch = async () => audio();

    const [a, b] = await Promise.all([
      SoundFileModel.findOrDownload('/Roland/snare.mp3', store),
      SoundFileModel.findOrDownload('/Roland/snare.mp3', store),
    ]);

    assert.strictEqual(a, b);
    assert.strictEqual(store.peekAll('sound-file').length, 1);
  });

  test('builds the CDN url with every path segment encoded, with or without a leading slash', function (assert) {
    const store = this.owner.lookup('service:store');
    const withSlash = store.createRecord('sound-file', { filePathRelative: '/Hammond Rhythm II/ham-bd#01.mp3' });
    const without = store.createRecord('sound-file', { filePathRelative: 'Hammond Rhythm II/ham-bd#01.mp3' });

    assert.true(withSlash.filepathUrl.endsWith('/Hammond%20Rhythm%20II/ham-bd%2301.mp3'));
    assert.strictEqual(without.filepathUrl, withSlash.filepathUrl);
  });
});
