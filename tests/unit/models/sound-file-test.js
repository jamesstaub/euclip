import { module, test } from 'qunit';

import { setupTest } from 'euclip/tests/helpers';

module('Unit | Model | sound file', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('sound-file', {});
    assert.ok(model);
  });
});
