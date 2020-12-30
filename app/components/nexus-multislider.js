import NexusBase from './nexus-base';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
import { arraysEqual } from '../utils/arrays-equal';
import { isPresent } from '@ember/utils';

export default NexusBase.extend({
  multislider: alias('nexusElement'),

  init() {
    this._super(...arguments);
    this.setProperties({
      elementName: 'Multislider',
      sliderColor: '#52ebff',
      sliderBgColor: '#f7f7f7',
      red: 'rgb(217, 83, 79)'
    });
  },

  didInsertElement() {
    this._super(...arguments);
    // hackish way to select the <rect> elements that need to be styled
    this.set('sliderQuery', this.nexusElement.parent.querySelectorAll(`rect[height="120"]`));
    this.set('sliderCapQuery', this.nexusElement.parent.querySelectorAll(`rect[height="5"]`));
    this.applyStyle();
  },

  didReceiveAttrs() {
    this._super(...arguments);
    this.applyStyle();
    this.styleOnStep();
  },
    
  nexusInit() {
    this._super(...arguments);
    this.multislider.colorize('accent', '#52ebff');
    this.multislider.colorize('fill', '#ffffff');
  },

  applyStyle() {
    if(this.nexusElement && this.sequence) {
      this.sliderQuery.forEach(this.styleRectElement.bind(this));
      this.sliderCapQuery.forEach(this.styleRectElement.bind(this))
    }
  },

  // callback when iterating over querySelector of svg <rect>s
  styleRectElement(el, idx) {
    let stroke = this.sliderColor;
    let fill = this.sequence[idx] ? this.sliderColor : this.sliderBgColor;
    el.setAttribute('style', `stroke: ${stroke}; fill: ${fill}; opacity: 1`);
  },

  styleOnStep() {
    if (this.sliderQuery && isPresent(this.stepIndex)) {
      let rectIndex = this.stepIndex - 1;
      // hack to avoid off by one error in current step display
      if (rectIndex === -1) {
        rectIndex = this.sequence.length - 1;
      }
      let style = `stroke: ${this.red}; fill: ${this.red}; opacity: 1`;
      this.sliderQuery[rectIndex].setAttribute('style', style);
      this.sliderCapQuery[rectIndex].setAttribute('style', style);
    }
  },

  valueChanged() {
    return !arraysEqual(this.values, this.nexusElement.values);
  },

  options: computed('max', 'min', 'width', 'step', 'values.[]', 'size', {
    get() {
      const height = 120;
      const size = [this.width, height];
      return {
        size: size,
        min: this.min,
        max: this.max,
        numberOfSliders: this.values.length,
        step: this.step,
        values: this.values
      };
    }
  }),
});
