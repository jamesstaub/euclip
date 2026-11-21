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

  /** A step of each of the filter's controls is painted: both lanes come into play under the one grid. */
  async function twoLanes(): Promise<void> {
    await render(<template><AppShell /></template>);
    audio.setLaneValue('t-kick', FREQUENCY, 0, 500);
    audio.setLaneValue('t-kick', Q, 2, 4);
    await settled();
  }

  /** The menu's items for these labels, as [label, role, checked]. */
  const itemsFor = (...labels: string[]): (string | null)[][] =>
    findAll(`${track} [data-test-menu-item]`)
      .map((el) => [
        el.getAttribute('data-test-menu-item'),
        el.getAttribute('role'),
        el.getAttribute('aria-checked'),
      ])
      .filter(([label]) => labels.includes(label ?? ''));

  test('with no step set, the row shows its grid and no lane; the menu lists every control’s lane', async function (assert) {
    await render(<template><AppShell /></template>);
    assert.dom(`${track} [data-test-step]`).exists({ count: 16 });
    assert.dom(`${track} [data-test-lane]`).doesNotExist();
    await click(button);
    assert.deepEqual(itemsFor('steps', 'frequency', 'q'), [
      ['steps', 'menuitemcheckbox', 'true'],
      ['frequency', 'menuitemcheckbox', 'false'],
      ['q', 'menuitemcheckbox', 'false'],
    ]);
  });

  test('a lane in play is shown, and the menu says how many steps it sets', async function (assert) {
    await twoLanes();
    assert.dom(`${track} [data-test-lane]`).exists({ count: 2 });
    await click(button);
    assert.deepEqual(itemsFor('steps', 'frequency', 'q'), [
      ['steps', 'menuitemcheckbox', 'true'],
      ['frequency', 'menuitemcheckbox', 'true'],
      ['q', 'menuitemcheckbox', 'true'],
    ]);
    assert.dom(item('frequency')).includesText('1 step set');
  });

  test('toggling shows and hides, the menu stays open, and a lane can stand without its grid', async function (assert) {
    await twoLanes();
    await click(button);
    await click(item('q'));
    assert.dom(`${track} [data-test-menu]`).exists('still open');
    assert.dom(`${track} [data-test-lane]`).exists({ count: 1 });

    await click(item('steps'));
    assert.dom(`${track} [data-test-step]`).doesNotExist('the grid is hidden');
    assert
      .dom(`${track} [data-test-lane]`)
      .exists({ count: 1 }, 'its lane stays');
    assert.dom(`${track} [data-lane-step]`).exists({ count: 16 });

    await click(item('frequency'));
    assert.dom(`${track} [data-test-no-lanes]`).hasText('No lanes shown');
    assert.dom(`${track} .track__lanes`).includesText('Lanes 0/');
    assert.dom(`${track} [data-test-menu]`).exists();

    await click(item('steps'));
    assert.dom(`${track} [data-test-step]`).exists({ count: 16 });
    const stored = JSON.parse(
      window.localStorage.getItem(VIEW_STORAGE_KEY) ?? '{}',
    ) as { laneView: Record<string, { open: string[]; closed: string[] }> };
    assert.deepEqual(stored.laneView['t-kick'], {
      open: [STEPS],
      closed: [Q, FREQUENCY],
    });
  });

  test('a control’s lane button opens its lane under the row and in the track’s row', async function (assert) {
    await render(<template><AppShell /></template>);
    const lane = `[data-test-control="${Q}"] [data-test-lane-button]`;
    assert.dom(lane).hasAttribute('aria-pressed', 'false');
    await click(lane);
    assert.dom(lane).hasAttribute('aria-pressed', 'true');
    assert
      .dom(
        `[data-test-control="${Q}"] [data-test-control-steps] [data-lane-step]`,
      )
      .exists({ count: 16 }, 'under the control, in its sequence’s columns');
    assert.dom(`${track} [data-test-lane="${Q}"]`).exists();
    assert.dom(`${track} [data-test-lane]`).exists({ count: 1 });
    await click(lane);
    assert.dom(`${track} [data-test-lane="${Q}"]`).doesNotExist();
    assert
      .dom(`[data-test-control="${Q}"] [data-test-control-steps]`)
      .doesNotExist();
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
    audio.setLaneSequence('t-kick', Q, 'fills');
    audio.setLaneValue('t-kick', FREQUENCY, 0, 500);
    audio.setLaneValue('t-kick', Q, 0, 4);
    await settled();
    await click(button);
    const labels = findAll(`${track} [data-test-menu] li`).map(
      (el) =>
        el
          .querySelector('[data-test-menu-item]')
          ?.getAttribute('data-test-menu-item') ?? el.textContent.trim(),
    );
    assert.deepEqual(
      labels.filter((label) => ['steps', 'fills', 'q'].includes(label)),
      ['steps', 'steps', 'fills', 'fills', 'q'],
      'a heading and the grid, then the lanes, for each sequence',
    );
    const stacks = findAll(`${track} .track__grid`);
    assert.strictEqual(stacks.length, 2);
    assert.dom(`[data-test-lane="${Q}"]`, stacks[1]).exists();
    assert.dom(`[data-test-lane="${Q}"]`, stacks[0]).doesNotExist();
    assert.dom(`[data-test-lane="${FREQUENCY}"]`, stacks[0]).exists();
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
      const bars = findAll(`${track} [data-lane="${FREQUENCY}"]`);
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
