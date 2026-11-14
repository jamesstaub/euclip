import { module, test } from 'qunit';
import {
  click,
  currentURL,
  find,
  triggerEvent,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'client-v2/tests/helpers';

module('Acceptance | project', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting / shows the default project, running', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/');
    assert.dom('[data-test-app-shell]').hasAttribute('data-ready', 'true');
    assert.dom('[data-test-track]').exists({ count: 4 });
    assert
      .dom('[data-test-track-list] [data-test-step-grid]')
      .exists({ count: 3 });
    assert.dom('[data-test-script-error]').doesNotExist();
    assert.dom('[data-test-track-error]').doesNotExist();
  });

  test('editing a grid changes the project and the running sequence', async function (assert) {
    await visit('/');
    const project = this.owner.lookup('service:project');
    const audio = this.owner.lookup('service:audio');
    const step = '[data-test-track="3"] [data-test-step="1"]';
    const running = () =>
      audio.engine?.scope('t-hat').transport.get('steps')?.steps[1];

    await click(step);

    assert.dom(step).hasAria('pressed', 'true');
    assert.strictEqual(
      project.doc.tracks[2]?.values.sequences['steps']?.value[1],
      1,
    );
    assert.strictEqual(running(), 1);

    await click(step);
    assert.dom(step).hasAria('pressed', 'false');
    assert.strictEqual(running(), 0);
  });

  test('moving the channel strip changes the project and the running track', async function (assert) {
    await visit('/');
    const project = this.owner.lookup('service:project');
    const audio = this.owner.lookup('service:audio');
    await click('[data-test-track="2"] [data-test-track-select]');
    if (!find('[data-test-footer-body]'))
      await click('[data-test-footer-toggle]');

    const level = find('[data-test-strip-level]') as HTMLInputElement;
    level.value = '0.25';
    await triggerEvent(level, 'input');

    assert.strictEqual(project.doc.tracks[1]?.level, 0.25);
    assert.strictEqual(
      audio.engine?.scope('t-snare').bus('out').gain.value,
      0.25,
    );
    assert.strictEqual(
      audio.engine?.scope('t-kick').bus('out').gain.value,
      1,
      'only that track',
    );
  });

  test('the page itself never scrolls sideways', async function (assert) {
    await visit('/');
    const shell = document.querySelector('[data-test-app-shell]');
    assert.ok(shell, 'the shell is rendered');
    assert.ok(
      shell!.scrollWidth <= shell!.clientWidth,
      `shell content (${shell!.scrollWidth}px) fits its width (${shell!.clientWidth}px)`,
    );
  });
});
