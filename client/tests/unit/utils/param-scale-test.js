import { module, test } from 'qunit';
import {
  fromNormalized,
  snapToStep,
  toNormalized,
} from 'euclip/utils/param-scale';

module('Unit | Utility | param-scale', function () {
  const hz = { min: 20, max: 20000, scale: 'log' };
  const linear = { min: 0, max: 10 };

  test('linear ranges map straight across', function (assert) {
    assert.strictEqual(toNormalized(5, linear), 0.5);
    assert.strictEqual(fromNormalized(0.25, linear), 2.5);
  });

  test('a log range gives every octave the same travel', function (assert) {
    // 20 -> 20000 is 3 decades, so the geometric middle (~632 Hz) sits at 0.5
    assert.ok(Math.abs(toNormalized(Math.sqrt(20 * 20000), hz) - 0.5) < 1e-9);
    assert.ok(Math.abs(fromNormalized(0.5, hz) - Math.sqrt(20 * 20000)) < 1e-6);
    assert.ok(
      Math.abs(toNormalized(200, hz) - 1 / 3) < 1e-9,
      '20 -> 200 is a third of the range'
    );
  });

  test('round trips and clamps', function (assert) {
    [20, 440, 5000, 20000].forEach((v) => {
      assert.ok(
        Math.abs(fromNormalized(toNormalized(v, hz), hz) - v) < 1e-6,
        `${v} round trips`
      );
    });
    assert.strictEqual(toNormalized(5, hz), 0, 'below min clamps to 0');
    assert.strictEqual(toNormalized(99999, hz), 1, 'above max clamps to 1');
    assert.strictEqual(fromNormalized(2, linear), 10);
  });

  test('a degenerate range does not produce NaN', function (assert) {
    assert.strictEqual(toNormalized(1, { min: 1, max: 1 }), 0);
    assert.strictEqual(fromNormalized(0.5, { min: 1, max: 1 }), 1);
    assert.ok(
      Number.isFinite(toNormalized(0.5, { min: 0, max: 100, scale: 'log' })),
      'a log range may start at 0'
    );
  });

  test('snapToStep lands on multiples of the step without float noise', function (assert) {
    assert.strictEqual(snapToStep(0.3000000004, 0.1), 0.3);
    assert.strictEqual(snapToStep(443.2, 1), 443);
    assert.strictEqual(snapToStep(7, 5, 2), 7, 'steps count from min');
    assert.strictEqual(
      snapToStep(3.3, 0),
      3.3,
      'no step leaves the value alone'
    );
  });
});
