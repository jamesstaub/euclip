import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | user/creator/project/track', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:user/creator/project/track');
    assert.ok(route);
  });
});
