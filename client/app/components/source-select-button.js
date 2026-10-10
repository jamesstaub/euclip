import Component from '@glimmer/component';

export default class SourceSelectButtonComponent extends Component {
  get classNames() {
    if (this.args.fileError) {
      return 'red b--red italic';
    }

    return this.args.filename ? 'yellow b--yellow' : 'light-blue b--light-blue';
  }

  get label() {
    if (this.args.fileError) {
      return `Error Downloading file ${this.args.fileError}`;
    }
    return `Open Audio File Browser.`;
  }
}
