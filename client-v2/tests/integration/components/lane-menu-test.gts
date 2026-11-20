import { module, test } from 'qunit';
import { click, find, findAll, render, settled } from '@ember/test-helpers';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import AppShell from 'client-v2/components/app-shell';
import { controlKey, stepGridKey } from 'client-v2/project/schema';
import { VIEW_STORAGE_KEY } from 'client-v2/services/view';
import type AudioService from 'client-v2/services/audio';
import type ProjectService from 'client-v2/services/project';
import type ViewService from 'client-v2/services/view';

const FREQUENCY = controlKey('#filter', 'frequency');
const Q = controlKey('#filter', 'q');
const STEPS = stepGridKey('steps');
const FILLS = stepGridKey('fills');
const track = '[data-test-track="1"]';
const button = `${track} .track__lanes [data-test-menu-button]`;
const item = (label: string): string =>
  `${track} [data-test-menu-item="${label}"]`;

module('Integration | Track row lanes menu', function (hooks) {
  setupRenderingTest(hooks);

  let view: ViewService;
  let audio: AudioService;
  let project: ProjectService;
  hooks.beforeEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
    view = this.owner.lookup('service:view');
    audio = this.owner.lookup('service:audio');
    project = this.owner.lookup('service:project');
    view.phone = false;
    view.footerOpen = true;
    view.footerPane = 'controls';
  });
  hooks.afterEach(function () {
    window.localStorage.removeItem(VIEW_STORAGE_KEY);
  });

  /** Both per-step controls of the first track become lanes of its one sequence. */
  async function twoLanes(): Promise<void> {
    await render(<template><AppShell /></template>);
    audio.chooseStepMode('t-kick', FREQUENCY, 'per-step:steps');
    audio.chooseStepMode('t-kick', Q, 'per-step:steps');
    await settled();
  }

  test('a plain one-grid track has no Lanes button', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.dom(`${track} .track__lanes`).doesNotExist();
    assert.dom(`${track} [data-test-step]`).exists({ count: 16 });
  });

  test('the menu lists the grid, then the lanes, as checkboxes; the defaults are the grid and the first lane', async function (assert) {
    await twoLanes();
    assert.dom(`${track} .track__lanes`).includesText('Lanes 2/3');
    assert.dom(`${track} [data-test-lane]`).exists({ count: 1 });
    assert.dom(`${track} [data-test-lane="${FREQUENCY}"]`).exists();

    await click(button);
    assert.deepEqual(
      findAll(`${track} [data-test-menu-item]`).map((el) => [
        el.textContent.trim(),
        el.getAttribute('role'),
        el.getAttribute('aria-checked'),
      ]),
      [
        ['steps', 'menuitemcheckbox', 'true'],
        ['frequency', 'menuitemcheckbox', 'true'],
        ['q', 'menuitemcheckbox', 'false'],
      ],
    );
  });

  test('toggling shows and hides, the menu stays open, and a lane can stand without its grid', async function (assert) {
    await twoLanes();
    await click(button);
    await click(item('q'));
    assert.dom(`${track} [data-test-menu]`).exists('still open');
    assert.dom(`${track} [data-test-lane]`).exists({ count: 2 });
    assert.dom(`${track} .track__lanes`).includesText('Lanes 3/3');

    await click(item('steps'));
    assert.dom(`${track} [data-test-step]`).doesNotExist('the grid is hidden');
    assert
      .dom(`${track} [data-test-lane]`)
      .exists({ count: 2 }, 'its lanes stay');
    assert.dom(`${track} [data-lane-step]`).exists({ count: 32 });

    await click(item('frequency'));
    await click(item('q'));
    assert.dom(`${track} [data-test-no-lanes]`).hasText('No lanes shown');
    assert.dom(`${track} .track__lanes`).includesText('Lanes 0/3');
    assert.dom(`${track} [data-test-menu]`).exists();

    await click(item('steps'));
    assert.dom(`${track} [data-test-step]`).exists({ count: 16 });
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}',
    ) as { laneSets: Record<string, { keys: string[] }> };
    assert.deepEqual(stored.laneSets['t-kick']!.keys, [STEPS]);
  });

  test('Show lane checks that lane and leaves the others alone', async function (assert) {
    await twoLanes();
    await click(button);
    await click(item('steps'));
    await click(button);
    await click('[data-test-footer-tab="controls"]').catch(() => undefined);
    await click(`[data-test-control="${Q}"] [data-test-show-lane]`);
    assert.dom(`${track} [data-test-lane="${Q}"]`).exists();
    assert.dom(`${track} [data-test-lane="${FREQUENCY}"]`).exists();
    assert
      .dom(`${track} [data-test-step]`)
      .doesNotExist('the grid stays unchecked');
  });

  test('a control just made per step is checked in the row', async function (assert) {
    await render(<template><AppShell /></template>);
    await click(`[data-test-control="${Q}"] [data-test-menu-button]`);
    await click('[data-test-menu-item="Per step"]');
    assert.dom(`${track} [data-test-lane="${Q}"]`).exists();
    await click(`[data-test-control="${FREQUENCY}"] [data-test-menu-button]`);
    await click('[data-test-menu-item="Per step"]');
    assert.dom(`${track} [data-test-lane]`).exists({ count: 2 });
  });

  test('two sequences: grouped by sequence, each lane under its own grid', async function (assert) {
    await render(<template><AppShell /></template>);
    const script = project.doc.tracks[0]!.script;
    project.apply({
      type: 'setScript',
      scope: 't-kick',
      script: `${script}
__.transport.sequence('fills', { steps: 8, step: '1/16' }, (ev) => {
  if (ev.value) __('#sampler').trigger();
});
stepGrid('fills');
`,
    });
    await settled();
    audio.chooseStepMode('t-kick', FREQUENCY, 'per-step:steps');
    audio.chooseStepMode('t-kick', Q, 'per-step:fills');
    await settled();
    await click(button);
    assert.deepEqual(
      findAll(`${track} [data-test-menu] li`).map((el) =>
        el.textContent.trim(),
      ),
      ['steps', 'steps', 'frequency', 'fills', 'fills', 'q'],
      'a heading and the grid, then the lanes, for each sequence',
    );
    await click(item('q'));
    const stacks = findAll(`${track} .track__grid`);
    assert.strictEqual(stacks.length, 2);
    assert.dom(`[data-test-lane="${Q}"]`, stacks[1]).exists();
    assert.dom(`[data-test-lane="${Q}"]`, stacks[0]).doesNotExist();
    assert.true(!!project.doc.tracks[0]);
    assert.true(!!FILLS);
  });

  for (const phone of [false, true]) {
    test(`every bar stands in its step's column (${phone ? 'phone' : 'desktop'})`, async function (assert) {
      view.phone = phone;
      await twoLanes();
      const steps = findAll(`${track} [data-test-step]`).map((el) => {
        const box = el.getBoundingClientRect();
        return box.left + box.width / 2;
      });
      assert.strictEqual(steps.length, 16);
      const bars = findAll(`${track} [data-lane-step]`);
      assert.strictEqual(bars.length, 16);
      for (const bar of bars) {
        const box = bar.getBoundingClientRect();
        const at = Number(bar.getAttribute('data-lane-step'));
        assert.true(
          Math.abs(box.left + box.width / 2 - steps[at]!) <= 1,
          `step ${at}`,
        );
      }
    });
  }

  test('the menu’s items keep their buttons while the project changes under it', async function (assert) {
    await twoLanes();
    await click(button);
    const q = find(item('q'));
    audio.setControl('t-kick', Q, 3);
    await settled();
    audio.setControl('t-kick', Q, 4);
    await settled();
    assert.strictEqual(find(item('q')), q, 'the same button');
  });
});
