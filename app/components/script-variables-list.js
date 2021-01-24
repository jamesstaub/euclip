import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { getCrackedNode } from '../utils/cracked';
import { A } from '@ember/array';
import { selectorType } from '../utils/selectors-util';
import { isPresent } from '@ember/utils';
import {
  inject as controller
} from '@ember/controller';

export default class ScriptVariablesComponent extends Component {
  @tracked ui;
  @tracked selectedTab;
  @tracked defaultTab;

  @controller('user.creator.project') project;

  vars = {
    data: 'Number value of the current step in the sequence (0 or 1)',
    index: 'Number of Which step the sequence is on.',
    array: 'The array representing the entire sequence',
    'this.filepath': 'The URL of the audio file select from the file picker for this track. This must get passed to the sampler node to play a sound.',
    // filestart: '',
    // fileend: '',
  }

  get isCollapsed() {
    return !this.project.showScriptFooter;
  }

  get scriptVars() {
    return  A(this.args.variables?.map((key) => { 
      return {
        name: key,
        description: this.vars[key]
      }
    }));
  }

  get currentNode() {
    if (this.args.useSourceNode) {
      return this.args.validTrackNodes.findBy('isSourceNode', true);
    } else if (isPresent(this.args.visibleNodeIdx)) {
      return this.args.validTrackNodes[this.args.visibleNodeIdx];
    }
  }

  get selectorsForNode() {
    // TODO show all track nodes, but make them collapsable
    // when shown on "controls" tab, sync the current track node
    // to collapse/expand in the script-variables-list
    if (this.currentNode) {
      return this.getSelectorsArray(this.currentNode.nodeUUID);
    } else {
      return []
    }
  }

  get tabItems() {
    const showDocs = this.args.sequencerDocs || this.args.nodeDocs;
    return [{
      label: 'variables',
      value: 'variables',
      condition: this.scriptVars
    },
    {
      label: 'selectors',
      value: 'selectors',
      condition: this.selectorsForNode.length
    },
    {
      label: 'attributes',
      value: 'docs',
      condition: showDocs
    }].filter((item) => { 
      return item.condition
    });
  }

  getSelectorsArray(uuid) {
    return getCrackedNode(uuid)?.selector_array
      .filter((selector) => selector !== '*')
      .map((selector) => {
        return {
          name: selector,
          type: selectorType(selector)
        }
      })
  }

  @action
  toggleCollapsed() {
    this.project.showScriptFooter = !this.project.showScriptFooter;
    this.defaultTab = null;
  }

  @action
  setUi(key, value) {
    this.ui = value;
  }

  @action
  setDefaultUi() {
    this.ui = this.tabItems[0]?.value;
    this.defaultTab = this.ui;
  }

}
