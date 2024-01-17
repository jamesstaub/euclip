import { helper } from '@ember/component/helper';

export default helper(function invokeOnRecord(
  [record, method, arg] /*, named*/
) {
  return record[method](arg);
});
