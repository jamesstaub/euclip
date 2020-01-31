import { helper } from '@ember/component/helper';

export default helper(function filenameUi(params/*, hash*/) {
  return params[0].split('.')[0];
});
