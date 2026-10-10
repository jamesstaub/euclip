import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';

module('Unit | Service | notifications', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:notifications');
    assert.ok(service);
  });
});
