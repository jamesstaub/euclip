// from here https://stackoverflow.com/a/16436975

// false if its impossible for the arrays to be equal
function naiveChecks(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  return true;
}

export function arraysEqual(a, b) {
  if (!naiveChecks(a, b)) {
    return false;
  }

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// return the things in A that are not in B
export function difference(a, b) {
  const diff = []
  if (naiveChecks(a, b)) {
    return diff;
  }
  a = a.sort();
  b = b.sort();
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      diff.push(a[i]);
    }
  }
  return diff
}