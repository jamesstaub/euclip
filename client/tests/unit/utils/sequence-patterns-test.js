import { module, test } from 'qunit';
import { binaryPattern, onOffPattern } from 'euclip/utils/sequence-patterns';

module('Unit | Utility | sequence-patterns', function () {
  test('binary is the digits of the value, as long as it needs to be', function (assert) {
    assert.deepEqual(binaryPattern(5), [1, 0, 1]);
    assert.deepEqual(binaryPattern(0), [0]);
    assert.deepEqual(binaryPattern(127), [1, 1, 1, 1, 1, 1, 1]);
    assert.deepEqual(
      binaryPattern(200),
      [1, 1, 1, 1, 1, 1, 1],
      'clamped to 127'
    );
  });

  test('on/off repeats on hits then off rests', function (assert) {
    assert.deepEqual(onOffPattern(3, 2, 2), [1, 1, 1, 0, 0, 1, 1, 1, 0, 0]);
    assert.deepEqual(onOffPattern(0, 0, 3), [], 'empty cycle');
    assert.strictEqual(onOffPattern(16, 16, 16).length, 64, 'capped');
  });
});
