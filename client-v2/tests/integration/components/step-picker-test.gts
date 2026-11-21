import { module, test } from 'qunit';
import { click, fillIn, render, triggerKeyEvent } from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { controlKey } from 'client-v2/project/schema';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

const FREQUENCY = controlKey('#filter', 'frequency');
const row = `[data-test-pane="controls"] [data-test-control="${FREQUENCY}"]`;

module(
  'Integration | Step picker: editing one step’s values',
  function (hooks) {
    setupRenderingTest(hooks);

    let view: ViewService;
    let project: ProjectService;
    hooks.beforeEach(function () {
      window.localStorage.removeItem(VIEW_STORAGE_KEY);
      view = this.owner.lookup('service:view');
      project = this.owner.lookup('service:project');
      view.phone = false;
      view.footerOpen = true;
      view.footerPane = 'controls';
    });
    hooks.afterEach(function () {
      window.localStorage.removeItem(VIEW_STORAGE_KEY);
    });

    const steps = (): unknown =>
      (
        project.doc.tracks[0]!.values.controls[FREQUENCY]?.options as
          { stepValues?: unknown[] } | undefined
      )?.stepValues;
    const stored = (): unknown =>
      project.doc.tracks[0]!.values.controls[FREQUENCY]?.value;

    async function type(text: string): Promise<void> {
      await click(`${row} [data-test-number-entry]`);
      await fillIn(`${row} [data-test-number-input]`, text);
      await triggerKeyEvent(
        `${row} [data-test-number-input]`,
        'keydown',
        'Enter',
      );
    }

    test('with a step chosen, a control sets that step’s own value; All steps goes back to its own', async function (assert) {
      await render(<template><AppShell /></template>);
      assert
        .dom('[data-test-step-picker-all]')
        .hasAttribute('aria-pressed', 'true');
      assert.dom('[data-test-step-pick]').exists({ count: 16 });
      assert.dom(`${row} [data-test-step-chip]`).doesNotExist();

      await click('[data-test-step-pick="2"]');
      assert.dom(row).hasAttribute('data-editing-step', 'true');
      assert.dom(`${row} [data-test-step-chip]`).hasText('step 3');
      assert
        .dom(`${row} [data-test-step-chip]`)
        .isDisabled('the step follows the control: nothing to clear');

      await type('440');
      const step3 = new Array(16).fill(null);
      step3[2] = 440;
      assert.deepEqual(steps(), step3, 'step 3 holds 440');
      assert.strictEqual(
        stored(),
        undefined,
        'the control’s own value is untouched',
      );
      assert.dom(`${row} [data-test-number-entry]`).hasText('440 Hz');
      assert.dom('[data-test-step-pick="2"]').hasAttribute('data-set', 'true');
      assert.dom(`${row} [data-test-lane-count]`).hasText('1');

      await click(`${row} [data-test-step-chip]`);
      assert.strictEqual(
        steps(),
        undefined,
        'the chip: the step follows again',
      );

      await type('500');
      await click('[data-test-step-picker-all]');
      assert.dom(row).doesNotHaveAttribute('data-editing-step');
      assert.dom(`${row} [data-test-number-entry]`).hasText('2 kHz');
      await type('1000');
      assert.strictEqual(stored(), 1000, 'with All steps, the control’s own');
      step3[2] = 500;
      assert.deepEqual(steps(), step3, 'the step keeps its own');

      await click('[data-test-step-pick="2"]');
      await click('[data-test-step-pick="2"]');
      assert
        .dom(row)
        .doesNotHaveAttribute('data-editing-step', 'pressed again: All steps');
    });
  },
);
