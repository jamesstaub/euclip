import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';

module('Unit | Controller | signup', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let controller = this.owner.lookup('controller:signup');
    assert.ok(controller);
  });
});
