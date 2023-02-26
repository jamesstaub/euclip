import { helper } from '@ember/component/helper';

export default helper(function displayFloat([num] /*, named*/) {
  return Number(num.toFixed(6));
});
