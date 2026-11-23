import { module, test } from 'qunit';
import { click, render, settled, triggerKeyEvent } from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { MemoryFiles, MemoryStorage } from 'client-v2/project/storage';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import { TOUR_STEPS } from 'client-v2/help/tour';
import { REFERENCE_FUNCTIONS } from 'client-v2/help/reference-data';

module('Integration | Welcome and tour', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const project = this.owner.lookup('service:project');
    project.storage = new MemoryStorage();
    project.files = new MemoryFiles();
    this.owner.lookup('service:view').phone = false;
  });

  test('the welcome does not appear unless a test asks for it', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.dom('[data-test-welcome]').doesNotExist();
  });

  test('the welcome shows on a first visit, once', async function (assert) {
    const help = this.owner.lookup('service:help');
    help.welcomeEnabled = true;
    await render(<template><AppShell /></template>);

    assert.dom('[data-test-welcome]').exists();
    assert.dom('[role="dialog"]').hasAttribute('aria-modal', 'true');
    assert.dom('[data-test-welcome-tour]').isFocused();
    assert.dom('[data-test-welcome-starter]').exists({ count: 4 });
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}',
    ) as { welcomeSeen?: boolean };
    assert.true(stored.welcomeSeen, 'seen is remembered with the view');

    await click('[data-test-welcome-start]');
    assert.dom('[data-test-welcome]').doesNotExist();

    help.considerWelcome();
    await settled();
    assert.dom('[data-test-welcome]').doesNotExist('and not again');

    // Help brings it back
    await click('[data-test-project-menu-button]');
    await click('[data-test-help]');
    await click('[data-test-help-welcome]');
    assert.dom('[data-test-welcome]').exists();
    await triggerKeyEvent(document.body, 'keydown', 'Escape');
    assert.dom('[data-test-welcome]').doesNotExist('Escape closes it');
    assert
      .dom('[data-test-project-menu-button]')
      .isFocused('and focus returns');
  });

  test('a starter chosen in the welcome opens as a new project', async function (assert) {
    const help = this.owner.lookup('service:help');
    const project = this.owner.lookup('service:project');
    help.welcomeEnabled = true;
    await render(<template><AppShell /></template>);
    await click('[data-test-welcome-starter="synth-line"]');
    assert.dom('[data-test-welcome]').doesNotExist();
    assert.strictEqual(project.doc.name, 'Synth line');
  });

  test('the welcome is not shown when a saved project was found', async function (assert) {
    const help = this.owner.lookup('service:help');
    this.owner.lookup('service:project').restored = true;
    help.welcomeEnabled = true;
    help.considerWelcome();
    await settled();
    assert.false(help.welcomeOpen);
  });

  test('the tour steps through, goes back, and closes', async function (assert) {
    await render(<template><AppShell /></template>);
    await click('[data-test-project-menu-button]');
    await click('[data-test-help]');
    await click('[data-test-help-tour]');

    assert.dom('[data-test-tour]').exists();
    assert
      .dom('[data-test-tour-step]')
      .hasAttribute('data-test-tour-step', 'track');
    assert.dom('[data-test-tour-next]').isFocused();
    assert.dom('[data-test-tour-back]').isDisabled();
    assert.dom('[data-test-tour-mark]').exists();
    const mark = document.querySelector<HTMLElement>('[data-test-tour-mark]')!;
    assert.true(parseInt(mark.style.width) > 0, 'the target is outlined');

    const seen: string[] = [];
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      seen.push(
        document
          .querySelector('[data-test-tour]')!
          .getAttribute('data-test-tour-step')!,
      );
      await click('[data-test-tour-next]');
    }
    assert.dom('[data-test-tour-next]').hasText('Done');
    assert.deepEqual(
      seen,
      TOUR_STEPS.slice(0, -1).map((s) => s.id),
    );

    await click('[data-test-tour-back]');
    assert.dom('[data-test-tour-count]').includesText('5');
    await click('[data-test-tour-next]');
    await click('[data-test-tour-next]');
    assert.dom('[data-test-tour]').doesNotExist('Done closes it');
    assert.dom('[data-test-project-menu-button]').isFocused('focus goes back');
  });

  test('Escape closes the tour', async function (assert) {
    await render(<template><AppShell /></template>);
    this.owner.lookup('service:help').startTour(null);
    await settled();
    assert.dom('[data-test-tour]').exists();
    await triggerKeyEvent(document.body, 'keydown', 'Escape');
    assert.dom('[data-test-tour]').doesNotExist();
  });

  test('a step whose target is not on screen is skipped', async function (assert) {
    await render(<template><AppShell /></template>);
    // the first step points at something that is not there
    const help = this.owner.lookup('service:help');
    help.steps = [
      { id: 'track', target: '.nothing-like-this' },
      ...TOUR_STEPS.slice(2),
    ];
    help.startTour(null);
    await settled();
    assert.dom('[data-test-tour]').hasAttribute('data-test-tour-step', 'tabs');
  });

  test('on the phone the card is a strip that does not cover what it points at', async function (assert) {
    this.owner.lookup('service:view').phone = true;
    await render(<template><AppShell /></template>);
    const help = this.owner.lookup('service:help');
    help.startTour(null);
    await settled();
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      const card = document.querySelector<HTMLElement>('[data-test-tour]');
      if (!card) break;
      const mark = document
        .querySelector<HTMLElement>('[data-test-tour-mark]')!
        .getBoundingClientRect();
      const strip = card.getBoundingClientRect();
      const clear =
        mark.bottom <= strip.top + 1 || mark.top >= strip.bottom - 1;
      assert.true(
        clear,
        `${card.dataset['testTourStep']}: the strip is clear of the outline`,
      );
      await click('[data-test-tour-next]');
    }
  });
});

module('Integration | Script reference', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const project = this.owner.lookup('service:project');
    project.storage = new MemoryStorage();
    project.files = new MemoryFiles();
    this.owner.lookup('service:view').phone = false;
  });

  test('Help opens the reference: an entry for every function, the basics and the docs link, and Copy copies', async function (assert) {
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          copied.push(text);
          return Promise.resolve();
        },
      },
    });
    await render(<template><AppShell /></template>);
    await click('[data-test-project-menu-button]');
    await click('[data-test-help]');
    await click('[data-test-help-reference]');

    assert.dom('[data-test-reference]').exists();
    assert
      .dom('[data-test-reference-entry]')
      .exists({ count: REFERENCE_FUNCTIONS.length });
    assert.dom('[data-test-reference-basics]').exists();
    assert
      .dom('[data-test-reference-docs]')
      .hasAttribute('href', 'https://jamesstaub.github.io/cracked-up/docs.html')
      .hasAttribute('target', '_blank')
      .hasAttribute('rel', 'noopener noreferrer');

    await click('[data-test-reference-copy="knob"]');
    assert.deepEqual(copied, [
      REFERENCE_FUNCTIONS.find((entry) => entry.name === 'knob')!.example,
    ]);
    assert.dom('[data-test-reference-copy="knob"]').hasText('Copied');

    await triggerKeyEvent(document.body, 'keydown', 'Escape');
    assert.dom('[data-test-reference]').doesNotExist();
    assert.dom('[data-test-project-menu-button]').isFocused();
  });
});
