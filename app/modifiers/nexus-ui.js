import Modifier from 'ember-modifier';
import { registerDestructor } from '@ember/destroyable';
import Nexus from 'nexusui';
import { guidFor } from '@ember/object/internals';

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

    if (this.shouldReInit(options)) {
      this.setup(element, nexusClass, options);
    }

    this.setValue(options);

    this._options = options;
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

    if (options.onChange) {
      this.nexusElement.on('change', options.onChange);
    }
    this.colorize(options);
  }

  setValue(options) {
    if (this.valueChanged(options)) {
      this.nexusElement.value = options.value;
    }
  }

  valueChanged(options) {
    return options?.value != this._options?.value;
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
        key === 'stepIndex'
      ) {
        return false;
      }
      return val != this._options[key];
    });

    return optionsIfchanged.length > 0;
  }

  colorize() {
    this.nexusElement.colorize('accent', '#52ebff');
    switch (this.nexusElement.type) {
      case 'Slider':
        this.nexusElement.colorize('fill', '#ffffff');
        // eslint-disable-next-line no-case-declarations
        const circle = this.nexusElement.element.querySelector('circle');
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '2px');
        this.nexusElement.element.style.overflow = 'visible';
        break;
      case 'Number':
        this.nexusElement.colorize('fill', 'transparent');
        break;
      default:
        break;
    }
  }
}

function setId(element) {
  element.id = guidFor(element);
}

function cleanup(instance) {
  instance.nexusElement.destroy();
}
