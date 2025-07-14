import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';

module('Unit | Service | request-cache', function (hooks) {
  setupTest(hooks);

  // TODO: Replace this with your real tests.
  test('it exists', function (assert) {
    let service = this.owner.lookup('service:request-cache');
    assert.ok(service);
  });
});
