import { module, test } from 'qunit';
import {
  MAX_FILE_BYTES,
  newFileId,
  refusal,
  sampleNameFor,
} from 'client-v2/project/pool';

module('Unit | Project | pool', function () {
  test('a file gets a name a script can write, and one the pool does not have', function (assert) {
    assert.strictEqual(
      sampleNameFor('Amen Break (remaster).WAV', []),
      'amen_break_remaster',
    );
    assert.strictEqual(sampleNameFor('kick.wav', ['kick', 'snare']), 'kick_2');
    assert.strictEqual(sampleNameFor('kick.wav', ['kick', 'kick_2']), 'kick_3');
    assert.strictEqual(
      sampleNameFor('808.mp3', []),
      's_808',
      'it starts with a letter',
    );
    assert.strictEqual(sampleNameFor('…….flac', []), 'sound');
    assert.strictEqual(sampleNameFor('Café Später.ogg', []), 'cafe_spater');
    assert.true(sampleNameFor(`${'long'.repeat(30)}.wav`, []).length <= 32);
    assert.true(
      /^[a-z][a-z0-9_]*$/.test(sampleNameFor('__ A  b--C__.aiff', [])),
    );
  });

  test('a file that is too large or empty is refused in words', function (assert) {
    assert.strictEqual(
      refusal({ name: 'a.wav', size: 1000, type: 'audio/wav' }),
      null,
    );
    assert.true(
      refusal({
        name: 'big.wav',
        size: MAX_FILE_BYTES + 1,
        type: 'audio/wav',
      })!.includes('30 MB'),
    );
    assert.true(
      refusal({ name: 'none.wav', size: 0, type: '' })!.includes('empty'),
    );
    assert.notStrictEqual(newFileId(), newFileId());
  });
});
