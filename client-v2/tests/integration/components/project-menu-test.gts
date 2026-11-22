import { module, test } from 'qunit';
import { click, fillIn, render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { MemoryFiles, MemoryStorage } from 'client-v2/project/storage';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';

module('Integration | Project menu, undo and redo', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
    const project = this.owner.lookup('service:project');
    project.storage = new MemoryStorage();
    project.files = new MemoryFiles();
  });
  hooks.afterEach(() => window.localStorage.removeItem(VIEW_STORAGE_KEY));

  test('undo and redo buttons are disabled until there is something to undo or redo', async function (assert) {
    this.owner.lookup('service:view').phone = false;
    await render(<template><AppShell /></template>);

    assert.dom('[data-test-undo-button]').hasAria('label', 'Undo').isDisabled();
    assert.dom('[data-test-redo-button]').hasAria('label', 'Redo').isDisabled();

    this.owner.lookup('service:project').apply({ type: 'setBpm', bpm: 90 });
    await settled();
    assert.dom('[data-test-undo-button]').isNotDisabled();
    assert.dom('[data-test-redo-button]').isDisabled();

    await click('[data-test-undo-button]');
    assert.strictEqual(this.owner.lookup('service:project').doc.bpm, 120);
    assert.dom('[data-test-undo-button]').isDisabled();
    assert.dom('[data-test-redo-button]').isNotDisabled();
    await click('[data-test-redo-button]');
    assert.strictEqual(this.owner.lookup('service:project').doc.bpm, 90);
  });

  test('on the phone, undo and redo are the first items of the project menu', async function (assert) {
    this.owner.lookup('service:view').phone = true;
    await render(<template><AppShell /></template>);

    assert.dom('[data-test-undo-button]').isNotVisible();
    await click('[data-test-project-menu-button]');
    assert.dom('[data-test-menu-undo]').isVisible().isDisabled();
    this.owner.lookup('service:project').apply({ type: 'setBpm', bpm: 90 });
    await settled();
    assert.dom('[data-test-menu-undo]').isNotDisabled();
    await click('[data-test-menu-undo]');
    assert.strictEqual(this.owner.lookup('service:project').doc.bpm, 120);
    assert.dom('[data-test-project-panel]').doesNotExist('the menu closes');
  });

  test('the menu names the project, makes a new one, lists, opens, duplicates and deletes', async function (assert) {
    this.owner.lookup('service:view').phone = false;
    await render(<template><AppShell /></template>);
    const project = this.owner.lookup('service:project');

    await click('[data-test-project-menu-button]');
    await fillIn('[data-test-project-name]', 'Alpha');
    assert.strictEqual(project.doc.name, 'Alpha');
    assert.dom('[data-test-save-state]').hasText(/Sav/);

    await click('[data-test-new-project]');
    assert.dom('[data-test-project-panel]').doesNotExist();
    assert.strictEqual(project.doc.name, 'Untitled project');
    assert.dom('[data-test-undo-button]').isDisabled('history was cleared');

    await click('[data-test-project-menu-button]');
    await click('[data-test-projects]');
    assert.dom('[data-test-project-row]').exists({ count: 2 });
    await click(
      '[data-test-project-row="Alpha"] [data-test-project-duplicate]',
    );
    assert.dom('[data-test-project-row]').exists({ count: 3 });
    assert.dom('[data-test-project-row="Alpha copy"]').exists();

    // delete asks first, in the row: nothing is removed by one press
    await click(
      '[data-test-project-row="Alpha copy"] [data-test-project-delete]',
    );
    assert.dom('[data-test-project-row]').exists({ count: 3 });
    await click(
      '[data-test-project-row="Alpha copy"] [data-test-project-delete-cancel]',
    );
    assert.dom('[data-test-project-row]').exists({ count: 3 });
    await click(
      '[data-test-project-row="Alpha copy"] [data-test-project-delete]',
    );
    await click('[data-test-project-delete-confirm]');
    assert.dom('[data-test-project-row]').exists({ count: 2 });

    await click('[data-test-project-row="Alpha"] [data-test-project-open]');
    assert.strictEqual(project.doc.name, 'Alpha');
    assert.dom('[data-test-project-title]').hasText('Alpha');
  });

  test('importing a bad file says why and creates nothing', async function (assert) {
    this.owner.lookup('service:view').phone = false;
    await render(<template><AppShell /></template>);
    const project = this.owner.lookup('service:project');

    await click('[data-test-project-menu-button]');
    const input = document.querySelector<HTMLInputElement>(
      '[data-test-import-file]',
    )!;
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(['{"format":"euclip-project","version":9}'], 'x.euclip'),
    );
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await settled();
    assert.dom('[data-test-import-error]').includesText('newer Euclip');
    assert.strictEqual((await project.projects()).length, 1);
  });
});
