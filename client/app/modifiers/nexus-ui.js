import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import Nexus from 'nexusui';
import { guidFor } from '@ember/object/internals';
import { isPresent } from '@ember/utils';
import { next } from '@ember/runloop';
import { typeOf } from '@ember/utils';
import { snapToStep } from '../utils/param-scale';

function roundFloat(num) {
  return Number(Number((num || 0).toFixed(4)));
}

export default class NexusUi extends Modifier {
  didSetup = false;
  _options = null;
  nexusElement;
  _value;

  constructor(owner, args) {
    super(owner, args);
    registerDestructor(this, cleanup);
  }

  modify(element, [nexusClass, optionsHash], namedOptions) {
    const options = {
      ...optionsHash,
      ...namedOptions,
    };

    this._pendingDragPerPixel = options.dragPerPixel;
    this._pendingDragStep = options.dragStep;
    this._pendingOnChange = options.onChange;

    if (this.shouldReInit(options)) {
      this.setup(element, nexusClass, options);
    }

    // Not ideal, but prevents double rendering caused
    // by using number box and slider with same value
    next(this, () => {
      this.setValue(options);
      if (options.node) {
        this.nexusElement.connect(options.node, 2);
      }
      this._options = options;
    });
  }

  setup(element, nexusClass, options) {
    if (this.didSetup) {
      cleanup(this);
    }
    setId(element); // Nexus needs a unique ID
    this.setupElement(element, nexusClass, options);
    this.didSetup = true;
  }

  setupElement(element, nexusClass, options) {
    this.nexusElement = new Nexus[nexusClass](`#${element.id}`, options);
    this.nexusElement.decimalPlaces = 6;
    if (options.onChange) {
      this.nexusElement.on('change', this.onNexusChange);
    }
    if (this.nexusElement instanceof Nexus.Number) {
      this.useStepAwareDrag();
    }

    this.colorize(options);
  }

  // Nexus sizes a number drag by (max - min), capped at 1000, per pixel. For params with a huge
  // or unbounded range that makes every pixel worth thousands of units. Scale by the
  // `dragPerPixel` option (units per pixel) instead; falls back to Nexus's own scaling.
  useStepAwareDrag() {
    const nexus = this.nexusElement;
    const nexusMove = nexus.move.bind(nexus);
    nexus.move = () => {
      const perPixel = this._options?.dragPerPixel ?? this._pendingDragPerPixel;
      if (!Number.isFinite(perPixel) || !(perPixel > 0) || !nexus.clicked) {
        return nexusMove();
      }
      nexus.hasMoved = true;
      const dy = nexus.mouse.y - nexus.initial.y;
      // like Nexus, dragging from the left edge is faster than from the right
      const factor = Math.pow(nexus.changeFactor, 2);
      const dragged = nexus.actual - dy * perPixel * factor;
      // Nexus's own step also decides what the box can display and accept, so it is kept fine and
      // the drag snaps to the control's step size here instead
      const dragStep = this._options?.dragStep ?? this._pendingDragStep;
      nexus.value = dragStep > 0 ? snapToStep(dragged, dragStep, nexus.min) : dragged;
      nexus.render();
      if (nexus._value.changed) {
        nexus.emit('change', nexus.value);
      }
    };
  }

  // Nexus emits `change` for programmatic value changes too, after rounding and snapping to its own
  // step (a model value of 174.61 comes back as 175). Forwarding that would overwrite the model with
  // a value the user never entered, so only changes made through the UI are passed on.
  applyingValue = false;

  onNexusChange = (value) => {
    if (this.applyingValue) return;
    (this._pendingOnChange ?? this._options?.onChange)?.(value);
  };

  withoutEmitting(fn) {
    this.applyingValue = true;
    try {
      fn();
    } finally {
      this.applyingValue = false;
    }
  }

  setValue(options) {
    if (typeOf(options.value) === 'boolean') {
      this.withoutEmitting(() => (this.nexusElement.state = options.value));
    } else if (
      isPresent(options.value) &&
      !isNaN(options.value) &&
      this.valueChanged(options)
    ) {
      this.withoutEmitting(() => (this.nexusElement.value = roundFloat(options.value)));
    } else if (cracked.isStr(options.value)) {
      this.withoutEmitting(() => (this.nexusElement.value = options.value));
    }
  }

  // TODO maybe it would be useful to use `this.clicked` in the event handler to determine if the value changed from
  // user or set from the model
  // https://github.com/nexus-js/ui/issues/218
  valueChanged(options) {
    // check boolean first
    if (options?.value === this._options?.value) {
      return false;
    }

    return roundFloat(options?.value) != roundFloat(this._options?.value);
  }

  // Only the `value` option can be updated without re-initializing
  // the Nexus element. Check for any difference between the cached _options
  // and the received options
  shouldReInit(options) {
    if (!this._options) {
      return true;
    }
    const optionsIfchanged = Object.entries(options).filter(([key, val]) => {
      // values that should not trigger a re-init
      if (
        key === 'value' ||
        key === 'values' ||
        key === 'state' ||
        key === 'stepIndex' ||
        key === 'dragPerPixel' ||
        key === 'dragStep'
      ) {
        return false;
      }
      return val != this._options[key];
    });

    return optionsIfchanged.length > 0;
  }

  colorize(options) {
    this.nexusElement.colorize('accent', '#52ebff');

    // NOTE:
    // important to use `instanceof` not nexusElement.type
    // because under the hood type is from constructor.name
    // which gets mangled when minified
    if (this.nexusElement instanceof Nexus.Slider) {
      this.nexusElement.colorize('fill', '#ffffff');
      // eslint-disable-next-line no-case-declarations
      const circle = this.nexusElement.element.querySelector('circle');
      circle.setAttribute('stroke', '#333');
      circle.setAttribute('stroke-width', '2px');
      this.nexusElement.element.style.overflow = 'visible';
    }
    if (this.nexusElement instanceof Nexus.Number) {
      // on the yellow footer the box is transparent with dark text; on a dark panel pass `fill` and `text`
      this.nexusElement.colorize('fill', options?.fill ?? 'transparent');
      if (options?.text) this.nexusElement.colorize('dark', options.text);
    }

    if (this.nexusElement instanceof Nexus.Select) {
      this.nexusElement.colorize('fill', '#ffce55');
    }

    if (this.nexusElement instanceof Nexus.Meter) {
      this.nexusElement.element.style.pointerEvents = 'none';
    }
  }
}

function setId(element) {
  element.id = guidFor(element);
}

function cleanup(instance) {
  instance.nexusElement.destroy();
}
