import Model from '@ember-data/model';
export default class TrackAudioModel extends Model {
  
  async ready() {
    const project = await this.project;
    project.on('initTracks', () => {
      this.initTrack();
    })
  }

  initTrack() {
    this.initScript.functionRef();
    this.bindToSequencer();
  }

  //
  bindToSequencer() {
    let onStepCallback = this.onStepCallback.bind(this);
    __(this.samplerSelector).unbind('step');
    __(this.samplerSelector).bind(
      'step', // on every crack sequencer step
      onStepCallback, // call this function (bound to component scope)
      this.sequence // passing in array value at position
    );
  }

  onStepCallback(index, data, array) {
    this.set('stepIndex', index);
    this.applyTrackControls(index);
    this.onstepScript.functionRef(index, data, array);
  }
}