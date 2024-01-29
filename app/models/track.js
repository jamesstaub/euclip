/* eslint-disable ember/classic-decorator-no-classic-methods */
/* eslint-disable ember/no-get */
import { attr, belongsTo, hasMany } from '@ember-data/model';
import TrackAudioModel from '../audio-models/track';
import { keepLatestTask, timeout } from 'ember-concurrency';
import { unbindFromSequencer } from '../utils/cracked';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { cached } from '@glimmer/tracking';

export default class TrackModel extends TrackAudioModel {
  @service store;
  @attr('boolean') isMaster;
  @belongsTo('project', { async: false, inverse: 'tracks' }) project;

  @belongsTo('init-script', { async: false, inverse: 'track' }) initScript;
  @belongsTo('onstep-script', { async: false, inverse: 'track' }) onstepScript;
  @belongsTo('audio-file-tree', { async: false, inverse: 'track' })
  audioFileTreeModel;

  @hasMany('track-node', { async: false, inverse: 'track' }) trackNodes;
  @hasMany('track-control', { async: false, inverse: 'track' }) trackControls;
  @hasMany('sequence', { async: false, inverse: 'track' }) sequences;

  @attr('number') order;

  @attr('number', { defaultValue: -1 }) stepIndex;

  async createAudioFileTree() {
    await this.trackControls; // audio-tree relies on the filepath track control
    const audioFileTreeModel = this.store.createRecord('audioFileTree', {
      track: this,
    });
    // load the file tree to show the audio file path saved on the sampler track control
    // eslint-disable-next-line ember/no-get, ember/classic-decorator-no-classic-methods
    let path = this.get('samplerFilepathControl.controlStringValue') || '';
    path = path.split('/');
    const item = path.pop();
    audioFileTreeModel.appendDirectoriesData(path.join('/'), item);
  }

  async destroyAndCleanup() {
    const project = await this.project;
    this.unbindAndRemoveCrackedNodes();
    // this.store.unloadRecord(this.initScript);
    // this.store.unloadRecord(this.onstepScript);
    this.trackNodes.forEach((trackNode) => {
      if (trackNode && trackNode.isLoaded) {
        this.store.unloadRecord(trackNode);
      }
    });
    this.trackControls.forEach((trackControl) => {
      if (trackControl && trackControl.isLoaded) {
        // these are deleted via :dependent_destory on the server,
        // so just unload them on track delete
        this.store.unloadRecord(trackControl);
      }
    });
    await this.destroyRecord();

    if (project.get('isPlaying')) {
      // TODO: add a hook to remove a callback from _loopListeners,
      // otherwise will get "tried to run callback on deleted track" warning.
      // Or add an argument to resetLoop() to target a listener by selctor
      // __.loop('reset', '.track-1');
    }
  }

  get currentSequence() {
    // if (this.isMaster) return null;
    return this.sequences[0];
  }

  get scriptAlert() {
    return this.get('initScript.alert') || this.get('onstepScript.alert');
  }

  // @cached // prevent this from re-computing on every beat of the sequencer
  get sourceNodeRecords() {
    // remove possible `null` to avoid error before filterBy
    return this.trackNodes.filter((tn) => tn).filterBy('isSourceNode', true);
  }

  get samplerNodes() {
    return this.sourceNodeRecords.filterBy('nodeType', 'sampler');
  }

  get adsrNodes() {
    return this.sourceNodeRecords.filterBy('nodeType', 'adsr');
  }

  get samplerNativeBuffers() {
    // FIXME: should this be a filter/map?
    return this.samplerNodes.map((samplerNode) => {
      if (samplerNode.sampleIsLoaded) {
        return samplerNode.nativeNode.buffer;
      }
    });
  }

  // trackControl for audio file path string
  // (duplicate getter as on trackNodes for convenience)

  get samplerFilepathControl() {
    return this.trackControls.find((trackControl) =>
      trackControl.get('isFilepath')
    );
  }

  // TODO: Eventually move away from teh 1:1 track to filepath relationship
  //  a better interface would clearly indicate that each file corresponds to a sampler, not
  // the track itself
  get filePathRelative() {
    // silent.mp3 is used as a fallback so the sampler node is created successfully
    // it will have already been downloaded on project load
    return (
      this.samplerFilepathControl?.controlStringValue ||
      '/assets/audio/silent.mp3'
    );
  }

  // This getter is called on every beat of the sequencer
  @cached
  get downloadedFilepath() {
    const sf = this.store
      .peekAll('sound-file')
      .findBy('filePathRelative', this.filePathRelative);

    return sf.downloadedURI;
  }

  get validTrackNodes() {
    // TODO: check if there are still orphaned nodes, then implement a filter here
    // otherwise remove this method
    return this.trackNodes;
  }

  get trackNodesForControls() {
    // all nodes except the children of channelStrip maco
    return this.validTrackNodes.filter(
      ({ nodeType, parentMacro }) =>
        nodeType !== 'channelStrip' && parentMacro == null
    );
  }

  @action
  updateTrackSequence(sequenceRecord, key, value) {
    if (sequenceRecord.get(key) == value) {
      // nexus element re-fires when initialized,
      // so skip if the value is the same
      return;
    }
    // switching from custom back to euclidean
    if (key === 'hits') {
      sequenceRecord?.set('customSequence', []);
    }
    // don't allow more hits than steps
    if (key === 'steps' && value < sequenceRecord.hits) {
      sequenceRecord?.set('hits', value);
    }

    sequenceRecord?.set(key, value);
    unbindFromSequencer(this.classSelector);
    this.bindToSequencer();
    this.saveTrackSequence.perform(sequenceRecord);
  }

  @keepLatestTask
  *saveTrackSequence(sequenceRecord) {
    yield timeout(1000);
    yield sequenceRecord.save();
  }

  // REFACTOR: this is only called when the filepath
  // is updated, filepath should be moved to a TrackControl attribute of Sampler nodes
  @keepLatestTask
  *updateTrackTask(key, value, reInit = true) {
    try {
      this.set(key, value);
      if (reInit) {
        yield this.findOrDownloadSoundFile();
        this.setupAudioFromScripts();
      }
      yield this.save();
    } catch (e) {
      this.rollbackAttributes();
    }
  }

  async duplicate() {
    const project = await this.project;
    const newTrack = project.tracks.createRecord();
    return await project.setupAndSaveNewTrack(newTrack, {
      adapterOptions: { duplicateId: this.id },
    });
  }
}
