import Component from '@glimmer/component';

export default class SelectorsListComponent extends Component {
  get idSelector() {
    return this.args.selectorsForNode.find((item) => item.type === 'id');
  }

  get classSelectors() {
    return this.args.selectorsForNode.filter((item) => item.type === 'class');
  }

  get elementSelector() {
    return this.args.selectorsForNode.find((item) => item.type === 'element');
  }
}
