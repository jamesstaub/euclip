import { helper } from '@ember/component/helper';

export default helper(function sequenceScrollLeft(pageNum /*, named*/) {
  //  the nexus multislider pagination
  const sliderWidth = 32.2; // TODO move this to shared config with NexusMultislider
  const pageSize = 16; // ditto
  return sliderWidth * pageNum * pageSize;
});
