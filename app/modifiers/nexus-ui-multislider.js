import { arraysEqual } from '../utils/arrays-equal';
import NexusUi from './nexus-ui';
import { isPresent } from '@ember/utils';
import Nexus from 'nexusui';

const COLORS = {
  sliderColor: '#52ebff',
  bgColor: '#075f68',
  sliderStrokeColor: '#333',
  sliderBgColor: '#f7f7f7',
  red: 'rgb(217, 83, 79)',
};

export default class NexusUiMultislider extends NexusUi {
  modify(element, [optionsHash], namedOptions) {
    super.modify(element, ['Multislider', optionsHash], namedOptions);
  }

  setupElement(element, nexusClass, options) {
    this.nexusElement = new Nexus[nexusClass](`#${element.id}`, options);
    // select sliders (ignoring the caps)
    this.sliderQuery = element.querySelectorAll(
      `rect[height="${options.size[1]}"]`
    );

    // select slider caps
    this.sliderCapQuery = element.querySelectorAll(`rect[height="5"]`);

    this.colorize(options);

    if (options.onChange) {
      this.nexusElement.on('change', options.onChange);
    }
    this.colorize(options);
  }

  setValue(options) {
    if (this.valueChanged(options)) {
      this.nexusElement.values = options.values;
    }

    this.styleOnStep(options);
  }

  styleOnStep(options) {
    this.colorize(options);
    if (this.sliderQuery && isPresent(options.stepIndex)) {
      if (options.stepIndex === -1) {
        return; // current step is on a page we're not viewing
      }
      let rectIndex = options.stepIndex - 1;
      // hack to avoid off by one error in current step display
      if (rectIndex === -1) {
        rectIndex = options.values.length - 1;
      }
      let style = `stroke: ${COLORS.red}; fill: ${COLORS.red}; opacity: 1`;
      this.sliderQuery[rectIndex].setAttribute('style', style);
      this.sliderCapQuery[rectIndex].setAttribute('style', style);
    }
  }

  valueChanged(options) {
    if (!this._options) {
      return true;
    }
    return !arraysEqual(options.values, this._options.values);
  }

  colorize(options) {
    if (this.nexusElement && options.values) {
      this.nexusElement.element.style.backgroundColor = COLORS.bgColor;

      this.sliderQuery?.forEach(this.styleRectElement.bind(options));
      this.sliderCapQuery?.forEach(this.styleRectElement.bind(options));
    }
  }

  // callback when iterating over querySelector of svg <rect>s
  styleRectElement(el, idx) {
    let stroke = COLORS.sliderStrokeColor;
    let fill = this.sequence[idx] ? COLORS.sliderColor : COLORS.sliderBgColor;
    el.setAttribute('style', `stroke: ${stroke}; fill: ${fill}; opacity: 1`);
  }
}
