/* eslint-disable ember/classic-decorator-no-classic-methods */
/* eslint-disable ember/no-get */
import { attr, belongsTo, hasMany } from '@ember-data/model';
import TrackAudioModel from '../audio-models/track';
import { keepLatestTask, timeout } from 'ember-concurrency';
import { unbindFromSequencer } from '../utils/cracked';
import ENV from 'euclip/config/environment';
import { inject as service } from '@ember/service';
import TrackNodeModel from './track-node';
import { action } from '@ember/object';

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

  @attr('number', { defaultValue: 0 }) stepIndex;

  async createAudioFileTree() {
    await this.trackControls; // audio-tree relies on the filepath track control
    const audioFileTreeModel = this.store.createRecord('audioFileTree', {
      track: this,
    });
    // load the file tree to show the audio file path saved on the sampler track control
    // eslint-disable-next-line ember/no-get, ember/classic-decorator-no-classic-methods
    let path = this.get('samplerFilepathControl.controlStringValue') || '';
    if (path.length) {
      path = path.split('/');
      const item = path.pop();
      audioFileTreeModel.appendDirectoriesData(path.join('/'), item);
    }
  }

  async destroyAndCleanup() {
    const project = await this.project;
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
    await this.destroyRecord();
    if (project.get('isPlaying')) {
      // clean reset on delete to prevent the _loopListeners array gets cleared out in cracked
      project.stopLoop();
      await project.initSignalChain();
      project.startLoop();
    }
  }

  get currentSequence() {
    if (this.isMaster) {
      return null;
    }
    // TODO management of current sequence
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

  get filePathRelative() {
    // TOODO create and ENV var to set drum filepath location

    // in cracked, sampler nodes must be initialized with a filepath,
    // which happens before TrackNode and subsequent TrackControl models
    // can be created, so without this default, we'll never be able to apply
    // the server-rendered default filepath

    // TODO refactor loadin order so nodes + controls are ready before initializing audio nodes
    // let defaultFile =
    //   '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KBASS.mp3';

    // for the same resons, there's a bad UX where if a user manually enters a filepath string
    // in the code, the file picker shows a default drumfile (which corresponds to the this.filepath variable)
    // improve the ui by allowing a manual URL in the file tree.
    return this.samplerFilepathControl?.controlStringValue;
  }

  get filepathUrl() {
    if (!this.filePathRelative) {
      return '/assets/audio/silent.mp3'; // if there's no track-control for filepath yet, we still want to create a sampler node
    }
    return `${ENV.APP.DRUMMACHINES_PATH}${this.filePathRelative}`;
  }

  get validTrackNodes() {
    //dont try to render if record has no corresponding AudioNode
    return TrackNodeModel.validTrackNodes(this);
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
    this.sourceNodeRecords.forEach((source) => {
      unbindFromSequencer(source.uniqueSelector);
      this.bindToSequencer(source);
    });
    this.saveTrackSequence.perform(sequenceRecord);
  }

  @keepLatestTask
  *saveTrackSequence(sequenceRecord) {
    yield timeout(2000);
    yield new Promise((resolve) => {
      sequenceRecord.save().then(resolve);
    });
  }

  // REFACTOR: this is only called when the filepath
  // is updated, filepath should be moved to a TrackControl attribute of Sampler nodes
  @keepLatestTask
  *updateTrackTask(key, value, reInit = true) {
    try {
      this.set(key, value);
      if (reInit) {
        yield this.downloadSample();
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
