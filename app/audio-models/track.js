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

    // FIXME should this method also call setupAudioFromScripts outright?
    // what should happen when new tracks are added while the project is playing
    project.on('initTracks', () => {
      if (!this.isDeleted) {
        this.setupAudioFromScripts(initScript);
      }
    });
  }

  setupAudioFromScripts(initScript) {
    // array to store audio node uuids created in this track's script
    // not to be confused with trackNode models, 
    // { uuid: type } 
    this.set('trackAudioNodes', []); 


    // _onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    __.onCreateNode = (node, type, creationParams, userSettings) => {
      // this callback gets called when a user creates cracked audio nodes in the script editor ui
      if (supportedNodes.indexOf(type) > -1) {
        const trackNode = {}
        trackNode[node.getUUID()] = type;
        this.trackAudioNodes.push(trackNode);

        // 'ui' is a custom attr that users can set in the script editor when defining a cracked audio node
        // new AudioNode objects won't get initialized with it by default so we hack it on here
        // see cracked.js line 330
        if (userSettings.ui) {
          node.ui = userSettings.ui;
        }
      }
    }

    this.unbindTrack();
     // run script to create audio nodes
    initScript.functionRef();
    
    this.findOrCreateTrackNodeRecords(initScript);
    this.bindTrackControls();
    this.bindToSequencer();
  }


  /**
   * find-or-create TrackNode records for each audio node object
   * created on this track
   */
  findOrCreateTrackNodeRecords() {
    // trackNode records already created for this track
    let existingtrackNodes = this.trackNodes.sortBy('order');
    
    // map over audio node objects created in this track's script
    // to find or create corresponding trackNode model records 
    this.trackAudioNodes.forEach((node, idx) => {
      const [uuid, type] = Object.entries(node)[0];
      const foundByType = existingtrackNodes.filterBy('nodeType', type);
      if (foundByType.length) {
        let foundtrackNode = foundByType[0];
        if (foundByType.length > 1) {
          // if there are several possible, take the first one, 
          // then remove it from the possible future choices
          existingtrackNodes = existingtrackNodes.rejectBy('nodeUUID', foundtrackNode.nodeUUID);
        }
        foundtrackNode.setProperties({nodeUUID: uuid, order: idx}); // update uuid since the audio nodes will be new every time
        return foundtrackNode;
      } else {
        const trackNode = this.trackNodes.createRecord({
          nodeUUID: uuid,
          nodeType: type,
          order: idx,
          defaultUi: __._getNode(uuid).ui || 'slider'
        });
        // OPTIMIZE
        // refactor the trackNode endpoint to support a single batch save
        trackNode.save();
      }
    });
  }
  
  /**
   * track controls are added/updated to the store after find-or-create track nodes
   * bindTrackEvents causes them to listen to this.trigger('trackStep')
  */
  bindTrackControls() {
    this.get('trackNodes').forEach((trackNode)=>{
      trackNode.get('trackControls').forEach((trackControl)=>{
        trackControl.bindTrackEvents(this);
      })
    })
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

  unbindTrack() {
    __(this.selector).unbind('step');
    __(this.selector).remove();
  }
  
  onStepCallback(index, data, array) {
    //track controls subscribe to trackStep event
    this.set('stepIndex', index);
    // this.applyOnstepTrackControls(index);
    this.onstepScript.get('functionRef')(index, data, array);
    this.trigger('trackStep', index);
  }

  get scriptScope() {
    return {
      // the track should either have a sampler or an oscillator 
      filepath: this.filepathUrl,
      id: this.id,
      selector: this.selector
    };
  } 
}