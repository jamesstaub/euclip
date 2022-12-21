import { attr, belongsTo, hasMany } from '@ember-data/model';
import TrackAudioModel from '../audio-models/track';
import { keepLatestTask } from 'ember-concurrency';
import { unbindFromSequencer } from '../utils/cracked';
import ENV from 'euclip/config/environment';
import { inject as service } from '@ember/service';

export default class TrackModel extends TrackAudioModel {
  @service store;
  @attr('boolean') isMaster;
  @belongsTo('project') project;

  @belongsTo('init-script') initScript;
  @belongsTo('onstep-script') onstepScript;
  @belongsTo('audio-file-tree') audioFileTreeModel;

  @hasMany('track-node') trackNodes;
  @hasMany('track-control') trackControls;
  @hasMany('sequence') sequences;

  @attr('number') order;

  @attr('number') stepIndex;

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
    this.unbindAndRemoveCrackedNodes();
    if (this.project.get('isPlaying')) {
      // clean reset on delete to prevent the _loopListeners array gets cleared out in cracked
      this.project.content.stopLoop();
      this.project.content.initSignalChain();
      this.project.content.startLoop();
    }
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

  get scriptAlert() {
    return this.get('initScript.alert') || this.get('onstepScript.alert');
  }

  get sourceNodeRecords() {
    return this.trackNodes.filterBy('isSourceNode', true);
  }

  get samplerNodes() {
    return this.sourceNodeRecords.filterBy('nodeType', 'sampler');
  }

  get adsrNodes() {
    return this.sourceNodeRecords.filterBy('nodeType', 'adsr');
  }

  get samplerNativeBuffers() {
    return this.samplerNodes.map((samplerNode) => {
      if (samplerNode.sampleIsLoaded) {
        return samplerNode.nativeNode.buffer;
      }
    });
  }

  get showFilePicker() {
    return !!this.samplerNodes?.length;
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
    let defaultFile =
      '/Roland/Roland%20CR-8000%20CompuRhythm/CR-8000%20Kit%2001/CR8KBASS.mp3';

    return this.samplerFilepathControl?.controlStringValue || defaultFile;
  }

  get filepathUrl() {
    return `${ENV.APP.AUDIO_PATH}${this.filePathRelative}`;
  }

  // TODO: dedupe from similar method on track-list-item
  @keepLatestTask
  *updateTrackSequence(sequenceRecord, key, value) {
    // switching from custom back to euclidean
    if (key === 'hits') {
      sequenceRecord.set('customSequence', []);
    }
    // don't allow more hits than steps
    if (key === 'steps' && value < sequenceRecord.hits) {
      sequenceRecord.set('hits', value);
    }

    sequenceRecord.set(key, value);
    this.sourceNodeRecords.forEach((source) => {
      unbindFromSequencer(source.uniqueSelector);
      this.bindToSequencer(source);
    });
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
        this.setupAudioFromScripts();
      }
      yield this.save();
    } catch (e) {
      this.rollbackAttributes();
    }
  }

  async duplicate() {
    const project = await this.project;
    const newTrack = project.get('tracks').createRecord();
    return await project.setupAndSaveNewTrack(newTrack, {
      adapterOptions: { duplicateId: this.id },
    });
  }
}
