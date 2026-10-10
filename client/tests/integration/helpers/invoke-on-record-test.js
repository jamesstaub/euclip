import { module, test } from 'qunit';
import { setupRenderingTest } from 'euclip/tests/helpers';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Helper | invoke-on-record', function (hooks) {
  setupRenderingTest(hooks);

  test('calls the named method with the argument', async function (assert) {
    this.set('record', { shout: (word) => `${word}!` });
    await render(hbs`{{invoke-on-record this.record "shout" "hey"}}`);
    assert.dom(this.element).hasText('hey!');
  });
});
