import { module, test } from 'qunit';
import { click, render, settled, triggerKeyEvent } from '@ember/test-helpers';
import { EditorView } from '@codemirror/view';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ViewService from 'client-v2/services/view';

module('Integration | Component | app-shell', function (hooks) {
  setupRenderingTest(hooks);

  // a desktop-sized view with the footer open, whatever the size of the test window
  let view: ViewService;
  hooks.beforeEach(function () {
    view = this.owner.lookup('service:view');
    view.footerOpen = true;
  });

  test('it renders the header, sidebar, track list and footer', async function (assert) {
    await render(
      <template><AppShell @initialSidebarOpen={{true}} /></template>,
    );

    assert.dom('[data-test-app-shell]').hasAttribute('data-sidebar', 'open');
    assert.dom('[data-test-app-header]').exists({ count: 1 });
    assert.dom('[data-test-sound-browser]').exists({ count: 1 });
    assert.dom('[data-test-track-list]').exists({ count: 1 });
    assert.dom('[data-test-track-footer]').exists({ count: 1 });
  });

  test('the transport is in the header', async function (assert) {
    await render(<template><AppShell /></template>);

    assert.dom('[data-test-transport]').exists({ count: 1 });
    assert.dom('[data-test-app-header] [data-test-transport]').exists();
    assert.dom('[data-test-transport-play]').hasAria('label', 'Play');
    assert.dom('[data-test-transport-stop]').hasAria('label', 'Stop');
    assert.dom('[data-test-transport-tempo]').hasValue('120');
  });

  test('the regions hold their placeholder content', async function (assert) {
    await render(
      <template><AppShell @initialSidebarOpen={{true}} /></template>,
    );

    assert.dom('[data-test-project-title]').hasText('Untitled project');
    assert.dom('[data-test-sound-row]').exists('the sidebar lists sounds');

    // three tracks and the main output; each track has 16 steps; rows are compact (no detail inside them)
    assert.dom('[data-test-track]').exists({ count: 4 });
    assert.dom('[data-test-step-grid]').exists({ count: 3 });
    assert.dom('[data-test-step]').exists({ count: 48 });
    assert.dom('[data-test-track="1"] [data-test-step]').exists({ count: 16 });
    assert
      .dom('[data-test-track-script]')
      .doesNotExist('no scripts in UI view');

    // the footer is the selected track's detail: channel strip, controls and script
    const footer = '[data-test-track-footer]';
    assert.dom(`${footer} [data-test-channel-strip]`).exists({ count: 1 });
    assert.dom(`${footer} [data-test-pane="controls"]`).exists({ count: 1 });
    assert
      .dom(`${footer} [data-test-footer-script]`)
      .doesNotExist('the UI, not the script');
    assert.dom(`${footer} canvas`).doesNotExist('no meters or scopes');
  });

  test('the sidebar toggle opens and closes the sidebar', async function (assert) {
    await render(
      <template><AppShell @initialSidebarOpen={{false}} /></template>,
    );

    const toggle = '[data-test-sidebar-toggle]';
    assert.dom('[data-test-sound-browser]').doesNotExist();
    assert.dom(toggle).hasAria('expanded', 'false');
    assert.dom('[data-test-app-shell]').hasAttribute('data-sidebar', 'closed');

    await click(toggle);
    assert.dom('[data-test-sound-browser]').exists();
    assert.dom(toggle).hasAria('expanded', 'true');
    assert.dom(toggle).hasAria('controls', 'sound-browser');
    assert.dom('[data-test-sound-browser]').hasAttribute('id', 'sound-browser');
    assert.dom('[data-test-app-shell]').hasAttribute('data-sidebar', 'open');

    await click(toggle);
    assert.dom('[data-test-sound-browser]').doesNotExist();
    assert.dom(toggle).hasAria('expanded', 'false');
  });

  test('an open sidebar closes from its own button, the scrim, and Escape', async function (assert) {
    await render(
      <template><AppShell @initialSidebarOpen={{true}} /></template>,
    );

    await click('[data-test-sidebar-close]');
    assert.dom('[data-test-sound-browser]').doesNotExist('close button');

    await click('[data-test-sidebar-toggle]');
    // the scrim is only displayed where the sidebar is a drawer, so call click() on it directly
    document.querySelector<HTMLElement>('[data-test-sidebar-scrim]')?.click();
    await click('[data-test-app-header]');
    assert.dom('[data-test-sound-browser]').doesNotExist('scrim');

    await click('[data-test-sidebar-toggle]');
    await triggerKeyEvent(document.body, 'keydown', 'Escape');
    assert.dom('[data-test-sound-browser]').doesNotExist('Escape');
  });

  test('the footer collapses to a bar naming the selected track, and expands again', async function (assert) {
    view.footerOpen = false;
    await render(<template><AppShell /></template>);

    const toggle = '[data-test-footer-toggle]';
    assert.dom('[data-test-track-footer]').hasAttribute('data-open', 'false');
    assert.dom(toggle).hasAria('expanded', 'false');
    assert.dom('[data-test-footer-title]').includesText('Track 1');
    assert.dom('[data-test-footer-body]').doesNotExist();

    await click(toggle);
    assert.dom('[data-test-track-footer]').hasAttribute('data-open', 'true');
    assert.dom(toggle).hasAria('expanded', 'true');
    assert.dom('[data-test-footer-body]').exists();
    assert.dom(toggle).hasAria('controls', 'track-footer-body');
    assert
      .dom('[data-test-footer-body]')
      .hasAttribute('id', 'track-footer-body');

    await click(toggle);
    assert.dom('[data-test-footer-body]').doesNotExist();
    assert.dom('[data-test-track-list]').exists('the track list stays');
  });

  test('selecting a track marks it and names it in the footer', async function (assert) {
    await render(<template><AppShell /></template>);

    assert.dom('[data-test-track="1"]').hasAria('current', 'true');
    assert.dom('[data-test-track="2"]').doesNotHaveAria('current');
    assert.dom('[data-test-footer-title]').includesText('Track 1');
    assert.dom('[data-test-footer-title]').includesText('BD0000.mp3');

    await click('[data-test-track="2"] [data-test-track-select]');
    assert.dom('[data-test-track="2"]').hasAria('current', 'true');
    assert.dom('[data-test-track="1"]').doesNotHaveAria('current');
    assert
      .dom('[data-test-track="2"] [data-test-track-select]')
      .hasAria('pressed', 'true');
    assert.dom('[data-test-footer-title]').includesText('Track 2');
    assert.dom('[data-test-footer-title]').includesText('SD0010.mp3');
    assert.dom('[data-test-footer-body]').exists('the footer stays open');

    await click('[data-test-track="4"] [data-test-track-select]');
    assert.dom('[data-test-footer-title]').includesText('Main output');
    assert.dom('[data-test-track="4"]').hasAria('current', 'true');
  });
  test('the footer menu switches the pane', async function (assert) {
    await render(<template><AppShell /></template>);

    assert.dom('[data-test-pane]').exists({ count: 1 });
    assert.dom('[data-test-pane="controls"]').exists();
    assert.dom('[data-test-footer-tab="controls"]').hasAria('pressed', 'true');

    await click('[data-test-footer-tab="sequence"]');
    assert.dom('[data-test-pane]').exists({ count: 1 });
    assert.dom('[data-test-pane="sequence"]').exists();
    assert.dom('[data-test-footer-tab="sequence"]').hasAria('pressed', 'true');
    assert.dom('[data-test-footer-tab="controls"]').hasAria('pressed', 'false');

    await click('[data-test-footer-tab="source"]');
    assert.dom('[data-test-pane="source"]').exists();
    assert.dom('[data-test-sampler-card]').includesText('BD0000.mp3');
    assert.dom('[data-test-pane="source"] canvas').doesNotExist();
  });

  test('the script button replaces the whole footer UI with the editor, and brings it back', async function (assert) {
    await render(<template><AppShell /></template>);

    const footer = '[data-test-track-footer]';
    const toggle = `${footer} [data-test-script-toggle]`;
    assert.dom(toggle).hasAria('pressed', 'false');
    assert.dom(toggle).hasAria('label', 'Track 1 script');
    assert.dom(`${footer} [data-test-footer-ui]`).exists();
    assert.dom('.cm-editor').doesNotExist('no editor until it is asked for');

    await click(toggle);
    assert.dom(toggle).hasAria('pressed', 'true');
    assert.dom(footer).hasAttribute('data-shows', 'script');
    assert
      .dom(`${footer} [data-test-footer-script] .cm-editor`)
      .exists({ count: 1 });
    assert.dom(`${footer} .cm-content`).includesText("buffer: 'kick'");
    assert.dom(`${footer} [data-test-footer-ui]`).doesNotExist();
    assert.dom(`${footer} [data-test-channel-strip]`).doesNotExist();
    assert.dom(`${footer} [data-test-footer-tab]`).doesNotExist();
    assert.dom(`${footer} [data-test-pane]`).doesNotExist();
    assert
      .dom('.cm-editor')
      .exists({ count: 1 }, 'the script is in one place only');

    await click(toggle);
    assert.dom(toggle).hasAria('pressed', 'false');
    assert.dom('.cm-editor').doesNotExist();
    assert.dom(`${footer} [data-test-channel-strip]`).exists();
    assert.dom(`${footer} [data-test-pane="controls"]`).exists();
  });

  test('the script follows the selected track', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-script-toggle]');

    await click('[data-test-track="3"] [data-test-track-select]');
    assert.dom('[data-test-footer-script] .cm-editor').exists({ count: 1 });
    assert
      .dom('[data-test-footer-script] .cm-content')
      .includesText("buffer: 'hat'");
    assert.dom('[data-test-script-toggle]').hasAria('label', 'Track 3 script');
  });

  test('the script button opens a collapsed footer on the script', async function (assert) {
    view.footerOpen = false;
    await render(<template><AppShell /></template>);
    assert.dom('[data-test-footer-body]').doesNotExist();

    await click('[data-test-script-toggle]');
    assert.dom('[data-test-footer-toggle]').hasAria('expanded', 'true');
    assert.dom('[data-test-footer-script] .cm-editor').exists();
  });

  test('the main output is selectable, shows master controls, and its script is the project script', async function (assert) {
    await render(<template><AppShell /></template>);

    assert
      .dom('[data-test-project]')
      .doesNotExist('no project block in the list');
    await click('[data-test-track="4"] [data-test-track-select]');

    const footer = '[data-test-track-footer]';
    assert.dom('[data-test-footer-title]').includesText('Main output');
    assert.dom(`${footer} [data-test-pane="master"]`).exists();
    assert.dom(`${footer} [data-test-param="level"]`).exists();
    assert.dom(`${footer} [data-test-channel-strip]`).doesNotExist();
    assert.dom(`${footer} [data-test-footer-tab]`).doesNotExist();
    assert.dom(`${footer} canvas`).doesNotExist('no meters or scopes');
    assert.dom('[data-test-script-toggle]').hasAria('label', 'Project script');

    await click('[data-test-script-toggle]');
    assert.dom(`${footer} [data-test-pane]`).doesNotExist();
    assert.dom(`${footer} .cm-content`).includesText("__.bus('drums')");
    assert.dom(`${footer} .cm-content`).hasAria('label', 'Project script');
  });

  test('an edit is kept when the footer goes to its UI and back, per script', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-script-toggle]');

    const content = document.querySelector<HTMLElement>(
      '[data-test-footer-script] .cm-content',
    );
    const editor = content ? EditorView.findFromDOM(content) : null;
    assert.ok(editor, 'the footer has an editor');
    editor?.dispatch({
      changes: { from: 0, insert: '// louder\n' },
      userEvent: 'input.type',
    });
    await settled();

    await click('[data-test-script-toggle]');
    await click('[data-test-track="2"] [data-test-track-select]');
    await click('[data-test-script-toggle]');
    assert
      .dom('.cm-content')
      .doesNotIncludeText('// louder', 'track 2 is untouched');

    await click('[data-test-track="1"] [data-test-track-select]');
    assert.dom('.cm-content').includesText('// louder');
  });

  test('the script choice is remembered on this device', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-script-toggle]');

    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? 'null',
    ) as { scriptOpen?: boolean } | null;
    assert.true(stored?.scriptOpen);
  });
});
