import { helper } from '@ember/component/helper';

export default helper(function renderModelError([error] /*, named*/) {
  const pointer = error.source.pointer.split('/').pop();
  return `${error.title} "${pointer}" ${error.detail} `;
});
