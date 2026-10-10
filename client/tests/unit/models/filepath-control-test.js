import { module, test } from 'qunit';

import { setupTest } from 'euclip/tests/helpers';

module('Unit | Model | filepath control', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('filepath-control', {});
    assert.ok(model);
  });
});
