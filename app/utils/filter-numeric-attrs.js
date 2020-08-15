import { typeOf } from '@ember/utils';
// takes an object, returns an object with only the attributes that have numeric values
export default function filterNumericAttrs(object) {
  if (typeOf(object) === 'object') {
    return Object.fromEntries(Object.entries(object).filter(([key, val]) => typeOf(val) === 'number'))
  } else {
    return {};
  }
}
