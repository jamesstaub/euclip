import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';

module('Unit | Route | user/creator/project-error', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:user/creator/project-error');
    assert.ok(route);
  });
});
