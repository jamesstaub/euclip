import { helper } from '@ember/component/helper';

export default helper(function intToBool(positional /*, named*/) {
  return positional[0] ? true : false;
});
