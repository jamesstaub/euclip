import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';

module('Unit | Route | embed', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:embed');
    assert.ok(route);
  });
});
