import { module, test } from 'qunit';
import { click, render, settled } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';

class State {
  @tracked items: MenuItem[] = [];
  @tracked open = true;
  picked = '';
}

module('Integration | Component | popup menu', function (hooks) {
  setupRenderingTest(hooks);

  test('items made again by the owner (every step while playing) are the same buttons, so a press on one still lands', async function (assert) {
    const state = new State();
    const make = (): MenuItem[] => [
      { label: 'Pattern generators', onSelect: () => (state.picked = 'gen') },
      {
        label: 'Remove',
        separated: true,
        onSelect: () => (state.picked = 'remove'),
      },
    ];
    state.items = make();
    const setOpen = (open: boolean): void => {
      state.open = open;
    };
    await render(
      <template>
        <PopupMenu
          @label="Track menu"
          @items={{state.items}}
          @open={{state.open}}
          @onOpenChange={{setOpen}}
        />
      </template>,
    );
    const menu = document.querySelector('[data-test-menu]');
    const remove = document.querySelector('[data-test-menu-item="Remove"]');
    const items = [...document.querySelectorAll('[data-test-menu-item]')];
    for (let tick = 0; tick < 5; tick++) {
      state.items = make(); // new objects, as the row's getter gives on every change
      await settled();
    }
    assert.strictEqual(
      document.querySelector('[data-test-menu]'),
      menu,
      'the menu',
    );
    assert.strictEqual(
      document.querySelector('[data-test-menu-item="Remove"]'),
      remove,
      'the item',
    );
    assert.deepEqual(
      [...document.querySelectorAll('[data-test-menu-item]')],
      items,
      'every button is the one that was there',
    );
    await click('[data-test-menu-item="Remove"]');
    assert.strictEqual(state.picked, 'remove');
  });
});
