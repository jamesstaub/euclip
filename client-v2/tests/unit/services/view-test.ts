import { module, test } from 'qunit';
import { setupTest } from 'client-v2/tests/helpers';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';

module('Unit | Service | view', function (hooks) {
  setupTest(hooks);

  test('it starts on the footer UI with the controls pane', function (assert) {
    const view = this.owner.lookup('service:view');

    assert.false(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'controls');
  });

  test('the script button swaps the footer between its UI and the script', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = true;

    view.toggleScript();
    assert.true(view.scriptOpen);
    assert.true(view.footerOpen);

    view.toggleScript();
    assert.false(view.scriptOpen);
    assert.true(view.footerOpen, 'the footer stays open');
  });

  test('the script button opens a collapsed footer on the script', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = false;

    view.toggleScript();
    assert.true(view.scriptOpen);
    assert.true(view.footerOpen, 'expanded');

    view.toggleFooter();
    view.toggleScript();
    assert.true(view.scriptOpen, 'still the script, not switched off unseen');
    assert.true(view.footerOpen);
  });

  test('the script choice and the footer pane are remembered in localStorage', function (assert) {
    const view = this.owner.lookup('service:view');
    view.footerOpen = true;
    view.toggleScript();
    view.setFooterPane('source');

    assert.deepEqual(
      JSON.parse(window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null'),
      { scriptOpen: true, footerPane: 'source' },
    );
  });

  test('a remembered choice is restored', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ scriptOpen: true, footerPane: 'sequence' }),
    );
    const view = this.owner.lookup('service:view');
    assert.true(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'sequence');
  });

  test('broken JSON in storage falls back to the defaults', function (assert) {
    window.localStorage.setItem(VIEW_STORAGE_KEY, '{"scriptOpen":"yes"');
    const view = this.owner.lookup('service:view');
    assert.false(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'controls');
  });

  test('remembered values that make no sense fall back to the defaults', function (assert) {
    window.localStorage.setItem(
      VIEW_STORAGE_KEY,
      JSON.stringify({ scriptOpen: 'yes', footerPane: 'sideways' }),
    );
    const view = this.owner.lookup('service:view');
    assert.false(view.scriptOpen);
    assert.strictEqual(view.footerPane, 'controls');
  });
});
