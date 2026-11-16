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
import Hint from 'client-v2/components/ui/hint';
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
      assert.dom(`${toggle} .toggle__handle`).hasText('O');
      const handle = (): { left: number; track: DOMRect; colour: string } => {
        const track = find(`${toggle} .toggle__track`)!;
        return {
          left: find(`${toggle} .toggle__handle`)!.getBoundingClientRect().left,
          track: track.getBoundingClientRect(),
          colour: getComputedStyle(find(`${toggle} .toggle__handle`)!)
            .backgroundColor,
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
      assert.dom(`${toggle} .toggle__handle`).hasText('I');
      await new Promise((resolve) => setTimeout(resolve, 150)); // (it slides)
      const on = handle();
      assert.true(
        on.left - on.track.left > on.track.width / 2 - 4,
        `on: the square has moved to the right (${on.left - on.track.left}px of ${on.track.width})`,
      );
      assert.strictEqual(
        on.colour,
        'rgb(48, 231, 255)',
        'on: the square itself is the blue one',
      );
      assert.strictEqual(off.colour, 'rgb(238, 238, 238)', 'off: it is pale');
      assert.strictEqual(
        getComputedStyle(find(`${toggle} .toggle__track`)!).backgroundColor,
        'rgb(51, 51, 51)',
        'the strip behind it is the same either way',
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

  module('hint', function () {
    test('a "?" that opens its hints on a press, and closes on a second, on Escape, or a press elsewhere', async function (assert) {
      await render(
        <template>
          <button type="button" id="elsewhere">elsewhere</button>
          <Hint @label="About this thing">
            <p>What it is for.</p>
          </Hint>
        </template>,
      );
      const opener = '[data-test-hint-button]';
      assert.dom(opener).hasText('?');
      assert.dom(opener).hasAria('label', 'About this thing');
      assert.dom(opener).hasAria('expanded', 'false');
      assert.dom(opener).hasTagName('button', 'reachable by the keyboard');
      assert
        .dom('[data-test-hint]')
        .doesNotExist('nothing is shown until it is asked for');

      await click(opener);
      assert.dom(opener).hasAria('expanded', 'true');
      assert.dom('[data-test-hint]').hasText('What it is for.');
      assert.dom('[data-test-hint]').hasAttribute('role', 'note');
      assert.strictEqual(
        find(opener)!.getAttribute('aria-controls'),
        find('[data-test-hint]')!.id,
      );
      const panel = find('[data-test-hint]')!.getBoundingClientRect();
      assert.true(panel.left >= 0, 'it is inside the screen');
      assert.true(panel.right <= window.innerWidth);
      assert.true(panel.bottom <= window.innerHeight);
      assert.strictEqual(
        getComputedStyle(find('[data-test-hint]')!).borderRadius,
        '0px',
        'square',
      );

      await click(opener);
      assert.dom('[data-test-hint]').doesNotExist('a second press closes it');

      await click(opener);
      await triggerKeyEvent('[data-test-hint]', 'keydown', 'Escape');
      assert.dom('[data-test-hint]').doesNotExist('Escape closes it');
      assert.dom(opener).isFocused('and gives focus back to the button');

      await click(opener);
      await triggerEvent('#elsewhere', 'pointerdown');
      assert
        .dom('[data-test-hint]')
        .doesNotExist('a press elsewhere closes it');

      await triggerEvent(opener, 'mouseenter');
      await triggerEvent(opener, 'pointerenter');
      assert
        .dom('[data-test-hint]')
        .doesNotExist('hovering alone does nothing');
    });
  });

  module('number entry box', function () {
    test('a number with a mapping is also a slider with no track: dragged across, stepped with the arrows, and a click still opens it', async function (assert) {
      const state = new State();
      const gestures: (string | undefined)[] = [];
      const change = (value: number, gesture?: string): void => {
        gestures.push(gesture);
        state.value = value;
      };
      const commit = (): boolean => true;
      const text = (value: number): string => `${Math.round(value)} %`;
      await render(
        <template>
          <NumberEntry
            @text={{text state.value}}
            @label="start"
            @value={{state.value}}
            @mapping={{state.mapping}}
            @onChange={{change}}
            @onCommit={{commit}}
          />
        </template>,
      );
      const entry = '[data-test-number-entry]';
      const rect = find(entry)!.getBoundingClientRect();
      const point = (dx: number, more: object = {}) => ({
        pointerId: 1,
        button: 0,
        buttons: 1,
        isPrimary: true,
        pointerType: 'mouse',
        clientX: rect.left + rect.width / 2 + dx,
        clientY: rect.top + rect.height / 2,
        ...more,
      });
      assert.dom(entry).hasClass('number-entry--drag');

      // a click that wobbles: nothing moves, and the field opens with its text selected
      await triggerEvent(entry, 'pointerdown', point(0));
      await triggerEvent(entry, 'pointermove', point(3));
      await triggerEvent(entry, 'pointerup', point(3));
      await click(entry);
      assert.strictEqual(state.value, 50, 'a click moves nothing');
      const field = find('[data-test-number-input]') as HTMLInputElement;
      assert.strictEqual(
        `${field.selectionStart}-${field.selectionEnd}`,
        `0-${field.value.length}`,
        'and opens the field, its text selected',
      );
      await triggerKeyEvent(field, 'keydown', 'Escape');

      // a drag: 200 px is the whole range; it goes on outside the box, and ends where it is let go
      await triggerEvent(entry, 'pointerdown', point(0));
      await triggerEvent(entry, 'pointermove', point(5));
      await triggerEvent(document.body, 'pointermove', point(40));
      assert.strictEqual(
        state.value,
        70,
        '40 px of the 200 that are the range',
      );
      await triggerEvent(document.body, 'pointermove', point(-600));
      assert.strictEqual(state.value, 0, 'held at the end of the range');
      await triggerEvent(document.body, 'pointermove', point(-600 + 60));
      assert.strictEqual(state.value, 30);
      await triggerEvent(
        document.body,
        'pointermove',
        point(-600 + 60 + 100, { shiftKey: true }),
      );
      assert.strictEqual(state.value, 35, 'Shift: a tenth as fast');
      await triggerEvent(document.body, 'pointerup', point(-440));
      await triggerEvent(
        document.body,
        'pointermove',
        point(0, { buttons: 0 }),
      );
      assert.strictEqual(state.value, 35, 'let go outside the box: it is over');
      assert.strictEqual(
        new Set(gestures).size,
        1,
        'every change of the drag names the one gesture',
      );
      assert.strictEqual(typeof gestures[0], 'string');
      await click(entry); // (the click a browser sends as a drag ends on the box)
      assert
        .dom('[data-test-number-input]')
        .doesNotExist('a drag does not open the field');
      await click(entry);
      assert.dom('[data-test-number-input]').exists('the next click does');
      await triggerKeyEvent('[data-test-number-input]', 'keydown', 'Escape');

      // a finger that sets off up or down is scrolling
      const touch = { pointerType: 'touch' };
      await triggerEvent(entry, 'pointerdown', point(0, touch));
      await triggerEvent(
        entry,
        'pointermove',
        point(2, { ...touch, clientY: rect.top + 40 }),
      );
      await triggerEvent(document.body, 'pointermove', point(80, touch));
      await triggerEvent(document.body, 'pointerup', point(80, touch));
      assert.strictEqual(state.value, 35, 'not a drag of the number');
      await triggerEvent(entry, 'pointerdown', point(0, touch));
      await triggerEvent(entry, 'pointermove', point(10, touch));
      await triggerEvent(document.body, 'pointermove', point(30, touch));
      await triggerEvent(document.body, 'pointerup', point(30, touch));
      assert.strictEqual(
        Math.round(state.value),
        50,
        'across, a finger drags it',
      );

      // the keys of a slider
      gestures.length = 0;
      await triggerKeyEvent(entry, 'keydown', 'ArrowUp');
      assert.true(state.value > 50.5, 'arrow up steps it up');
      const stepped = state.value;
      await triggerKeyEvent(entry, 'keydown', 'ArrowDown', { shiftKey: true });
      assert.true(state.value < stepped, 'arrow down steps it down');
      assert.true(
        stepped - state.value < (stepped - 50) / 2,
        'Shift steps finer',
      );
      assert.deepEqual(gestures, [undefined, undefined]);
    });

    test('a number with no mapping, or a disabled one, is not dragged', async function (assert) {
      const state = new State();
      const commit = (): boolean => true;
      await render(
        <template>
          <NumberEntry @text="120" @label="plain" @onCommit={{commit}} />
          <NumberEntry
            @text="50"
            @label="off"
            @disabled={{true}}
            @value={{state.value}}
            @mapping={{state.mapping}}
            @onChange={{state.change}}
            @onCommit={{commit}}
          />
        </template>,
      );
      assert.dom('.number-entry--drag').doesNotExist();
    });

    test('while a value is typed the field is the person’s: a change to the value it shows does not write into it', async function (assert) {
      const state = new State();
      const commits: string[] = [];
      const commit = (text: string): boolean => {
        commits.push(text);
        return true;
      };
      const text = (value: number): string => `${value} Hz`;
      await render(
        <template>
          <NumberEntry
            @text={{text state.value}}
            @label="frequency"
            @onCommit={{commit}}
          />
        </template>,
      );
      await click('[data-test-number-entry]');
      const field = find('[data-test-number-input]') as HTMLInputElement;
      assert.strictEqual(field.value, '50 Hz', 'it opens on the value');
      // Backspace to empty, the value changing under it (a script moving the parameter as it plays)
      for (const [typed, moved] of [
        ['50 H', 51],
        ['5', 52],
        ['', 53],
        ['4', 54],
        ['44', 55],
      ] as const) {
        field.value = typed;
        await triggerEvent(field, 'input');
        state.value = moved;
        await settled();
        assert.strictEqual(
          field.value,
          typed,
          `"${typed}" stays "${typed}" when the value becomes ${moved}`,
        );
        assert.strictEqual(
          find('[data-test-number-input]'),
          field,
          'and it is the same field',
        );
      }
      await triggerKeyEvent(field, 'keydown', 'Enter');
      assert.deepEqual(
        commits,
        ['44'],
        'what was typed is what is committed, once',
      );
      assert
        .dom('[data-test-number-entry]')
        .hasText('55 Hz', 'closed, it shows the value again');
    });

    test('the field a value is typed in takes exactly the readout’s box, whatever is typed', async function (assert) {
      const state = new State();
      const commit = (): boolean => true;
      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          <div style="display: flex; gap: 4px; width: 320px">
            <span id="before">before</span>
            <NumberEntry
              @text="2 kHz"
              @label="frequency"
              @onCommit={{commit}}
            />
            <span id="after">after</span>
          </div>
          <span hidden>{{state.value}}</span>
        </template>,
      );
      const box = (selector: string): string => {
        const rect = find(selector)!.getBoundingClientRect();
        return [rect.left, rect.top, rect.width, rect.height]
          .map((n) => n.toFixed(2))
          .join(' ');
      };
      const before = {
        entry: box('.number-entry-box'),
        next: box('#after'),
        prev: box('#before'),
      };
      assert.strictEqual(
        box('[data-test-number-entry]'),
        before.entry,
        'the readout fills its box',
      );

      await click('[data-test-number-entry]');
      assert.dom('[data-test-number-input]').isFocused();
      assert.deepEqual(
        {
          entry: box('.number-entry-box'),
          next: box('#after'),
          prev: box('#before'),
        },
        before,
        'focused: the same box, the same neighbours',
      );
      assert.strictEqual(
        box('[data-test-number-input]'),
        before.entry,
        'the field is laid exactly over it',
      );
      await fillIn('[data-test-number-input]', '123456.789012345 kHz and more');
      assert.deepEqual(
        {
          entry: box('.number-entry-box'),
          next: box('#after'),
          prev: box('#before'),
        },
        before,
        'a long value does not widen it',
      );
      await triggerKeyEvent('[data-test-number-input]', 'keydown', 'Escape');
      assert.deepEqual(
        {
          entry: box('.number-entry-box'),
          next: box('#after'),
          prev: box('#before'),
        },
        before,
      );
    });
  });
});
