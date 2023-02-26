import { helper } from '@ember/component/helper';
import sampsToSecs from '../utils/samps-to-secs';

export default helper(function bufferLen([buffer] /*, named*/) {
  return sampsToSecs(buffer.length, buffer.sampleRate);
});
