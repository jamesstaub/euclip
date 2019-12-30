import Model from '@ember-data/model';
const supportedNodes = ['gain', 'sampler', 'lowpass', 'highpass', 'bandpass', 'allpasss', 'notch', 'lowshelf', 'highshelf', 'peaking', 'reverb', 'delay', 'bitcrusher', 'overdrive', 'ring', 'comb'];
import Evented from '@ember/object/evented';

export default class TrackAudioModel extends Model.extend(Evented) {
  get selector() {
    return `#${this.id}`;
  }

  bindProjectEvents(project, initScript) {
    // project and initScript are awaited on the route
    // so this event can be synchronous
    project.on('initTracks', () => {
      this.setupAudioFromScripts(initScript);
    })
  }

  setupAudioFromScripts(initScript) {
    // array to store audio node uuids created in this track's script
    // { uuid: type }
    this.set('trackNodes', []); 
    __.onCreateNode = (node, type) => {
      if (supportedNodes.indexOf(type) > -1) {
        const trackNode = {}
        trackNode[node.getUUID()] = type;
        this.trackNodes.push(trackNode);
      }
    }
     // run script to create audio nodes
    initScript.functionRef();

    this.setupTrackControls(initScript);
    this.bindToSequencer();
  }

  // find-or-create track control records bound to each audio node
  // TODO: replace track-control model with a node model
  // which has many track controls?
  setupTrackControls() {
    let existingTrackControls = this.trackControls.sortBy('order');
    this.trackNodes.map((node, idx) => {
      const [uuid, type] = Object.entries(node)[0];
      const foundByType = existingTrackControls.filterBy('nodeType', type);
      if (foundByType.length) {
        let foundTrackControl = foundByType[0];
        if (foundByType.length > 1) {
          // if there are several possible, take the first one, 
          // then remove it from the possible future choices
          existingTrackControls = existingTrackControls.rejectBy('nodeUUID', foundTrackControl.nodeUUID);
        }
        foundTrackControl.setProperties({nodeUUID: uuid, order: idx}); // update uuid since the audio nodes will be new every time
        return foundTrackControl;
      } else {
        return this.trackControls.createRecord({
          nodeUUID: uuid,
          nodeType: type,
          order: idx,
          interfaceName: 'slider' // TODO parse classnames
        });
      }
    })
    .forEach((trackControl)=>{
      trackControl.bindTrackEvents(this);
    });
  }

  bindToSequencer() {
    let onStepCallback = this.onStepCallback.bind(this);
    __(this.selector).unbind('step');
    __(this.selector).bind(
      'step', // on every crack sequencer step
      onStepCallback, // call this function (bound to component scope)
      this.sequence // passing in array value at position
    );
  }
  
  onStepCallback(index, data, array) {
    //track controls subscribe to trackStep event
    this.trigger('trackStep', index);
    this.set('stepIndex', index);
    this.onstepScript.get('functionRef')(index, data, array);
  }

  get scriptScope() {
    return {
      filepath: this.filepath,
      oscillator: this.oscillator, 
      id: this.id,
      selector: this.selector
    };
  } 
}