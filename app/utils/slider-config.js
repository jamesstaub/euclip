// WIP

const isInt = (n) => {
  return n % 1 === 0;
};

export const fitMinMaxToValue = (value, attrs) => {
  attrs.min = Math.min(attrs.min, value);
  attrs.max = Math.max(attrs.max, value);
  return attrs;
};

export const fitStepToRange = (attrs) => {
  // defaultValue outside the range of min, max then error
  if (defaultValue < min || defaultValue > max) {
    throw new Error('defaultValue outside the range of min, max');
  }

  if (isInt(min) && isInt(max) && isInt(defaultValue)) {
    const range = max - min;
    const orderOfMagnitude = Math.floor(Math.log10(range));
    if (orderOfMagnitude >= 0) {
      return Math.pow(10, orderOfMagnitude - 1);
    }
  }
};

export const updateValue = (controlValue, existingAttrs) => {
  let { min, max, defaultValue, stepSize } = existingAttrs;
  // {min, max} = fitMinMaxToValue(min, max, value);
};
