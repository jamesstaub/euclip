import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { objectCompletions } from '../utils/autocomplete/object-completions';
import { argCompletions } from '../utils/autocomplete/arg-completions';

export default class CrackedNodeDocsComponent extends Component {
  get currentNode() {
    return objectCompletions.findBy('label', this.args.nodeName);
  }
  get currentNodeDocs() {
    return argCompletions[this.currentNode.label];
  }
}
