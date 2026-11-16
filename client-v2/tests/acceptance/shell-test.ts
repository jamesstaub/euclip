import { module, test } from 'qunit';
import {
  click,
  currentURL,
  find,
  triggerEvent,
  visit,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'client-v2/tests/helpers';
import { controlKey, stepGridKey } from 'client-v2/project/schema';

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
    assert.dom('[data-test-script-warnings]').doesNotExist();
    assert.dom('[data-test-track-error]').doesNotExist();
  });

  test('editing a grid changes the project and the running sequence', async function (assert) {
    await visit('/');
    const project = this.owner.lookup('service:project');
    const audio = this.owner.lookup('service:audio');
    const step = '[data-test-track="3"] [data-test-step="1"]';
    const running = () =>
      audio.engine?.scope('t-hat').scope('script').transport.get('steps')
        ?.steps[1];
    const stored = () =>
      project.doc.tracks[2]?.values.controls[stepGridKey('steps')]?.value as
        number[] | undefined;

    await click(step);

    assert.dom(step).hasAria('pressed', 'true');
    assert.strictEqual(stored()?.[1], 1);
    assert.strictEqual(running(), 1);

    await click(step);
    assert.dom(step).hasAria('pressed', 'false');
    assert.strictEqual(running(), 0);
  });

  test('dragging a slider in the app changes the project and the running parameter', async function (assert) {
    await visit('/');
    const project = this.owner.lookup('service:project');
    const audio = this.owner.lookup('service:audio');
    const view = this.owner.lookup('service:view');
    await click('[data-test-track="2"] [data-test-track-select]');
    if (!find('[data-test-footer-body]'))
      await click('[data-test-footer-toggle]');
    if (view.footerPane !== 'controls')
      await click('[data-test-footer-tab="controls"]');

    const key = controlKey('#filter', 'frequency');
    const slider = `[data-test-control="${key}"] [data-test-slider]`;
    const rect = find(slider)!.getBoundingClientRect();
    const pointer = (share: number) => ({
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: rect.left + 8 + share * (rect.width - 16),
      clientY: rect.top + rect.height / 2,
    });
    const frequency = () =>
      [...(audio.engine?.scope('t-snare').select('#filter') ?? [])][0]?.param(
        'frequency',
      ).value as number;
    assert.strictEqual(
      frequency(),
      180,
      'the number in the script, to begin with',
    );

    await triggerEvent(slider, 'pointerdown', pointer(0.5));
    await triggerEvent(slider, 'pointermove', pointer(1));
    await triggerEvent(slider, 'pointerup', pointer(1));

    assert.strictEqual(frequency(), 20000, 'dragged to the top');
    assert.strictEqual(
      project.doc.tracks[1]?.values.controls[key]?.value,
      20000,
    );
    assert.dom(slider).hasAria('valuetext', '20 kHz');
    assert.strictEqual(
      [...(audio.engine?.scope('t-kick').select('#filter') ?? [])][0]?.param(
        'frequency',
      ).value,
      2000,
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
