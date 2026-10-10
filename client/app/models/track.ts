// app/models/track.ts
import Model, { attr, belongsTo, hasMany  } from '@ember-data/model';
import { service } from '@ember/service';
import { action } from '@ember/object';
import type StoreService from '@ember-data/store';
import { keepLatestTask, timeout, waitForProperty } from 'ember-concurrency';
import { unbindFromSequencer } from 'euclip/utils/cracked';
import { SoundFileStates } from 'euclip/models/sound-file';

import type ProjectModel from './project';
import type InitScriptModel from 'euclip/models/init-script';
import type OnstepScriptModel from 'euclip/models/onstep-script';
import AudioFileTreeModel from 'euclip/models/audio-file-tree';
import TrackNodeModel from 'euclip/models/track-node';
import TrackControlModel from 'euclip/models/track-control';
import FilepathControlModel from 'euclip/models/filepath-control';
import type SequenceModel from 'euclip/models/sequence';
import SoundFileModel from 'euclip/models/sound-file';

import Evented from '@ember/object/evented';

import {
  addCustomSelector,
  applyAttrs,
  bindToLoopStep,
  getCrackedNode,
} from '../utils/cracked';
import filterNumericAttrs from 'euclip/utils/filter-numeric-attrs';
import { tracked } from '@glimmer/tracking';

import { isPresent } from '@ember/utils';


import { extendOnCreateNode } from 'euclip/utils/cracked';
import { FILE_LOAD_STATES } from './track-node';
import { debugLog } from 'euclip/utils/debug-log';
import byKey from 'euclip/utils/by-key';

declare const __: any;
declare const cracked: any;

// Track state management
export enum TrackState {
  CREATED = 'created',
  SAVED = 'saved',
  SETUP = 'setup',
  READY = 'ready',
  ERROR = 'error'
}

export default class TrackModel extends Model.extend(Evented) {

  @service declare store: StoreService;

  @attr('boolean') declare isMaster: boolean;
  @attr('number') declare order: number;
  @attr('number', { defaultValue: -1 }) declare stepIndex: number;
  @attr('string', { defaultValue: TrackState.CREATED }) declare state: TrackState;
  @tracked declare nodeToVisualize: any;
  @tracked declare settingsForNodes: any[];

  // true once the track's init script has run at least once (successfully or not).
  // The UI only reports a failed source after this, so it never flashes during creation.
  @tracked hasBuiltAudio = false;
  // set the moment deletion starts: blocks audio rebuilds and hides transient UI states.
  @tracked isTearingDown = false;

  get isRemoved(): boolean {
    return this.isTearingDown || this.isDeleted || this.isDestroying || this.isDestroyed;
  }

  @belongsTo('project', { async: false, inverse: 'tracks' }) declare project: ProjectModel;
  @belongsTo('init-script', { async: false, inverse: 'track' }) declare initScript: InitScriptModel;
  @belongsTo('onstep-script', { async: false, inverse: 'track' }) declare onstepScript: OnstepScriptModel;
  @belongsTo('audio-file-tree', { async: false, inverse: 'track' }) declare audioFileTree: AudioFileTreeModel;

  @hasMany('track-node', { async: false, inverse: 'track' }) declare trackNodes: TrackNodeModel[];
  @hasMany('track-control', { async: false, inverse: 'track' }) declare trackControls: TrackControlModel[];
  @hasMany('filepath-control', { async: false, inverse: 'track' }) declare filepathControls: FilepathControlModel[];
  @hasMany('sequence', { async: false, inverse: 'track' }) declare sequences: SequenceModel[];

  // FIXME: move this to the filepathControl record? 
  // FIXME: probably need to do this once per filepathcontrol (since there can be multiple)
  async createAudioFileTree(): Promise<void> {
    await this.trackControls;
    let path = this.samplerFilepathControl?.controlValue || '';
    const record =  AudioFileTreeModel.createRecord(
      this.store,{
      track: this,
    }, path);
  }

  async destroyAndCleanup(): Promise<void> {
    if (this.isTearingDown) return;
    // Flag first: from here on nothing may rebuild this track's audio, and the UI stops
    // reporting source state while the records are unloaded.
    this.isTearingDown = true;
    const selector = this.stableSelector; // capture: the id is gone once the record is unloaded
    this.unbindAndRemoveCrackedNodes();

    try {
      // Ember Data throws if an in-flight record is unloaded, so let pending saves
      // (e.g. controls of a track that was just created) settle first.
      const children = [...this.trackControls, ...this.filepathControls, ...this.sequences];
      await Promise.all(
        children.filter((r) => r.isSaving).map((r) => waitForProperty(r, 'isSaving', false))
      );
      await this.destroyRecord(); // the API cascades to controls, scripts and sequences
      // then drop the client copies (copy first: unloading mutates the live arrays)
      [...this.trackNodes, ...children].forEach((record) => {
        if (record && record.isLoaded && !record.isSaving) this.store.unloadRecord(record);
      });
    } catch (error) {
      // the server refused: bring the track (and its sound) back
      console.error(`Failed to delete track ${this.id}`, error);
      this.isTearingDown = false;
      this.rollbackAttributes();
      this.setupAudioFromScripts();
      throw error;
    } finally {
      // sweep again: anything created while the delete request was in flight is an orphan
      if (this.isTearingDown) {
        unbindFromSequencer(selector);
        __(selector).remove();
      }
    }
  }

  get currentSequence(): SequenceModel | undefined {
    return this.sequences?.[0];
  }

  get scriptAlert(): string | null {
    return this.initScript?.alert || this.onstepScript?.alert;
  }

  get sourceNodeRecords(): TrackNodeModel[] {
    return this.trackNodes?.filter((tn) => tn).filter((item) => item.isSourceNode === true);
  }

  get firstSourceNode(): TrackNodeModel | undefined {
    return this.sourceNodeRecords[0];
  }

  get samplerNodes(): TrackNodeModel[] {
    return this.sourceNodeRecords.filter((item) => item.nodeType === 'sampler').slice().sort(byKey('order'));
  }

  get adsrNodes(): TrackNodeModel[] {
    return this.sourceNodeRecords.filter((item) => item.nodeType === 'adsr').slice().sort(byKey('order'));
  }

  get samplerNativeBuffers(): AudioBuffer[] {
    return this.samplerNodes
      .map((samplerNode: TrackNodeModel) => samplerNode.sampleIsLoaded && samplerNode.nativeNode?.buffer)
      .filter(Boolean) as AudioBuffer[];
  }

  get sortedFilepathControls(): FilepathControlModel[] {
    return this.filepathControls.slice().sort(byKey('nodeOrder'));
  }

  get samplerFilepathControl(): FilepathControlModel | undefined {
    return this.sortedFilepathControls[0];
  }
  
  /**
   * the array of SoundFiles is populated by silent files first to avoid nulls
   * then replaced by any real sound files related to the filepathcontrols
   * 
   * FIXME: right now filepathcontrols are created if a sampler is initialized with one of these downloadedSoundFiles
   * it doesnt work if you initialize many samplers using the same file (eg set this.files[0] to multiple samplers)
   * 
   * We'd either need to use the same filepath control for multiple nodes, or make multiple filepath controls 
   * with the same value... hmmmm
   */


  get downloadedSoundFiles(): (SoundFileModel | null)[] {
    const soundFiles = this.store.peekAll('sound-file') as SoundFileModel[];
    const files: (SoundFileModel | null)[] = Array.from({ length: 16 }, () => null);

    this.sortedFilepathControls.forEach((filepathControl, i) => {
      const match = soundFiles.find((item) => item.filePathRelative === filepathControl.controlValue);
      if (match?.isDownloaded) {
        files[i] = match;
      }
    });

    return files;
  }

  /**
   * The array of downloaded files exposed to the user via `this.files` in the script.
   * Entries are null until a file has downloaded; samplers are still created without a path
   * (they are silent until a file loads), so the UI never depends on a download succeeding.
  */
  get downloadedFilepaths(): (string | null)[] {
    return this.downloadedSoundFiles.map(file => file?.downloadedURI ?? null);
  }


  get validTrackNodes(): TrackNodeModel[] {
    return this.trackNodes;
  }

  get trackNodesForControls(): TrackNodeModel[] {
    return this.validTrackNodes.filter(
      ({ nodeType, parentMacro }) => nodeType !== 'channelStrip' && parentMacro == null
    );
  }

  @action
  updateTrackSequence(sequenceRecord: SequenceModel, key: string, value: any): void {
    if (sequenceRecord.get(key) === value) return;

    if (key === 'hits') {
      sequenceRecord.set('customSequence', []);
    }
    if (key === 'steps' && value < sequenceRecord.hits) {
      sequenceRecord.set('hits', value);
    }

    sequenceRecord.set(key, value);
    unbindFromSequencer(this.stableSelector);
    this.bindToSequencer();
    this.saveTrackSequence.perform(sequenceRecord);
  }

  @keepLatestTask
  *saveTrackSequence(sequenceRecord: SequenceModel): Generator<Promise<void>, void, unknown> {
    yield timeout(1000);
    yield sequenceRecord.save();
  }

  @keepLatestTask
  *updateTrackTask(key: string, value: any, reInit = true): Generator<Promise<void>, void, unknown> {
    try {
      (this as any).set(key, value);
      if (reInit) {
        this.setState(TrackState.SETUP);
        yield this.findOrDownloadSoundFiles();
        if (this.isRemoved) return;
        this.setupAudioFromScripts();
        this.setState(TrackState.READY);
      }
      yield this.save();
    } catch (error) {
      console.error(`Failed to update track ${this.id} (${key})`, error);
      this.setState(TrackState.ERROR);
      this.rollbackAttributes();
    }
  }

  async duplicate(): Promise<TrackModel> {
    const project = await this.project;
    const newTrack = project.tracks.createRecord() as TrackModel;
    return await project.setupAndSaveNewTrack(newTrack, {
      adapterOptions: { duplicateId: this.id },
    });
  }



  /**
   * Audio stuff
   */

  get trackControlData() {
    return this.trackControls.map((trackControl) => {
      // FIXME when user switches a control from single to multi, both values will be truthy/
      // need an 'activeValue' that switches with it
      if (trackControl.get('controlArrayValue.length')) {
        return trackControl.get('controlArrayValue');
      }
      return trackControl.get('controlValue');
    });
  }

  setNodeToVisualize() {
    const firstVisualizableNode = this.settingsForNodes.find(
      (audioNode) => audioNode.nodeType === 'channelStrip'
    );
    const node = __._getNode(firstVisualizableNode?.uuid)?.getNativeNode();
    this.nodeToVisualize = (node && node[0]) || node; // get the gain node of the channelSTrip
  }

  async findOrDownloadSoundFiles(): Promise<SoundFileModel[]> {
    // if there is a sound-file record matching this.filePathRelative, use it
    // then make sure its assoicated to this track
    // else create a new sound-file record
    // track nodes will look for a matching sound-file record to associate to
    
    return Promise.all(this.filepathControls.filter((fpc) => fpc.controlValue).map((filepathControl) => {

          // there can be leftover filepath controls from a previous project that had tracks 
          // without files chosen. TODO: clear out dead filepath controls on project exit.
          
          // ALSO TODO: dont load all project assets on /projects index
          // ALSO ensure that the fpcs are properly tied to the track (shouldnt bleed between projects)

         return SoundFileModel.findOrDownload(
          filepathControl.controlValue,
          this.store
        )
      })
    )
  }

  setupAudioFromScripts(unbindBeforeCreate = true) {
    if (this.isRemoved) return;
    const initScript = this.initScript;
    if (!initScript) {
      console.error(`Track ${this.id} has no initScript; cannot build its audio`);
      return;
    }

    // settingsForNodes is an array to store audio node uuids created in this track's script
    // not to be confused with trackNode models,
    // { uuid: type, atts: { filename: '...', speed: 1} }
    this.settingsForNodes = [];

    // cracked.onCreateNode was added to the Cracked library to give access to the AudioNode object upon creation
    // this callback gets called when a user creates cracked audio nodes in the script editor ui
    // macro components should not get individual ui controls
    extendOnCreateNode(async (node, type, creationParams, userSettings) => {
      const nodeSettings = {};
      const uuid = node.getUUID();
      nodeSettings[uuid] = type;
      nodeSettings.nodeType = type; // used to find orphaned nodes
      nodeSettings.uuid = uuid;
      nodeSettings.userSettings = userSettings; // save the initialization attributes so they can be used to update TrackControl's min/max/default param values
      nodeSettings.parentMacro = node.isMacroComponent()
        ? __._getNode(node.getMacroContainerUUID())
        : null;

      const shouldCreateTrackNode =
        __.isFun(cracked[type]) && !node.getMacroContainerUUID();

      if (shouldCreateTrackNode) {
        // add a track-specific class to every node created so it can be
        // easily selected and properly cleaned up. addCustomSelector sets these in
        // the Cracked store
        addCustomSelector(node, this.classSelector); // user-facing, follows track order
        addCustomSelector(node, this.stableSelector); // internal: survives renumbering
        addCustomSelector(node, `${type} ${this.classSelector}`);
        addCustomSelector(node, node.getUUID()); // NOTE: no . or # is used, the uuid is the full selector

        this.settingsForNodes.push(nodeSettings);

        if (userSettings) {
          // callback is a custom addition to cracked library that
          // fires when audio file loads
          userSettings.callback = ({ buffer, error }) => {
            const trackNode = this.trackNodes.find((item) => item.nodeUUID === node.getUUID());

            if (this.trackNodes && trackNode) {
              if (buffer) {
                trackNode.fileLoadState = FILE_LOAD_STATES.SUCCESS;
                trackNode.setSamplerControlsToBuffer(buffer);
              }
              if (error) {
                console.error('File Load Error:', error);
                this.initScript.alert = `File Load Error: ${error}`;
                trackNode.fileLoadState = FILE_LOAD_STATES.ERROR;
              }
            }
          };
        }
        // 'ui' is a custom attr that users can set in the script editor when defining a cracked audio node
        // new AudioNode objects won't get initialized with it by default so we hack it on here
        // see cracked.js line 330
        if (userSettings?.ui) {
          node.ui = userSettings.ui;
        }
      }
    });

    try {
      if (unbindBeforeCreate) {
        this.unbindAndRemoveCrackedNodes();
      }

      // run script to create audio nodes
      debugLog('track', `#${this.order} running init script`, {
        files: this.downloadedFilepaths.slice(0, 3),
        filepathControls: this.filepathControls.map((f) => f.controlValue),
      });
      initScript.invokeFunctionRef();
      debugLog('track', `#${this.order} init script done`, {
        nodes: this.settingsForNodes.map((n) => n.nodeType),
        alert: initScript.alert,
      });

    } finally {
      // never leave this global hook installed, even if the script or node setup throws
      extendOnCreateNode(null);
    }

    // Destroy all TrackNode records for this track, they'll be recreated from the latest update to the AudioNode tree
    // (copy: unloading mutates the live relationship array, which would skip every other record)
    [...this.trackNodes].forEach((trackNode) => this.store.unloadRecord(trackNode));

    let trackNodes = this.createTrackNodeRecords();

    trackNodes = this.applyOrderOfType(trackNodes);
    this.setupTrackControls(trackNodes);
    if (this.currentSequence) {
      if (trackNodes.length) {
        let onStepCallback = this.onStepCallback.bind(this);
        if (trackNodes.length) {
          bindToLoopStep(
            this.stableSelector,
            onStepCallback,
            this.currentSequence.sequence,
            {
              loopIndex:
                this.project.stepIndex % this.currentSequence.sequence.length,
            }
          );
        }
      } else {
        console.error('no track nodes to bind to sequencer');
      }
    }
    this.setNodeToVisualize();
    this.hasBuiltAudio = true;
  }

  // can take array of trackNodes or trackControls or filepathControls
  // compares keys to determine where in the order of creation
  // this trackNode or trackControl is positioned. used to
  // match existing trackControls to newly re-created trackNodes
  // TODO: refactor to static method?
  applyOrderOfType(recordsArray: (TrackNodeModel | TrackControlModel | FilepathControlModel)[]): (TrackNodeModel | TrackControlModel | FilepathControlModel)[] {
    recordsArray.reduce((acc, record) => {
      let key: string;
      if (record instanceof TrackNodeModel) {
        const { nodeType } = record;
        key = nodeType;
      } else if (record instanceof TrackControlModel) {
        const { nodeType, nodeAttr } = record;
        key = `${nodeType}-${nodeAttr}`;
      } else if (record instanceof FilepathControlModel) {
        key = 'sampler-filepath';
      }

      if (isPresent(acc[key])) {
        acc[key] += 1;
      } else {
        acc[key] = 0;
      }
      record.orderOfType = acc[key];
      return acc;
    }, {});
    return recordsArray;
  }

  /**
   * create TrackNode records for each audio node object
   * created on this track
   *
   * this method assumes that cracked audio nodes (which are wrappers around web audio AudioNode objects) were created by the script,
   * and we now need to create or update TrackNode ember data records.
   *
   * TrackNode records are ephemeral, so trackNode.save is never called.
   * TrackControls however, get created on the server, and returned to the client where they are associated with the TrackNode records
   
   */
  createTrackNodeRecords() {
    // map over audio node objects created in this track's script
    // to create corresponding trackNode model records
    this.settingsForNodes
      .filter((setting) => {
        // currently the channelStrip is the only use case where the child nodes of a macro get TrackNode models.
        if (setting.parentMacro?.nodeType == 'channelStrip') return true;
        return !setting.parentMacro;
      })
      .forEach((node, idx) => {
        const [uuid, type] = Object.entries(node)[0];
        if (getCrackedNode(uuid)) {
          // grab the attributes passed in to the initialization of a cracked node that will be used to set default state of track controls (eg. frequency, gain, speed etc.)
          const userSettingsForControl = filterNumericAttrs(node.userSettings);

          let trackNodeAttrs = {
            nodeUUID: uuid, // always update uuid since the audio nodes will be new every time
            nodeType: type,
            order: idx, // FIXME: does this break when nodes changed, reordered, multiple of same type? Consider using a cumulative "createdOrder" (based on initialization from the script, not every rebuild)
            parentMacro: node.parentMacro,
          };
          // the parentMacro property is a cracked web audio node which happens to be a macro
          // this is used to determine if the node should appear with the normal node controls,
          // or separated as in the channel strip component.
          // since the AudioNodes are ephemeral, but the TrackNode models persist to the database
          // we need to save a boolean telling the data model that it expects to have a channel strip maco audio node
          trackNodeAttrs.isChannelStripChild =
            trackNodeAttrs.parentMacro &&
            trackNodeAttrs.parentMacro.getType() === 'channelStrip';
          // ID is necessary for client-side relationships between track-node and track-controller
          // so we're using the audio node's UUID at time of creation.
          // however when a trackNode is found and updated in the if block above,
          // it will update with a new audio node uuid and this id value will be outdated
          // so theyre just a representation of the state of original creation
          trackNodeAttrs = {
            id: `${uuid}`,
            ...trackNodeAttrs,
          };

          let trackNode = this.trackNodes.createRecord(trackNodeAttrs);

          // stash the userSettingsForControl on the trackNode
          // So it can be read by trackControls to set their default values
          // update track control with user default values
          trackNode.userSettingsForControl = userSettingsForControl;
        }
      });
    return this.trackNodes;
  }

  /**
   *
   * Loop over trackNode records
   * Search for a matching TrackControl
   *  if found, update it with the trackNode
   *  else create a new TrackControl for the node
   *
   * Then apply the values from the track controls to the audio nodes
   */
  setupTrackControls(trackNodes: TrackNodeModel[]): void {
    
    let remainingControls = [
      ...this.trackControls,
      ...this.filepathControls,
    ];
    
    remainingControls = this.applyOrderOfType(remainingControls);
  
    const unlinkedNodes: TrackNodeModel[] = [];
  
    trackNodes.forEach((trackNode) => {
      // Find matching controls by type and order
      const matchingControls = remainingControls.filter((control) => {
        if (control instanceof FilepathControlModel) {
          return trackNode.orderOfType === (control as any).orderOfType;
        }
  
        return (
          trackNode.nodeType === control.nodeType &&
          trackNode.orderOfType === (control as any).orderOfType
        );
      });
        
      // For samplers, ensure a filepath control is always added
      if (trackNode.nodeType === 'sampler') {
        const hasFilepath = matchingControls.some(
          (control) => control instanceof FilepathControlModel
        );
  

        if (!hasFilepath && this.filepathControls[trackNode.orderOfType]) {
          matchingControls.push(this.filepathControls[trackNode.orderOfType]);
        }
      }

      // If matched controls are valid, assign them to the node
      if (TrackNodeModel.validateControls(matchingControls, trackNode.nodeType)) {
        matchingControls.forEach((control) => {
          control.set('trackNode', trackNode);
  
          if (control instanceof FilepathControlModel) {
            trackNode.filepathControl = control;
          }
  
          if (control instanceof TrackControlModel) {
            trackNode.trackControls.push(control);
          }
  
          // Remove assigned control from pool
          remainingControls = remainingControls.filter(c => c.id !== control.id);
        });
      } else {
        unlinkedNodes.push(trackNode);
      }
  
      trackNode.updateDefaultValue();
    });
  
    // Clean up unused controls - but be conservative with filepathControls bc keeping them around prevents
    // errors when new sampler nodes are created 
    remainingControls.forEach((control) => {
      if (control instanceof FilepathControlModel) {
        // Don't destroy filepathControls that have valid controlValue - they might be from bulk creation
        if (control.controlValue) {
          return;
        }
      }

      control.destroyRecord();
    });
  
    // Create missing controls for unmatched nodes
    unlinkedNodes.forEach((node) => {
      node.findOrCreateTrackControls();
    });
  
    // Apply attributes to all trackNodes
    const attrsForNodes = TrackControlModel.getAttrsForNodes(this.trackControls, undefined, undefined);
  
    this.trackNodes.forEach((trackNode) => {
      trackNode.delinkControlsForDeadNodes();
  
      const attrs = attrsForNodes[trackNode.uniqueSelector];
      if (attrs) {
        applyAttrs(trackNode.uniqueSelector, attrs);
      }
    });
  }

  bindToSequencer() {
    let onStepCallback = this.onStepCallback.bind(this);

    let loopIndex = this.project.isPlaying
      ? this.project.stepIndex % this.currentSequence.sequence.length
      : 0;

    bindToLoopStep(
      this.stableSelector,
      onStepCallback,
      this.currentSequence.sequence,
      {
        loopIndex,
      }
    );
  }

  unbindAndRemoveCrackedNodes() {
    unbindFromSequencer(this.stableSelector);
    __(this.stableSelector).remove();
  }

  onStepCallback(index, data, array) {
    if (this.isDeleted || this.isDestroying || this.isDestroyed) {
      debugLog('track', `step callback on removed track ${this.id}; ignoring`);
      return;
    }
    this.stepIndex = index;

    if (this.isMaster) {
      this.project.stepIndex = index;
    }

    // before calling the user's onstepScript, pass the current values of all track-controls
    // to the their respective track-nodes. Sampler nodes are a special case, since they get
    // rebuilt on each play, so they need to be passed their params in the .start() call (see below).
    const attrsForNodes = TrackControlModel.getAttrsForNodes(
      this.trackControls,
      index,
      this.currentSequence.sequence
    );

    this.trackNodes.forEach((trackNode) => {
      const attrs = attrsForNodes[trackNode.uniqueSelector];
      if (attrs) {
        applyAttrs(trackNode.uniqueSelector, attrs);
      }
    });
    this.onstepScript.invokeFunctionRef(index, data, array);
  }

  // TODO: create property "trackCreatedOrder" and use that here
  // so weirdness doesnt happen when track order changes
  // The server renumbers `order` when a track is deleted, but nodes keep the class they were
  // built with. Anything that must find *this track's* nodes later (loop binding, teardown)
  // therefore uses the id, which never changes. `classSelector` stays for users' scripts.
  get stableSelector() {
    return `.track-id-${this.id}`;
  }

  get classSelector() {
    const indicator = this.isMaster ? 'master' : this.order;
    return `.track-${indicator}`;
  }

  get scriptScope() {
    // sampler speed is a special case because they rebuild on every play,
    // so we need to ensure the attrs from the UI controls get applied after .start()
    // this is not an issue for non sampler nodes.
    const sourceNodes = this.sourceNodeRecords;
    const adsrNodes = this.adsrNodes;
    const controls = TrackControlModel.serializeForScript(
      this.trackNodes,
      this.stepIndex
    );

    return {
      files: this.downloadedFilepaths,
      filepath: this.downloadedFilepaths[0],
      id: this.id,
      trackSelector: this.classSelector,
      controls: controls, // the value of the controls at this current step
      sliders: this.trackControlData,
      select() {
        let selector = typeof arguments[0] === 'string' ? arguments[0] : null;
        if (selector) {
          return __(`${selector} ${this.trackSelector}`);
        }
        return __(this.trackSelector);
      },
      // These methods may get replaced by the track('selector').play() style of API
      playSourceNodes(attrs) {
        if (sourceNodes) {
          sourceNodes.forEach((sourceNode) => {
            __(sourceNode.uniqueSelector)
              .stop()
              .attr({
                ...controls.find((item) => item.nodeUUID === sourceNode.nodeUUID), //NOTE: explicitly using the key nodeUUID instead of `uuid` because the latter will mess up the native audio node when attrs applied
                ...attrs,
              })
              .start();
          });
        }
      },
      playADSRNodes() {
        adsrNodes.forEach((adsrNode) => {
          __(adsrNode.uniqueSelector).adsr('trigger', 'fast');
        });
      },
      play(attrs) {
        this.playADSRNodes();
        this.playSourceNodes(attrs);
        // TODO: rampNodes, LFONodes
      },
      stop() {
        sourceNodes.forEach((sourceNode) => {
          __(sourceNode.uniqueSelector).stop();
        });
      },
    };
  }

  /**
   * State management methods
   * TODO: implement UI to represent track state 
   */
  
  isInState(state: TrackState): boolean {
    return this.state === state;
  }
  
  setState(newState: TrackState): void {
    this.state = newState;
  }
  
  isCreated(): boolean {
    return this.state === TrackState.CREATED;
  }
  
  isSaved(): boolean {
    return this.state === TrackState.SAVED;
  }
  
  isSetup(): boolean {
    return this.state === TrackState.SETUP;
  }
  
  isReady(): boolean {
    return this.state === TrackState.READY;
  }
  
  hasError(): boolean {
    return this.state === TrackState.ERROR;
  }

  // FIXME: move this to the filepathControl record?
}
