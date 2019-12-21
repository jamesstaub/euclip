/* eslint complexity: ["error", 8]*/

// This module created by https://github.com/mkontogiannis/euclidean-rhythms

Array.prototype.rotate = (function () {
  // save references to array functions to make lookup faster
  var push = Array.prototype.push,
    splice = Array.prototype.splice;

  return function (count) {
    var len = this.length >>> 0; // convert to uint
    count = count >> 0; // convert to int

    // convert count to value in range [0, len)
    count = ((count % len) + len) % len;

    // use splice.call() instead of this.splice() to make function generic
    push.apply(this, splice.call(this, 0, count));
    return this;
  };
})();

/**
 *  Returns the calculated pattern of equally distributed pulses in total steps
 *  based on the euclidean rhythms algorithm described by Godfried Toussaint
 *
 *  @method  getPattern
 *  @param {Number} pulses Number of pulses in the pattern
 *  @param {Number} steps  Number of steps in the pattern (pattern length)
 */

const getPattern = (pulses, steps) => {
  if (pulses < 0 || steps < 0 || steps < pulses) {
    return [];
  }

  // Create the two arrays
  let first = new Array(pulses).fill([1]);
  let second = new Array(steps - pulses).fill([0]);

  let firstLength = first.length;
  let minLength = Math.min(firstLength, second.length);

  let loopThreshold = 0;
  // Loop until at least one array has length gt 2 (1 for first loop)
  while (minLength > loopThreshold) {
    // Allow only loopThreshold to be zero on the first loop
    if (loopThreshold === 0) {
      loopThreshold = 1;
    }

    // For the minimum array loop and concat
    for (var x = 0; x < minLength; x++) {
      first[x] = Array.prototype.concat.call(first[x], second[x]);
    }

    // if the second was the bigger array, slice the
    // remaining elements/arrays and update
    if (minLength === firstLength) {
      second = Array.prototype.slice.call(second, minLength);
    } else {
      // Otherwise update the second (smallest array)
      // with the remainders of the first
      // and update the first array to include onlt the extended sub-arrays
      second = Array.prototype.slice.call(first, minLength);
      first = Array.prototype.slice.call(first, 0, minLength);
    }
    firstLength = first.length;
    minLength = Math.min(firstLength, second.length);
  }

  // Build the final array
  let pattern = [];
  first.forEach(f => {
    pattern = Array.prototype.concat.call(pattern, f);
  });
  second.forEach(s => {
    pattern = Array.prototype.concat.call(pattern, s);
  });

  return pattern;
};

// for euclidean algorithm hits must always be lower than steps
const sortParameters = (hits, steps) => {
  const params = [hits, steps].sort((a, b) => {
    return a - b;
  });
  return params;
};

const calculateSequence = (hits, steps, offset) => {
  const sortedHitsSteps = sortParameters(hits, steps);
  offset = steps - offset;
  return getPattern(...sortedHitsSteps).rotate(offset);
};

export default calculateSequence;
