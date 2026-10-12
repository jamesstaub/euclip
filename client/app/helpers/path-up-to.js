import { helper } from '@ember/component/helper';

// Directory path for the breadcrumb at `idx`; the final segment is the file,
// so it resolves to its parent directory.
export default helper(function pathUpTo([segments, idx]) {
  const isFile = idx === segments.length - 1;
  return segments.slice(0, isFile ? idx : idx + 1).join('/') || '/';
});
