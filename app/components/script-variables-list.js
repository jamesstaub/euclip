import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class ScriptVariablesComponent extends Component {
  @tracked scriptVars;

  vars = {
    data: 'Number value of the current step in the sequence (0 or 1)',
    index: 'Number of Which step the sequence is on.',
    array: 'The array representing the entire sequence',
    filepath: 'The URL of the audio file select from the file picker for this track. This must get passed to the sampler node to play a sound.',
    start: '',
    end: '',
    loop: '',
  }

  @action
  showVars() {
    this.args.keys.map((key) => {      
      return {
        name: key,
        description: this.vars[key]
      }
    })
  }
}
