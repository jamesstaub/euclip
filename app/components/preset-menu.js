import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { useMachine, matchesState } from 'ember-statecharts';
import listSelectMachine from '../machines/list-select-machine';

export default class PresetMenuComponent extends Component {
  @tracked item;
  @tracked selectedPreset;

  statechart = useMachine(this, () => {
    return {
      machine: listSelectMachine
        .withConfig({
          actions: {
            handleSelectItem(context) {
              const { component } = context;
              // validate existance of selectedPreset?
              component.selectedPreset;
            },
            handleSubmit(context) {
              const { component } = context;
              component.submit();
            },
            handleSuccess(context) {
              const { component } = context;
              component.args.closeMenu();
            },
          },
        })
        .withContext({
          component: this,
        }),
    };
  });

  @matchesState('selected')
  canSubmit;

  async submit() {
    try {
      this.statechart.send('LOADING');
      await this.args.onSubmit(this.selectedPreset.id);
      this.statechart.send('SUCCESS');
    } catch (error) {
      this.statechart.send('ERROR', error);
    }
  }

  @action
  selectItem(item) {
    this.selectedPreset = item;
    this.statechart.send('SELECT');
  }

  @action
  async applyPreset() {
    this.statechart.send('SUBMIT');
  }
}
