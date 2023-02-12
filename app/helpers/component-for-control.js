import { helper } from '@ember/component/helper';

export default helper(function componentForControl(nodeType /*, named*/) {
  const componentNames = {
    speed: 'timeSlider',
    gain: 'gainSlider',
    frequency: 'frequencySlider',
    adsr: 'envelope',
  };
  return componentNames[nodeType];
});
