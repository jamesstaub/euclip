import { helper } from '@ember/component/helper';
import { defaultParams } from '../utils/audio-node-config';

export default helper(function unitForParam(paramName /*, named*/) {
  return `(${defaultParams[paramName].unit})`;
});
