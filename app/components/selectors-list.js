import Component from '@glimmer/component';

export default class SelectorsListComponent extends Component {
  
  get idSelector() {
    return this.args.selectorsForNode.findBy('type', 'id');
  }

  get classSelectors() {
    return this.args.selectorsForNode.filterBy('type', 'class');
  }

  get elementSelector() {
    return this.args.selectorsForNode.findBy('type', 'element');
  }
}
