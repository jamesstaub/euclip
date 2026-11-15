import Component from '@glimmer/component';
import { on } from '@ember/modifier';
import { ControlGesture, positionForKey } from 'client-v2/controls/gesture';
import type { Mapping } from 'client-v2/controls/modes';

/** How far the pointer travels, in px, for the whole of the knob's range. */
const TRAVEL_PX = 160;
/** The dial runs from 7 o'clock to 5 o'clock: 270 degrees. */
const START = -135;
const SWEEP = 270;
const RADIUS = 16;
const CENTRE = 20;

function point(position: number, radius: number): string {
  const angle = ((START + SWEEP * position - 90) * Math.PI) / 180;
  const x = CENTRE + radius * Math.cos(angle);
  const y = CENTRE + radius * Math.sin(angle);
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

function arc(from: number, to: number): string {
  const [a, b] = from <= to ? [from, to] : [to, from];
  if (b - a < 1e-4) return '';
  const large = (b - a) * SWEEP > 180 ? 1 : 0;
  return `M ${point(a, RADIUS)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${point(b, RADIUS)}`;
}

export interface KnobSignature {
  Element: HTMLDivElement;
  Args: {
    value: number;
    mapping: Mapping;
    label: string;
    effective?: number | null;
    onChange: (value: number) => void;
    onReset?: () => void;
    onMenu?: () => void;
  };
}

/**
 * A knob: the same control as the slider, drawn as a dial and moved by dragging up and down (or along).
 * An arc fills from the minimum (or from the centre, for a range centred on zero), a line points at the
 * value, and a second mark shows where the parameter really is when that differs.
 */
export default class Knob extends Component<KnobSignature> {
  get position(): number {
    return this.args.mapping.toPosition(this.args.value);
  }

  get trackPath(): string {
    return arc(0, 1);
  }

  get fillPath(): string {
    return arc(this.args.mapping.bipolar ? 0.5 : 0, this.position);
  }

  get pointerPath(): string {
    return `M ${point(this.position, 7)} L ${point(this.position, RADIUS + 2)}`;
  }

  get effectivePath(): string | undefined {
    const effective = this.args.effective;
    if (effective === null || effective === undefined) return undefined;
    const position = this.args.mapping.toPosition(effective);
    return `M ${point(position, RADIUS - 3)} L ${point(position, RADIUS + 3)}`;
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
    // up or to the right turns it up
    travel: (event, from) =>
      (from.clientY - event.clientY + (event.clientX - from.clientX)) /
      TRAVEL_PX,
    onPosition: this.#setPosition,
    onReset: () => this.args.onReset?.(),
    onMenu: () => this.args.onMenu?.(),
  });

  willDestroy(): void {
    super.willDestroy();
    this.gesture.release();
  }

  onKeydown = (event: KeyboardEvent): void => {
    const next = positionForKey(event, this.position, this.args.mapping);
    if (next === null) return;
    event.preventDefault();
    this.#setPosition(next);
  };

  <template>
    {{! template-lint-disable no-pointer-down-event-binding require-presentational-children }}
    {{! a drag has to begin when the pointer goes down; the drawing inside is hidden from assistive tech }}
    <div
      class="knob"
      role="slider"
      tabindex="0"
      aria-label={{@label}}
      aria-orientation="vertical"
      aria-valuemin={{this.min}}
      aria-valuemax={{this.max}}
      aria-valuenow={{@value}}
      aria-valuetext={{this.valueText}}
      data-test-knob
      ...attributes
      {{on "pointerdown" this.gesture.down}}
      {{on "contextmenu" this.gesture.contextMenu}}
      {{on "keydown" this.onKeydown}}
    >
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <path class="knob__track" d={{this.trackPath}} />
        <path class="knob__fill" d={{this.fillPath}} />
        <path class="knob__pointer" d={{this.pointerPath}} />
        {{#if this.effectivePath}}
          <path
            class="knob__effective"
            d={{this.effectivePath}}
            data-test-effective
          />
        {{/if}}
      </svg>
    </div>
  </template>
}
