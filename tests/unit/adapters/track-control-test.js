import { module, test } from 'qunit';

import { setupTest } from 'euclip/tests/helpers';

module('Unit | Adapter | track control', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:track-control');
    assert.ok(adapter);
  });
});
