import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import cssVars from 'client-v2/modifiers/css-vars';
import { ControlGesture, positionForKey } from 'client-v2/controls/gesture';
import type { Mapping } from 'client-v2/controls/modes';

/** Half the handle's length along the track, in px: the travel stops this far from each end. */
const INSET = 8;

export interface SliderSignature {
  Element: HTMLDivElement;
  Args: {
    /** the value, in the parameter's own unit */
    value: number;
    /** how the travel maps to values, and how a value is said (see controls/modes.ts) */
    mapping: Mapping;
    label: string;
    /** where the parameter really is, when code has moved it away from `value` */
    effective?: number | null;
    orientation?: 'horizontal' | 'vertical';
    onChange: (value: number) => void;
    /** double click or double tap */
    onReset?: () => void;
    /** long press or right click */
    onMenu?: () => void;
  };
}

/**
 * A slider, drawn by the app (no native range input): a track, a fill from the minimum (or from the
 * centre, for a range centred on zero), the handle, and a marker for where the parameter really is when
 * that differs. Pointer events with capture, so it works the same with a mouse, a finger and a pen;
 * Shift drags finely; the keys are an ARIA slider's.
 */
export default class Slider extends Component<SliderSignature> {
  get vertical(): boolean {
    return this.args.orientation === 'vertical';
  }

  get position(): number {
    return this.args.mapping.toPosition(this.args.value);
  }

  get fillFrom(): number {
    return this.args.mapping.bipolar ? 0.5 : 0;
  }

  get fillStart(): number {
    return Math.min(this.fillFrom, this.position);
  }

  get fillSize(): number {
    return Math.abs(this.position - this.fillFrom);
  }

  get effectivePosition(): number | undefined {
    const effective = this.args.effective;
    return effective === null || effective === undefined
      ? undefined
      : this.args.mapping.toPosition(effective);
  }

  get hasEffective(): boolean {
    return this.effectivePosition !== undefined;
  }

  get min(): number {
    return this.args.mapping.toValue(0);
  }

  get max(): number {
    return this.args.mapping.toValue(1);
  }

  get valueText(): string {
    const text = this.args.mapping.format(this.args.value);
    const effective = this.args.effective;
    return effective === null || effective === undefined
      ? text
      : `${text}, now at ${this.args.mapping.format(effective)}`;
  }

  #setPosition = (position: number): void => {
    const value = this.args.mapping.toValue(position);
    if (value !== this.args.value) this.args.onChange(value);
  };

  gesture = new ControlGesture({
    position: () => this.position,
    axis: () => (this.vertical ? 'y' : 'x'),
    positionAt: (event) => {
      const rect = (event.currentTarget as Element).getBoundingClientRect();
      return this.vertical
        ? 1 - (event.clientY - rect.top - INSET) / (rect.height - 2 * INSET)
        : (event.clientX - rect.left - INSET) / (rect.width - 2 * INSET);
    },
    travel: (event, from) => {
      const rect = (event.currentTarget as Element).getBoundingClientRect();
      return this.vertical
        ? (from.clientY - event.clientY) / (rect.height - 2 * INSET)
        : (event.clientX - from.clientX) / (rect.width - 2 * INSET);
    },
    onPosition: this.#setPosition,
    onReset: () => this.args.onReset?.(),
    onMenu: () => this.args.onMenu?.(),
  });

  onKeydown = (event: KeyboardEvent): void => {
    const next = positionForKey(event, this.position, this.args.mapping);
    if (next === null) return;
    event.preventDefault();
    this.#setPosition(next);
  };

  <template>
    {{! template-lint-disable no-pointer-down-event-binding }}
    {{! a drag has to begin when the pointer goes down }}
    <div
      class="slider {{if this.vertical 'slider--vertical'}}"
      role="slider"
      tabindex="0"
      aria-label={{@label}}
      aria-orientation={{if this.vertical "vertical" "horizontal"}}
      aria-valuemin={{this.min}}
      aria-valuemax={{this.max}}
      aria-valuenow={{@value}}
      aria-valuetext={{this.valueText}}
      data-test-slider
      ...attributes
      {{cssVars
        pos=this.position
        fill-start=this.fillStart
        fill-size=this.fillSize
        effective=this.effectivePosition
      }}
      {{on "pointerdown" this.gesture.down}}
      {{on "pointermove" this.gesture.move}}
      {{on "pointerup" this.gesture.up}}
      {{on "pointercancel" this.gesture.cancel}}
      {{on "contextmenu" this.gesture.contextMenu}}
      {{on "keydown" this.onKeydown}}
    >
      <span class="slider__track"></span>
      <span class="slider__fill"></span>
      {{#if this.hasEffective}}
        <span class="slider__effective" data-test-effective></span>
      {{/if}}
      <span class="slider__handle"></span>
    </div>
  </template>
}
