import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';

module('Unit | Service | audio', function (hooks) {
  setupTest(hooks);

  test('it can be looked up, and does not start an engine until asked', function (assert) {
    const audio = this.owner.lookup('service:audio');

    assert.ok(audio, 'the service is registered');
    assert.strictEqual(typeof audio.engine, 'function');
    assert.false(audio.isStarted, 'no audio context is created on lookup');
  });
});
