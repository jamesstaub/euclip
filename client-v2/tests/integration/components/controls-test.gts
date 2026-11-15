import { module, test } from 'qunit';
import {
  click,
  fillIn,
  find,
  focus,
  render,
  rerender,
  settled,
  triggerEvent,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';
import { setupRenderingTest } from 'client-v2/tests/helpers';
import Knob from 'client-v2/components/ui/knob';
import NumberEntry from 'client-v2/components/ui/number-entry';
import PopupMenu, { type MenuItem } from 'client-v2/components/ui/popup-menu';
import Slider from 'client-v2/components/ui/slider';
import Toggle from 'client-v2/components/ui/toggle';
import { mapping, type Mapping } from 'client-v2/controls/modes';

class State {
  @tracked value = 50;
  @tracked effective: number | null = null;
  @tracked mapping: Mapping = mapping('linear', { min: 0, max: 100 });
  @tracked checked = false;
  @tracked open = false;
  resets = 0;
  menus = 0;
  chosen: string[] = [];
  change = (value: number): void => {
    this.value = value;
  };
  reset = (): void => {
    this.resets++;
  };
  menu = (): void => {
    this.menus++;
  };
  check = (checked: boolean): void => {
    this.checked = checked;
  };
  setOpen = (open: boolean): void => {
    this.open = open;
  };
}

function styleOf(selector: string): CSSStyleDeclaration {
  return (find(selector) as HTMLElement).style;
}

/** A pointer event at a share of the way along (and across the middle of) an element. */
function at(
  selector: string,
  along: number,
  options: {
    vertical?: boolean;
    pointerType?: string;
    shiftKey?: boolean;
    dx?: number;
    dy?: number;
  } = {},
) {
  const rect = find(selector)!.getBoundingClientRect();
  const inset = 8; // the slider's travel stops half a handle from each end
  const x = options.vertical
    ? rect.left + rect.width / 2
    : rect.left + inset + along * (rect.width - 2 * inset);
  const y = options.vertical
    ? rect.bottom - inset - along * (rect.height - 2 * inset)
    : rect.top + rect.height / 2;
  return {
    pointerId: 1,
    button: 0,
    buttons: 1,
    isPrimary: true,
    pointerType: options.pointerType ?? 'mouse',
    shiftKey: options.shiftKey ?? false,
    clientX: x + (options.dx ?? 0),
    clientY: y + (options.dy ?? 0),
  };
}

module('Integration | Component | controls', function (hooks) {
  setupRenderingTest(hooks);

  module('slider', function () {
    test('it is an ARIA slider that says its value with its unit', async function (assert) {
      const state = new State();
      state.mapping = mapping('exponential', {
        min: 20,
        max: 20000,
        unit: 'hz',
      });
      state.value = 2000;
      await render(
        <template>
          <Slider
            @value={{state.value}}
            @mapping={{state.mapping}}
            @label="frequency"
            @onChange={{state.change}}
          />
        </template>,
      );

      const slider = '[data-test-slider]';
      assert.dom(slider).hasAttribute('role', 'slider');
      assert.dom(slider).hasAttribute('tabindex', '0');
      assert.dom(slider).hasAria('label', 'frequency');
      assert.dom(slider).hasAria('orientation', 'horizontal');
      assert.dom(slider).hasAria('valuemin', '20');
      assert.dom(slider).hasAria('valuemax', '20000');
      assert.dom(slider).hasAria('valuenow', '2000');
      assert.dom(slider).hasAria('valuetext', '2 kHz');
      assert.dom(`${slider} input`).doesNotExist('no native range input');
      assert.strictEqual(
        Number(styleOf(slider).getPropertyValue('--pos')).toFixed(3),
        (2 / 3).toFixed(3),
        'the handle is two thirds along: two of three decades',
      );
    });

    test('pressing the track goes there, and dragging follows the pointer', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';

      await triggerEvent(slider, 'pointerdown', at(slider, 0.25));
      assert.strictEqual(
        Math.round(state.value),
        25,
        'a mouse press goes there at once',
      );
      await triggerEvent(slider, 'pointermove', at(slider, 0.8));
      assert.strictEqual(Math.round(state.value), 80);
      await triggerEvent(slider, 'pointermove', at(slider, 1.4));
      assert.strictEqual(state.value, 100, 'held at the end of the travel');
      await triggerEvent(slider, 'pointerup', at(slider, 1.4));

      await triggerEvent(slider, 'pointermove', at(slider, 0.1));
      assert.strictEqual(
        state.value,
        100,
        'after the pointer is up, moving does nothing',
      );
      assert.dom(slider).hasAria('valuenow', '100');
    });

    test('a drag that leaves the control keeps following the pointer, and a release anywhere lets go', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';
      const elsewhere = document.body;

      await triggerEvent(slider, 'pointerdown', at(slider, 0.25));
      // off the control: the events arrive somewhere else on the page
      await triggerEvent(
        elsewhere,
        'pointermove',
        at(slider, 0.6, { dy: 300 }),
      );
      assert.strictEqual(
        Math.round(state.value),
        60,
        'far below it, it still follows',
      );
      await triggerEvent(elsewhere, 'pointermove', at(slider, 3, { dy: -500 }));
      assert.strictEqual(state.value, 100, 'past the end: held at the end');
      await triggerEvent(elsewhere, 'pointermove', at(slider, -2, { dy: 80 }));
      assert.strictEqual(state.value, 0, 'before the start: held at the start');
      await triggerEvent(elsewhere, 'pointermove', at(slider, 0.4, { dy: 80 }));
      assert.strictEqual(Math.round(state.value), 40);

      await triggerEvent(elsewhere, 'pointerup', at(slider, 0.4, { dy: 80 }));
      await triggerEvent(slider, 'pointermove', at(slider, 0.9));
      await triggerEvent(elsewhere, 'pointermove', at(slider, 0.1));
      assert.strictEqual(
        Math.round(state.value),
        40,
        'released outside the control: it has let go',
      );

      // and it can be picked up again
      await triggerEvent(slider, 'pointerdown', at(slider, 0.7));
      assert.strictEqual(Math.round(state.value), 70);
      await triggerEvent(slider, 'pointerup', at(slider, 0.7));
    });

    test('it lets go when the pointer is cancelled or lost, a second finger arrives, the window loses focus, or the button turns out to be up', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';
      const endings: Record<string, () => Promise<unknown>> = {
        'pointercancel away from the control': () =>
          triggerEvent(document.body, 'pointercancel', at(slider, 0.2)),
        'losing pointer capture': () =>
          triggerEvent(slider, 'lostpointercapture', at(slider, 0.2)),
        'a second finger anywhere': () =>
          triggerEvent(document.body, 'pointerdown', {
            ...at(slider, 0.5, { pointerType: 'touch' }),
            pointerId: 2,
            isPrimary: false,
          }),
        'the window losing focus': async () => {
          window.dispatchEvent(new Event('blur'));
          await settled();
        },
        'a mouse moving with no button down': () =>
          triggerEvent(document.body, 'pointermove', {
            ...at(slider, 0.5),
            buttons: 0,
          }),
      };
      for (const [what, end] of Object.entries(endings)) {
        await triggerEvent(slider, 'pointerdown', at(slider, 0.2));
        await triggerEvent(slider, 'pointermove', at(slider, 0.3));
        assert.strictEqual(Math.round(state.value), 30, `${what}: dragging`);
        await end();
        await triggerEvent(slider, 'pointermove', at(slider, 0.9));
        await triggerEvent(document.body, 'pointermove', at(slider, 0.8));
        assert.strictEqual(
          Math.round(state.value),
          30,
          `${what}: let go, and stays where it was`,
        );
        await triggerEvent(slider, 'pointerup', at(slider, 0.9));
        assert.strictEqual(
          Math.round(state.value),
          30,
          `${what}: a late release does nothing`,
        );
      }
    });

    test('a mouse: holding the handle still is not a long press, and two short drags are not a double click', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
              @onReset={{state.reset}}
              @onMenu={{state.menu}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';

      await triggerEvent(slider, 'pointerdown', at(slider, 0.5));
      await new Promise((resolve) => setTimeout(resolve, 650));
      assert.strictEqual(
        state.menus,
        0,
        'no menu: a mouse has a button for that',
      );
      await triggerEvent(slider, 'pointermove', at(slider, 0.6));
      assert.strictEqual(
        Math.round(state.value),
        60,
        'and the drag goes on after the wait',
      );
      await triggerEvent(slider, 'pointerup', at(slider, 0.6));

      await triggerEvent(slider, 'pointerdown', at(slider, 0.6));
      await triggerEvent(slider, 'pointermove', at(slider, 0.7));
      await triggerEvent(slider, 'pointerup', at(slider, 0.7));
      assert.strictEqual(
        state.resets,
        0,
        'two small adjustments in a row are not a reset',
      );
      assert.strictEqual(Math.round(state.value), 70);
    });

    test('Shift drags finely', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';

      await triggerEvent(
        slider,
        'pointerdown',
        at(slider, 0.9, { shiftKey: true }),
      );
      assert.strictEqual(state.value, 50, 'with Shift the press does not jump');
      await triggerEvent(
        slider,
        'pointermove',
        at(slider, 1, { shiftKey: true, dx: 0 }),
      );
      // the pointer moved a tenth of the track; the value moves a tenth of that
      assert.true(
        Math.abs(state.value - 51) < 0.01,
        `a tenth of the distance (${state.value})`,
      );
      await triggerEvent(
        slider,
        'pointerup',
        at(slider, 1, { shiftKey: true }),
      );
    });

    test('a finger: a tap goes there, a drag moves it, and a scroll the browser takes leaves it alone', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';
      const touch = { pointerType: 'touch' };

      await triggerEvent(slider, 'pointerdown', at(slider, 0.2, touch));
      assert.strictEqual(
        state.value,
        50,
        'a finger going down does not move it yet',
      );
      await triggerEvent(slider, 'pointerup', at(slider, 0.2, touch));
      assert.strictEqual(Math.round(state.value), 20, 'the tap does');

      await triggerEvent(slider, 'pointerdown', at(slider, 0.2, touch));
      await triggerEvent(slider, 'pointermove', at(slider, 0.21, touch));
      assert.strictEqual(Math.round(state.value), 20, 'a wobble is not a drag');
      await triggerEvent(slider, 'pointermove', at(slider, 0.6, touch));
      assert.strictEqual(Math.round(state.value), 60);
      await triggerEvent(slider, 'pointerup', at(slider, 0.6, touch));

      await triggerEvent(slider, 'pointerdown', at(slider, 0.9, touch));
      await triggerEvent(
        slider,
        'pointercancel',
        at(slider, 0.9, { ...touch, dy: 80 }),
      );
      assert.strictEqual(
        Math.round(state.value),
        60,
        'a gesture the browser took for a scroll changes nothing',
      );
      assert.strictEqual(
        getComputedStyle(find(slider)!).touchAction,
        'pan-y',
        'a drag across it still scrolls the pane',
      );

      // a finger that sets off across the slider is left alone, even where nothing can scroll
      await triggerEvent(slider, 'pointerdown', at(slider, 0.9, touch));
      await triggerEvent(
        slider,
        'pointermove',
        at(slider, 0.92, { ...touch, dy: -30 }),
      );
      await triggerEvent(
        slider,
        'pointermove',
        at(slider, 0.95, { ...touch, dy: -60 }),
      );
      await triggerEvent(
        slider,
        'pointerup',
        at(slider, 0.95, { ...touch, dy: -60 }),
      );
      assert.strictEqual(
        Math.round(state.value),
        60,
        'moving up over a horizontal slider does not move it',
      );
    });

    test('a double tap resets, and a long press or right click opens the menu', async function (assert) {
      const state = new State();
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="width: 216px"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="amount"
              @onChange={{state.change}}
              @onReset={{state.reset}}
              @onMenu={{state.menu}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';
      const touch = { pointerType: 'touch' };

      await triggerEvent(slider, 'pointerdown', at(slider, 0.3, touch));
      await triggerEvent(slider, 'pointerup', at(slider, 0.3, touch));
      assert.strictEqual(state.resets, 0);
      await triggerEvent(slider, 'pointerdown', at(slider, 0.3, touch));
      await triggerEvent(slider, 'pointerup', at(slider, 0.3, touch));
      assert.strictEqual(state.resets, 1, 'two taps close together');

      await triggerEvent(slider, 'contextmenu');
      assert.strictEqual(state.menus, 1, 'right click');

      await triggerEvent(slider, 'pointerdown', at(slider, 0.7, touch));
      await new Promise((resolve) => setTimeout(resolve, 650));
      assert.strictEqual(state.menus, 2, 'a long press');
      await triggerEvent(slider, 'pointerup', at(slider, 0.7, touch));

      assert.strictEqual(
        Math.round(state.value),
        30,
        'and it did not move the slider',
      );
    });

    test('the keyboard: arrows, Page Up and Down, Home and End', async function (assert) {
      const state = new State();
      await render(
        <template>
          <Slider
            @value={{state.value}}
            @mapping={{state.mapping}}
            @label="amount"
            @onChange={{state.change}}
          />
        </template>,
      );
      const slider = '[data-test-slider]';
      await focus(slider);

      await triggerKeyEvent(slider, 'keydown', 'ArrowRight');
      assert.strictEqual(Math.round(state.value), 51);
      await triggerKeyEvent(slider, 'keydown', 'ArrowUp');
      assert.strictEqual(Math.round(state.value), 52);
      await triggerKeyEvent(slider, 'keydown', 'ArrowLeft');
      await triggerKeyEvent(slider, 'keydown', 'ArrowDown');
      assert.strictEqual(Math.round(state.value), 50);
      await triggerKeyEvent(slider, 'keydown', 'ArrowRight', {
        shiftKey: true,
      });
      assert.true(
        Math.abs(state.value - 50.1) < 1e-6,
        'Shift moves a tenth as far',
      );
      await triggerKeyEvent(slider, 'keydown', 'PageUp');
      assert.true(Math.abs(state.value - 60.1) < 1e-6);
      await triggerKeyEvent(slider, 'keydown', 'PageDown');
      await triggerKeyEvent(slider, 'keydown', 'Home');
      assert.strictEqual(state.value, 0);
      await triggerKeyEvent(slider, 'keydown', 'End');
      assert.strictEqual(state.value, 100);
      await triggerKeyEvent(slider, 'keydown', 'A');
      assert.strictEqual(state.value, 100, 'other keys are left alone');
    });

    test('modes change how it travels and what it says, not the value', async function (assert) {
      const state = new State();
      state.value = 440;
      state.mapping = mapping('note', { min: 20, max: 20000, unit: 'hz' });
      await render(
        <template>
          <Slider
            @value={{state.value}}
            @mapping={{state.mapping}}
            @label="frequency"
            @onChange={{state.change}}
          />
        </template>,
      );
      const slider = '[data-test-slider]';
      assert.dom(slider).hasAria('valuetext', 'A4');
      assert.dom(slider).hasAria('valuenow', '440');

      await focus(slider);
      await triggerKeyEvent(slider, 'keydown', 'ArrowRight');
      assert.true(
        Math.abs(state.value - 466.1637615) < 1e-4,
        'one key is one semitone',
      );
      assert.dom(slider).hasAria('valuetext', 'A#4');
      await triggerKeyEvent(slider, 'keydown', 'ArrowRight', {
        shiftKey: true,
      });
      assert
        .dom(slider)
        .hasAria('valuetext', 'B4', 'Shift does not split a semitone');

      state.mapping = mapping('exponential', {
        min: 20,
        max: 20000,
        unit: 'hz',
      });
      await rerender();
      assert
        .dom(slider)
        .hasAria('valuetext', '494 Hz', 'the same value, said another way');
    });

    test('it shows where the parameter really is when code has moved it', async function (assert) {
      const state = new State();
      await render(
        <template>
          <Slider
            @value={{state.value}}
            @mapping={{state.mapping}}
            @label="amount"
            @effective={{state.effective}}
            @onChange={{state.change}}
          />
        </template>,
      );
      assert.dom('[data-test-effective]').doesNotExist();

      state.effective = 0;
      await rerender();
      assert.dom('[data-test-effective]').exists('even at the very bottom');
      assert.strictEqual(
        styleOf('[data-test-slider]').getPropertyValue('--effective'),
        '0',
      );
      assert.dom('[data-test-slider]').hasAria('valuetext', '50, now at 0');
      assert.strictEqual(
        styleOf('[data-test-slider]').getPropertyValue('--pos'),
        '0.5',
        'the handle stays',
      );
    });

    test('a range centred on zero fills from the centre; vertical works the other axis', async function (assert) {
      const state = new State();
      state.value = -0.5;
      state.mapping = mapping('linear', { min: -1, max: 1 });
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          {{! the test gives the control a known size }}
          <div style="height: 216px; display: flex"><Slider
              @value={{state.value}}
              @mapping={{state.mapping}}
              @label="pan"
              @orientation="vertical"
              @onChange={{state.change}}
            /></div>
        </template>,
      );
      const slider = '[data-test-slider]';
      const style = styleOf(slider);
      assert.strictEqual(style.getPropertyValue('--fill-start'), '0.25');
      assert.strictEqual(
        style.getPropertyValue('--fill-size'),
        '0.25',
        'from the handle to the centre',
      );
      assert.dom(slider).hasAria('orientation', 'vertical');

      await triggerEvent(
        slider,
        'pointerdown',
        at(slider, 0.75, { vertical: true }),
      );
      assert.true(
        Math.abs(state.value - 0.5) < 0.02,
        `up is more (${state.value})`,
      );
      await triggerEvent(
        slider,
        'pointerup',
        at(slider, 0.75, { vertical: true }),
      );
    });
  });

  module('knob', function () {
    test('it is an ARIA slider, turned by dragging up or right, with the same keys', async function (assert) {
      const state = new State();
      await render(
        <template>
          <Knob
            @value={{state.value}}
            @mapping={{state.mapping}}
            @label="level"
            @onChange={{state.change}}
            @onReset={{state.reset}}
          />
        </template>,
      );
      const knob = '[data-test-knob]';
      assert.dom(knob).hasAttribute('role', 'slider');
      assert.dom(knob).hasAria('valuenow', '50');
      assert.dom(knob).hasAria('valuetext', '50');

      const down = {
        pointerId: 1,
        button: 0,
        buttons: 1,
        pointerType: 'mouse',
        clientX: 100,
        clientY: 300,
      };
      await triggerEvent(knob, 'pointerdown', down);
      assert.strictEqual(state.value, 50, 'pressing a knob does not jump');
      await triggerEvent(knob, 'pointermove', { ...down, clientY: 260 });
      assert.strictEqual(
        state.value,
        75,
        '40px up of a 160px travel is a quarter',
      );
      await triggerEvent(knob, 'pointermove', {
        ...down,
        clientY: 260,
        clientX: 116,
        shiftKey: true,
      });
      assert.strictEqual(state.value, 76, 'Shift: a tenth as far');
      // off the knob, and released there
      await triggerEvent(document.body, 'pointermove', {
        ...down,
        clientY: 250,
        clientX: 116,
      });
      assert.true(state.value > 76, 'it follows the pointer off the knob');
      const there = state.value;
      await triggerEvent(document.body, 'pointerup', { ...down, clientY: 250 });
      await triggerEvent(knob, 'pointermove', { ...down, clientY: 100 });
      assert.strictEqual(
        state.value,
        there,
        'released off the knob: it has let go',
      );
      state.value = 76;
      await rerender();

      await focus(knob);
      await triggerKeyEvent(knob, 'keydown', 'ArrowDown');
      assert.strictEqual(Math.round(state.value), 75);
      await triggerKeyEvent(knob, 'keydown', 'Home');
      assert.strictEqual(state.value, 0);
      assert.strictEqual(getComputedStyle(find(knob)!).touchAction, 'none');
    });
  });

  module('toggle', function () {
    test('it is a switch', async function (assert) {
      const state = new State();
      await render(
        <template>
          <Toggle
            @checked={{state.checked}}
            @label="loop"
            @onChange={{state.check}}
          />
        </template>,
      );
      const toggle = '[data-test-toggle]';
      assert.dom(toggle).hasAttribute('role', 'switch');
      assert.dom(toggle).hasAria('checked', 'false');
      assert.dom(toggle).hasAria('label', 'loop');
      assert.dom(`${toggle} .toggle__text`).hasText('off');
      assert.dom(`${toggle} .toggle__mark`).hasText('O');
      const handle = (): { left: number; track: DOMRect; colour: string } => {
        const track = find(`${toggle} .toggle__track`)!;
        return {
          left: find(`${toggle} .toggle__handle`)!.getBoundingClientRect().left,
          track: track.getBoundingClientRect(),
          colour: getComputedStyle(track).backgroundColor,
        };
      };
      const off = handle();
      assert.true(
        off.left - off.track.left < 4,
        'off: the square is at the left',
      );

      await click(toggle);
      assert.true(state.checked);
      assert.dom(toggle).hasAria('checked', 'true');
      assert.dom(`${toggle} .toggle__text`).hasText('on');
      assert.dom(`${toggle} .toggle__mark`).hasText('I');
      await new Promise((resolve) => setTimeout(resolve, 150)); // (it slides)
      const on = handle();
      assert.true(
        on.left - on.track.left > on.track.width / 2 - 4,
        `on: the square has moved to the right (${on.left - on.track.left}px of ${on.track.width})`,
      );
      assert.notStrictEqual(
        on.colour,
        off.colour,
        'and the track has changed colour',
      );
      assert.strictEqual(
        getComputedStyle(find(`${toggle} .toggle__handle`)!).backgroundColor,
        'rgb(51, 51, 51)',
        'the square itself is the same dark square either way',
      );
    });
  });

  module('number entry', function () {
    test('press the number to type a value; Enter commits, Escape gives up, nonsense is refused', async function (assert) {
      const state = new State();
      const frequency = mapping('exponential', {
        min: 20,
        max: 20000,
        unit: 'hz',
      });
      state.value = 2000;
      const text = (): string => frequency.format(state.value);
      const commit = (typed: string): boolean => {
        const value = frequency.parse(typed);
        if (value === null) return false;
        state.value = value;
        return true;
      };
      await render(
        <template>
          <NumberEntry
            @text={{(text)}}
            @label="frequency"
            @onCommit={{commit}}
          />
        </template>,
      );

      assert.dom('[data-test-number-entry]').hasText('2 kHz');
      assert
        .dom('[data-test-number-entry]')
        .hasAria('label', 'frequency: 2 kHz. Type a value');
      await click('[data-test-number-entry]');
      assert.dom('[data-test-number-input]').isFocused();
      assert.dom('[data-test-number-input]').hasValue('2 kHz');

      await fillIn('[data-test-number-input]', '440');
      await triggerKeyEvent('[data-test-number-input]', 'keydown', 'Enter');
      assert.strictEqual(state.value, 440);
      assert.dom('[data-test-number-entry]').hasText('440 Hz');

      await click('[data-test-number-entry]');
      await fillIn('[data-test-number-input]', 'loud');
      await triggerKeyEvent('[data-test-number-input]', 'keydown', 'Enter');
      assert
        .dom('[data-test-number-input]')
        .hasAria('invalid', 'true', 'what cannot be read is not taken');
      assert.strictEqual(state.value, 440);
      await triggerKeyEvent('[data-test-number-input]', 'keydown', 'Escape');
      assert.dom('[data-test-number-entry]').hasText('440 Hz');

      await click('[data-test-number-entry]');
      await fillIn('[data-test-number-input]', '99999');
      await triggerEvent('[data-test-number-input]', 'blur');
      assert.strictEqual(
        state.value,
        20000,
        'leaving the field commits, held inside the range',
      );
    });
  });

  module('popup menu', function () {
    test('it opens from its button, is worked with the keyboard, and closes on Escape or a press outside', async function (assert) {
      const state = new State();
      const items: MenuItem[] = [
        {
          label: 'Linear',
          checked: false,
          onSelect: () => state.chosen.push('linear'),
        },
        {
          label: 'Exponential',
          checked: true,
          onSelect: () => state.chosen.push('exponential'),
        },
        {
          label: 'Reset',
          separated: true,
          onSelect: () => state.chosen.push('reset'),
        },
        {
          label: 'Learn MIDI (coming)',
          disabled: true,
          onSelect: () => state.chosen.push('midi'),
        },
      ];
      await render(
        <template>
          <button type="button" id="elsewhere">elsewhere</button>
          <PopupMenu
            @label="frequency menu"
            @items={{items}}
            @open={{state.open}}
            @onOpenChange={{state.setOpen}}
          />
        </template>,
      );
      // (not called `button`: a template tag that matches a name in scope is taken to be that value)
      const trigger = '[data-test-menu-button]';
      assert.dom(trigger).hasAria('haspopup', 'menu');
      assert.dom(trigger).hasAria('expanded', 'false');
      assert.dom(trigger).hasAria('label', 'frequency menu');
      assert.dom('[data-test-menu]').doesNotExist();

      await click(trigger);
      assert.dom(trigger).hasAria('expanded', 'true');
      assert.dom('[data-test-menu]').hasAttribute('role', 'menu');
      assert
        .dom('[data-test-menu-item="Exponential"]')
        .hasAttribute('role', 'menuitemradio');
      assert
        .dom('[data-test-menu-item="Exponential"]')
        .hasAria('checked', 'true');
      assert.dom('[data-test-menu-item="Linear"]').hasAria('checked', 'false');
      assert
        .dom('[data-test-menu-item="Reset"]')
        .hasAttribute('role', 'menuitem');
      assert
        .dom('[data-test-menu-item="Learn MIDI (coming)"]')
        .hasAria('disabled', 'true');
      assert
        .dom('[data-test-menu-item="Exponential"]')
        .isFocused('focus goes to the chosen item');

      await triggerKeyEvent('[data-test-menu]', 'keydown', 'ArrowDown');
      assert.dom('[data-test-menu-item="Reset"]').isFocused();
      await triggerKeyEvent('[data-test-menu]', 'keydown', 'ArrowDown');
      assert
        .dom('[data-test-menu-item="Linear"]')
        .isFocused('it skips what cannot be chosen, and wraps');
      await triggerKeyEvent('[data-test-menu]', 'keydown', 'End');
      assert.dom('[data-test-menu-item="Reset"]').isFocused();

      await triggerKeyEvent('[data-test-menu]', 'keydown', 'Escape');
      assert.dom('[data-test-menu]').doesNotExist();
      assert.dom(trigger).isFocused('focus returns to the button');

      await click(trigger);
      await click('[data-test-menu-item="Learn MIDI (coming)"]');
      assert.dom('[data-test-menu]').exists('a disabled item does nothing');
      await click('[data-test-menu-item="Linear"]');
      assert.deepEqual(state.chosen, ['linear']);
      assert.dom('[data-test-menu]').doesNotExist('choosing closes it');

      state.open = true; // its owner opens it (a long press on the control)
      await rerender();
      assert.dom('[data-test-menu]').exists();
      await triggerEvent('#elsewhere', 'pointerdown');
      assert.dom('[data-test-menu]').doesNotExist('a press outside closes it');
    });
  });
});
