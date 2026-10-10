import { module, test } from 'qunit';
import { setupTest } from 'euclip/tests/helpers';

module('Unit | Model | audio file tree', function (hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function (assert) {
    let store = this.owner.lookup('service:store');
    let model = store.createRecord('audio-file-tree', {});
    assert.ok(model);
  });
});
