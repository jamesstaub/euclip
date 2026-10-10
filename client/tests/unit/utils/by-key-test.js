import { module, test } from 'qunit';
import byKey from 'euclip/utils/by-key';

module('Unit | Utility | by-key', function () {
  test('sorts ascending by the given property without mutating the input', function (assert) {
    const items = [{ order: 3 }, { order: 1 }, { order: 2 }];
    const sorted = items.slice().sort(byKey('order'));

    assert.deepEqual(sorted.map((i) => i.order), [1, 2, 3]);
    assert.deepEqual(items.map((i) => i.order), [3, 1, 2], 'input order is unchanged');
  });

  test('keeps equal keys stable', function (assert) {
    const items = [{ k: 1, n: 'a' }, { k: 1, n: 'b' }, { k: 0, n: 'c' }];
    assert.deepEqual(items.slice().sort(byKey('k')).map((i) => i.n), ['c', 'a', 'b']);
  });
});
