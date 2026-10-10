import { helper } from '@ember/component/helper';

export default helper(function displayFloat([num] /*, named*/) {
  if (isNaN(num)) {
    return num;
  }
  return Number(num.toFixed(6));
});
