import { module, test } from 'qunit';
import encodeFilePath from 'euclip/utils/encode-file-path';

module('Unit | Utility | encode-file-path', function () {
  test('keeps / separators and encodes every segment', function (assert) {
    assert.strictEqual(encodeFilePath('Roland/TR 808/kick.mp3'), 'Roland/TR%20808/kick.mp3');
  });

  test('encodes characters that would otherwise change the URL', function (assert) {
    // "#" starts a fragment, "?" a query, "+" is a space in forms, "%" starts an escape
    assert.strictEqual(encodeFilePath('Hammond Rhythm II/ham-bd#01.mp3'), 'Hammond%20Rhythm%20II/ham-bd%2301.mp3');
    assert.strictEqual(encodeFilePath('WAV hh+filterloops/a?b%c.mp3'), 'WAV%20hh%2Bfilterloops/a%3Fb%25c.mp3');
  });

  test('keeps a leading slash', function (assert) {
    assert.strictEqual(encodeFilePath('/a b/c.mp3'), '/a%20b/c.mp3');
  });
});
