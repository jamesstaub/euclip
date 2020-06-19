import DS from 'ember-data';
import E from '../utils/euclidean';
import { tracked } from '@glimmer/tracking';
import TrackAudioModel from '../audio-models/track';
import { keepLatestTask } from "ember-concurrency-decorators";
const { belongsTo, hasMany, attr } = DS;

export default class TrackModel extends TrackAudioModel {
  @tracked hits;
  @tracked steps;
  @tracked offset;
  @tracked filepath;

  @attr('string') type
  @attr('string') filepath

  @belongsTo('project') project

  @belongsTo('init-script') initScript
  @belongsTo('onstep-script') onstepScript

  @hasMany('track-node') trackNodes
  @hasMany('track-control') trackControls

  // euclidean rhythm params
  @attr('number', {
    defaultValue() { return 0 }
  }) hits

  @attr('number', {
    defaultValue() { return 8 }
  }) steps

  @attr('number', {
    defaultValue() { return 0 }
  }) offset

  @attr() customSequence

  async destroyAndCleanup() {
    this.unbindTrack();

    const initScript = await this.initScript;
    const onstepScript = await this.onstepScript;
    const trackNodes = await this.trackNodes;

    debugger
    this.store.unloadRecord(initScript);
    this.store.unloadRecord(onstepScript);
    
    trackNodes.forEach((trackNode) => {
      try {
        if (trackNode && trackNode.trackControls) {
          // Move this logic to trackNode model so it can be used on removeNode
          trackNode.trackControls.forEach((trackControl) => {
            this.store.unloadRecord(trackControl);
          });
          this.store.unloadRecord(trackNode);
        }
      } catch (error) {
        console.error('TODO ensure track relations are properly deleted', error);        
      }
    });
    return this.destroyRecord();
  }

  get sequence() {
    // TODO implement support for custom sequence
    // this.customSequence ||
    return E(this.hits, this.steps, this.offset)
  }

  get filename() {
    const pathSegments = this.filepath.split('/');    
    return pathSegments[pathSegments.length-1].split('.')[0].replace(/%20/g, ' ');
  }

  get filepathUrl() {
    // TOODO create and ENV var to set drum filepath
    return `/assets/audio/Drum%20Machines%20mp3${this.filepath}`;
    // return `https://storage.googleapis.com/euclidean-cracked.appspot.com/Drum%20Machines%20mp3${this.filepath}`;
  }

  @keepLatestTask
  *updateTrackTask(key, value, reInit=true){
    try {
      this.set(key, value);
      if (reInit)  {
        // TODO refactor so setupAudioFromScripts does not take arguments, but ensure these models are resolved
        const initScript = yield this.initScript;
        this.setupAudioFromScripts(initScript);
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