import { attr, belongsTo, hasMany } from '@ember-data/model';
import TrackAudioModel from '../audio-models/track';
import { keepLatestTask } from "ember-concurrency-decorators";
import { timeout } from 'ember-concurrency';
import { unbindFromSequencer } from '../utils/cracked';
import { filterBy } from '@ember/object/computed';

export default class TrackModel extends TrackAudioModel {
  
  @attr('boolean') isMaster  
  @belongsTo('project') project
  
  @belongsTo('init-script') initScript
  @belongsTo('onstep-script') onstepScript
  
  @hasMany('track-node') trackNodes
  @hasMany('track-control') trackControls
  @hasMany('sequence') sequences
  
  @attr('number') order
  
  destroyAndCleanup() {
    this.unbindAndRemoveCrackedNodes();
    // this.store.unloadRecord(this.initScript);
    // this.store.unloadRecord(this.onstepScript);
    this.trackNodes.forEach((trackNode) => {
      if (trackNode) {
        this.store.unloadRecord(trackNode);
      }
    });
    this.trackControls.forEach((trackControl) => {
      if (trackControl) {
        // these are deleted via :dependent_destory on the server, 
        // so just unload them on track delete
        this.store.unloadRecord(trackControl);
      }
    });
    this.destroyRecord();
  }

  get currentSequence() {
    if (this.isMaster) {
      return null;
    }
    // TODO management of current sequence
    return this.sequences.firstObject;
  }

  // duplicate getter as on trackNodes for convenience
  get samplerFilepathControl() {
    return this.trackControls.find((trackControl) => trackControl.isFilepath);
  }

  get filepathUrl() {
    // TOODO create and ENV var to set drum filepath location
    
    // in cracked, sampler nodes must be initialized with a filepath,
    // which happens before TrackNode and subsequent TrackControl models
    // can be created, so without this default, we'll never be able to apply
    // the server-rendered default filepath
    let defaultFile =  '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KBASS.mp3';
    return `/assets/audio/Drum%20Machines%20mp3${this.samplerFilepathControl?.controlStringValue || defaultFile}`;
    // return `https://storage.googleapis.com/euclidean-cracked.appspot.com/Drum%20Machines%20mp3${this.filepath}`;
  }

  @filterBy('trackNodes', 'isSourceNode', true) sourceNodeRecords;

  // TODO: dedupe from similar method on track-list-item
  @keepLatestTask
  *updateTrackSequence(sequenceRecord, key, value) {
    sequenceRecord.set('customSequence', []);
    sequenceRecord.set(key, value);
    // TODO replace samplerSelector with "sourceNodeSelector"
    unbindFromSequencer(this.samplerSelector);
    this.bindToSequencer();
    yield timeout(300);
    yield sequenceRecord.save();
  }

  // REFACTOR: this is only called when the filepath
  // is updated, filepath should be moved to a TrackControl attribute of Sampler nodes
  @keepLatestTask
  *updateTrackTask(key, value, reInit=true) {
    try {
      this.set(key, value);
      if (reInit)  {
        this.setupAudioFromScripts();
      }
      yield this.save();
    } catch (e) {
      this.rollbackAttributes();
    }
  }

  async duplicate() {
    const project = await this.get('project');
    const newTrack = project.get('tracks').createRecord();
    return await project.setupAndSaveNewTrack(newTrack, { adapterOptions: { duplicateId: this.id }});
  }
}