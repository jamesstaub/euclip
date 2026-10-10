import { helper } from '@ember/component/helper';

// Rounds numbers (or numeric strings) to 6 decimals; anything else is passed through.
export default helper(function displayFloat([value] /*, named*/) {
  if (value === null || value === undefined || value === '') return value;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return Number(num.toFixed(6));
});
