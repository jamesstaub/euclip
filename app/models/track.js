import { attr, belongsTo, hasMany } from '@ember-data/model';
import E from '../utils/euclidean';
import { tracked } from '@glimmer/tracking';
import TrackAudioModel from '../audio-models/track';
import { keepLatestTask } from "ember-concurrency-decorators";
import { timeout } from 'ember-concurrency';
import { unbindFromSequencer } from '../utils/cracked';
import { isEmpty } from '@ember/utils';

export default class TrackModel extends TrackAudioModel {
  @tracked hits;
  @tracked steps;
  @tracked offset;
  @tracked filepath;

  @attr('string') filepath

  @belongsTo('project') project

  @belongsTo('init-script') initScript
  @belongsTo('onstep-script') onstepScript

  @hasMany('track-node') trackNodes
  @hasMany('track-control') trackControls

  @attr('number') order

  // euclidean rhythm params (should eventually move to a Sequence model)
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

  get sequence() {
    if (isEmpty(this.customSequence)) {
      return E(this.hits, this.steps, this.offset)
    } else {
      return this.customSequence;
    }
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
  *updateTrackSequence(key, value){
    try {
      this.set(key, value);
      unbindFromSequencer(this.samplerSelector);
      this.bindToSequencer();
      yield timeout(300)
      yield this.save();
    } catch (e) {
      this.rollbackAttributes();
    }
  }

  // REFACTOR: this is only called when the filepath
  // is updated, filepath should be moved to a TrackControl attribute of Sampler nodes
  @keepLatestTask
  *updateTrackTask(key, value, reInit=true){
    try {
      this.set(key, value);
      if (reInit)  {
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